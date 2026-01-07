import { db } from "../db";
import { texts, positions, argumentsTable, quotes, chunks } from "@shared/schema";
import { sql } from "drizzle-orm";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;

interface IngestResult {
  file: string;
  status: "success" | "error" | "skipped";
  type?: string;
  thinker?: string;
  processed: number;
  skipped: number;
  errors: string[];
  deleted: boolean;
}

function normalizeContent(raw: string): string {
  return raw
    .replace(/\uFEFF/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function safeUnlink(filepath: string): boolean {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
  } catch (err) {
    console.error(`  [WARN] Failed to delete file: ${err}`);
  }
  return false;
}

function validateFile(filepath: string): { valid: boolean; content: string; reason?: string } {
  try {
    const stat = fs.statSync(filepath);
    if (stat.size === 0) {
      return { valid: false, content: "", reason: "File is empty (0 bytes)" };
    }
    if (stat.size > 50 * 1024 * 1024) {
      return { valid: false, content: "", reason: "File too large (>50MB)" };
    }
    
    const raw = fs.readFileSync(filepath, "utf-8");
    const content = normalizeContent(raw);
    
    if (!content) {
      return { valid: false, content: "", reason: "File contains only whitespace" };
    }
    
    const garbagePatterns = [
      /^(TURN THE FOLLOWING|CONVERT THIS|MAKE THIS|WRITE A|CREATE A)/i,
      /^(Please|Could you|Can you|I want you to)/i,
    ];
    
    for (const pattern of garbagePatterns) {
      if (pattern.test(content)) {
        return { valid: false, content, reason: "File starts with prompt/instruction text" };
      }
    }
    
    return { valid: true, content };
  } catch (err) {
    return { valid: false, content: "", reason: `Read error: ${err}` };
  }
}

async function embedText(text: string): Promise<number[]> {
  const input = text.slice(0, 8000).trim();
  if (!input) throw new Error("Empty text for embedding");
  
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input,
  });
  return response.data[0].embedding;
}

function parseFilename(filename: string): { thinker: string; type: string; index: number } | null {
  const basename = path.basename(filename, path.extname(filename));
  const cleanName = basename.replace(/_\d{13,}$/, "");
  
  const match = cleanName.match(/^([a-zA-Z]+)_(positions|arguments|quotes|works)_(\d+)$/i);
  if (!match) return null;
  
  return {
    thinker: match[1].toLowerCase(),
    type: match[2].toLowerCase(),
    index: parseInt(match[3], 10),
  };
}

function chunkText(text: string): string[] {
  const result: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + CHUNK_SIZE;
    
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(".", end);
      const lastNewline = text.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > start + CHUNK_SIZE / 2) {
        end = breakPoint + 1;
      }
    }
    
    result.push(text.slice(start, end).trim());
    start = end - CHUNK_OVERLAP;
  }
  
  return result.filter((c) => c.length > 50);
}

async function ingestPositions(content: string, thinker: string): Promise<{ processed: number; skipped: number; errors: string[] }> {
  const lines = content.split("\n").filter((l) => l.trim());
  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split("|").map((p) => p.trim());
    
    if (parts.length < 2) {
      skipped++;
      continue;
    }
    
    const [lineThinker, positionText, topic] = parts;
    const actualThinker = lineThinker || thinker;
    
    if (!positionText || positionText.length < 10) {
      skipped++;
      continue;
    }
    
    try {
      const embedding = await embedText(positionText);
      
      await db.execute(sql`
        INSERT INTO positions (thinker, position_text, topic, embedding)
        VALUES (${actualThinker}, ${positionText}, ${topic || null}, ${JSON.stringify(embedding)}::vector)
        ON CONFLICT DO NOTHING
      `);
      processed++;
      
      if (processed % 10 === 0) {
        console.log(`  [positions] ${processed} inserted...`);
      }
    } catch (error) {
      errors.push(`Line ${i + 1}: ${error}`);
      skipped++;
    }
  }
  
  return { processed, skipped, errors };
}

async function ingestQuotes(content: string, thinker: string): Promise<{ processed: number; skipped: number; errors: string[] }> {
  const lines = content.split("\n").filter((l) => l.trim());
  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split("|").map((p) => p.trim());
    
    if (parts.length < 2) {
      skipped++;
      continue;
    }
    
    const [lineThinker, quoteText, topic] = parts;
    const actualThinker = lineThinker || thinker;
    
    if (!quoteText || quoteText.length < 10) {
      skipped++;
      continue;
    }
    
    try {
      const embedding = await embedText(quoteText);
      
      await db.execute(sql`
        INSERT INTO quotes (thinker, quote_text, topic, embedding)
        VALUES (${actualThinker}, ${quoteText}, ${topic || null}, ${JSON.stringify(embedding)}::vector)
        ON CONFLICT DO NOTHING
      `);
      processed++;
      
      if (processed % 10 === 0) {
        console.log(`  [quotes] ${processed} inserted...`);
      }
    } catch (error) {
      errors.push(`Line ${i + 1}: ${error}`);
      skipped++;
    }
  }
  
  return { processed, skipped, errors };
}

async function ingestArguments(content: string, thinker: string): Promise<{ processed: number; skipped: number; errors: string[] }> {
  const argBlocks = content.split(/### Argument \d+/).slice(1);
  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];
  
  for (let i = 0; i < argBlocks.length; i++) {
    const block = argBlocks[i];
    
    try {
      const typeMatch = block.match(/^\s*\(([^)]+)\)/);
      const argumentType = typeMatch ? typeMatch[1].toLowerCase() : "unknown";
      
      const premisesMatch = block.match(/\*\*Premises:\*\*\n([\s\S]*?)(?=\*\*[→>] ?Conclusion:|$)/);
      const premises: string[] = [];
      if (premisesMatch) {
        const premiseLines = premisesMatch[1].split("\n");
        for (const line of premiseLines) {
          const cleaned = line.replace(/^[\s-]+/, "").trim();
          if (cleaned) premises.push(cleaned);
        }
      }
      
      const conclusionMatch = block.match(/\*\*[→>] ?Conclusion:\*\*\s*([^\n]+)/);
      const conclusion = conclusionMatch ? conclusionMatch[1].trim() : "";
      
      if (!conclusion || premises.length === 0) {
        skipped++;
        continue;
      }
      
      const sourceMatch = block.match(/\*Source:\s*([^|]+)/);
      const topic = sourceMatch ? sourceMatch[1].trim() : null;
      
      const importanceMatch = block.match(/Importance:\s*(\d+)/);
      const importance = importanceMatch ? parseInt(importanceMatch[1], 10) : 5;
      
      const embeddingText = `${premises.join(". ")} Therefore: ${conclusion}`;
      const embedding = await embedText(embeddingText);
      
      await db.execute(sql`
        INSERT INTO arguments (thinker, argument_type, premises, conclusion, topic, importance, embedding)
        VALUES (
          ${thinker}, 
          ${argumentType}, 
          ${JSON.stringify(premises)}::jsonb, 
          ${conclusion}, 
          ${topic}, 
          ${importance},
          ${JSON.stringify(embedding)}::vector
        )
      `);
      processed++;
      
      if (processed % 5 === 0) {
        console.log(`  [arguments] ${processed} inserted...`);
      }
    } catch (error) {
      errors.push(`Block ${i + 1}: ${error}`);
      skipped++;
    }
  }
  
  return { processed, skipped, errors };
}

async function ingestWork(content: string, thinker: string, index: number, filename: string): Promise<{ processed: number; skipped: number; errors: string[] }> {
  const errors: string[] = [];
  
  try {
    const basename = path.basename(filename, path.extname(filename));
    
    const titleMatch = content.match(/^(?:Chapter \d+\n)?([^\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : `Work ${index}`;
    
    const result = await db.execute(sql`
      INSERT INTO texts (thinker, title, source_file, content)
      VALUES (${thinker}, ${title}, ${basename}, ${content})
      ON CONFLICT (thinker, source_file) DO UPDATE SET content = ${content}
      RETURNING id
    `);
    
    const textId = (result.rows[0] as any).id;
    console.log(`  [works] Text: ${title} (id=${textId})`);
    
    await db.execute(sql`DELETE FROM chunks WHERE source_text_id = ${textId}`);
    
    const textChunks = chunkText(content);
    let chunkCount = 0;
    
    for (let i = 0; i < textChunks.length; i++) {
      const chunkContent = textChunks[i];
      
      try {
        const embedding = await embedText(chunkContent);
        
        await db.execute(sql`
          INSERT INTO chunks (thinker, source_text_id, chunk_index, chunk_text, embedding)
          VALUES (${thinker}, ${textId}, ${i}, ${chunkContent}, ${JSON.stringify(embedding)}::vector)
        `);
        chunkCount++;
        
        if (chunkCount % 10 === 0) {
          console.log(`  [chunks] ${chunkCount}/${textChunks.length}...`);
        }
      } catch (error) {
        errors.push(`Chunk ${i}: ${error}`);
      }
    }
    
    console.log(`  [works] Created ${chunkCount} chunks`);
    return { processed: chunkCount, skipped: textChunks.length - chunkCount, errors };
  } catch (error) {
    errors.push(`Work ingestion failed: ${error}`);
    return { processed: 0, skipped: 1, errors };
  }
}

async function ingestFile(filepath: string): Promise<IngestResult> {
  const filename = path.basename(filepath);
  const result: IngestResult = {
    file: filename,
    status: "error",
    processed: 0,
    skipped: 0,
    errors: [],
    deleted: false,
  };
  
  try {
    const parsed = parseFilename(filepath);
    
    if (!parsed) {
      result.status = "skipped";
      result.errors.push("Invalid filename format. Expected: LASTNAME_type_N.txt");
      console.log(`\n[SKIP] ${filename}`);
      console.log(`  Reason: Invalid filename format`);
      console.log(`  Expected: LASTNAME_type_N.txt (e.g., kuczynski_positions_7.txt)`);
      return result;
    }
    
    result.type = parsed.type;
    result.thinker = parsed.thinker;
    
    console.log(`\n[INGEST] ${filename}`);
    console.log(`  Type: ${parsed.type}, Thinker: ${parsed.thinker}`);
    
    const validation = validateFile(filepath);
    
    if (!validation.valid) {
      result.status = "skipped";
      result.errors.push(validation.reason || "Validation failed");
      console.log(`  [SKIP] ${validation.reason}`);
      return result;
    }
    
    let ingestResult: { processed: number; skipped: number; errors: string[] };
    
    switch (parsed.type) {
      case "positions":
        ingestResult = await ingestPositions(validation.content, parsed.thinker);
        break;
      case "quotes":
        ingestResult = await ingestQuotes(validation.content, parsed.thinker);
        break;
      case "arguments":
        ingestResult = await ingestArguments(validation.content, parsed.thinker);
        break;
      case "works":
        ingestResult = await ingestWork(validation.content, parsed.thinker, parsed.index, filepath);
        break;
      default:
        result.errors.push(`Unknown type: ${parsed.type}`);
        return result;
    }
    
    result.processed = ingestResult.processed;
    result.skipped = ingestResult.skipped;
    result.errors = ingestResult.errors;
    result.status = ingestResult.errors.length === 0 ? "success" : "error";
    
    console.log(`  Result: ${result.processed} processed, ${result.skipped} skipped`);
    if (result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.length} (first: ${result.errors[0]})`);
    }
    
  } catch (error) {
    result.errors.push(`Fatal error: ${error}`);
    console.error(`  [ERROR] ${error}`);
  } finally {
    result.deleted = safeUnlink(filepath);
    if (result.deleted) {
      console.log(`  [DELETED] ${filename}`);
    } else {
      console.log(`  [WARN] Failed to delete ${filename}`);
    }
  }
  
  return result;
}

async function ingestDirectory(dirpath: string): Promise<IngestResult[]> {
  const files = fs.readdirSync(dirpath).filter((f) => f.endsWith(".txt"));
  const results: IngestResult[] = [];
  
  console.log(`\n========================================`);
  console.log(`INGEST: Found ${files.length} files in ${dirpath}`);
  console.log(`========================================`);
  
  if (files.length === 0) {
    console.log("No .txt files to process.");
    return results;
  }
  
  for (const file of files) {
    const result = await ingestFile(path.join(dirpath, file));
    results.push(result);
  }
  
  return results;
}

function printSummary(results: IngestResult[]): void {
  console.log(`\n========================================`);
  console.log(`SUMMARY`);
  console.log(`========================================`);
  
  const success = results.filter((r) => r.status === "success").length;
  const errors = results.filter((r) => r.status === "error").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const deleted = results.filter((r) => r.deleted).length;
  const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);
  
  console.log(`Files: ${results.length} total`);
  console.log(`  Success: ${success}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Deleted: ${deleted}/${results.length}`);
  console.log(`Items processed: ${totalProcessed}`);
  
  if (errors > 0) {
    console.log(`\nFiles with errors:`);
    for (const r of results.filter((r) => r.status === "error")) {
      console.log(`  - ${r.file}: ${r.errors[0]}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("Usage:");
    console.log("  npx tsx server/scripts/ingest.ts <file.txt>");
    console.log("  npx tsx server/scripts/ingest.ts <directory>");
    console.log("  npx tsx server/scripts/ingest.ts data/ingest");
    console.log("");
    console.log("File naming convention:");
    console.log("  LASTNAME_positions_N.txt  - Pipe-delimited: thinker|position|topic");
    console.log("  LASTNAME_arguments_N.txt  - Markdown argument blocks");
    console.log("  LASTNAME_quotes_N.txt     - Pipe-delimited: thinker|quote|topic");
    console.log("  LASTNAME_works_N.txt      - Full text works (chunked automatically)");
    console.log("");
    console.log("Files are ALWAYS deleted after processing (success or failure).");
    process.exit(1);
  }
  
  const allResults: IngestResult[] = [];
  
  for (const arg of args) {
    try {
      const stat = fs.statSync(arg);
      
      if (stat.isDirectory()) {
        const results = await ingestDirectory(arg);
        allResults.push(...results);
      } else {
        const result = await ingestFile(arg);
        allResults.push(result);
      }
    } catch (err) {
      console.error(`Cannot access: ${arg} - ${err}`);
    }
  }
  
  if (allResults.length > 0) {
    printSummary(allResults);
  }
  
  console.log("\nIngestion complete!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

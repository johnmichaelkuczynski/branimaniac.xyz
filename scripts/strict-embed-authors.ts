/**
 * STRICT AUTHOR-ISOLATED EMBEDDING SCRIPT
 * 
 * Requirements:
 * 1. Process ONE author folder at a time
 * 2. Tag every chunk with correct author name
 * 3. Log exactly which files were indexed
 * 4. Validate files are in correct author folder
 * 5. Flag suspicious content (other author names in text)
 * 6. Post-index verification for each author
 */

import { db } from "../server/db";
import { paperChunks } from "../shared/schema";
import { sql } from "drizzle-orm";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DATA_DIR = path.join(process.cwd(), "server/data");
const LOG_DIR = path.join(process.cwd(), "logs");

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Author folder to canonical author name mapping
const AUTHOR_MAP: Record<string, { name: string; figureId: string }> = {
  "kuczynski": { name: "J.-M. Kuczynski", figureId: "kuczynski" },
  "freud": { name: "Sigmund Freud", figureId: "freud" },
  "nietzsche": { name: "Friedrich Nietzsche", figureId: "nietzsche" },
  "jung": { name: "Carl Jung", figureId: "jung" },
  "marx": { name: "Karl Marx", figureId: "marx" },
  "russell": { name: "Bertrand Russell", figureId: "russell" },
  "kant": { name: "Immanuel Kant", figureId: "kant" },
  "plato": { name: "Plato", figureId: "plato" },
  "aristotle": { name: "Aristotle", figureId: "aristotle" },
  "spinoza": { name: "Baruch Spinoza", figureId: "spinoza" },
  "leibniz": { name: "Gottfried Wilhelm Leibniz", figureId: "leibniz" },
  "hume": { name: "David Hume", figureId: "hume" },
  "locke": { name: "John Locke", figureId: "locke" },
  "berkeley": { name: "George Berkeley", figureId: "berkeley" },
  "descartes": { name: "René Descartes", figureId: "descartes" },
  "schopenhauer": { name: "Arthur Schopenhauer", figureId: "schopenhauer" },
  "bergson": { name: "Henri Bergson", figureId: "bergson" },
  "darwin": { name: "Charles Darwin", figureId: "darwin" },
  "newton": { name: "Isaac Newton", figureId: "newton" },
  "galileo": { name: "Galileo Galilei", figureId: "galileo" },
  "smith": { name: "Adam Smith", figureId: "smith" },
  "veblen": { name: "Thorstein Veblen", figureId: "veblen" },
  "keynes": { name: "John Maynard Keynes", figureId: "keynes" },
  "von-mises": { name: "Ludwig von Mises", figureId: "mises" },
  "aesop": { name: "Aesop", figureId: "aesop" },
  "poe": { name: "Edgar Allan Poe", figureId: "poe" },
  "james": { name: "William James", figureId: "james" },
  "james-allen": { name: "James Allen", figureId: "james-allen" },
  "adler": { name: "Alfred Adler", figureId: "adler" },
  "machiavelli": { name: "Niccolò Machiavelli", figureId: "machiavelli" },
  "rousseau": { name: "Jean-Jacques Rousseau", figureId: "rousseau" },
  "voltaire": { name: "Voltaire", figureId: "voltaire" },
  "tocqueville": { name: "Alexis de Tocqueville", figureId: "tocqueville" },
  "hegel": { name: "G.W.F. Hegel", figureId: "hegel" },
  "engels": { name: "Friedrich Engels", figureId: "engels" },
  "le-bon": { name: "Gustave Le Bon", figureId: "lebon" },
  "lebon": { name: "Gustave Le Bon", figureId: "lebon" },
  "jack-london": { name: "Jack London", figureId: "london" },
  "confucius": { name: "Confucius", figureId: "confucius" },
  "maimonides": { name: "Moses Maimonides", figureId: "maimonides" },
  "bierce": { name: "Ambrose Bierce", figureId: "bierce" },
  "poincare": { name: "Henri Poincaré", figureId: "poincare" },
  "reich": { name: "Wilhelm Reich", figureId: "reich" },
  "goldman": { name: "Emma Goldman", figureId: "goldman" },
  "gibbon": { name: "Edward Gibbon", figureId: "gibbon" },
  "swett": { name: "Orison Swett Marden", figureId: "marden" },
  "luther": { name: "Martin Luther", figureId: "luther" },
  "auxiliary": { name: "Auxiliary", figureId: "auxiliary" },
};

// List of author names to check for cross-contamination
const ALL_AUTHOR_NAMES = [
  "Mill", "John Stuart Mill", "Dewey", "John Dewey", "Plutarch",
  "Mises", "Ludwig von Mises", "Ricardo", "David Ricardo",
  "Bentham", "Jeremy Bentham", "Hobbes", "Thomas Hobbes",
  "Bacon", "Francis Bacon", "Montesquieu", "Voltaire",
];

interface IndexingResult {
  author: string;
  figureId: string;
  filesProcessed: string[];
  chunksCreated: number;
  flaggedFiles: { file: string; reason: string }[];
  errors: string[];
}

interface LogEntry {
  timestamp: string;
  author: string;
  figureId: string;
  file: string;
  chunks: number;
  status: "success" | "flagged" | "error";
  message?: string;
}

function log(entry: LogEntry): void {
  const logFile = path.join(LOG_DIR, `embedding_log_${entry.author}.txt`);
  const logLine = `[${entry.timestamp}] ${entry.status.toUpperCase()} | ${entry.file} | ${entry.chunks} chunks | ${entry.message || ""}\n`;
  fs.appendFileSync(logFile, logLine);
  console.log(logLine.trim());
}

function checkForCrossContamination(content: string, expectedAuthor: string): string | null {
  const contentLower = content.toLowerCase();
  
  for (const otherAuthor of ALL_AUTHOR_NAMES) {
    // Skip if this is the expected author
    if (expectedAuthor.toLowerCase().includes(otherAuthor.toLowerCase())) continue;
    
    // Check for prominent mentions (multiple occurrences or in headers)
    const regex = new RegExp(otherAuthor, "gi");
    const matches = content.match(regex);
    
    if (matches && matches.length >= 5) {
      return `Contains ${matches.length} mentions of "${otherAuthor}" - possible misattribution`;
    }
    
    // Check for "BY [AUTHOR]" pattern which indicates authorship
    const byPattern = new RegExp(`by\\s+${otherAuthor}`, "i");
    if (byPattern.test(content)) {
      return `Contains "by ${otherAuthor}" - likely wrong author`;
    }
  }
  
  return null;
}

function chunkText(text: string, chunkSize: number = 1500, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + chunkSize;
    
    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(".", end);
      const lastNewline = text.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > start + chunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }
    
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 100) { // Only include meaningful chunks
      chunks.push(chunk);
    }
    
    start = end - overlap;
  }
  
  return chunks;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text.slice(0, 8000), // Limit input size
  });
  return response.data[0].embedding;
}

async function isFileAlreadyIndexed(figureId: string, paperTitle: string): Promise<boolean> {
  const result = await db.execute(
    sql`SELECT COUNT(*) as count FROM ${paperChunks} 
        WHERE figure_id = ${figureId} AND paper_title = ${paperTitle} LIMIT 1`
  );
  return parseInt((result.rows[0] as any)?.count || "0") > 0;
}

async function indexAuthorFolder(authorFolder: string): Promise<IndexingResult> {
  const authorConfig = AUTHOR_MAP[authorFolder];
  
  if (!authorConfig) {
    return {
      author: authorFolder,
      figureId: "unknown",
      filesProcessed: [],
      chunksCreated: 0,
      flaggedFiles: [],
      errors: [`Unknown author folder: ${authorFolder}`],
    };
  }
  
  const { name: authorName, figureId } = authorConfig;
  const folderPath = path.join(DATA_DIR, authorFolder);
  
  if (!fs.existsSync(folderPath)) {
    return {
      author: authorName,
      figureId,
      filesProcessed: [],
      chunksCreated: 0,
      flaggedFiles: [],
      errors: [`Folder not found: ${folderPath}`],
    };
  }
  
  const result: IndexingResult = {
    author: authorName,
    figureId,
    filesProcessed: [],
    chunksCreated: 0,
    flaggedFiles: [],
    errors: [],
  };
  
  // Create log file header
  const logFile = path.join(LOG_DIR, `embedding_log_${authorFolder}.txt`);
  fs.writeFileSync(logFile, `=== EMBEDDING LOG FOR ${authorName.toUpperCase()} ===\n`);
  fs.appendFileSync(logFile, `Figure ID: ${figureId}\n`);
  fs.appendFileSync(logFile, `Source Folder: ${folderPath}\n`);
  fs.appendFileSync(logFile, `Started: ${new Date().toISOString()}\n`);
  fs.appendFileSync(logFile, "=".repeat(60) + "\n\n");
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`PROCESSING: ${authorName} (${figureId})`);
  console.log(`Folder: ${folderPath}`);
  console.log("=".repeat(60));
  
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".txt"));
  
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const timestamp = new Date().toISOString();
    
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const paperTitle = file.replace(/\.txt$/, "").replace(/_/g, " ");
      
      // Check if already indexed
      const alreadyIndexed = await isFileAlreadyIndexed(figureId, paperTitle);
      if (alreadyIndexed) {
        log({
          timestamp,
          author: authorFolder,
          figureId,
          file,
          chunks: 0,
          status: "success",
          message: "SKIPPED - already indexed",
        });
        result.filesProcessed.push(file);
        continue;
      }
      
      // Check for cross-contamination
      const contamination = checkForCrossContamination(content, authorName);
      if (contamination) {
        result.flaggedFiles.push({ file, reason: contamination });
        log({
          timestamp,
          author: authorFolder,
          figureId,
          file,
          chunks: 0,
          status: "flagged",
          message: contamination,
        });
        continue; // Skip flagged files
      }
      
      // Chunk the text
      const chunks = chunkText(content);
      
      // Generate embeddings and insert
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await generateEmbedding(chunk);
        
        await db.insert(paperChunks).values({
          figureId: figureId,
          author: authorName,
          paperTitle: paperTitle,
          content: chunk,
          chunkIndex: i,
          embedding: embedding,
          significance: "VERBATIM_TEXT",
        });
        
        result.chunksCreated++;
      }
      
      result.filesProcessed.push(file);
      log({
        timestamp,
        author: authorFolder,
        figureId,
        file,
        chunks: chunks.length,
        status: "success",
      });
      
    } catch (error: any) {
      result.errors.push(`${file}: ${error.message}`);
      log({
        timestamp,
        author: authorFolder,
        figureId,
        file,
        chunks: 0,
        status: "error",
        message: error.message,
      });
    }
  }
  
  // Write summary to log
  fs.appendFileSync(logFile, "\n" + "=".repeat(60) + "\n");
  fs.appendFileSync(logFile, "SUMMARY\n");
  fs.appendFileSync(logFile, `Files processed: ${result.filesProcessed.length}\n`);
  fs.appendFileSync(logFile, `Chunks created: ${result.chunksCreated}\n`);
  fs.appendFileSync(logFile, `Files flagged: ${result.flaggedFiles.length}\n`);
  fs.appendFileSync(logFile, `Errors: ${result.errors.length}\n`);
  fs.appendFileSync(logFile, `Completed: ${new Date().toISOString()}\n`);
  
  console.log(`\nSUMMARY for ${authorName}:`);
  console.log(`  Files processed: ${result.filesProcessed.length}`);
  console.log(`  Chunks created: ${result.chunksCreated}`);
  console.log(`  Flagged: ${result.flaggedFiles.length}`);
  console.log(`  Errors: ${result.errors.length}`);
  
  return result;
}

async function verifyAuthor(figureId: string, authorName: string): Promise<void> {
  console.log(`\nVERIFYING: ${authorName} (${figureId})`);
  
  // Count chunks
  const countResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM ${paperChunks} WHERE figure_id = ${figureId}`
  );
  const count = (countResult.rows[0] as any)?.count || 0;
  console.log(`  Total chunks: ${count}`);
  
  // Sample some content
  const sampleResult = await db.execute(
    sql`SELECT paper_title, LEFT(content, 100) as preview 
        FROM ${paperChunks} 
        WHERE figure_id = ${figureId} 
        ORDER BY RANDOM() 
        LIMIT 3`
  );
  
  console.log("  Sample content:");
  for (const row of sampleResult.rows as any[]) {
    console.log(`    - ${row.paper_title}: "${row.preview}..."`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("Usage:");
    console.log("  npx tsx scripts/strict-embed-authors.ts <author-folder>");
    console.log("  npx tsx scripts/strict-embed-authors.ts all");
    console.log("  npx tsx scripts/strict-embed-authors.ts verify <author-folder>");
    console.log("");
    console.log("Available authors:");
    const folders = fs.readdirSync(DATA_DIR).filter(f => 
      fs.statSync(path.join(DATA_DIR, f)).isDirectory() && AUTHOR_MAP[f]
    );
    folders.forEach(f => console.log(`  - ${f} (${AUTHOR_MAP[f]?.name})`));
    return;
  }
  
  if (args[0] === "verify") {
    const authorFolder = args[1];
    if (!authorFolder || !AUTHOR_MAP[authorFolder]) {
      console.log("Please specify a valid author folder to verify");
      return;
    }
    await verifyAuthor(AUTHOR_MAP[authorFolder].figureId, AUTHOR_MAP[authorFolder].name);
    return;
  }
  
  if (args[0] === "all") {
    const folders = fs.readdirSync(DATA_DIR).filter(f => 
      fs.statSync(path.join(DATA_DIR, f)).isDirectory() && AUTHOR_MAP[f]
    );
    
    const masterLog = path.join(LOG_DIR, "embedding_master_log.txt");
    fs.writeFileSync(masterLog, `=== MASTER EMBEDDING LOG ===\n`);
    fs.appendFileSync(masterLog, `Started: ${new Date().toISOString()}\n\n`);
    
    for (const folder of folders) {
      const result = await indexAuthorFolder(folder);
      fs.appendFileSync(masterLog, `${result.author}: ${result.chunksCreated} chunks, ${result.filesProcessed.length} files\n`);
    }
    
    fs.appendFileSync(masterLog, `\nCompleted: ${new Date().toISOString()}\n`);
    
    // Verify all
    console.log("\n\n=== POST-INDEX VERIFICATION ===\n");
    for (const folder of folders) {
      await verifyAuthor(AUTHOR_MAP[folder].figureId, AUTHOR_MAP[folder].name);
    }
    
  } else {
    const authorFolder = args[0];
    if (!AUTHOR_MAP[authorFolder]) {
      console.log(`Unknown author folder: ${authorFolder}`);
      console.log("Available authors:");
      Object.keys(AUTHOR_MAP).forEach(k => console.log(`  - ${k}`));
      return;
    }
    
    await indexAuthorFolder(authorFolder);
    await verifyAuthor(AUTHOR_MAP[authorFolder].figureId, AUTHOR_MAP[authorFolder].name);
  }
  
  console.log("\n=== EMBEDDING COMPLETE ===\n");
  console.log(`Log files saved to: ${LOG_DIR}`);
}

main().catch(console.error);

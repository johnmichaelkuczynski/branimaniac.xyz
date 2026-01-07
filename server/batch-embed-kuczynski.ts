import OpenAI from "openai";
import { db } from "./db";
import { paperChunks } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { eq } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}

function chunkText(text: string, chunkSize: number = 2000): string[] {
  // Normalize line endings - CRITICAL for Windows files
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Try splitting by section markers first
  const sectionMarkers = /(?=\n(?:Chapter|CHAPTER|PART|Section|SECTION|\d+\.\d+|\d+\.)\s)/g;
  let sections = normalized.split(sectionMarkers).filter(s => s.trim().length > 50);
  
  // If that didn't work, split by paragraph clusters
  if (sections.length < 3) {
    sections = normalized.split(/\n{2,}/).filter(s => s.trim().length > 50);
  }
  
  // If still too few, chunk by character count
  if (sections.length < 3) {
    const chunks: string[] = [];
    let remaining = normalized;
    while (remaining.length > 0) {
      if (remaining.length <= chunkSize) {
        chunks.push(remaining.trim());
        break;
      }
      // Find a good break point
      let breakPoint = remaining.lastIndexOf('\n', chunkSize);
      if (breakPoint < chunkSize / 2) {
        breakPoint = remaining.lastIndexOf('.', chunkSize);
      }
      if (breakPoint < chunkSize / 2) {
        breakPoint = chunkSize;
      }
      chunks.push(remaining.slice(0, breakPoint).trim());
      remaining = remaining.slice(breakPoint).trim();
    }
    return chunks.filter(c => c.length > 50);
  }
  
  // Merge small sections, split large ones
  const chunks: string[] = [];
  let currentChunk = "";
  
  for (const section of sections) {
    if (section.length > chunkSize * 2) {
      // Split large section
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
      let remaining = section;
      while (remaining.length > 0) {
        if (remaining.length <= chunkSize) {
          chunks.push(remaining.trim());
          break;
        }
        let breakPoint = remaining.lastIndexOf('\n', chunkSize);
        if (breakPoint < chunkSize / 2) breakPoint = chunkSize;
        chunks.push(remaining.slice(0, breakPoint).trim());
        remaining = remaining.slice(breakPoint).trim();
      }
    } else if ((currentChunk + section).length > chunkSize) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = section;
    } else {
      currentChunk += "\n\n" + section;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  
  return chunks.filter(c => c.length > 50);
}

async function embedFile(filePath: string) {
  const fileName = path.basename(filePath, '.txt');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.length < 100) {
    return 0;
  }

  // Check if already embedded
  const existing = await db.select().from(paperChunks)
    .where(eq(paperChunks.paperTitle, fileName))
    .limit(1);
  
  if (existing.length > 0) {
    return 0;
  }

  const chunks = chunkText(content);
  console.log(`📄 ${fileName}: ${chunks.length} chunks (${Math.round(content.length/1000)}KB)`);
  
  let embedded = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    try {
      const embedding = await generateEmbedding(chunks[i]);
      await db.insert(paperChunks).values({
        paperTitle: fileName,
        chunkIndex: i,
        content: chunks[i],
        embedding,
        figureId: "common",
        author: "Kuczynski",
      });
      embedded++;
    } catch (error: any) {
      if (error?.status === 429) {
        console.log(`   ⏳ Rate limited, waiting 60s...`);
        await new Promise(r => setTimeout(r, 60000));
        i--;
      } else {
        console.error(`   ✗ Chunk ${i} error:`, error?.message?.slice(0, 100) || error);
      }
    }
  }
  
  return embedded;
}

async function main() {
  const dir = path.join(__dirname, "data/kuczynski");
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.txt') && !f.includes('_Positions'))
    .map(f => path.join(dir, f));
  
  console.log(`\n🚀 Embedding ${files.length} Kuczynski source files...\n`);
  
  let total = 0;
  let processed = 0;
  let skipped = 0;
  
  for (const file of files) {
    const count = await embedFile(file);
    if (count === 0) skipped++;
    total += count;
    processed++;
    if (processed % 20 === 0) {
      console.log(`\n--- Progress: ${processed}/${files.length} files, ${total} chunks, ${skipped} skipped ---\n`);
    }
  }
  
  console.log(`\n✅ DONE! Embedded ${total} chunks from ${processed} files (${skipped} skipped)`);
  process.exit(0);
}

main();

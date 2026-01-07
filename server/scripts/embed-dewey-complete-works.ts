/**
 * DEWEY COMPLETE WORKS EMBEDDING SCRIPT (RESUMABLE)
 * 
 * This embeds the massive Complete Works of John Dewey (~970,000 lines).
 * Designed for multiple runs - tracks progress and resumes where it left off.
 * 
 * Usage: npx tsx server/scripts/embed-dewey-complete-works.ts
 * 
 * Run repeatedly until complete.
 */

import { db } from "../db";
import { textChunks } from "@shared/schema";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const MAX_CHUNKS_PER_RUN = 200; // Process 200 chunks per run to avoid timeouts

const THINKER = "John Dewey";
const SOURCE_FILE = "Complete Works of John Dewey";

function chunkText(text: string, chunkSize: number = CHUNK_SIZE, overlap: number = CHUNK_OVERLAP): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.length > 100) {
      chunks.push(chunk);
    }
    if (i + chunkSize >= words.length) break;
  }
  
  return chunks;
}

async function getExistingChunkCount(): Promise<number> {
  const result = await db.execute(
    sql`SELECT COUNT(*) as count FROM text_chunks WHERE thinker = ${THINKER} AND source_file = ${SOURCE_FILE}`
  );
  return parseInt((result.rows[0] as any)?.count || '0', 10);
}

async function embedDeweyCorpus() {
  console.log("===========================================");
  console.log("DEWEY COMPLETE WORKS EMBEDDING (RESUMABLE)");
  console.log("===========================================\n");
  
  const filePath = path.join(process.cwd(), 'attached_assets', 'The_Collected_Works_of_John_Dewey__The_Complete_Works_Pergamon_1765865146831.txt');
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  console.log(`Reading file...`);
  const content = fs.readFileSync(filePath, 'utf-8');
  console.log(`File size: ${(content.length / 1024 / 1024).toFixed(2)} MB`);
  
  console.log(`Chunking text...`);
  const allChunks = chunkText(content);
  console.log(`Total chunks in file: ${allChunks.length}`);
  
  const existingCount = await getExistingChunkCount();
  console.log(`Existing chunks in database: ${existingCount}`);
  
  if (existingCount >= allChunks.length) {
    console.log(`\nDewey Complete Works is fully embedded!`);
    console.log(`Total: ${existingCount} chunks`);
    return;
  }
  
  const remaining = allChunks.length - existingCount;
  const chunksToProcess = allChunks.slice(existingCount, existingCount + MAX_CHUNKS_PER_RUN);
  
  console.log(`\nChunks remaining: ${remaining}`);
  console.log(`Processing this run: ${chunksToProcess.length}`);
  console.log(`\nStarting at chunk index: ${existingCount}`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < chunksToProcess.length; i++) {
    const chunk = chunksToProcess[i];
    const chunkIndex = existingCount + i;
    
    try {
      await db.insert(textChunks).values({
        thinker: THINKER,
        sourceFile: SOURCE_FILE,
        chunkText: chunk,
        chunkIndex: chunkIndex,
      });
      
      successCount++;
      
      if (successCount % 50 === 0) {
        const progress = ((existingCount + successCount) / allChunks.length * 100).toFixed(1);
        console.log(`Progress: ${existingCount + successCount}/${allChunks.length} (${progress}%)`);
      }
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        // Skip duplicates silently
      } else {
        console.error(`Error at chunk ${chunkIndex}:`, error.message);
        errorCount++;
      }
    }
  }
  
  const newTotal = existingCount + successCount;
  const newRemaining = allChunks.length - newTotal;
  const runsNeeded = Math.ceil(newRemaining / MAX_CHUNKS_PER_RUN);
  
  console.log(`\n========================================`);
  console.log(`DEWEY EMBEDDING PROGRESS`);
  console.log(`========================================`);
  console.log(`Inserted this run: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total now: ${newTotal}/${allChunks.length} (${(newTotal/allChunks.length*100).toFixed(1)}%)`);
  console.log(`Remaining: ${newRemaining}`);
  
  if (newRemaining > 0) {
    console.log(`Runs needed to complete: ${runsNeeded}`);
    console.log(`\nRun this script again to continue.`);
  } else {
    console.log(`\n✓ DEWEY COMPLETE WORKS FULLY EMBEDDED!`);
  }
}

embedDeweyCorpus().catch(console.error);

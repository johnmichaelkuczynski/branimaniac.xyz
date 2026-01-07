/**
 * HEGEL CORPUS EMBEDDING SCRIPT
 * 
 * Embeds Hegel's major works into the text_chunks table for RAG retrieval.
 * 
 * Works:
 * - Philosophy of Mind (~12,245 lines)
 * - Science of Logic (~15,431 lines)
 * 
 * Usage: npx tsx server/scripts/embed-hegel-corpus.ts
 */

import { db } from "../db";
import { textChunks } from "@shared/schema";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const MAX_CHUNKS_PER_RUN = 150;

const THINKER = "G.W.F. Hegel";

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

async function getExistingChunkCount(sourceFile: string): Promise<number> {
  const result = await db.execute(
    sql`SELECT COUNT(*) as count FROM text_chunks WHERE thinker = ${THINKER} AND source_file = ${sourceFile}`
  );
  return parseInt((result.rows[0] as any)?.count || '0', 10);
}

async function embedHegelCorpus() {
  console.log("===========================================");
  console.log("HEGEL CORPUS EMBEDDING");
  console.log("===========================================\n");
  
  const files = [
    {
      path: path.join(process.cwd(), 'attached_assets', 'HEGEL_PHILOSOPHY_OF_MIND_1765865235789.txt'),
      title: 'Philosophy of Mind'
    },
    {
      path: path.join(process.cwd(), 'attached_assets', 'HEGEL_SCIENCE_OF_LOGIC_1765865249543.txt'),
      title: 'Science of Logic'
    },
    {
      path: path.join(process.cwd(), 'attached_assets', 'The_Collected_Works_of_Georg_Wilhelm_Friedrich_Hegel__The_Scie_1765865717368.txt'),
      title: 'Hegel Collected Works'
    }
  ];
  
  let totalChunksInserted = 0;
  
  for (const file of files) {
    if (!fs.existsSync(file.path)) {
      console.log(`File not found: ${file.path}`);
      continue;
    }
    
    console.log(`\nProcessing: ${file.title}`);
    console.log(`File: ${file.path}`);
    
    const existingCount = await getExistingChunkCount(file.title);
    console.log(`Existing chunks: ${existingCount}`);
    
    const content = fs.readFileSync(file.path, 'utf-8');
    const allChunks = chunkText(content);
    console.log(`Total chunks in file: ${allChunks.length}`);
    
    const chunksToProcess = allChunks.slice(existingCount, existingCount + MAX_CHUNKS_PER_RUN);
    console.log(`Chunks to process this run: ${chunksToProcess.length}`);
    
    if (chunksToProcess.length === 0) {
      console.log(`${file.title} is fully embedded!`);
      continue;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < chunksToProcess.length; i++) {
      const chunk = chunksToProcess[i];
      const chunkIndex = existingCount + i;
      
      try {
        await db.insert(textChunks).values({
          thinker: THINKER,
          sourceFile: file.title,
          chunkText: chunk,
          chunkIndex: chunkIndex,
        });
        
        successCount++;
        
        if (successCount % 25 === 0) {
          console.log(`Progress: ${successCount}/${chunksToProcess.length} chunks inserted`);
        }
      } catch (error: any) {
        if (error.message?.includes('duplicate')) {
          // Skip duplicates
        } else {
          console.error(`Error inserting chunk ${chunkIndex}:`, error.message);
          errorCount++;
        }
      }
    }
    
    totalChunksInserted += successCount;
    
    const newTotal = existingCount + successCount;
    const remaining = allChunks.length - newTotal;
    
    console.log(`\n${file.title} Summary:`);
    console.log(`  Inserted: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log(`  Total now: ${newTotal}/${allChunks.length}`);
    console.log(`  Remaining: ${remaining}`);
    
    if (remaining > 0) {
      const runsNeeded = Math.ceil(remaining / MAX_CHUNKS_PER_RUN);
      console.log(`  Runs needed to complete: ${runsNeeded}`);
    }
  }
  
  console.log(`\n========================================`);
  console.log(`HEGEL CORPUS EMBEDDING COMPLETE`);
  console.log(`========================================`);
  console.log(`Total chunks inserted this run: ${totalChunksInserted}`);
  console.log(`\nRun again to continue embedding remaining chunks.`);
}

embedHegelCorpus().catch(console.error);

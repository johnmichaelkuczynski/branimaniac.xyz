/**
 * ENGELS CORPUS EMBEDDING SCRIPT
 * 
 * Embeds Engels' positions and works into the text_chunks table.
 * 
 * Usage: npx tsx server/scripts/embed-engels-corpus.ts
 */

import { db } from "../db";
import { textChunks } from "@shared/schema";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const CHUNK_SIZE = 400;
const CHUNK_OVERLAP = 40;

const THINKER = "Friedrich Engels";

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

async function embedEngelsCorpus() {
  console.log("===========================================");
  console.log("ENGELS CORPUS EMBEDDING");
  console.log("===========================================\n");
  
  const files = [
    {
      path: path.join(process.cwd(), 'attached_assets', 'ENGELS_POSITIONS_AND_QUESTIONS_1765865017480.txt'),
      title: 'Engels Positions and Questions'
    }
  ];
  
  let totalChunksInserted = 0;
  
  for (const file of files) {
    if (!fs.existsSync(file.path)) {
      console.log(`File not found: ${file.path}`);
      continue;
    }
    
    console.log(`Processing: ${file.title}`);
    
    const existingCount = await getExistingChunkCount(file.title);
    console.log(`Existing chunks: ${existingCount}`);
    
    const content = fs.readFileSync(file.path, 'utf-8');
    const allChunks = chunkText(content);
    console.log(`Total chunks in file: ${allChunks.length}`);
    
    if (existingCount >= allChunks.length) {
      console.log(`${file.title} is fully embedded!`);
      continue;
    }
    
    const chunksToProcess = allChunks.slice(existingCount);
    console.log(`Chunks to process: ${chunksToProcess.length}`);
    
    let successCount = 0;
    
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
        
        if (successCount % 10 === 0) {
          console.log(`Progress: ${successCount}/${chunksToProcess.length}`);
        }
      } catch (error: any) {
        if (!error.message?.includes('duplicate')) {
          console.error(`Error:`, error.message);
        }
      }
    }
    
    totalChunksInserted += successCount;
    console.log(`\n${file.title}: Inserted ${successCount} chunks`);
  }
  
  console.log(`\n========================================`);
  console.log(`ENGELS CORPUS COMPLETE: ${totalChunksInserted} chunks`);
  console.log(`========================================`);
}

embedEngelsCorpus().catch(console.error);

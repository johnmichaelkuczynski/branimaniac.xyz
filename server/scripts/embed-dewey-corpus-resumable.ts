import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "@shared/schema";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES = 1000;
const MAX_CHUNKS_PER_RUN = 100; // Process 100 chunks per run to avoid timeout

function chunkText(text: string, chunkSize: number = CHUNK_SIZE, overlap: number = CHUNK_OVERLAP): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.length > 50) {
      chunks.push(chunk);
    }
    if (i + chunkSize >= words.length) break;
  }
  
  return chunks;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function getLastEmbeddedChunkIndex(): Promise<number> {
  try {
    const result = await db.execute(sql`
      SELECT MAX(chunk_index) as max_index 
      FROM paper_chunks 
      WHERE author = 'Dewey' AND paper_title = 'The Collected Works of John Dewey'
    `);
    const maxIndex = (result.rows[0] as any)?.max_index;
    return maxIndex !== null ? Number(maxIndex) : -1;
  } catch (error) {
    return -1;
  }
}

async function embedDeweyCorpusResumable() {
  console.log("Starting RESUMABLE John Dewey Complete Works embedding...\n");
  
  const filePath = path.join(process.cwd(), 'attached_assets', 'The_Collected_Works_of_John_Dewey__The_Complete_Works_Pergamon_1765862407143.txt');
  const title = "The Collected Works of John Dewey";
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  const lastIndex = await getLastEmbeddedChunkIndex();
  const startIndex = lastIndex + 1;
  
  console.log(`Last embedded chunk index: ${lastIndex}`);
  console.log(`Starting from chunk index: ${startIndex}`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const allChunks = chunkText(content);
  
  console.log(`Total chunks in file: ${allChunks.length}`);
  
  if (startIndex >= allChunks.length) {
    console.log("All chunks already embedded!");
    return;
  }
  
  const chunksToProcess = allChunks.slice(startIndex, startIndex + MAX_CHUNKS_PER_RUN);
  console.log(`Processing chunks ${startIndex} to ${startIndex + chunksToProcess.length - 1} (${chunksToProcess.length} chunks)\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < chunksToProcess.length; i += BATCH_SIZE) {
    const batch = chunksToProcess.slice(i, i + BATCH_SIZE);
    
    for (let batchIdx = 0; batchIdx < batch.length; batchIdx++) {
      const chunk = batch[batchIdx];
      const chunkIdx = startIndex + i + batchIdx;
      
      try {
        const embedding = await getEmbedding(chunk);
        
        await db.insert(paperChunks).values({
          paperTitle: title,
          content: chunk,
          author: "Dewey",
          chunkIndex: chunkIdx,
          embedding: embedding,
          figureId: "dewey",
          domain: "philosophy",
        }).onConflictDoNothing();
        
        successCount++;
        
        if (successCount % 20 === 0) {
          console.log(`Progress: ${successCount}/${chunksToProcess.length} chunks embedded (total: ${startIndex + successCount}/${allChunks.length})`);
        }
      } catch (error) {
        console.error(`Error embedding chunk ${chunkIdx}:`, error);
        errorCount++;
      }
    }
    
    if (i + BATCH_SIZE < chunksToProcess.length) {
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  }
  
  const totalEmbedded = startIndex + successCount;
  const remaining = allChunks.length - totalEmbedded;
  
  console.log(`\n========================================`);
  console.log(`DEWEY CORPUS BATCH COMPLETE`);
  console.log(`========================================`);
  console.log(`This run: ${successCount} embedded, ${errorCount} errors`);
  console.log(`Total progress: ${totalEmbedded}/${allChunks.length} chunks`);
  console.log(`Remaining: ${remaining} chunks`);
  if (remaining > 0) {
    console.log(`\nRun this script again to continue embedding.`);
  } else {
    console.log(`\nALL DEWEY CHUNKS EMBEDDED!`);
  }
  console.log(`========================================\n`);
}

embedDeweyCorpusResumable().catch(console.error);

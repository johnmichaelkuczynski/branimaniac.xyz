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
const MAX_CHUNKS_PER_RUN = 200;

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

async function getTotalEmbeddedCount(): Promise<number> {
  try {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM paper_chunks 
      WHERE author = 'Allen' AND paper_title LIKE 'James Allen Works%'
    `);
    return Number((result.rows[0] as any)?.count || 0);
  } catch (error) {
    return 0;
  }
}

async function embedAllenCorpusResumable() {
  console.log("Starting RESUMABLE James Allen Complete Works embedding...\n");
  
  const files = [
    { path: path.join(process.cwd(), 'attached_assets', 'JAMES_ALLEN_21_BOOKS_Part1_1765863042488.txt'), title: "James Allen Works Part 1" },
    { path: path.join(process.cwd(), 'attached_assets', 'JAMES_ALLEN_21_BOOKS_Part2_1765863042489.txt'), title: "James Allen Works Part 2" },
    { path: path.join(process.cwd(), 'attached_assets', 'JAMES_ALLEN_21_BOOKS_Part3_1765863042490.txt'), title: "James Allen Works Part 3" },
    { path: path.join(process.cwd(), 'attached_assets', 'JAMES_ALLEN_21_BOOKS_Part4_1765863042491.txt'), title: "James Allen Works Part 4" },
    { path: path.join(process.cwd(), 'attached_assets', 'JAMES_ALLEN_21_BOOKS_Part5_1765863042492.txt'), title: "James Allen Works Part 5" },
    { path: path.join(process.cwd(), 'attached_assets', 'JAMES_ALLEN_21_BOOKS_Part6_1765863042483.txt'), title: "James Allen Works Part 6" },
    { path: path.join(process.cwd(), 'attached_assets', 'JAMES_ALLEN_21_BOOKS_Part7_1765863042484.txt'), title: "James Allen Works Part 7" },
    { path: path.join(process.cwd(), 'attached_assets', 'JAMES_ALLEN_21_BOOKS_Part8_1765863042485.txt'), title: "James Allen Works Part 8" },
    { path: path.join(process.cwd(), 'attached_assets', 'JAMES_ALLEN_21_BOOKS_Part9_1765863042487.txt'), title: "James Allen Works Part 9" },
  ];
  
  // Build all chunks with file info
  interface ChunkInfo { content: string; title: string; localIndex: number; }
  const allChunks: ChunkInfo[] = [];
  
  for (const file of files) {
    if (!fs.existsSync(file.path)) {
      console.log(`File not found: ${file.path}`);
      continue;
    }
    const content = fs.readFileSync(file.path, 'utf-8');
    const chunks = chunkText(content);
    chunks.forEach((chunk, idx) => {
      allChunks.push({ content: chunk, title: file.title, localIndex: idx });
    });
    console.log(`${file.title}: ${chunks.length} chunks`);
  }
  
  console.log(`\nTotal chunks across all files: ${allChunks.length}`);
  
  const alreadyEmbedded = await getTotalEmbeddedCount();
  const startIndex = alreadyEmbedded;
  
  console.log(`Already embedded: ${alreadyEmbedded}`);
  
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
      const chunkInfo = batch[batchIdx];
      
      try {
        const embedding = await getEmbedding(chunkInfo.content);
        
        await db.insert(paperChunks).values({
          paperTitle: chunkInfo.title,
          content: chunkInfo.content,
          author: "Allen",
          chunkIndex: chunkInfo.localIndex,
          embedding: embedding,
          figureId: "allen",
          domain: "philosophy",
        }).onConflictDoNothing();
        
        successCount++;
        
        if (successCount % 20 === 0) {
          console.log(`Progress: ${successCount}/${chunksToProcess.length} chunks embedded (total: ${startIndex + successCount}/${allChunks.length})`);
        }
      } catch (error) {
        console.error(`Error embedding chunk:`, error);
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
  console.log(`ALLEN CORPUS BATCH COMPLETE`);
  console.log(`========================================`);
  console.log(`This run: ${successCount} embedded, ${errorCount} errors`);
  console.log(`Total progress: ${totalEmbedded}/${allChunks.length} chunks`);
  console.log(`Remaining: ${remaining} chunks`);
  if (remaining > 0) {
    console.log(`\nRun this script again to continue embedding.`);
  } else {
    console.log(`\nALL ALLEN CHUNKS EMBEDDED!`);
  }
  console.log(`========================================\n`);
}

embedAllenCorpusResumable().catch(console.error);

import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES = 1000;

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

async function embedAllenCorpus() {
  console.log("Starting James Allen Complete Works embedding...\n");
  
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
  
  let totalChunks = 0;
  let successCount = 0;
  let errorCount = 0;
  let fileCount = 0;
  
  for (const file of files) {
    if (!fs.existsSync(file.path)) {
      console.log(`File not found: ${file.path}`);
      continue;
    }
    
    fileCount++;
    
    try {
      console.log(`Reading ${file.title}...`);
      const content = fs.readFileSync(file.path, 'utf-8');
      const chunks = chunkText(content);
      
      console.log(`[${fileCount}/${files.length}] ${file.title}: ${chunks.length} chunks`);
      totalChunks += chunks.length;
      
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        
        for (let batchIdx = 0; batchIdx < batch.length; batchIdx++) {
          const chunk = batch[batchIdx];
          const chunkIdx = i + batchIdx;
          
          try {
            const embedding = await getEmbedding(chunk);
            
            await db.insert(paperChunks).values({
              paperTitle: file.title,
              content: chunk,
              author: "Allen",
              chunkIndex: chunkIdx,
              embedding: embedding,
              figureId: "allen",
              domain: "philosophy",
            }).onConflictDoNothing();
            
            successCount++;
            
            if (successCount % 100 === 0) {
              console.log(`Progress: ${successCount} chunks embedded so far`);
            }
          } catch (error) {
            console.error(`Error embedding chunk ${chunkIdx}:`, error);
            errorCount++;
          }
        }
        
        if (i + BATCH_SIZE < chunks.length) {
          await sleep(DELAY_BETWEEN_BATCHES);
        }
      }
      
    } catch (error) {
      console.error(`Error processing file ${file.title}:`, error);
      errorCount++;
    }
  }
  
  console.log(`\n========================================`);
  console.log(`ALLEN CORPUS EMBEDDING COMPLETE`);
  console.log(`========================================`);
  console.log(`Files processed: ${fileCount}`);
  console.log(`Total chunks: ${totalChunks}`);
  console.log(`Successfully embedded: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`========================================\n`);
}

embedAllenCorpus().catch(console.error);

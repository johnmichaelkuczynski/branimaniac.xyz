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

async function embedKuczynskiNew() {
  console.log("Starting Kuczynski New Works embedding...\n");
  
  const files = [
    { path: path.join(process.cwd(), 'attached_assets', 'Freedom_1765863211862.txt'), title: "Freedom" },
    { path: path.join(process.cwd(), 'attached_assets', 'Modality_and_Non-existence_1765863262240.txt'), title: "Modality and Non-existence" },
    { path: path.join(process.cwd(), 'attached_assets', 'Language_1765863272674.txt'), title: "What Is a Language" },
    { path: path.join(process.cwd(), 'attached_assets', 'Semantics__Philosophy_Shorts_Volume_8_1765863290456.txt'), title: "Semantics" },
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
              author: "Kuczynski",
              chunkIndex: chunkIdx,
              embedding: embedding,
              figureId: "kuczynski",
              domain: "philosophy",
            }).onConflictDoNothing();
            
            successCount++;
            
            if (successCount % 20 === 0) {
              console.log(`Progress: ${successCount} chunks embedded`);
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
  console.log(`KUCZYNSKI NEW WORKS EMBEDDING COMPLETE`);
  console.log(`========================================`);
  console.log(`Files processed: ${fileCount}`);
  console.log(`Total chunks: ${totalChunks}`);
  console.log(`Successfully embedded: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`========================================\n`);
}

embedKuczynskiNew().catch(console.error);

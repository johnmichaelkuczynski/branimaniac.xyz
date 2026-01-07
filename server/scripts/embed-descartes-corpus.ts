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

async function embedDescartesCorpus() {
  console.log("Starting René Descartes Works embedding...\n");
  
  const files = [
    {
      path: path.join(process.cwd(), 'attached_assets', 'DESCARTES_POSITIONS_AND_QUESTIONS_1765862635105.txt'),
      title: "Descartes Positions and Questions"
    }
  ];
  
  let totalChunks = 0;
  let successCount = 0;
  let errorCount = 0;
  
  for (const file of files) {
    if (!fs.existsSync(file.path)) {
      console.log(`File not found: ${file.path}`);
      continue;
    }
    
    try {
      console.log(`Reading ${file.title}...`);
      const content = fs.readFileSync(file.path, 'utf-8');
      const chunks = chunkText(content);
      
      console.log(`${file.title}: ${chunks.length} chunks to embed`);
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
              author: "Descartes",
              chunkIndex: chunkIdx,
              embedding: embedding,
              figureId: "descartes",
              domain: "philosophy",
            }).onConflictDoNothing();
            
            successCount++;
            
            if (successCount % 20 === 0) {
              console.log(`Progress: ${successCount}/${totalChunks} chunks embedded`);
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
  console.log(`DESCARTES CORPUS EMBEDDING COMPLETE`);
  console.log(`========================================`);
  console.log(`Total chunks: ${totalChunks}`);
  console.log(`Successfully embedded: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`========================================\n`);
}

embedDescartesCorpus().catch(console.error);

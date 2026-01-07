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

function extractTitle(filename: string): string {
  return filename
    .replace(/\.txt$/i, '')
    .replace(/_/g, ' ')
    .replace(/^\d+\s*/, '')
    .replace(/\s+WORD$/i, '')
    .replace(/\s+revised$/i, ' (Revised)')
    .trim();
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

async function embedKuczynskiCorpus() {
  console.log("Starting FULL Kuczynski Corpus embedding...\n");
  
  const dataDir = path.join(process.cwd(), 'server', 'data', 'kuczynski');
  const authorDbDir = path.join(process.cwd(), 'author_database', 'kuczynski');
  
  let allFiles: { path: string; name: string }[] = [];
  
  if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.txt'));
    allFiles.push(...files.map(f => ({ path: path.join(dataDir, f), name: f })));
    console.log(`Found ${files.length} files in server/data/kuczynski`);
  }
  
  if (fs.existsSync(authorDbDir)) {
    const files = fs.readdirSync(authorDbDir).filter(f => f.endsWith('.txt'));
    allFiles.push(...files.map(f => ({ path: path.join(authorDbDir, f), name: f })));
    console.log(`Found ${files.length} files in author_database/kuczynski`);
  }
  
  console.log(`\nTotal files to process: ${allFiles.length}\n`);
  
  let totalChunks = 0;
  let successCount = 0;
  let errorCount = 0;
  let fileCount = 0;
  
  for (const file of allFiles) {
    fileCount++;
    const title = extractTitle(file.name);
    
    try {
      const content = fs.readFileSync(file.path, 'utf-8');
      const chunks = chunkText(content);
      
      console.log(`[${fileCount}/${allFiles.length}] ${title}: ${chunks.length} chunks`);
      
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        
        for (let batchIdx = 0; batchIdx < batch.length; batchIdx++) {
          const chunk = batch[batchIdx];
          const chunkIdx = i + batchIdx;
          
          try {
            const embedding = await getEmbedding(chunk);
            
            await db.insert(paperChunks).values({
              paperTitle: title,
              content: chunk,
              author: "Kuczynski",
              chunkIndex: chunkIdx,
              embedding: embedding,
              figureId: "kuczynski",
              domain: "philosophy",
            }).onConflictDoNothing();
            
            successCount++;
          } catch (error) {
            console.error(`Error embedding chunk ${chunkIdx} of ${title}:`, error);
            errorCount++;
          }
        }
        
        if (i + BATCH_SIZE < chunks.length) {
          await sleep(DELAY_BETWEEN_BATCHES);
        }
      }
      
      totalChunks += chunks.length;
      
      if (fileCount % 10 === 0) {
        console.log(`\n--- Progress: ${fileCount}/${allFiles.length} files, ${successCount} chunks embedded ---\n`);
      }
      
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      errorCount++;
    }
  }
  
  console.log(`\n========================================`);
  console.log(`EMBEDDING COMPLETE`);
  console.log(`========================================`);
  console.log(`Files processed: ${fileCount}`);
  console.log(`Total chunks: ${totalChunks}`);
  console.log(`Successfully embedded: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`========================================\n`);
}

embedKuczynskiCorpus().catch(console.error);

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

async function embedQuantumDeterminism() {
  console.log("Starting Quantum Determinism embedding...\n");
  
  const filePath = path.join(process.cwd(), 'server', 'data', 'kuczynski', 'Quantum_Determinism.txt');
  const title = "Quantum Determinism";
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    process.exit(1);
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  try {
    console.log(`Reading ${title}...`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const chunks = chunkText(content);
    
    console.log(`${title}: ${chunks.length} chunks to embed`);
    
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
          console.log(`Embedded chunk ${chunkIdx + 1}/${chunks.length}`);
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
    console.error(`Error processing ${title}:`, error);
  }
  
  console.log(`\n=== COMPLETE ===`);
  console.log(`Successfully embedded: ${successCount} chunks`);
  console.log(`Errors: ${errorCount}`);
}

embedQuantumDeterminism()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

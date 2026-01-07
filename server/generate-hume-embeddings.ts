import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "./db";
import { paperChunks } from "@shared/schema";
import OpenAI from "openai";
import { eq, and } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function chunkText(text: string, targetWordsPerChunk: number = 250): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  const chunks: string[] = [];
  let currentChunk = "";
  let wordCount = 0;
  
  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).length;
    
    if (sentenceWords > targetWordsPerChunk) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
        wordCount = 0;
      }
      
      const words = sentence.split(/\s+/);
      for (let i = 0; i < words.length; i += targetWordsPerChunk) {
        const chunk = words.slice(i, i + targetWordsPerChunk).join(" ");
        chunks.push(chunk);
      }
      continue;
    }
    
    if (wordCount + sentenceWords > targetWordsPerChunk && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
      wordCount = sentenceWords;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
      wordCount += sentenceWords;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(c => c.split(/\s+/).length > 20);
}

async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: texts,
    });
    
    return response.data.map(item => item.embedding);
  } catch (error: any) {
    const errorMessage = error?.error?.message || error?.message || '';
    if (error?.status === 400 && errorMessage.includes('maximum context length')) {
      throw error;
    }
    throw error;
  }
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error: any) {
    const errorMessage = error?.error?.message || error?.message || '';
    if (error?.status === 400 && errorMessage.includes('maximum context length')) {
      return null;
    }
    throw error;
  }
}

async function main() {
  console.log("Generating David Hume embeddings...\n");
  
  console.log("Clearing existing Hume embeddings...");
  await db.delete(paperChunks).where(
    and(
      eq(paperChunks.figureId, 'common'),
      eq(paperChunks.author, 'David Hume')
    )
  );
  console.log("✓ Cleared\n");
  
  const startTime = Date.now();
  
  try {
    console.log(`Processing: An Enquiry Concerning Human Understanding`);
    
    const content = readFileSync(
      join(__dirname, "../attached_assets/Pasted-HUME-The-Project-Gutenberg-eBook-of-An-Enquiry-Concerning-Human-Understanding-This-ebook-i-1762993430494_1762993430511.txt"),
      "utf-8"
    );
    const chunks = chunkText(content, 250);
    
    console.log(`   Found ${chunks.length} chunks`);
    console.log(`   Estimated time: ${Math.ceil(chunks.length / 16 * 0.2)} minutes\n`);
    
    const BATCH_SIZE = 16;
    let processedCount = 0;
    
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, Math.min(i + BATCH_SIZE, chunks.length));
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);
      
      process.stdout.write(`   Batch ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + BATCH_SIZE, chunks.length)})...`);
      
      try {
        const embeddings = await generateEmbeddingsBatch(batch);
        
        for (let j = 0; j < batch.length; j++) {
          await db.insert(paperChunks).values({
            figureId: "common",
            author: "David Hume",
            paperTitle: "An Enquiry Concerning Human Understanding",
            content: batch[j],
            embedding: embeddings[j] as any,
            chunkIndex: i + j,
          });
          processedCount++;
        }
        
        process.stdout.write(` ✓ (${processedCount}/${chunks.length})\n`);
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (batchError) {
        process.stdout.write(` fallback...\n`);
        
        for (let j = 0; j < batch.length; j++) {
          const chunkIndex = i + j;
          process.stdout.write(`     Chunk ${chunkIndex + 1}/${chunks.length}...`);
          
          const embedding = await generateEmbedding(batch[j]);
          
          if (embedding === null) {
            process.stdout.write(` skip\n`);
            continue;
          }
          
          await db.insert(paperChunks).values({
            figureId: "common",
            author: "David Hume",
            paperTitle: "An Enquiry Concerning Human Understanding",
            content: batch[j],
            embedding: embedding as any,
            chunkIndex: chunkIndex,
          });
          
          processedCount++;
          process.stdout.write(` ✓\n`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`\nDone! Generated ${processedCount} Hume embeddings in ${duration} minutes.`);
    console.log(`Stored in Common Fund with author='David Hume'`);
    
  } catch (error) {
    console.error(`Error:`, error);
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

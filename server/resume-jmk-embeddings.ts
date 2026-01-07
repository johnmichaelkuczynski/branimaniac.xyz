import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "./db";
import { paperChunks } from "@shared/schema";
import OpenAI from "openai";
import { eq, sql } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function chunkText(text: string, targetWordsPerChunk: number = 400): string[] {
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
      const wordCount = text.split(/\s+/).length;
      console.log(` ⚠️  Chunk too large (~${wordCount} words), skipping`);
      return null;
    }
    throw error;
  }
}

async function main() {
  console.log("🎓 Resuming J.-M. Kuczynski embeddings generation...\n");
  
  // Check current progress
  const result = await db.select({ count: sql<number>`count(*)::int` })
    .from(paperChunks)
    .where(eq(paperChunks.figureId, 'kuczynski'));
  
  const currentCount = result[0]?.count || 0;
  console.log(`📊 Current embeddings: ${currentCount}\n`);
  
  const startTime = Date.now();
  
  try {
    console.log(`📄 Processing: J.-M. Kuczynski Complete Works (30 papers)`);
    
    const content = readFileSync(join(__dirname, "kuczynski_complete_works.txt"), "utf-8");
    const chunks = chunkText(content, 400);
    
    console.log(`   Total chunks: ${chunks.length}`);
    console.log(`   Starting from chunk: ${currentCount + 1}\n`);
    
    for (let i = currentCount; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      process.stdout.write(`   Embedding chunk ${i + 1}/${chunks.length}...`);
      
      const embedding = await generateEmbedding(chunk);
      
      if (embedding === null) {
        process.stdout.write(` skipped\n`);
        continue;
      }
      
      await db.insert(paperChunks).values({
        figureId: "kuczynski",
        paperTitle: "Complete Works: 30 Papers including Mind, Meaning & Scientific Explanation",
        content: chunk,
        embedding: embedding as any,
        chunkIndex: i,
      });
      
      process.stdout.write(` ✓\n`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const totalProcessed = chunks.length - currentCount;
    console.log(`\n🎉 Done! Generated ${totalProcessed} new embeddings in ${duration} minutes.`);
    console.log(`   Total J.-M. Kuczynski embeddings: ${chunks.length}`);
  } catch (error) {
    console.error(`❌ Error:`, error);
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

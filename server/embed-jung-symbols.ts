import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "./db";
import { paperChunks } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const jungWork = {
  file: "jung_man_and_symbols.txt",
  title: "Man and His Symbols by Carl G. Jung",
  author: "C.G. Jung"
};

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

async function generateEmbeddingsBatch(texts: string[]): Promise<(number[] | null)[]> {
  const BATCH_SIZE = 16;
  const results: (number[] | null)[] = [];
  
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: batch,
      });
      
      results.push(...response.data.map(d => d.embedding));
    } catch (error: any) {
      const errorMessage = error?.error?.message || error?.message || '';
      if (errorMessage.toLowerCase().includes('maximum context length')) {
        console.log(` ⚠️  Batch too large, processing individually...`);
        for (const text of batch) {
          try {
            const response = await openai.embeddings.create({
              model: "text-embedding-ada-002",
              input: text,
            });
            results.push(response.data[0].embedding);
          } catch {
            results.push(null);
          }
        }
      } else {
        throw error;
      }
    }
  }
  
  return results;
}

async function main() {
  console.log("🧠 Starting embedding process for Jung's Man and His Symbols...\n");
  
  const figureId = "common";
  
  console.log(`📖 Processing: ${jungWork.title}`);
  console.log(`   Author: ${jungWork.author}`);
  console.log(`   File: ${jungWork.file}`);
  
  const existing = await db
    .select()
    .from(paperChunks)
    .where(and(
      eq(paperChunks.figureId, figureId),
      eq(paperChunks.paperTitle, jungWork.title)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    console.log(`   ⏭️  Already embedded, skipping...`);
    return;
  }
  
  const filePath = join(__dirname, "data", jungWork.file);
  let content: string;
  
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (error) {
    console.log(`   ❌ File not found: ${filePath}`);
    return;
  }
  
  const chunks = chunkText(content, 250);
  console.log(`   📝 Created ${chunks.length} chunks (~250 words each)`);
  
  console.log(`   🔄 Generating embeddings in batches...`);
  const embeddings = await generateEmbeddingsBatch(chunks);
  
  const insertData = chunks
    .map((chunk, index) => {
      const embedding = embeddings[index];
      if (!embedding) return null;
      
      return {
        figureId,
        author: jungWork.author,
        paperTitle: jungWork.title,
        content: chunk,
        embedding: embedding,
        chunkIndex: index,
      };
    })
    .filter(Boolean);
  
  if (insertData.length === 0) {
    console.log(`   ⚠️  No embeddings generated`);
    return;
  }
  
  const DB_BATCH_SIZE = 50;
  for (let i = 0; i < insertData.length; i += DB_BATCH_SIZE) {
    const batch = insertData.slice(i, i + DB_BATCH_SIZE);
    await db.insert(paperChunks).values(batch as any);
    
    if ((i + DB_BATCH_SIZE) < insertData.length) {
      process.stdout.write(`\r   💾 Inserted ${Math.min(i + DB_BATCH_SIZE, insertData.length)}/${insertData.length} chunks...`);
    }
  }
  
  const skippedCount = chunks.length - insertData.length;
  console.log(`\n   ✅ Completed: ${insertData.length} chunks embedded${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}`);
  
  const finalCount = await db
    .select()
    .from(paperChunks)
    .where(eq(paperChunks.figureId, figureId));
  
  console.log(`\n📊 Common Fund now contains: ${finalCount.length} total chunks`);
  console.log(`\n✨ Jung's Man and His Symbols successfully added with author attribution!`);
}

main().catch(console.error);

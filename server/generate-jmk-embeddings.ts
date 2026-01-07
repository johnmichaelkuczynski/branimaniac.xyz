import { readFileSync, readdirSync } from "fs";
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

function formatTitle(filename: string): string {
  return filename
    .replace(/\.txt$/, '')
    .replace(/^CHAPTER_/, 'Chapter ')
    .replace(/^CORPUS_ANALYSIS_/, '')
    .replace(/_/g, ' ');
}

async function main() {
  console.log("🎓 Generating J.-M. Kuczynski embeddings from ACTUAL SOURCE TEXTS...\n");
  
  const dataDir = join(__dirname, "data/kuczynski");
  
  const allFiles = readdirSync(dataDir).filter(f => f.endsWith('.txt'));
  
  const targetFiles = allFiles.filter(f => {
    if (f.startsWith('CORPUS_ANALYSIS_')) return false;
    if (f.includes('WORD')) return false;
    if (f.includes('revised')) return false;
    if (f.includes('_1762') || f.includes('_176')) return false;
    return true;
  });
  
  console.log(`📚 Found ${targetFiles.length} ACTUAL Kuczynski source file(s) to process\n`);
  console.log("Files to embed:");
  targetFiles.forEach(f => console.log(`  - ${f}`));
  console.log("");
  
  const startTime = Date.now();
  let totalChunks = 0;
  let newFiles = 0;
  
  for (const file of targetFiles) {
    const filePath = join(dataDir, file);
    const paperTitle = formatTitle(file);
    
    console.log(`📄 Processing: ${paperTitle}`);
    
    const existing = await db.select().from(paperChunks)
      .where(and(eq(paperChunks.figureId, "kuczynski"), eq(paperChunks.paperTitle, paperTitle)))
      .limit(1);
    
    if (existing.length > 0) {
      console.log(`   ⏭️  Already embedded, skipping\n`);
      continue;
    }
    
    newFiles++;
    const content = readFileSync(filePath, "utf-8");
    const chunks = chunkText(content, 400);
    
    console.log(`   Found ${chunks.length} chunks`);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      process.stdout.write(`   Embedding chunk ${i + 1}/${chunks.length}...`);
      
      const embedding = await generateEmbedding(chunk);
      
      if (embedding === null) {
        process.stdout.write(` skipped\n`);
        continue;
      }
      
      await db.insert(paperChunks).values({
        figureId: "kuczynski",
        author: "J.-M. Kuczynski",
        paperTitle: paperTitle,
        content: chunk,
        embedding: embedding as any,
        chunkIndex: i,
      });
      
      process.stdout.write(` ✓\n`);
      totalChunks++;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`   ✓ Completed ${file}\n`);
  }
  
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n🎉 Done! Processed ${newFiles} new file(s), generated ${totalChunks} embeddings in ${duration} minutes.`);
}

main().catch(console.error);

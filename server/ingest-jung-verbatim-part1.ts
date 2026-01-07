import { db } from "./db";
import { paperChunks } from "@shared/schema";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CHUNK_SIZE = 2000; // characters per chunk
const OVERLAP = 200; // overlap between chunks

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text.substring(0, 8000),
  });
  return response.data[0].embedding;
}

function chunkText(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    start += size - overlap;
  }
  
  return chunks;
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('  JUNG VERBATIM TEXT INGESTION - PART 1');
  console.log('  Complete Works: Psychological Types, Psychiatric Studies, Essays');
  console.log('='.repeat(80) + '\n');
  
  const files = [
    'attached_assets/Complete Works of Carl Jung_ Psychological Types, Psychiatric Studies, Essays on Analytical Psychology & others (Grapevine Press)_Part1_1763671198105.txt',
    'attached_assets/Complete Works of Carl Jung_ Psychological Types, Psychiatric Studies, Essays on Analytical Psychology & others (Grapevine Press)_Part2_1763671198106.txt',
    'attached_assets/Complete Works of Carl Jung_ Psychological Types, Psychiatric Studies, Essays on Analytical Psychology & others (Grapevine Press)_Part3_1763671198106.txt',
    'attached_assets/Complete Works of Carl Jung_ Psychological Types, Psychiatric Studies, Essays on Analytical Psychology & others (Grapevine Press)_Part4_1763671198107.txt',
    'attached_assets/Complete Works of Carl Jung_ Psychological Types, Psychiatric Studies, Essays on Analytical Psychology & others (Grapevine Press)_Part5_1763671198107.txt',
    'attached_assets/Complete Works of Carl Jung_ Psychological Types, Psychiatric Studies, Essays on Analytical Psychology & others (Grapevine Press)_Part6_1763671198107.txt',
    'attached_assets/Complete Works of Carl Jung_ Psychological Types, Psychiatric Studies, Essays on Analytical Psychology & others (Grapevine Press)_Part7_1763671198108.txt',
    'attached_assets/Complete Works of Carl Jung_ Psychological Types, Psychiatric Studies, Essays on Analytical Psychology & others (Grapevine Press)_Part8_1763671198108.txt'
  ];
  
  const result = await db.execute(
    `SELECT MAX(chunk_index) as max_idx FROM paper_chunks WHERE author = 'Carl Jung'`
  );
  let chunkIndex = parseInt((result.rows[0] as any).max_idx || '0') + 1;
  
  let totalChunks = 0;
  let totalWords = 0;
  
  for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
    const filePath = files[fileIdx];
    const partNum = fileIdx + 1;
    
    console.log(`\n  📄 Processing Part ${partNum}/8...`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  File not found: ${filePath}`);
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const wordCount = content.split(/\s+/).length;
    totalWords += wordCount;
    
    console.log(`     Words: ${wordCount.toLocaleString()}`);
    
    const chunks = chunkText(content, CHUNK_SIZE, OVERLAP);
    console.log(`     Chunks: ${chunks.length}`);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const embedding = await generateEmbedding(chunk);
        
        await db.insert(paperChunks).values({
          figureId: 'common',
          author: 'Carl Jung',
          paperTitle: `Complete Works Part ${partNum}`,
          chunkIndex: chunkIndex++,
          content: chunk,
          embedding: embedding,
          significance: 'VERBATIM_TEXT'
        });
        
        totalChunks++;
        
        if (totalChunks % 50 === 0) {
          console.log(`     Progress: ${totalChunks} chunks ingested...`);
        }
        
        // Rate limiting
        if (totalChunks % 10 === 0) {
          await new Promise(r => setTimeout(r, 100));
        }
        
      } catch (error) {
        console.error(`  ✗ Failed chunk ${i} in Part ${partNum}:`, error);
      }
    }
    
    console.log(`  ✅ Part ${partNum} complete: ${chunks.length} chunks`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`  🎉 JUNG VERBATIM INGESTION COMPLETE`);
  console.log(`  \n  📊 Statistics:`);
  console.log(`     - Total chunks: ${totalChunks.toLocaleString()}`);
  console.log(`     - Total words: ${totalWords.toLocaleString()}`);
  console.log(`     - Files processed: ${files.length}`);
  console.log(`  \n  ✅ Jung now has verbatim text for authentic quotes`);
  console.log('='.repeat(80) + '\n');
}

main().catch(console.error);

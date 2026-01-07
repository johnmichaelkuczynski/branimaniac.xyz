import { db } from "./db";
import { paperChunks } from "@shared/schema";
import OpenAI from "openai";
import * as fs from "fs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CHUNK_SIZE = 2000;
const OVERLAP = 200;

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
  console.log('  JUNG COMPLETE WORKS INGESTION');
  console.log('='.repeat(80) + '\n');
  
  // ALL Jung files in order
  const allFiles = [
    { path: 'attached_assets/Complete Works of Carl Jung_ Psychological Types, Psychiatric Studies, Essays on Analytical Psychology & others (Grapevine Press)_Part5_1763671198107.txt', title: 'Complete Works Part 5' },
    { path: 'attached_assets/Complete Works of Carl Jung_ Psychological Types, Psychiatric Studies, Essays on Analytical Psychology & others (Grapevine Press)_Part6_1763671198107.txt', title: 'Complete Works Part 6' },
    { path: 'attached_assets/Complete Works of Carl Jung_ Psychological Types, Psychiatric Studies, Essays on Analytical Psychology & others (Grapevine Press)_Part7_1763671198108.txt', title: 'Complete Works Part 7' },
    { path: 'attached_assets/Complete Works of Carl Jung_ Psychological Types, Psychiatric Studies, Essays on Analytical Psychology & others (Grapevine Press)_Part8_1763671198108.txt', title: 'Complete Works Part 8' },
    { path: 'attached_assets/JUNG COLLECTED ANALYTICAL WORKS_1763671558319.txt', title: 'Collected Analytical Works' },
    { path: 'attached_assets/Psychology of the Unconscious_ A Study of the Transformations and Symbolisms of the Libido, A Contribution to the History of the Evolution of Thought_1763671563900.txt', title: 'Psychology of the Unconscious (Libido)' },
    { path: 'attached_assets/THE THEORY OF PSYCHOANALYSIS (Timeless Wisdom Collection Book 615)_1763671563901.txt', title: 'Theory of Psychoanalysis' },
    { path: 'attached_assets/JUNG PSYCHOLOGY OF THE UNCONSCIOUS_1763671563902.txt', title: 'Psychology of the Unconscious' },
    { path: 'attached_assets/Man and His Symbols_1763671563903.txt', title: 'Man and His Symbols' }
  ];
  
  const result = await db.execute(
    `SELECT MAX(chunk_index) as max_idx FROM paper_chunks WHERE author = 'Carl Jung'`
  );
  let chunkIndex = parseInt((result.rows[0] as any).max_idx || '0') + 1;
  
  let totalChunks = 0;
  let totalWords = 0;
  let filesProcessed = 0;
  
  for (const fileInfo of allFiles) {
    console.log(`\n  📄 Processing: ${fileInfo.title}...`);
    
    if (!fs.existsSync(fileInfo.path)) {
      console.log(`  ⚠️  File not found, skipping`);
      continue;
    }
    
    const content = fs.readFileSync(fileInfo.path, 'utf-8');
    const wordCount = content.split(/\s+/).length;
    totalWords += wordCount;
    
    console.log(`     Words: ${wordCount.toLocaleString()}`);
    
    const chunks = chunkText(content, CHUNK_SIZE, OVERLAP);
    console.log(`     Chunks to process: ${chunks.length}`);
    
    let fileChunks = 0;
    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await generateEmbedding(chunks[i]);
        
        await db.insert(paperChunks).values({
          figureId: 'common',
          author: 'Carl Jung',
          paperTitle: fileInfo.title,
          chunkIndex: chunkIndex++,
          content: chunks[i],
          embedding: embedding,
          significance: 'VERBATIM_TEXT'
        });
        
        fileChunks++;
        totalChunks++;
        
        if (fileChunks % 25 === 0) {
          console.log(`     Progress: ${fileChunks}/${chunks.length} chunks...`);
        }
        
        // Rate limiting
        if (fileChunks % 10 === 0) {
          await new Promise(r => setTimeout(r, 100));
        }
        
      } catch (error) {
        console.error(`  ✗ Failed chunk ${i}:`, error);
      }
    }
    
    filesProcessed++;
    console.log(`  ✅ Complete: ${fileChunks} chunks added`);
    console.log(`     Running total: ${totalChunks} chunks`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`  🎉 JUNG INGESTION COMPLETE!`);
  console.log(`  \n  📊 Final Statistics:`);
  console.log(`     - Files processed: ${filesProcessed}`);
  console.log(`     - Total chunks: ${totalChunks.toLocaleString()}`);
  console.log(`     - Total words: ${totalWords.toLocaleString()}`);
  console.log(`  \n  ✅ Jung now has comprehensive verbatim text coverage!`);
  console.log('='.repeat(80) + '\n');
}

main().catch(console.error);

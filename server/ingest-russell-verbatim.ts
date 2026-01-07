import { db } from "./db";
import { paperChunks } from "@shared/schema";
import OpenAI from "openai";
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const RUSSELL_FILES = [
  { 
    path: 'attached_assets/Complete Philosophical Writings of Bertrand Russell_Part1_1763621259845.txt',
    work: 'Complete Philosophical Writings - Part 1',
    workId: 'RUSSELL-COMPLETE-PT1'
  },
  { 
    path: 'attached_assets/Complete Philosophical Writings of Bertrand Russell_Part2_1763621259846.txt',
    work: 'Complete Philosophical Writings - Part 2',
    workId: 'RUSSELL-COMPLETE-PT2'
  },
  { 
    path: 'attached_assets/Complete Philosophical Writings of Bertrand Russell_Part3_1763621259846.txt',
    work: 'Complete Philosophical Writings - Part 3',
    workId: 'RUSSELL-COMPLETE-PT3'
  },
  { 
    path: 'attached_assets/BERTRAND RUSSELL GUTENBERG WORKS_1763621259847.txt',
    work: 'Russell: Analysis of Mind & Other Works',
    workId: 'RUSSELL-GUTENBERG'
  }
];

const TARGET_CHUNK_SIZE = 400; // words per chunk

function chunkTextByWords(text: string, targetSize: number): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += targetSize) {
    const chunk = words.slice(i, i + targetSize).join(' ');
    if (chunk.trim().length > 50) { // Skip tiny fragments
      chunks.push(chunk.trim());
    }
  }
  
  return chunks;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text.substring(0, 8000), // OpenAI limit
  });
  return response.data[0].embedding;
}

async function ingestRussellFile(file: typeof RUSSELL_FILES[0], startChunkIndex: number): Promise<number> {
  console.log(`\n📖 Ingesting: ${file.work}`);
  
  const fullPath = path.join(process.cwd(), file.path);
  if (!fs.existsSync(fullPath)) {
    console.log(`   ⚠️  File not found, skipping`);
    return 0;
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const wordCount = content.split(/\s+/).length;
  console.log(`   ${wordCount.toLocaleString()} words`);
  
  const chunks = chunkTextByWords(content, TARGET_CHUNK_SIZE);
  console.log(`   ${chunks.length} chunks to ingest`);
  
  let successCount = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    const globalChunkIndex = startChunkIndex + i;
    
    if (i % 20 === 0) {
      console.log(`   Progress: ${i + 1}/${chunks.length}...`);
    }
    
    try {
      const embedding = await generateEmbedding(chunks[i]);
      
      await db.insert(paperChunks).values({
        figureId: 'common',
        author: 'Bertrand Russell',
        paperTitle: file.work,
        chunkIndex: globalChunkIndex,
        content: chunks[i],
        embedding: embedding,
        positionId: null,
        domain: null,
        sourceWork: file.workId,
        significance: 'VERBATIM_TEXT',
        philosophicalEngagements: {
          source_type: 'verbatim',
          chunk_number: globalChunkIndex + 1,
          work: file.workId
        }
      });
      
      successCount++;
      
      // Rate limiting: 3 requests per second = 333ms delay
      if (i < chunks.length - 1 && i % 3 === 0) {
        await new Promise(r => setTimeout(r, 150));
      }
      
    } catch (error) {
      console.error(`   ✗ Chunk ${i} failed:`, error);
    }
  }
  
  console.log(`   ✅ ${successCount}/${chunks.length} chunks ingested`);
  return successCount;
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('  BERTRAND RUSSELL VERBATIM TEXT INGESTION');
  console.log('='.repeat(80));
  console.log('\n  This creates quotable text chunks from Russell\'s complete works');
  console.log('  Estimated: ~2,000 chunks from 832,000 words\n');
  
  let totalChunks = 0;
  let currentChunkIndex = 0;
  
  for (const file of RUSSELL_FILES) {
    const chunksIngested = await ingestRussellFile(file, currentChunkIndex);
    totalChunks += chunksIngested;
    currentChunkIndex += chunksIngested;
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`  ✅ COMPLETE: ${totalChunks} Russell verbatim chunks ingested`);
  console.log(`  🎯 Russell now has quotable text from all major works`);
  console.log('='.repeat(80) + '\n');
}

main().catch(console.error);

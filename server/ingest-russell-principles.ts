import { db } from "./db";
import { paperChunks } from "@shared/schema";
import OpenAI from "openai";
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PRINCIPLES_FILES = [
  { 
    path: 'attached_assets/Principles of Mathematics (Routledge Classics)_Part1_1763667768841.txt',
    work: 'Principles of Mathematics - Part 1',
    workId: 'RUSSELL-PRINCIPLES-PT1'
  },
  { 
    path: 'attached_assets/Principles of Mathematics (Routledge Classics)_Part2_1763667768841.txt',
    work: 'Principles of Mathematics - Part 2',
    workId: 'RUSSELL-PRINCIPLES-PT2'
  },
  { 
    path: 'attached_assets/Principles of Mathematics (Routledge Classics)_Part3_1763667768842.txt',
    work: 'Principles of Mathematics - Part 3',
    workId: 'RUSSELL-PRINCIPLES-PT3'
  },
  { 
    path: 'attached_assets/Principles of Mathematics (Routledge Classics)_Part4_1763667768842.txt',
    work: 'Principles of Mathematics - Part 4 (Appendices)',
    workId: 'RUSSELL-PRINCIPLES-PT4'
  }
];

const TARGET_CHUNK_SIZE = 400;

function chunkTextByWords(text: string, targetSize: number): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += targetSize) {
    const chunk = words.slice(i, i + targetSize).join(' ');
    if (chunk.trim().length > 50) {
      chunks.push(chunk.trim());
    }
  }
  
  return chunks;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text.substring(0, 8000),
  });
  return response.data[0].embedding;
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('  RUSSELL: PRINCIPLES OF MATHEMATICS INGESTION');
  console.log('='.repeat(80));
  console.log('\n  Russell\'s magnum opus on logicism and foundations of mathematics\n');
  
  // Get current Russell chunk count to continue indexing
  const result = await db.execute(
    `SELECT COUNT(*) as count FROM paper_chunks WHERE author = 'Bertrand Russell'`
  );
  const startIndex = parseInt((result.rows[0] as any).count || '0');
  console.log(`  Starting from chunk index: ${startIndex}\n`);
  
  let totalChunks = 0;
  let currentIndex = startIndex;
  
  for (const file of PRINCIPLES_FILES) {
    console.log(`📖 ${file.work}`);
    
    const fullPath = path.join(process.cwd(), file.path);
    if (!fs.existsSync(fullPath)) {
      console.log(`   ⚠️  File not found, skipping\n`);
      continue;
    }
    
    const content = fs.readFileSync(fullPath, 'utf-8');
    const wordCount = content.split(/\s+/).length;
    console.log(`   ${wordCount.toLocaleString()} words`);
    
    const chunks = chunkTextByWords(content, TARGET_CHUNK_SIZE);
    console.log(`   ${chunks.length} chunks to ingest`);
    
    let successCount = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      if (i % 25 === 0) {
        console.log(`   Progress: ${i + 1}/${chunks.length}...`);
      }
      
      try {
        const embedding = await generateEmbedding(chunks[i]);
        
        await db.insert(paperChunks).values({
          figureId: 'common',
          author: 'Bertrand Russell',
          paperTitle: file.work,
          chunkIndex: currentIndex,
          content: chunks[i],
          embedding: embedding,
          positionId: null,
          domain: null,
          sourceWork: file.workId,
          significance: 'VERBATIM_TEXT',
          philosophicalEngagements: {
            source_type: 'verbatim',
            chunk_number: currentIndex + 1,
            work: file.workId
          }
        });
        
        successCount++;
        currentIndex++;
        
        if (i < chunks.length - 1 && i % 3 === 0) {
          await new Promise(r => setTimeout(r, 150));
        }
        
      } catch (error) {
        console.error(`   ✗ Chunk ${i} failed:`, error);
      }
    }
    
    console.log(`   ✅ ${successCount}/${chunks.length} chunks ingested\n`);
    totalChunks += successCount;
  }
  
  console.log('='.repeat(80));
  console.log(`  ✅ COMPLETE: ${totalChunks} Principles chunks ingested`);
  console.log(`  📊 Russell total verbatim chunks: ${currentIndex}`);
  console.log('='.repeat(80) + '\n');
}

main().catch(console.error);

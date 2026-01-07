import { db } from './db';
import { paperChunks } from '@shared/schema';
import { OpenAI } from 'openai';
import { readFile } from 'fs/promises';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  return response.data[0].embedding;
}

interface TextChunk {
  text: string;
  workTitle: string;
  section?: string;
  chunkIndex: number;
}

/**
 * JAMES ALLEN - COMPLETE WORKS INGESTION (ROUND 2: 8 PARTS)
 * 
 * Source: James Allen 21 Books Collection
 * Total: 8 parts (Rounds 1-2), ~60,079 lines, ~370,000 words
 * Strategy: MAX VALUE - Verbatim chunks for quote extraction + structured positions
 * 
 * Works Included Across All Parts:
 * - The Kingdom of Peace (selfishness, competition, spiritual wisdom)
 * - Laws of Justice & Spiritual Economics
 * - Sympathy, Sincerity, and Character
 * - Bodily Conditions, Poverty, Health & Virtue
 * - Humility and Spiritual Strength
 * - The Way of Truth (Self-Restraint, Self-Examination, Self-Surrender)
 * - Morning and Evening Thoughts
 * - Daily Meditations (Immortality, Peace, Love, Truth) [NEW - Part 8]
 * - Truth Triumphant (Poetry & Wisdom) [NEW - Part 9]
 * 
 * Note: James Allen (1864-1912) - Author of "As A Man Thinketh"
 * Pioneer of self-help movement, moral philosophy, and practical spirituality
 */

const JAMES_ALLEN_FILES = [
  {
    path: 'attached_assets/JAMES ALLEN 21 BOOKS_Part2_1763704117442.txt',
    title: 'The Kingdom of Peace',
    section: 'Spiritual Philosophy'
  },
  {
    path: 'attached_assets/JAMES ALLEN 21 BOOKS_Part3_1763704117442.txt',
    title: 'Laws of Justice & Spiritual Economics',
    section: 'Moral Philosophy'
  },
  {
    path: 'attached_assets/JAMES ALLEN 21 BOOKS_Part4_1763704117443.txt',
    title: 'Sympathy, Sincerity & Character',
    section: 'Character Development'
  },
  {
    path: 'attached_assets/JAMES ALLEN 21 BOOKS_Part5_1763704117443.txt',
    title: 'Bodily Conditions & Virtue',
    section: 'Health & Morality'
  },
  {
    path: 'attached_assets/JAMES ALLEN 21 BOOKS_Part6_1763704117443.txt',
    title: 'Humility & Spiritual Strength',
    section: 'Character Development'
  },
  {
    path: 'attached_assets/JAMES ALLEN 21 BOOKS_Part7_1763704117442.txt',
    title: 'The Way of Truth',
    section: 'Spiritual Practice'
  },
  {
    path: 'attached_assets/JAMES ALLEN 21 BOOKS_Part8_1763704358609.txt',
    title: 'Daily Meditations - Immortality & Peace',
    section: 'Spiritual Practice'
  },
  {
    path: 'attached_assets/JAMES ALLEN 21 BOOKS_Part9_1763704358610.txt',
    title: 'Truth Triumphant - Poetry & Wisdom',
    section: 'Poetry & Philosophy'
  }
];

function chunkText(text: string, workTitle: string, section: string, chunkSize: number = 600): TextChunk[] {
  const chunks: TextChunk[] = [];
  const words = text.trim().split(/\s+/);
  
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunkWords = words.slice(i, i + chunkSize);
    const chunkText = chunkWords.join(' ');
    
    chunks.push({
      text: chunkText,
      workTitle,
      section,
      chunkIndex: Math.floor(i / chunkSize)
    });
  }
  
  return chunks;
}

async function ingestJamesAllenComplete() {
  console.log('⚡ JAMES ALLEN - COMPLETE WORKS INGESTION (ROUND 2: 8 PARTS)');
  console.log('=' .repeat(80));
  
  let totalChunks = 0;
  let totalWords = 0;
  
  for (const file of JAMES_ALLEN_FILES) {
    try {
      console.log(`\n📖 Processing: ${file.title}`);
      console.log(`   Section: ${file.section}`);
      
      const content = await readFile(file.path, 'utf-8');
      const words = content.trim().split(/\s+/);
      const wordCount = words.length;
      totalWords += wordCount;
      
      console.log(`   📊 Size: ${wordCount.toLocaleString()} words`);
      
      const chunks = chunkText(content, file.title, file.section);
      console.log(`   ✂️  Created ${chunks.length} chunks`);
      
      let processed = 0;
      for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk.text);
        
        await db.insert(paperChunks).values({
          figureId: 'james-allen',
          author: 'James Allen',
          paperTitle: chunk.workTitle,
          content: chunk.text,
          embedding: embedding,
          chunkIndex: chunk.chunkIndex,
          domain: chunk.section || 'Moral Philosophy'
        }).onConflictDoNothing();
        
        processed++;
        if (processed % 50 === 0) {
          console.log(`   💾 Processed ${processed}/${chunks.length} chunks...`);
        }
      }
      
      totalChunks += chunks.length;
      console.log(`   ✅ Completed ${file.title}`);
      
    } catch (error) {
      console.error(`   ❌ Error processing ${file.title}:`, error);
      throw error;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 JAMES ALLEN COMPLETE WORKS INGESTION COMPLETE (ROUND 2: 8 PARTS)');
  console.log(`📚 Total chunks created: ${totalChunks}`);
  console.log(`📊 Total words processed: ${totalWords.toLocaleString()}`);
  console.log(`⚡ Average chunk size: ${Math.round(totalWords / totalChunks)} words`);
  console.log(`📖 Total parts processed: 8`);
  console.log(`🔮 More parts expected in subsequent rounds (21 books total)`);
  console.log('='.repeat(80));
}

ingestJamesAllenComplete();

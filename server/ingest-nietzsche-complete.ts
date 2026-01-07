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
 * FRIEDRICH NIETZSCHE - COMPLETE WORKS INGESTION (ALL 19 PARTS - ULTIMATE EDITION)
 * 
 * Source: Complete Works Collection (19 parts, ~196,000 lines, ~1,200,000 words)
 * Strategy: MAX VALUE - Verbatim chunks for quote extraction + structured positions
 * 
 * Works Included Across All Parts:
 * - The Birth of Tragedy
 * - Philosophy During the Tragic Age of the Greeks
 * - On Truth and Lies in a Non-Moral Sense
 * - Untimely Meditations (all 4 essays)
 * - Human, All Too Human (complete with sequels)
 * - The Dawn of Day (complete)
 * - The Gay Science (complete)
 * - Thus Spoke Zarathustra (complete)
 * - Beyond Good and Evil (complete)
 * - On the Genealogy of Morals (complete)
 * - The Twilight of the Idols (complete)
 * - The Antichrist (complete)
 * - Ecce Homo (complete)
 * - The Will to Power (posthumous notes - extensive)
 * - Biography and letters
 * - Various essays and fragments
 */

const NIETZSCHE_FILES = [
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part1_1763741805841.txt',
    title: 'Birth of Tragedy & Early Works',
    section: 'Aesthetics & Early Philosophy'
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part2_1763741805842.txt',
    title: 'Philosophical Foundations',
    section: 'Metaphysics & Epistemology'
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part3_1763741805836.txt',
    title: 'Ethics & Truth',
    section: 'Moral Philosophy'
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part4_1763741805837.txt',
    title: 'Religion & Culture',
    section: 'Cultural Criticism'
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part5_1763741805839.txt',
    title: 'Middle Period Works',
    section: 'Philosophy of Values'
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part6_1763741935272.txt',
    title: 'Late Works & Fragments',
    section: 'Mature Philosophy'
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part7_1763741935270.txt',
    title: 'Dawn of Day & Free Spirit',
    section: 'Moral Philosophy'
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part8_1763741935271.txt',
    title: 'Historical Method & Science',
    section: 'Philosophy of Science'
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part9_1763741935271.txt',
    title: 'Gay Science & Great Health',
    section: 'Philosophy of Values'
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part10_1763741935271.txt',
    title: 'Zarathustra - Spirit of Gravity',
    section: 'Ethics & Self-Overcoming'
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part11_1763701774090.txt',
    title: 'Beyond Good and Evil - Will to Power',
    section: 'Moral Philosophy'
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part12_1763701774090.txt',
    title: 'Genealogy of Morals - Master & Slave',
    section: 'Moral Philosophy'
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part13_1763701774091.txt',
    title: 'Twilight of Idols & Cultural Critique',
    section: 'Cultural Criticism'
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part14_1763701774092.txt',
    title: 'Ecce Homo & Self-Reflection',
    section: 'Autobiography'
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part15_1763701940974.txt',
    title: 'Will to Power - Epistemology',
    section: 'Philosophy of Science'
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part16_1763701940974.txt',
    title: 'Culture & Education Critique',
    section: 'Cultural Criticism'
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part17_1763701940975.txt',
    title: 'Letters & Correspondence',
    section: 'Biography'
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part18_1763701940972.txt',
    title: 'Early Biography & Development',
    section: 'Biography'
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part19_1763701940973.txt',
    title: 'Wagner Relationship & Bayreuth',
    section: 'Biography'
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

async function ingestNietzscheComplete() {
  console.log('⚡ FRIEDRICH NIETZSCHE - COMPLETE WORKS INGESTION (ALL 19 PARTS - ULTIMATE EDITION)');
  console.log('=' .repeat(80));
  
  let totalChunks = 0;
  let totalWords = 0;
  
  for (const file of NIETZSCHE_FILES) {
    try {
      console.log(`\n📖 Processing: ${file.title}`);
      console.log(`   Section: ${file.section}`);
      
      const content = await readFile(file.path, 'utf-8');
      const wordCount = content.trim().split(/\s+/).length;
      totalWords += wordCount;
      
      console.log(`   📊 Size: ${wordCount.toLocaleString()} words`);
      
      const chunks = chunkText(content, file.title, file.section);
      console.log(`   ✂️  Created ${chunks.length} chunks`);
      
      let inserted = 0;
      
      // ONE CHUNK AT A TIME - SLOW AND STEADY WINS THE RACE
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        try {
          const embedding = await generateEmbedding(chunk.text);
          
          await db.insert(paperChunks).values({
            figureId: 'nietzsche',
            author: 'Friedrich Nietzsche',
            paperTitle: chunk.workTitle,
            content: chunk.text,
            embedding: embedding,
            chunkIndex: chunk.chunkIndex,
            domain: chunk.section || 'General',
          }).onConflictDoNothing();
          
          inserted++;
          
          if (inserted % 10 === 0) {
            console.log(`   💾 Processed ${inserted}/${chunks.length} chunks...`);
          }
          
          // TAKE A BREAK between chunks to avoid resource limits
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (error) {
          console.error(`   ❌ Error processing chunk ${i}:`, error);
        }
      }
      
      totalChunks += inserted;
      console.log(`   ✅ Completed: ${inserted} chunks inserted`);
      
    } catch (error) {
      console.error(`\n❌ Error processing ${file.title}:`, error);
      throw error;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 NIETZSCHE COMPLETE WORKS INGESTION COMPLETE (ALL 19 PARTS - ULTIMATE EDITION)');
  console.log(`📚 Total chunks created: ${totalChunks}`);
  console.log(`📊 Total words processed: ${totalWords.toLocaleString()}`);
  console.log(`⚡ Average chunk size: ${Math.round(totalWords / totalChunks)} words`);
  console.log(`📖 Total parts processed: 19`);
  console.log('='.repeat(80));
}

ingestNietzscheComplete();

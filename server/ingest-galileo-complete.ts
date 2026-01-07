import { db } from './db';
import { paperChunks } from '../shared/schema';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TextChunk {
  text: string;
  workTitle: string;
  section?: string;
  chunkIndex: number;
}

/**
 * GALILEO GALILEI - COMPLETE WORKS INGESTION (ROUNDS 1 + 2)
 * 
 * Source: Delphi Collected Works of Galileo Galilei (9 parts, ~76,394 lines)
 * Strategy: MAX VALUE - Verbatim chunks for quote extraction + structured positions
 * 
 * Works Included:
 * - Part 1: The Starry Messenger, biographies
 * - Part 2: Discourse on Floating Bodies
 * - Part 3: Dialogues on solar spots, Aristotelian philosophy
 * - Part 4: Motion, mechanics, Earth's movement
 * - Part 5: Astronomical calculations, new stars
 * - Part 6: Tides, Earth's motion, dialogue format
 * - Part 7: Pendulums, vibrations, acoustics
 * - Part 8: Projectile motion, parabolas, geometry
 * - Part 9: Encyclopedia Britannica biography
 */

const GALILEO_FILES = [
  {
    path: 'attached_assets/Delphi Collected Works of Galileo Galilei (Illustrated) (Delphi Series Seven Book 26)_Part1_1763693476535.txt',
    title: 'The Starry Messenger and Biographical Works',
    section: 'Astronomy & Biography'
  },
  {
    path: 'attached_assets/Delphi Collected Works of Galileo Galilei (Illustrated) (Delphi Series Seven Book 26)_Part2_1763693476539.txt',
    title: 'Discourse on Floating Bodies',
    section: 'Physics & Mathematics'
  },
  {
    path: 'attached_assets/Delphi Collected Works of Galileo Galilei (Illustrated) (Delphi Series Seven Book 26)_Part3_1763693476539.txt',
    title: 'Dialogues on Solar Spots and Philosophy',
    section: 'Astronomy & Philosophy'
  },
  {
    path: 'attached_assets/Delphi Collected Works of Galileo Galilei (Illustrated) (Delphi Series Seven Book 26)_Part4_1763693476540.txt',
    title: 'Dialogues on Motion and Mechanics',
    section: 'Physics & Mechanics'
  },
  {
    path: 'attached_assets/Delphi Collected Works of Galileo Galilei (Illustrated) (Delphi Series Seven Book 26)_Part5_1763693476532.txt',
    title: 'Astronomical Calculations and New Stars',
    section: 'Astronomy & Mathematics'
  },
  {
    path: 'attached_assets/Delphi Collected Works of Galileo Galilei (Illustrated) (Delphi Series Seven Book 26)_Part6_1763694160417.txt',
    title: 'Dialogues on Tides and Earth Motion',
    section: 'Physics & Astronomy'
  },
  {
    path: 'attached_assets/Delphi Collected Works of Galileo Galilei (Illustrated) (Delphi Series Seven Book 26)_Part7_1763694160419.txt',
    title: 'Mathematical Demonstrations - Pendulums and Vibrations',
    section: 'Physics & Mathematics'
  },
  {
    path: 'attached_assets/Delphi Collected Works of Galileo Galilei (Illustrated) (Delphi Series Seven Book 26)_Part8_1763694160420.txt',
    title: 'Mathematical Demonstrations - Projectile Motion',
    section: 'Physics & Mathematics'
  },
  {
    path: 'attached_assets/Delphi Collected Works of Galileo Galilei (Illustrated) (Delphi Series Seven Book 26)_Part9_1763694160420.txt',
    title: 'Biographical Encyclopedia Entry',
    section: 'Biography'
  }
];

function chunkText(text: string, workTitle: string, section: string, chunkSize: number = 600): TextChunk[] {
  const chunks: TextChunk[] = [];
  const words = text.trim().split(/\s+/);
  
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunkWords = words.slice(i, i + chunkSize);
    const chunkText = chunkWords.join(' ').trim();
    
    if (chunkText.length > 100) {  // Minimum 100 characters
      chunks.push({
        text: chunkText,
        workTitle,
        section,
        chunkIndex: chunks.length
      });
    }
  }
  
  return chunks;
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

async function ingestGalileoComplete() {
  console.log('🔭 GALILEO GALILEI - COMPLETE WORKS INGESTION (ROUNDS 1 + 2)');
  console.log('=' .repeat(80));
  
  let totalChunks = 0;
  let totalWords = 0;
  
  for (const file of GALILEO_FILES) {
    console.log(`\n📖 Processing: ${file.title}`);
    console.log(`   Section: ${file.section}`);
    
    try {
      const fullPath = path.resolve(file.path);
      
      if (!fs.existsSync(fullPath)) {
        console.log(`   ⚠️  File not found: ${fullPath}`);
        continue;
      }
      
      const content = fs.readFileSync(fullPath, 'utf-8');
      const wordCount = content.split(/\s+/).length;
      totalWords += wordCount;
      
      console.log(`   📊 Size: ${wordCount.toLocaleString()} words`);
      
      const chunks = chunkText(content, file.title, file.section);
      console.log(`   ✂️  Created ${chunks.length} chunks`);
      
      let inserted = 0;
      for (const chunk of chunks) {
        try {
          const embedding = await generateEmbedding(chunk.text);
          
          // Use onConflictDoNothing to skip duplicates (allows resumable ingestion)
          await db.insert(paperChunks).values({
            figureId: 'galileo',
            author: 'Galileo Galilei',
            paperTitle: chunk.workTitle,
            content: chunk.text,
            embedding: embedding,
            chunkIndex: chunk.chunkIndex,
            domain: chunk.section || 'General',
          }).onConflictDoNothing();
          
          inserted++;
          
          if (inserted % 50 === 0) {
            console.log(`   💾 Processed ${inserted}/${chunks.length} chunks...`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`   ❌ Error processing chunk ${chunk.chunkIndex}:`, error);
        }
      }
      
      totalChunks += inserted;
      console.log(`   ✅ Completed: ${inserted} chunks inserted`);
      
    } catch (error) {
      console.error(`   ❌ Error processing ${file.title}:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 INGESTION COMPLETE');
  console.log(`   Total Works: ${GALILEO_FILES.length}`);
  console.log(`   Total Words: ${totalWords.toLocaleString()}`);
  console.log(`   Total Chunks: ${totalChunks}`);
  console.log('=' .repeat(80));
}

export { ingestGalileoComplete };

// Execute immediately
ingestGalileoComplete()
  .then(() => {
    console.log('✅ Galileo ingestion completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Galileo ingestion failed:', error);
    process.exit(1);
  });

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
 * PLATO - COMPLETE WORKS INGESTION (14 PARTS TOTAL)
 * 
 * Source: Complete Works Collection [Annotated] by Benjamin Jowett translation
 * Total: 14 parts, ~133,658 lines, ~820,000 words
 * Strategy: MAX VALUE - Verbatim chunks for quote extraction + structured positions
 * 
 * Works Included Across All Parts:
 * - The Apology
 * - Charmides, Cratylus, Critias, Crito
 * - Euthydemus, Euthyphro
 * - Gorgias
 * - Ion
 * - Laches
 * - Laws (Books I-XII, complete)
 * - Lesser Hippias, Lysis
 * - Meno, Menexenus
 * - Parmenides
 * - Phaedo
 * - Phaedrus
 * - Philebus
 * - Republic (Guardian Education, Noble Lie)
 * - Plus Benjamin Jowett's extensive introductions and analyses
 */

const PLATO_FILES = [
  // UPDATED COLLECTION - Using latest uploaded files
  {
    path: 'attached_assets/The Complete Works of Plato [Annotated]_Part1_1763709115600.txt',
    title: 'Apology & Dialogues I',
    section: 'Ethics & Socratic Dialogues'
  },
  {
    path: 'attached_assets/The Complete Works of Plato [Annotated]_Part2_1763709115601.txt',
    title: 'Cratylus - Theory of Names',
    section: 'Philosophy of Language'
  },
  {
    path: 'attached_assets/The Complete Works of Plato [Annotated]_Part3_1763709115601.txt',
    title: 'Euthydemus - Virtue & Wisdom',
    section: 'Ethics & Education'
  },
  {
    path: 'attached_assets/The Complete Works of Plato [Annotated]_Part4_1763709115602.txt',
    title: 'Gorgias - Rhetoric & Justice',
    section: 'Political Philosophy'
  },
  {
    path: 'attached_assets/The Complete Works of Plato [Annotated]_Part5_1763709115599.txt',
    title: 'Laches & Laws I-IV',
    section: 'Political Philosophy'
  },
  {
    path: 'attached_assets/The Complete Works of Plato [Annotated]_Part6_1763709115599.txt',
    title: 'Laws V-XII',
    section: 'Political Philosophy'
  },
  {
    path: 'attached_assets/The Complete Works of Plato [Annotated]_Part7_1763709115600.txt',
    title: 'Laws - Virtue & Governance',
    section: 'Political Philosophy'
  },
  {
    path: 'attached_assets/The Complete Works of Plato [Annotated]_Part8_1763709115600.txt',
    title: 'Laws - Agriculture & Property',
    section: 'Political Philosophy'
  },
  {
    path: 'attached_assets/The Complete Works of Plato [Annotated]_Part9_1763709340441.txt',
    title: 'Lesser Hippias - Truth & Falsehood',
    section: 'Ethics & Epistemology'
  },
  {
    path: 'attached_assets/The Complete Works of Plato [Annotated]_Part10_1763709340441.txt',
    title: 'Parmenides - Theory of Forms',
    section: 'Metaphysics'
  },
  {
    path: 'attached_assets/The Complete Works of Plato [Annotated]_Part11_1763709340442.txt',
    title: 'Phaedo - Immortality of Soul',
    section: 'Metaphysics & Ethics'
  },
  {
    path: 'attached_assets/The Complete Works of Plato [Annotated]_Part12_1763709340442.txt',
    title: 'Phaedrus - Love & Rhetoric',
    section: 'Ethics & Rhetoric'
  },
  {
    path: 'attached_assets/The Complete Works of Plato [Annotated]_Part13_1763709340443.txt',
    title: 'Philebus - Pleasure & Good',
    section: 'Ethics'
  },
  {
    path: 'attached_assets/The Complete Works of Plato [Annotated]_Part14_1763709340443.txt',
    title: 'Republic - Guardian Education & Noble Lie',
    section: 'Political Philosophy'
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

async function ingestPlatoComplete() {
  console.log('⚡ PLATO - COMPLETE WORKS INGESTION (14 PARTS TOTAL)');
  console.log('=' .repeat(80));
  
  let totalChunks = 0;
  let totalWords = 0;
  
  for (const file of PLATO_FILES) {
    try {
      console.log(`\n📖 Processing: ${file.title}`);
      console.log(`   Section: ${file.section}`);
      
      const content = await readFile(file.path, 'utf-8');
      const wordCount = content.trim().split(/\s+/).length;
      totalWords += wordCount;
      
      console.log(`   📊 Size: ${wordCount.toLocaleString()} words`);
      
      const chunks = chunkText(content, file.title, file.section);
      console.log(`   ✂️  Created ${chunks.length} chunks`);
      
      let processedChunks = 0;
      for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk.text);
        
        await db.insert(paperChunks).values({
          figureId: 'plato',
          author: 'Plato',
          paperTitle: chunk.workTitle,
          content: chunk.text,
          embedding: embedding,
          chunkIndex: chunk.chunkIndex,
        }).onConflictDoNothing();
        
        processedChunks++;
        totalChunks++;
        
        if (processedChunks % 50 === 0) {
          console.log(`   💾 Processed ${processedChunks}/${chunks.length} chunks...`);
        }
      }
      
      console.log(`   ✅ Completed ${file.title}`);
      
    } catch (error) {
      console.error(`   ❌ Error processing ${file.title}:`, error);
      throw error;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 PLATO COMPLETE WORKS INGESTION COMPLETE (14 PARTS TOTAL)');
  console.log(`📚 Total chunks created: ${totalChunks}`);
  console.log(`📊 Total words processed: ${totalWords.toLocaleString()}`);
  console.log(`⚡ Average chunk size: ${Math.round(totalWords / totalChunks)} words`);
  console.log(`📖 Total parts processed: 14`);
  console.log('='.repeat(80));
}

ingestPlatoComplete();

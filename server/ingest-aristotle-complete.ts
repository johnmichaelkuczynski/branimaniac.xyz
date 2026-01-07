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
 * ARISTOTLE - COMPLETE WORKS INGESTION (ROUND 3: 18 PARTS - COMPLETE!)
 * 
 * Source: The Complete Aristotle Collection
 * Total: 18 parts (ALL ROUNDS), ~175,346 lines, ~1,052,000 words
 * Strategy: MAX VALUE - Verbatim chunks for quote extraction + structured positions
 * 
 * COMPLETE SYSTEMATIC PHILOSOPHY - ALL MAJOR WORKS:
 * 
 * LOGIC & EPISTEMOLOGY (Parts 1-3):
 * - Organon: Categories, On Interpretation, Prior & Posterior Analytics, Topics, Sophistical Refutations
 * 
 * NATURAL PHILOSOPHY (Parts 4-7):
 * - Physics (8 books), On Generation & Corruption, On the Soul, Perception, Memory, Dreams
 * 
 * BIOLOGY & ZOOLOGY (Parts 8-12):
 * - History of Animals (classification, reproduction, generation)
 * - Parts of Animals, Motion of Animals, Generation of Animals (embryology)
 * 
 * METAPHYSICS & ETHICS (Parts 13-15):
 * - Metaphysics Book IX (Potency & Actuality)
 * - Nicomachean Ethics Books III & X (Virtue, Choice, Deliberation, Happiness)
 * - Politics Book I (State, Household, Slavery)
 * 
 * POLITICS & RHETORIC (Parts 16-18):
 * - Politics Books IV-VII (Democracy, Oligarchy, Best Constitution)
 * - Rhetoric Books I-III (Persuasion, Emotions, Style)
 * - Poetics (Tragedy, Epic, Imitation)
 * 
 * Note: Aristotle (384-322 BC) - Student of Plato, teacher of Alexander the Great
 * Founder of formal logic, empirical biology, physics, metaphysics, ethics, politics, rhetoric
 * His comprehensive systematic works shaped medieval scholarship and remain foundational to Western thought
 */

const ARISTOTLE_FILES = [
  // ROUND 1: Logic & Natural Philosophy (Parts 1-7)
  {
    path: 'attached_assets/The Complete Aristotle_Part1_1763707425321.txt',
    title: 'Logic (Organon) - Categories & Analytics',
    section: 'Logic & Epistemology'
  },
  {
    path: 'attached_assets/The Complete Aristotle_Part2_1763707425321.txt',
    title: 'Prior & Posterior Analytics',
    section: 'Logic & Demonstration'
  },
  {
    path: 'attached_assets/The Complete Aristotle_Part3_1763707425322.txt',
    title: 'Topics - Advanced Methods',
    section: 'Dialectic & Reasoning'
  },
  {
    path: 'attached_assets/The Complete Aristotle_Part4_1763707425322.txt',
    title: 'Physics & Generation',
    section: 'Natural Philosophy'
  },
  {
    path: 'attached_assets/The Complete Aristotle_Part5_1763707425318.txt',
    title: 'Physics Book VIII - Motion & First Mover',
    section: 'Cosmology & Metaphysics'
  },
  {
    path: 'attached_assets/The Complete Aristotle_Part6_1763707425319.txt',
    title: 'On Generation and Corruption II',
    section: 'Elements & Substances'
  },
  {
    path: 'attached_assets/The Complete Aristotle_Part7_1763707425320.txt',
    title: 'On the Soul & Perception',
    section: 'Psychology & Biology'
  },
  
  // ROUND 2: Biology, Metaphysics, Ethics (Parts 8-15)
  {
    path: 'attached_assets/The Complete Aristotle_Part8_1763707760923.txt',
    title: 'History of Animals - Classification',
    section: 'Biology & Zoology'
  },
  {
    path: 'attached_assets/The Complete Aristotle_Part9_1763707760923.txt',
    title: 'History of Animals - Reproduction',
    section: 'Biology & Zoology'
  },
  {
    path: 'attached_assets/The Complete Aristotle_Part10_1763707760924.txt',
    title: 'Parts of Animals',
    section: 'Biology & Anatomy'
  },
  {
    path: 'attached_assets/The Complete Aristotle_Part11_1763707760924.txt',
    title: 'On the Motion of Animals',
    section: 'Biology & Movement'
  },
  {
    path: 'attached_assets/The Complete Aristotle_Part12_1763707760925.txt',
    title: 'On the Generation of Animals',
    section: 'Biology & Embryology'
  },
  {
    path: 'attached_assets/The Complete Aristotle_Part13_1763707760926.txt',
    title: 'Metaphysics Book IX - Potency & Actuality',
    section: 'Metaphysics'
  },
  {
    path: 'attached_assets/The Complete Aristotle_Part14_1763707760922.txt',
    title: 'Nicomachean Ethics III - Virtue & Choice',
    section: 'Ethics'
  },
  {
    path: 'attached_assets/The Complete Aristotle_Part15_1763707760923.txt',
    title: 'Nicomachean Ethics X & Politics I',
    section: 'Ethics & Political Philosophy'
  },
  
  // ROUND 3: Politics, Rhetoric, Poetics (Parts 16-18) - FINAL
  {
    path: 'attached_assets/The Complete Aristotle_Part16_1763707769176.txt',
    title: 'Politics Books IV-VII - Constitution & Democracy',
    section: 'Political Philosophy'
  },
  {
    path: 'attached_assets/The Complete Aristotle_Part17_1763707769174.txt',
    title: 'Rhetoric Books I-III - Persuasion & Style',
    section: 'Rhetoric & Communication'
  },
  {
    path: 'attached_assets/The Complete Aristotle_Part18_1763707769175.txt',
    title: 'Poetics - Tragedy & Epic Poetry',
    section: 'Literary Theory'
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

async function ingestAristotleComplete() {
  console.log('⚡ ARISTOTLE - COMPLETE WORKS INGESTION (ROUND 3: 18 PARTS - COMPLETE!)');
  console.log('=' .repeat(80));
  
  let totalChunks = 0;
  let totalWords = 0;
  
  for (const file of ARISTOTLE_FILES) {
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
          figureId: 'aristotle',
          author: 'Aristotle',
          paperTitle: chunk.workTitle,
          content: chunk.text,
          embedding: embedding,
          chunkIndex: chunk.chunkIndex,
          domain: chunk.section || 'Philosophy'
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
  console.log('🎉 ARISTOTLE COMPLETE WORKS INGESTION COMPLETE (ROUND 3: 18 PARTS - COMPLETE!)');
  console.log(`📚 Total chunks created: ${totalChunks}`);
  console.log(`📊 Total words processed: ${totalWords.toLocaleString()}`);
  console.log(`⚡ Average chunk size: ${Math.round(totalWords / totalChunks)} words`);
  console.log(`📖 Total parts processed: 18`);
  console.log(`🔮 COMPLETE COVERAGE: Logic, Physics, Biology, Metaphysics, Ethics, Politics, Rhetoric, Poetics`);
  console.log('='.repeat(80));
}

ingestAristotleComplete();

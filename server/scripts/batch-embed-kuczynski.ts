import OpenAI from 'openai';
import { db } from '../db';
import { paperChunks } from '../../shared/schema';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BATCH_SIZE = 20; // OpenAI can handle up to 2048 inputs per batch
const CONCURRENT_BATCHES = 3;
const CHUNK_SIZE = 500; // words per chunk
const OVERLAP = 50; // word overlap

// Priority files - the CORE philosophical work
const PRIORITY_FILES = [
  'Logic_and_Set_Theory',
  'Analytic_Philosophy',
  'Philosophy_of_Mind',
  'Philosophy_of_Language',
  'Metaphysics',
  'Epistemology',
  'Ethics',
  'Modal_Logic',
  'Russell',
  'Frege',
  'Wittgenstein',
  'Meaning',
  'Truth',
  'Reference',
  'Propositions',
  'Knowledge',
  'Belief',
  'Necessity',
  'Possibility',
  'Identity',
  'Existence',
  'Consciousness',
  'Free_Will',
  'Causation',
  'Time',
  'Space',
  'Mathematics',
  'Logic',
];

interface ChunkData {
  content: string;
  paperTitle: string;
  chunkIndex: number;
}

interface EmbeddingProgress {
  processedFiles: string[];
  totalChunksEmbedded: number;
  lastUpdate: string;
}

const PROGRESS_FILE = '/tmp/kuczynski_embed_progress.json';

function loadProgress(): EmbeddingProgress {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.log('Starting fresh progress tracking');
  }
  return { processedFiles: [], totalChunksEmbedded: 0, lastUpdate: new Date().toISOString() };
}

function saveProgress(progress: EmbeddingProgress) {
  progress.lastUpdate = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.length > 50) {
      chunks.push(chunk);
    }
    if (i + chunkSize >= words.length) break;
  }
  
  return chunks;
}

function extractTitle(filename: string): string {
  return filename
    .replace(/\.txt$|\.md$/i, '')
    .replace(/_/g, ' ')
    .replace(/^\d+[-_]/, '')
    .trim();
}

function isPriorityFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return PRIORITY_FILES.some(p => lower.includes(p.toLowerCase()));
}

async function embedBatchWithRetry(texts: string[], maxRetries = 5): Promise<number[][]> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texts,
      });
      return response.data.map(d => d.embedding);
    } catch (error: any) {
      if (error?.status === 429 || error?.status >= 500) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.log(`Rate limited, waiting ${Math.round(delay/1000)}s (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded for embedding batch');
}

async function processBatch(chunks: ChunkData[]): Promise<number> {
  if (chunks.length === 0) return 0;
  
  const texts = chunks.map(c => c.content);
  const embeddings = await embedBatchWithRetry(texts);
  
  let inserted = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = embeddings[i];
    
    try {
      await db.insert(paperChunks).values({
        author: 'Kuczynski',
        figureId: 'kuczynski',
        paperTitle: chunk.paperTitle,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        embedding: embedding,
      }).onConflictDoNothing();
      inserted++;
    } catch (e: any) {
      if (!e.message?.includes('duplicate')) {
        console.error(`Insert error for ${chunk.paperTitle}:`, e.message);
      }
    }
  }
  
  return inserted;
}

async function processFile(filePath: string, progress: EmbeddingProgress): Promise<number> {
  const filename = path.basename(filePath);
  const title = extractTitle(filename);
  
  // Skip if already processed
  if (progress.processedFiles.includes(filePath)) {
    return 0;
  }
  
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    console.error(`Cannot read ${filePath}`);
    return 0;
  }
  
  if (content.length < 100) {
    progress.processedFiles.push(filePath);
    saveProgress(progress);
    return 0;
  }
  
  const textChunks = chunkText(content, CHUNK_SIZE, OVERLAP);
  const chunkData: ChunkData[] = textChunks.map((text, idx) => ({
    content: text,
    paperTitle: title,
    chunkIndex: idx,
  }));
  
  let totalInserted = 0;
  
  // Process in batches
  for (let i = 0; i < chunkData.length; i += BATCH_SIZE) {
    const batch = chunkData.slice(i, i + BATCH_SIZE);
    const inserted = await processBatch(batch);
    totalInserted += inserted;
    
    // Small delay between batches
    await new Promise(r => setTimeout(r, 100));
  }
  
  progress.processedFiles.push(filePath);
  progress.totalChunksEmbedded += totalInserted;
  saveProgress(progress);
  
  return totalInserted;
}

async function getAllFiles(): Promise<string[]> {
  const files: string[] = [];
  
  const dirs = [
    'server/data/kuczynski',
    'author_database/kuczynski',
  ];
  
  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      const entries = fs.readdirSync(dir, { recursive: true }) as string[];
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        if (fs.statSync(fullPath).isFile() && /\.(txt|md)$/i.test(entry)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  // Sort: priority files first
  return files.sort((a, b) => {
    const aPriority = isPriorityFile(a);
    const bPriority = isPriorityFile(b);
    if (aPriority && !bPriority) return -1;
    if (!aPriority && bPriority) return 1;
    return a.localeCompare(b);
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('KUCZYNSKI BATCH EMBEDDING - FULL CORPUS');
  console.log('='.repeat(60));
  
  const progress = loadProgress();
  console.log(`Previously processed: ${progress.processedFiles.length} files`);
  console.log(`Previously embedded: ${progress.totalChunksEmbedded} chunks`);
  
  const allFiles = await getAllFiles();
  console.log(`Total files found: ${allFiles.length}`);
  
  const remainingFiles = allFiles.filter(f => !progress.processedFiles.includes(f));
  console.log(`Files to process: ${remainingFiles.length}`);
  
  // Check current DB count
  const result = await db.execute(sql`
    SELECT COUNT(*) as count FROM paper_chunks 
    WHERE author = 'Kuczynski' OR figure_id = 'kuczynski'
  `);
  console.log(`Current DB count: ${result.rows[0]?.count || 0}`);
  console.log('='.repeat(60));
  
  let totalNewChunks = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < remainingFiles.length; i++) {
    const file = remainingFiles[i];
    const filename = path.basename(file);
    
    try {
      const inserted = await processFile(file, progress);
      totalNewChunks += inserted;
      
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = totalNewChunks / elapsed;
      const remaining = remainingFiles.length - i - 1;
      
      if (inserted > 0) {
        console.log(`[${i + 1}/${remainingFiles.length}] ${filename}: +${inserted} chunks (${rate.toFixed(1)}/s, ${remaining} files left)`);
      } else {
        console.log(`[${i + 1}/${remainingFiles.length}] ${filename}: skipped`);
      }
      
      // Save progress every 10 files
      if (i % 10 === 0) {
        saveProgress(progress);
      }
      
    } catch (error: any) {
      console.error(`ERROR processing ${filename}:`, error.message);
      // Continue with next file
    }
  }
  
  // Final count
  const finalResult = await db.execute(sql`
    SELECT COUNT(*) as count FROM paper_chunks 
    WHERE author = 'Kuczynski' OR figure_id = 'kuczynski'
  `);
  
  console.log('='.repeat(60));
  console.log('EMBEDDING COMPLETE');
  console.log(`Total chunks in database: ${finalResult.rows[0]?.count}`);
  console.log(`New chunks added this run: ${totalNewChunks}`);
  console.log(`Total time: ${((Date.now() - startTime) / 60000).toFixed(1)} minutes`);
  console.log('='.repeat(60));
}

main().catch(console.error);

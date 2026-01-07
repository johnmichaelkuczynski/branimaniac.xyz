import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);

async function chunkAndInsert(filePath: string, thinker: string) {
  console.log(`Reading ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Split into words and create ~500-word chunks
  const words = content.split(/\s+/);
  const CHUNK_SIZE = 500;
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += CHUNK_SIZE) {
    const chunkWords = words.slice(i, i + CHUNK_SIZE);
    chunks.push(chunkWords.join(' '));
  }
  
  console.log(`Created ${chunks.length} chunks of ~${CHUNK_SIZE} words each`);
  
  const sourceFile = filePath.split('/').pop() || filePath;
  
  // Insert in batches of 50
  const BATCH_SIZE = 50;
  let inserted = 0;
  
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const values = batch.map((chunk, idx) => ({
      thinker,
      source_file: sourceFile,
      chunk_text: chunk,
      chunk_index: i + idx
    }));
    
    // Build INSERT statement
    for (const v of values) {
      await sql`
        INSERT INTO text_chunks (thinker, source_file, chunk_text, chunk_index)
        VALUES (${v.thinker}, ${v.source_file}, ${v.chunk_text}, ${v.chunk_index})
      `;
      inserted++;
    }
    
    console.log(`Inserted ${inserted}/${chunks.length} chunks...`);
  }
  
  // Get total count for this thinker
  const result = await sql`SELECT COUNT(*) as count FROM text_chunks WHERE thinker = ${thinker}`;
  console.log(`\nDone! Total chunks for ${thinker}: ${result[0].count}`);
}

const filePath = process.argv[2];
const thinker = process.argv[3];

if (!filePath || !thinker) {
  console.error('Usage: npx tsx scripts/chunk-and-insert.ts <file-path> <thinker-name>');
  process.exit(1);
}

chunkAndInsert(filePath, thinker).catch(console.error);

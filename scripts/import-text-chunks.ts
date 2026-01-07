/**
 * Import text chunks from thinker files into the text_chunks table
 * Uses batch inserts for speed
 * 
 * Usage: npx tsx scripts/import-text-chunks.ts
 */

import { db } from "../server/db";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "server/data");

const THINKER_NAME_MAP: Record<string, string> = {
  'adler': 'Alfred Adler',
  'aesop': 'Aesop',
  'aristotle': 'Aristotle',
  'auxiliary': 'Auxiliary',
  'bergson': 'Henri Bergson',
  'berkeley': 'George Berkeley',
  'bierce': 'Ambrose Bierce',
  'confucius': 'Confucius',
  'darwin': 'Charles Darwin',
  'engels': 'Friedrich Engels',
  'freud': 'Sigmund Freud',
  'galileo': 'Galileo Galilei',
  'gibbon': 'Edward Gibbon',
  'goldman': 'Emma Goldman',
  'hegel': 'G.W.F. Hegel',
  'hume': 'David Hume',
  'jack-london': 'Jack London',
  'james': 'William James',
  'james-allen': 'James Allen',
  'jung': 'Carl Jung',
  'kant': 'Immanuel Kant',
  'keynes': 'John Maynard Keynes',
  'kuczynski': 'J.-M. Kuczynski',
  'le-bon': 'Gustave Le Bon',
  'lebon': 'Gustave Le Bon',
  'leibniz': 'Gottfried Wilhelm Leibniz',
  'locke': 'John Locke',
  'luther': 'Martin Luther',
  'machiavelli': 'Niccolò Machiavelli',
  'maimonides': 'Moses Maimonides',
  'marx': 'Karl Marx',
  'newton': 'Isaac Newton',
  'nietzsche': 'Friedrich Nietzsche',
  'plato': 'Plato',
  'poe': 'Edgar Allan Poe',
  'poincare': 'Henri Poincaré',
  'reich': 'Wilhelm Reich',
  'rousseau': 'Jean-Jacques Rousseau',
  'russell': 'Bertrand Russell',
  'schopenhauer': 'Arthur Schopenhauer',
  'smith': 'Adam Smith',
  'spinoza': 'Baruch Spinoza',
  'swett': 'Sophia Swett',
  'tocqueville': 'Alexis de Tocqueville',
  'veblen': 'Thorstein Veblen',
  'voltaire': 'Voltaire',
  'von-mises': 'Ludwig von Mises',
};

function splitIntoChunks(text: string, targetWords: number = 500): string[] {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';
  let currentWordCount = 0;

  for (const paragraph of paragraphs) {
    const paragraphWords = paragraph.trim().split(/\s+/).length;
    
    if (currentWordCount + paragraphWords > targetWords && currentChunk.trim()) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
      currentWordCount = paragraphWords;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      currentWordCount += paragraphWords;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

interface ChunkData {
  thinker: string;
  sourceFile: string;
  chunkText: string;
  chunkIndex: number;
}

async function batchInsert(chunks: ChunkData[]) {
  if (chunks.length === 0) return;
  
  const values = chunks.map(c => 
    sql`(${c.thinker}, ${c.sourceFile}, ${c.chunkText}, ${c.chunkIndex})`
  );
  
  await db.execute(sql`
    INSERT INTO text_chunks (thinker, source_file, chunk_text, chunk_index)
    VALUES ${sql.join(values, sql`, `)}
    ON CONFLICT (thinker, source_file, chunk_index) DO UPDATE SET chunk_text = EXCLUDED.chunk_text
  `);
}

async function importTextChunks() {
  console.log('Starting text chunk import...');
  console.log(`Data directory: ${DATA_DIR}`);
  
  const folders = fs.readdirSync(DATA_DIR).filter(f => {
    const fullPath = path.join(DATA_DIR, f);
    return fs.statSync(fullPath).isDirectory();
  });
  
  console.log(`Found ${folders.length} thinker folders`);
  
  let totalChunks = 0;
  let totalFiles = 0;
  const BATCH_SIZE = 50;
  
  for (const folder of folders) {
    const folderPath = path.join(DATA_DIR, folder);
    const thinkerName = THINKER_NAME_MAP[folder] || folder;
    
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.txt'));
    
    if (files.length === 0) {
      continue;
    }
    
    console.log(`Processing ${folder} (${thinkerName}): ${files.length} files`);
    
    let batch: ChunkData[] = [];
    
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      let content: string;
      
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch (err) {
        console.error(`    Error reading ${file}: ${err}`);
        continue;
      }
      
      if (!content.trim()) {
        continue;
      }
      
      const chunks = splitIntoChunks(content, 500);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (chunk.length < 50) continue;
        
        batch.push({
          thinker: thinkerName,
          sourceFile: file,
          chunkText: chunk,
          chunkIndex: i
        });
        
        if (batch.length >= BATCH_SIZE) {
          try {
            await batchInsert(batch);
            totalChunks += batch.length;
          } catch (err) {
            console.error(`    Batch insert error: ${err}`);
          }
          batch = [];
        }
      }
      
      totalFiles++;
    }
    
    if (batch.length > 0) {
      try {
        await batchInsert(batch);
        totalChunks += batch.length;
      } catch (err) {
        console.error(`    Final batch insert error: ${err}`);
      }
    }
    
    console.log(`  Done: ${files.length} files`);
  }
  
  console.log(`\nImport complete!`);
  console.log(`Total files processed: ${totalFiles}`);
  console.log(`Total chunks inserted: ${totalChunks}`);
  
  const result = await db.execute(sql`SELECT thinker, COUNT(*) as count FROM text_chunks GROUP BY thinker ORDER BY count DESC`);
  console.log('\nChunks per thinker:');
  for (const row of result.rows as Array<{thinker: string, count: string}>) {
    console.log(`  ${row.thinker}: ${row.count}`);
  }
  
  process.exit(0);
}

importTextChunks().catch(console.error);

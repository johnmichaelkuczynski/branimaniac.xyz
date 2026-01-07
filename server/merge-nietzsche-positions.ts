import { db } from './db';
import { paperChunks } from '@shared/schema';
import { OpenAI } from 'openai';
import { readFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';

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

/**
 * FRIEDRICH NIETZSCHE - MERGE STRUCTURED POSITIONS INTO DATABASE
 * 
 * Reads extracted positions from server/nietzsche-positions/ directory
 * Converts to paper_chunks format with embeddings
 * Merges into unified database
 */

const POSITIONS_DIR = 'server/nietzsche-positions';

async function mergeNietzschePositions() {
  console.log('⚡ NIETZSCHE - MERGING STRUCTURED POSITIONS');
  console.log('='.repeat(80));
  
  if (!existsSync(POSITIONS_DIR)) {
    console.error(`❌ Directory not found: ${POSITIONS_DIR}`);
    console.log('💡 Run extract-nietzsche-positions-incremental.ts first');
    return;
  }
  
  const files = await readdir(POSITIONS_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  console.log(`📁 Found ${jsonFiles.length} position files`);
  
  let totalPositions = 0;
  let totalInserted = 0;
  
  for (const file of jsonFiles) {
    console.log(`\n📖 Processing: ${file}`);
    
    const content = await readFile(`${POSITIONS_DIR}/${file}`, 'utf-8');
    const positions = JSON.parse(content);
    
    console.log(`   📊 Found ${positions.length} positions`);
    totalPositions += positions.length;
    
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      
      const positionText = `
TITLE: ${pos.title}

THESIS: ${pos.thesis}

KEY ARGUMENTS:
${Array.isArray(pos.key_arguments) ? pos.key_arguments.map((arg: string, idx: number) => `${idx + 1}. ${arg}`).join('\n') : pos.key_arguments}

SOURCE: ${pos.source_citation}

THEORETICAL SIGNIFICANCE: ${pos.theoretical_significance}
      `.trim();
      
      try {
        const embedding = await generateEmbedding(positionText);
        
        await db.insert(paperChunks).values({
          figureId: 'nietzsche',
          author: 'Friedrich Nietzsche',
          paperTitle: `[POSITION] ${pos.title}`,
          content: positionText,
          embedding: embedding,
          chunkIndex: i,
          domain: pos.domain || 'Philosophy',
        }).onConflictDoNothing();
        
        totalInserted++;
        
        if (totalInserted % 20 === 0) {
          console.log(`   💾 Inserted ${totalInserted}/${totalPositions} positions...`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`   ❌ Error inserting position "${pos.title}":`, error);
      }
    }
    
    console.log(`   ✅ Completed: ${file}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 NIETZSCHE POSITION MERGE COMPLETE');
  console.log(`📚 Total positions processed: ${totalPositions}`);
  console.log(`💾 Total positions inserted: ${totalInserted}`);
  console.log('='.repeat(80));
}

mergeNietzschePositions();

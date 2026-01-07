import { db } from './db';
import { paperChunks } from '../shared/schema';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * GALILEO POSITION MERGER
 * 
 * Consolidates extracted positions from all works into the database
 * Generates embeddings for semantic search
 */

const POSITIONS_DIR = 'server/galileo-positions';

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

async function mergeGalileoPositions() {
  console.log('🔭 GALILEO POSITION MERGER');
  console.log('='.repeat(80));
  
  if (!fs.existsSync(POSITIONS_DIR)) {
    console.log(`❌ Directory not found: ${POSITIONS_DIR}`);
    console.log('   Run extract-galileo-positions-incremental.ts first');
    return;
  }
  
  const files = fs.readdirSync(POSITIONS_DIR).filter(f => f.endsWith('.json'));
  console.log(`📂 Found ${files.length} position files`);
  
  let totalPositions = 0;
  let inserted = 0;
  
  for (const file of files) {
    console.log(`\n📖 Processing: ${file}`);
    
    try {
      const filePath = path.join(POSITIONS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const positions = JSON.parse(content);
      
      console.log(`   📊 Loaded ${positions.length} positions`);
      totalPositions += positions.length;
      
      for (const position of positions) {
        try {
          const contentText = `POSITION: ${position.title}

THESIS: ${position.thesis}

ARGUMENTS:
${position.arguments.map((arg: string, i: number) => `${i + 1}. ${arg}`).join('\n')}

SIGNIFICANCE: ${position.significance}`;
          
          const embedding = await generateEmbedding(contentText);
          
          await db.insert(paperChunks).values({
            figureId: 'galileo',
            author: 'Galileo Galilei',
            paperTitle: position.title,
            content: contentText,
            embedding: embedding,
            chunkIndex: inserted,
            domain: position.domain,
            sourceWork: position.source,
            significance: 'HIGH',
          });
          
          inserted++;
          
          if (inserted % 10 === 0) {
            console.log(`   💾 Inserted ${inserted}/${positions.length} positions...`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`   ❌ Error inserting position "${position.title}":`, error);
        }
      }
      
      console.log(`   ✅ Completed: ${inserted} positions inserted`);
      
    } catch (error) {
      console.error(`   ❌ Error processing ${file}:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 MERGE COMPLETE');
  console.log(`   Total Positions Found: ${totalPositions}`);
  console.log(`   Positions Inserted: ${inserted}`);
  console.log('='.repeat(80));
}

export { mergeGalileoPositions };

// Execute immediately
mergeGalileoPositions()
  .then(() => {
    console.log('✅ Merge completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Merge failed:', error);
    process.exit(1);
  });

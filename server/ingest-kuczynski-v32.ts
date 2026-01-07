/**
 * Kuczynski Database v32 Ingestion Script
 * 
 * Replaces ALL old Kuczynski content with the new v32_CONCEPTUAL_ATOMISM database
 * containing 1,628 positions across 42 works.
 */

import { db } from './db';
import { paperChunks } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface Position {
  position_id: string;
  title: string;
  domain: string;
  thesis: string;
  source: string[];
  consistency?: string;
  key_arguments?: string[];
  significance?: string;
  challenges?: string[];
  supports?: string[];
  [key: string]: any;
}

interface DatabaseV32 {
  database_metadata: {
    version: string;
    total_positions: number;
    total_works: number;
    description: string;
  };
  positions: Position[];
  works_inventory?: any[];
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

function formatPositionContent(position: Position): string {
  // Get title from multiple possible fields
  const title = position.title || position.position || `Position ${position.position_id}`;
  let content = `${title}\n\n`;
  
  // Handle multiple different formats in the database
  if (position.thesis) {
    // Format 1: Has thesis field
    content += `Thesis: ${position.thesis}\n\n`;
  } else if (position.statement) {
    // Format 2: Has statement field instead
    content += `Statement: ${position.statement}\n\n`;
  } else if (position.position && position.position !== title) {
    // Format 3: Has position field as content
    content += `Position: ${position.position}\n\n`;
  }
  
  if (position.justification) {
    content += `Justification: ${position.justification}\n\n`;
  }
  
  if (position.key_arguments && position.key_arguments.length > 0) {
    content += `Key Arguments:\n${position.key_arguments.map(arg => `- ${arg}`).join('\n')}\n\n`;
  }
  
  if (position.consistency) {
    content += `Consistency: ${position.consistency}\n\n`;
  }
  
  if (position.significance || position.theoretical_significance) {
    content += `Significance: ${position.significance || position.theoretical_significance}\n\n`;
  }
  
  // Handle source - can be array, string, or missing
  const sources = position.source 
    ? (Array.isArray(position.source) ? position.source : [position.source])
    : (position.chapter ? [`${position.chapter}`] : []);
    
  if (sources.length > 0) {
    content += `Sources: ${sources.join(', ')}`;
  }
  
  return content.trim();
}

function estimateTokenCount(text: string): number {
  // Rough estimation: ~1.3 tokens per word
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

async function cleanOldKuczynski() {
  console.log('\n🧹 Cleaning old Kuczynski content...');
  
  const result = await db
    .delete(paperChunks)
    .where(eq(paperChunks.author, 'J.-M. Kuczynski'));
  
  console.log(`✓ Deleted all old Kuczynski chunks`);
}

async function ingestV32Database() {
  console.log('\n📚 Loading Kuczynski Database v32...');
  
  const dbPath = path.join(process.cwd(), 'attached_assets', 'KUCZYNSKI DATABASE 6_1763597844539.txt');
  const rawData = fs.readFileSync(dbPath, 'utf8');
  const database: DatabaseV32 = JSON.parse(rawData);
  
  console.log(`✓ Loaded ${database.database_metadata.total_positions} positions from ${database.database_metadata.version}`);
  console.log(`  Total works: ${database.database_metadata.total_works}`);
  
  // Group positions by domain to show progress
  const domainCounts: Record<string, number> = {};
  database.positions.forEach(pos => {
    domainCounts[pos.domain] = (domainCounts[pos.domain] || 0) + 1;
  });
  
  console.log('\n📊 Positions by domain:');
  Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([domain, count]) => {
      console.log(`  ${domain}: ${count}`);
    });
  
  console.log(`\n🔄 Processing ${database.positions.length} positions...`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < database.positions.length; i++) {
    const position = database.positions[i];
    
    if ((i + 1) % 50 === 0) {
      console.log(`  Progress: ${i + 1}/${database.positions.length} (${Math.round((i + 1) / database.positions.length * 100)}%)`);
    }
    
    // Skip positions without any valid content
    if (!position.position_id || (!position.title && !position.position && !position.thesis && !position.statement)) {
      failCount++;
      continue;
    }
    
    try {
      const content = formatPositionContent(position);
      const embedding = await generateEmbedding(content);
      
      // Normalize source work field
      const sources = position.source 
        ? (Array.isArray(position.source) ? position.source : [position.source])
        : (position.source_work ? [position.source_work] : (position.chapter ? [position.chapter] : []));
      
      // Get paper title from multiple possible fields
      const paperTitle = position.title || position.position || `Position ${position.position_id}`;
      
      await db.insert(paperChunks).values({
        figureId: 'common', // Unified knowledge base (not 'kuczynski')
        author: 'J.-M. Kuczynski',
        paperTitle: paperTitle,
        chunkIndex: 0,
        content: content,
        embedding: embedding,
        positionId: position.position_id,
        domain: position.domain,
        sourceWork: sources[0] || null, // Primary source work
        significance: position.significance || position.theoretical_significance || null,
        philosophicalEngagements: {
          challenges: position.challenges || [],
          supports: position.supports || [],
          consistency: position.consistency,
          related_positions: position.related_positions || []
        }
      });
      
      successCount++;
      
      // Rate limiting: pause briefly every 20 requests
      if ((i + 1) % 20 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`✗ Failed to process position ${position.position_id}:`, error);
      failCount++;
    }
  }
  
  console.log(`\n✅ Ingestion complete!`);
  console.log(`  Successful: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`  Total: ${successCount + failCount}`);
}

async function verifyIngestion() {
  console.log('\n🔍 Verifying ingestion...');
  
  const chunks = await db
    .select()
    .from(paperChunks)
    .where(eq(paperChunks.author, 'J.-M. Kuczynski'))
    .limit(5);
  
  console.log(`✓ Found ${chunks.length} sample chunks`);
  
  if (chunks.length > 0) {
    console.log('\n=== Sample Position ===');
    console.log(`Title: ${chunks[0].paperTitle}`);
    console.log(`Domain: ${chunks[0].domain || 'N/A'}`);
    console.log(`Position ID: ${chunks[0].positionId || 'N/A'}`);
    console.log(`Significance: ${chunks[0].significance || 'N/A'}`);
    console.log(`Content preview: ${chunks[0].content.substring(0, 200)}...`);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Kuczynski Database v32 Ingestion');
  console.log('═══════════════════════════════════════════════════════');
  
  try {
    // Step 1: Clean old content
    await cleanOldKuczynski();
    
    // Step 2: Ingest new database
    await ingestV32Database();
    
    // Step 3: Verify
    await verifyIngestion();
    
    console.log('\n✅ All done! Kuczynski database successfully updated.');
    
  } catch (error) {
    console.error('\n❌ Ingestion failed:', error);
    process.exit(1);
  }
}

// Run main function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export { main as ingestKuczynskiV32 };

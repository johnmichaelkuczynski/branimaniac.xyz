import { db } from './db';
import { paperChunks } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CollegePaperPosition {
  position_id: string;
  domain: string;
  paper_title: string;
  content: string;
  author: string;
  source_work: string;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  return response.data[0].embedding;
}

async function loadCollegePapers() {
  console.log('📚 Loading College Papers Plus positions...\n');
  
  // Read the converted JSON file
  const jsonPath = path.join(process.cwd(), 'server', 'college-papers-positions.json');
  const positions: CollegePaperPosition[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  
  console.log(`Found ${positions.length} positions to load\n`);
  
  // Delete existing College Papers positions (but keep v29 and other data)
  console.log('🗑️  Removing old College Papers positions...');
  await db.delete(paperChunks)
    .where(
      and(
        eq(paperChunks.author, 'J.-M. Kuczynski'),
        eq(paperChunks.sourceWork, 'WORK-041: College Papers Plus (2019)')
      )
    );
  console.log('✅ Old College Papers data removed\n');
  
  // Load new positions with embeddings (batch processing)
  console.log('⚡ Generating embeddings and loading positions...');
  let loaded = 0;
  let skipped = 0;
  let failed = 0;
  
  const batchSize = 20; // Process 20 at a time
  
  for (let i = 0; i < positions.length; i += batchSize) {
    const batch = positions.slice(i, Math.min(i + batchSize, positions.length));
    
    // Generate embeddings for batch
    const batchPromises = batch.map(async (pos) => {
      try {
        const textForEmbedding = `${pos.paper_title}\n\n${pos.content}`;
        const embedding = await generateEmbedding(textForEmbedding);
        return { pos, embedding, error: null };
      } catch (error) {
        return { pos, embedding: null, error };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    // Insert batch
    for (const result of batchResults) {
      if (result.error) {
        failed++;
        console.error(`   ❌ Failed embedding for ${result.pos.position_id}`);
        continue;
      }
      
      try {
        // Use onConflictDoNothing to skip duplicates
        await db.insert(paperChunks).values({
          figureId: 'common',
          author: result.pos.author,
          paperTitle: result.pos.paper_title,
          content: result.pos.content,
          chunkIndex: 0,
          positionId: result.pos.position_id,
          domain: result.pos.domain,
          sourceWork: result.pos.source_work,
          embedding: result.embedding!,
        }).onConflictDoNothing();
        
        loaded++;
      } catch (error) {
        // If still fails, it's a duplicate or other issue
        skipped++;
      }
    }
    
    if ((loaded + skipped) % 100 === 0 || (loaded + skipped) >= positions.length) {
      console.log(`   Progress: ${loaded + skipped}/${positions.length} (loaded: ${loaded}, skipped: ${skipped}, failed: ${failed})`);
    }
  }
  
  console.log(`\n✅ Successfully loaded ${loaded} new positions`);
  if (skipped > 0) {
    console.log(`   Skipped ${skipped} duplicate positions`);
  }
  if (failed > 0) {
    console.log(`⚠️  Failed to load ${failed} positions`);
  }
  
  // Show summary statistics
  const domainCounts = positions.reduce((acc, pos) => {
    acc[pos.domain] = (acc[pos.domain] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\n📊 Loaded positions by domain:');
  Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([domain, count]) => {
      console.log(`   ${domain}: ${count}`);
    });
}

// Run the loader
loadCollegePapers()
  .then(() => {
    console.log('\n🎉 College Papers Plus loading complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error loading College Papers:', error);
    process.exit(1);
  });

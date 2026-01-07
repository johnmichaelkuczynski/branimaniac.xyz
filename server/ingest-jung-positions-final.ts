import { db } from "./db";
import { paperChunks } from "@shared/schema";
import OpenAI from "openai";
import * as fs from "fs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text.substring(0, 8000),
  });
  return response.data[0].embedding;
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('  INGESTING JUNG STRUCTURED POSITIONS');
  console.log('='.repeat(80) + '\n');

  const positions = JSON.parse(fs.readFileSync('server/jung-positions-all.json', 'utf-8'));
  console.log(`  📋 Loading ${positions.length} Jung positions\n`);

  const result = await db.execute(
    `SELECT MAX(chunk_index) as max_idx FROM paper_chunks WHERE author = 'Carl Jung'`
  );
  let chunkIndex = parseInt((result.rows[0] as any).max_idx || '0') + 1;

  let ingested = 0;

  for (const pos of positions) {
    const content = `[${pos.positionId}] ${pos.domain}: ${pos.thesis}

KEY ARGUMENTS:
${pos.keyArguments.map((arg: string, i: number) => `${i + 1}. ${arg}`).join('\n')}

SOURCE: ${pos.sourceWork}${pos.sourceLocation ? ` (${pos.sourceLocation})` : ''}

SIGNIFICANCE: ${pos.significance}

RELATED CONCEPTS: ${pos.relatedConcepts.join(', ')}`;

    try {
      const embedding = await generateEmbedding(content);

      await db.insert(paperChunks).values({
        figureId: 'common',
        author: 'Carl Jung',
        paperTitle: pos.sourceWork,
        chunkIndex: chunkIndex++,
        content: content,
        embedding: embedding,
        significance: 'STRUCTURED_POSITION'
      });

      ingested++;

      if (ingested % 10 === 0) {
        console.log(`  Progress: ${ingested}/${positions.length} positions ingested...`);
      }

      // Rate limiting
      if (ingested % 5 === 0) {
        await new Promise(r => setTimeout(r, 100));
      }

    } catch (error) {
      console.error(`  ✗ Failed to ingest ${pos.positionId}:`, error);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`  🎉 JUNG POSITIONS INGESTED!`);
  console.log(`  \n  📊 Summary:`);
  console.log(`     - Total positions: ${ingested}`);
  console.log(`  \n  ✅ Jung database now complete with structured positions!`);
  console.log('='.repeat(80) + '\n');
}

main().catch(console.error);

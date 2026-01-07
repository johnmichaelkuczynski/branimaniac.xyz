import { readFileSync } from 'fs';
import OpenAI from 'openai';
import { db } from "./db";
import { paperChunks } from "../shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CHUNK_SIZE = 400;
const FIGURE_ID = 'newton';

function chunkText(text: string, chunkSize: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim());
    }
  }
  
  return chunks;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  return response.data[0].embedding;
}

async function main() {
  try {
    console.log('Reading Newton\'s "Philosophy of Nature"...');
    const text = readFileSync('newton_philosophy.txt', 'utf-8');
    
    console.log(`Total characters: ${text.length}`);
    console.log(`Total words: ~${text.split(/\s+/).length}`);
    
    const chunks = chunkText(text, CHUNK_SIZE);
    console.log(`Created ${chunks.length} chunks of ~${CHUNK_SIZE} words each\n`);
    
    console.log('Generating embeddings...');
    const startTime = Date.now();
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);
      
      await db.insert(paperChunks).values({
        figureId: FIGURE_ID,
        paperTitle: "Newton's Philosophy of Nature: Selections from His Writings",
        chunkIndex: i,
        content: chunk,
        embedding: embedding,
      });
      
      if ((i + 1) % 10 === 0 || i === chunks.length - 1) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = ((i + 1) / (Date.now() - startTime) * 1000).toFixed(1);
        console.log(`Progress: ${i + 1}/${chunks.length} (${rate} chunks/sec, ${elapsed}s elapsed)`);
      }
    }
    
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`\n✓ Successfully generated ${chunks.length} embeddings in ${totalTime} minutes`);
    console.log(`✓ All embeddings stored in database for figure: ${FIGURE_ID}`);
    
  } catch (error) {
    console.error('Error generating embeddings:', error);
    process.exit(1);
  }
}

main();

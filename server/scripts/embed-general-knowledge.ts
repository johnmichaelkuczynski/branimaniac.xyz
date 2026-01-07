/**
 * GENERAL KNOWLEDGE FUND EMBEDDING SCRIPT
 * 
 * This script embeds content into the shared General Knowledge Fund.
 * All philosophers have access to this content, but it's clearly labeled
 * as modern research/scholarship that wasn't available during their lifetimes.
 * 
 * Usage: npx tsx server/scripts/embed-general-knowledge.ts
 * 
 * To add content to the General Knowledge Fund:
 * 1. Place text files in attached_assets/ directory
 * 2. Add them to the 'files' array below with descriptive titles
 * 3. Run this script
 */

import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES = 1000;

function chunkText(text: string, chunkSize: number = CHUNK_SIZE, overlap: number = CHUNK_OVERLAP): string[] {
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

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function embedGeneralKnowledge() {
  console.log("===========================================");
  console.log("GENERAL KNOWLEDGE FUND EMBEDDING");
  console.log("===========================================\n");
  console.log("This content will be available to ALL philosophers");
  console.log("as modern research notes from after their lifetimes.\n");
  
  // Add files to embed into the General Knowledge Fund here
  // Format: { path: 'path/to/file.txt', title: 'Descriptive Title' }
  const files: { path: string; title: string; domain: string }[] = [
    // Example entries - add your files here:
    // { path: path.join(process.cwd(), 'attached_assets', 'modern_physics_overview.txt'), title: 'Modern Physics Overview (2024)', domain: 'physics' },
    // { path: path.join(process.cwd(), 'attached_assets', 'neuroscience_advances.txt'), title: 'Advances in Neuroscience', domain: 'neuroscience' },
  ];
  
  if (files.length === 0) {
    console.log("No files configured for General Knowledge Fund.");
    console.log("\nTo add content:");
    console.log("1. Place text files in attached_assets/ directory");
    console.log("2. Add them to the 'files' array in this script");
    console.log("3. Run the script again");
    return;
  }
  
  let totalChunks = 0;
  let successCount = 0;
  let errorCount = 0;
  let fileCount = 0;
  
  for (const file of files) {
    if (!fs.existsSync(file.path)) {
      console.log(`File not found: ${file.path}`);
      continue;
    }
    
    fileCount++;
    
    try {
      console.log(`Reading ${file.title}...`);
      const content = fs.readFileSync(file.path, 'utf-8');
      const chunks = chunkText(content);
      
      console.log(`[${fileCount}/${files.length}] ${file.title}: ${chunks.length} chunks`);
      totalChunks += chunks.length;
      
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        
        for (let batchIdx = 0; batchIdx < batch.length; batchIdx++) {
          const chunk = batch[batchIdx];
          const chunkIdx = i + batchIdx;
          
          try {
            const embedding = await getEmbedding(chunk);
            
            await db.insert(paperChunks).values({
              paperTitle: file.title,
              content: chunk,
              author: "GeneralKnowledge", // Special author for shared fund
              chunkIndex: chunkIdx,
              embedding: embedding,
              figureId: "general_knowledge", // Special figure ID
              domain: file.domain,
            }).onConflictDoNothing();
            
            successCount++;
            
            if (successCount % 20 === 0) {
              console.log(`Progress: ${successCount} chunks embedded`);
            }
          } catch (error) {
            console.error(`Error embedding chunk ${chunkIdx}:`, error);
            errorCount++;
          }
        }
        
        if (i + BATCH_SIZE < chunks.length) {
          await sleep(DELAY_BETWEEN_BATCHES);
        }
      }
      
    } catch (error) {
      console.error(`Error processing file ${file.title}:`, error);
      errorCount++;
    }
  }
  
  console.log(`\n========================================`);
  console.log(`GENERAL KNOWLEDGE FUND EMBEDDING COMPLETE`);
  console.log(`========================================`);
  console.log(`Files processed: ${fileCount}`);
  console.log(`Total chunks: ${totalChunks}`);
  console.log(`Successfully embedded: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`========================================\n`);
  console.log("All philosophers now have access to this knowledge!");
}

embedGeneralKnowledge().catch(console.error);

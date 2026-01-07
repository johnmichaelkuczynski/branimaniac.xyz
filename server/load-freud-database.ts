import { db } from "./db";
import { paperChunks } from "@shared/schema";
import { sql } from "drizzle-orm";
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

interface FreudDatabaseEntry {
  position_id: string;
  domain: string;
  position: string;
  content: string;
  source_work: string;
  author: string;
}

interface FreudDatabase {
  version: string;
  author: string;
  total_positions: number;
  positions: FreudDatabaseEntry[];
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function loadFreudDatabase() {
  console.log("=== Freud Philosophical Database Loader ===\n");
  
  // Find the JSON database file
  const databasePath = path.join(process.cwd(), "attached_assets");
  const files = fs.readdirSync(databasePath);
  const dbFile = files.find(f => 
    f.includes("FREUD_DATABASE") && 
    f.includes("v1") &&
    f.includes("COMPLETE") && 
    f.endsWith(".json")
  );
  
  if (!dbFile) {
    console.error("❌ Error: Could not find Freud Database JSON file in attached_assets/");
    console.error("Expected: FREUD_DATABASE_v1_COMPLETE.json");
    process.exit(1);
  }
  
  console.log(`📁 Found database file: ${dbFile}`);
  console.log("📖 Loading JSON database...\n");
  
  const fullPath = path.join(databasePath, dbFile);
  const rawData = fs.readFileSync(fullPath, 'utf-8');
  const database: FreudDatabase = JSON.parse(rawData);
  
  console.log(`📊 Database Metadata:`);
  console.log(`   Version: ${database.version}`);
  console.log(`   Author: ${database.author}`);
  console.log(`   Total Positions: ${database.total_positions}\n`);
  
  console.log(`✅ Loaded ${database.positions.length} positions from JSON\n`);
  
  // Check existing Freud positions
  const existingPositions = await db.execute(
    sql`SELECT COUNT(*) as count FROM ${paperChunks} WHERE author = 'Freud'`
  );
  const existingCount = Number(existingPositions.rows[0].count);
  
  if (existingCount > 0) {
    console.log(`⚠️  Found ${existingCount} existing Freud positions in database`);
    console.log(`   These will be skipped (idempotent operation)\n`);
  }
  
  let processed = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const [index, entry] of database.positions.entries()) {
    try {
      // Check if position already exists
      const exists = await db.execute(
        sql`SELECT id FROM ${paperChunks} 
            WHERE author = 'Freud' 
            AND position_id = ${entry.position_id}
            LIMIT 1`
      );
      
      if (exists.rows.length > 0) {
        skipped++;
        if ((index + 1) % 50 === 0) {
          console.log(`   [${index + 1}/${database.positions.length}] Skipping existing positions... (${skipped} skipped)`);
        }
        continue;
      }
      
      // Extract content for embedding
      const textContent = entry.content;
      
      if (!textContent || textContent.trim().length === 0) {
        console.log(`⚠️  Position ${entry.position_id} has no extractable content, skipping`);
        skipped++;
        continue;
      }
      
      // Create embedding-friendly text
      const embeddingText = `${entry.position}: ${textContent}`;
      
      // Generate embedding
      const embedding = await generateEmbedding(embeddingText);
      
      // Insert into database
      await db.insert(paperChunks).values({
        figureId: "common",
        author: "Freud",
        paperTitle: entry.position, // Position title
        content: textContent,
        embedding: embedding,
        chunkIndex: 0, // Positions are atomic, not chunked
        positionId: entry.position_id,
        domain: entry.domain,
        sourceWork: entry.source_work || null
      });
      
      processed++;
      
      if ((index + 1) % 10 === 0) {
        console.log(`   [${index + 1}/${database.positions.length}] Processed ${processed} new positions...`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error processing position ${entry.position_id}:`, error);
      errors++;
    }
  }
  
  console.log("\n=== Processing Complete ===");
  console.log(`✅ Successfully processed: ${processed} positions`);
  console.log(`⏭️  Skipped (already exist): ${skipped} positions`);
  console.log(`❌ Errors: ${errors} positions\n`);
  
  // Verify total count
  const finalCount = await db.execute(
    sql`SELECT COUNT(*) as count FROM ${paperChunks} WHERE author = 'Freud'`
  );
  const totalFreud = Number(finalCount.rows[0].count);
  
  console.log(`🎉 Freud Philosophical Database is now integrated with the RAG system!`);
  console.log(`   Total positions in database: ${totalFreud}\n`);
  
  process.exit(0);
}

loadFreudDatabase().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});

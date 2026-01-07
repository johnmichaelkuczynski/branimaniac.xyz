import { db } from "./db";
import { paperChunks } from "@shared/schema";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { sql, eq, and, isNotNull } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PhilosophicalEngagements {
  challenges?: string[];
  supports?: string[];
}

interface RelationsToExisting {
  extends?: string[];
  compatible_with?: string[];
  conflicts_with?: string[];
}

interface KuczynskiPosition {
  position_id: string;
  title?: string;
  thesis?: string; // Some positions use "thesis"
  statement?: string; // Some positions use "statement"
  position?: string; // Some positions use "position"
  content?: string; // Some positions use "content"
  domain: string;
  source?: string | string[];
  source_work?: string;
  work?: string;
  work_id?: string;
  significance?: string;
  consistency?: string;
  philosophical_engagements?: PhilosophicalEngagements;
  relations_to_existing?: RelationsToExisting;
  key_consequences?: string[];
  key_implications?: string[];
  key_insight?: string;
  explanation?: string;
  justification?: string;
  context?: string; // Additional context field
  implications?: string; // Implications field
}

interface KuczynskiDatabase {
  database_metadata: {
    version: string;
    total_positions: number;
    total_works: number;
  };
  positions: KuczynskiPosition[];
}

async function loadKuczynskiDatabase() {
  console.log("=== Kuczynski Philosophical Database Loader (v25/v26) ===\n");
  
  // Find the JSON database file
  const databasePath = path.join(process.cwd(), "attached_assets");
  const files = fs.readdirSync(databasePath);
  // Look for v26 first, then fall back to v25
  let dbFile = files.find(f => 
    f.includes("KUCZYNSKI_PHILOSOPHICAL_DATABASE") && 
    f.includes("v26") &&
    f.includes("COMPLETE") && 
    f.endsWith(".json")
  );
  
  if (!dbFile) {
    dbFile = files.find(f => 
      f.includes("KUCZYNSKI_PHILOSOPHICAL_DATABASE") && 
      f.includes("v25") &&
      f.includes("COMPLETE") && 
      f.endsWith(".json")
    );
  }
  
  if (!dbFile) {
    console.error("❌ Error: Could not find Kuczynski Database JSON file in attached_assets/");
    console.error("Expected: KUCZYNSKI_PHILOSOPHICAL_DATABASE_v26_COMPLETE*.json or v25");
    process.exit(1);
  }
  
  const fullPath = path.join(databasePath, dbFile);
  console.log(`📁 Found database file: ${dbFile}`);
  
  // Load and parse JSON
  console.log("📖 Loading JSON database...");
  const jsonContent = fs.readFileSync(fullPath, "utf-8");
  const database: KuczynskiDatabase = JSON.parse(jsonContent);
  
  console.log(`\n📊 Database Metadata:`);
  console.log(`   Version: ${database.database_metadata.version}`);
  console.log(`   Total Works: ${database.database_metadata.total_works}`);
  console.log(`   Total Positions: ${database.database_metadata.total_positions}`);
  
  const positions = database.positions;
  console.log(`\n✅ Loaded ${positions.length} positions from JSON\n`);
  
  // Check for existing Kuczynski positions in database
  const existingPositions = await db.select({ count: sql<number>`count(*)` })
    .from(paperChunks)
    .where(and(
      isNotNull(paperChunks.positionId),
      eq(paperChunks.author, "J.-M. Kuczynski")
    ));
  const existing = Number(existingPositions[0]?.count || 0);
  
  if (existing > 0) {
    console.log(`⚠️  Found ${existing} existing Kuczynski positions in database`);
    console.log(`   These will be skipped (idempotent operation)\n`);
  }
  
  // Process each position
  let processed = 0;
  let skipped = 0;
  let errors = 0;
  
  for (let i = 0; i < positions.length; i++) {
    const position = positions[i];
    
    try {
      // Check if position already exists
      const exists = await db.select({ id: paperChunks.id })
        .from(paperChunks)
        .where(eq(paperChunks.positionId, position.position_id))
        .limit(1);
      
      if (exists && exists.length > 0) {
        skipped++;
        if (skipped % 50 === 0) {
          console.log(`   [${i + 1}/${positions.length}] Skipping existing positions... (${skipped} skipped)`);
        }
        continue;
      }
      
      // BUILD COMPREHENSIVE CONTENT from ALL available fields
      // Priority order: thesis > statement > position > content, but use ANY available content
      const primaryContent = position.thesis || position.statement || position.position || position.content;
      
      // Build rich content by combining all descriptive fields
      let contentParts: string[] = [];
      
      if (primaryContent) {
        contentParts.push(primaryContent);
      }
      
      // Add context (often provides valuable background)
      if (position.context) {
        contentParts.push(`Context: ${position.context}`);
      }
      
      // Add explanation (often contains substantial philosophical content)
      if (position.explanation) {
        contentParts.push(`Explanation: ${position.explanation}`);
      }
      
      // Add justification (philosophical reasoning)
      if (position.justification) {
        contentParts.push(`Justification: ${position.justification}`);
      }
      
      // Add key insight (crucial conceptual points)
      if (position.key_insight) {
        contentParts.push(`Key Insight: ${position.key_insight}`);
      }
      
      // Add key consequences (implications)
      if (position.key_consequences && position.key_consequences.length > 0) {
        contentParts.push(`Key Consequences: ${position.key_consequences.join('; ')}`);
      }
      
      // Add key implications
      if (position.key_implications && position.key_implications.length > 0) {
        contentParts.push(`Key Implications: ${position.key_implications.join('; ')}`);
      }
      
      // Add implications (singular field)
      if (position.implications) {
        contentParts.push(`Implications: ${position.implications}`);
      }
      
      // Combine all content parts
      const mainContent = contentParts.join('\n\n');
      
      // Sanity check: if NO content at all, skip (but this should be rare)
      if (!mainContent || mainContent.trim().length === 0) {
        console.error(`⚠️  Position ${position.position_id} has no extractable content, skipping`);
        skipped++;
        continue;
      }
      
      // Get the title - use provided title or generate from position_id
      const title = position.title || `Position ${position.position_id}`;
      
      // Create embedding content from title + comprehensive content + metadata
      let embeddingText = `${title}\n\n${mainContent}`;
      
      // Add domain context for better semantic search
      if (position.domain) {
        embeddingText += `\n\nDomain: ${position.domain}`;
      }
      
      // Generate embedding
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: embeddingText,
      });
      
      const embedding = embeddingResponse.data[0].embedding;
      
      // Extract source work ID - check work, work_id, source_work, and source fields
      let sourceWork = position.work || position.work_id || position.source_work;
      if (!sourceWork && position.source) {
        if (Array.isArray(position.source)) {
          sourceWork = position.source[0];
        } else {
          sourceWork = position.source;
        }
      }
      
      // Insert into database
      await db.insert(paperChunks).values({
        figureId: "common",
        author: "J.-M. Kuczynski",
        paperTitle: title,
        content: mainContent, // Use thesis, statement, or position
        embedding: embedding,
        chunkIndex: 0, // Positions are atomic, not chunked
        positionId: position.position_id,
        domain: position.domain,
        philosophicalEngagements: position.philosophical_engagements || null,
        sourceWork: sourceWork || null,
        significance: position.significance || null,
      });
      
      processed++;
      
      // Progress update every 50 positions
      if (processed % 50 === 0) {
        console.log(`✅ Progress: ${processed}/${positions.length} positions embedded and stored`);
      }
      
      // Rate limiting - OpenAI has limits on embeddings API
      if (i < positions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      }
      
    } catch (error) {
      errors++;
      console.error(`❌ Error processing position ${position.position_id}:`, error);
      
      // Don't fail the entire process for one position
      if (errors > 10) {
        console.error(`\n❌ Too many errors (${errors}), aborting...`);
        process.exit(1);
      }
    }
  }
  
  console.log(`\n=== Processing Complete ===`);
  console.log(`✅ Successfully processed: ${processed} positions`);
  console.log(`⏭️  Skipped (already exist): ${skipped} positions`);
  console.log(`❌ Errors: ${errors} positions`);
  console.log(`\n🎉 Kuczynski Philosophical Database v25 is now integrated with the RAG system!`);
  console.log(`   Total positions in database: ${processed + existing}`);
  
  process.exit(0);
}

loadKuczynskiDatabase().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

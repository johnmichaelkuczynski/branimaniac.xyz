import { db } from "./db";
import { paperChunks } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface Position {
  positionId: string;
  domain: string;
  paperTitle: string;
  content: string;
  author: string;
  figureId: string;
  sourceWork: string;
  chunkIndex: number;
}

async function loadKuczynskiV29Database() {
  console.log("\n🔄 Loading Kuczynski v29 Database + Blog Essays...\n");

  // Load v29 structured positions
  const v29Path = join(__dirname, "..", "attached_assets", "KUCZYNSKI_DATABASE_v29.json");
  const v29Positions: Position[] = JSON.parse(readFileSync(v29Path, "utf-8"));
  console.log(`✓ Loaded ${v29Positions.length} v29 database positions`);

  // Load blog essays
  const blogPath = join(__dirname, "..", "attached_assets", "BLOG_ESSAYS.json");
  const blogPositions: Position[] = JSON.parse(readFileSync(blogPath, "utf-8"));
  console.log(`✓ Loaded ${blogPositions.length} blog essays`);

  // Combine all positions
  const allPositions = [...v29Positions, ...blogPositions];
  console.log(`\n📊 Total: ${allPositions.length} positions to load`);

  // Delete existing Kuczynski positions
  console.log("\n🗑️  Removing old Kuczynski positions from database...");
  await db.delete(paperChunks)
    .where(
      and(
        eq(paperChunks.author, "J.-M. Kuczynski"),
        eq(paperChunks.figureId, "common")
      )
    );
  console.log("✓ Old positions removed");

  // Insert new positions with embeddings
  console.log("\n🔢 Generating embeddings and loading positions...");
  let loaded = 0;
  const batchSize = 10;

  for (let i = 0; i < allPositions.length; i += batchSize) {
    const batch = allPositions.slice(i, i + batchSize);

    for (const position of batch) {
      try {
        // Generate embedding
        const response = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: `${position.paperTitle}: ${position.content}`,
        });

        const embedding = response.data[0].embedding;

        // Insert into database
        await db.insert(paperChunks).values({
          positionId: position.positionId,
          domain: position.domain,
          paperTitle: position.paperTitle,
          content: position.content,
          author: position.author,
          figureId: position.figureId,
          sourceWork: position.sourceWork,
          chunkIndex: position.chunkIndex,
          embedding: embedding, // Pass array directly, not JSON string
        });

        loaded++;
        if (loaded % 50 === 0) {
          console.log(`  Loaded ${loaded}/${allPositions.length}...`);
        }
      } catch (error) {
        console.error(`  ❌ Error loading ${position.positionId}:`, error);
      }
    }

    // Small delay to avoid rate limits
    if (i + batchSize < allPositions.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log(`\n✅ Successfully loaded ${loaded} Kuczynski v29 positions!`);
  console.log("\n📈 Database Summary:");
  console.log(`  - v29 structured positions: ${v29Positions.length}`);
  console.log(`  - Blog essays: ${blogPositions.length}`);
  console.log(`  - Total loaded: ${loaded}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  loadKuczynskiV29Database()
    .then(() => {
      console.log("\n🎉 v29 database load complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Load failed:", error);
      process.exit(1);
    });
}

export { loadKuczynskiV29Database };

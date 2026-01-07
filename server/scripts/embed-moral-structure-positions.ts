import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface PositionChunk {
  content: string;
  section: string;
}

async function parsePositions(filePath: string): Promise<PositionChunk[]> {
  const content = fs.readFileSync(filePath, "utf-8");
  const chunks: PositionChunk[] = [];
  
  const lines = content.split("\n");
  let currentSection = "Legal Obligation";
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith("=== ") && line.endsWith(" ===")) {
      currentSection = line.replace(/^=== /, "").replace(/ ===$/, "");
      continue;
    }
    
    const positionMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (positionMatch && positionMatch[2].length > 15) {
      const positionText = positionMatch[2];
      
      chunks.push({
        content: positionText,
        section: currentSection
      });
    }
  }
  
  return chunks;
}

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function embedMoralStructurePositions() {
  console.log("Starting Moral Structure of Legal Obligation embedding...");
  
  const filePath = path.join(__dirname, "../data/kuczynski/Moral_Structure_Legal_Obligation_Positions.txt");
  
  if (!fs.existsSync(filePath)) {
    console.error("Positions file not found at:", filePath);
    return;
  }
  
  const chunks = await parsePositions(filePath);
  console.log(`Parsed ${chunks.length} position statements`);
  
  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    try {
      const embedding = await getEmbedding(chunk.content);
      
      await db.insert(paperChunks).values({
        figureId: "common",
        author: "Kuczynski",
        paperTitle: "The Moral Structure of Legal Obligation",
        content: chunk.content,
        embedding: embedding,
        chunkIndex: i,
        domain: "philosophy_of_law",
        significance: "HIGH",
        sourceWork: `Moral Structure - ${chunk.section}`
      });
      
      successCount++;
      
      if (successCount % 25 === 0) {
        console.log(`Progress: ${successCount}/${chunks.length} embedded`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error: any) {
      if (error.message?.includes("duplicate key")) {
        skipCount++;
      } else {
        console.error(`Error embedding chunk ${i}:`, error.message || error);
        errorCount++;
      }
    }
  }
  
  console.log(`\n=== MORAL STRUCTURE EMBEDDING COMPLETE ===`);
  console.log(`Successfully embedded: ${successCount}`);
  console.log(`Skipped (duplicates): ${skipCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total chunks: ${chunks.length}`);
}

embedMoralStructurePositions()
  .then(() => {
    console.log("Embedding script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

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
  work: string;
  domain: string;
}

async function parseSpinozaPositions(filePath: string): Promise<PositionChunk[]> {
  const content = fs.readFileSync(filePath, "utf-8");
  const chunks: PositionChunk[] = [];
  
  const lines = content.split("\n");
  let currentWork = "";
  let currentDomain = "metaphysics";
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith("=== ") && line.endsWith(" ===")) {
      currentWork = line.replace(/^=== /, "").replace(/ ===$/, "");
      
      if (currentWork.includes("ETHICS")) {
        currentDomain = "metaphysics_ethics";
      } else if (currentWork.includes("THEOLOGICO")) {
        currentDomain = "philosophy_of_religion";
      } else if (currentWork.includes("POLITICUS")) {
        currentDomain = "political_philosophy";
      } else if (currentWork.includes("CARTESIAN")) {
        currentDomain = "metaphysics";
      } else if (currentWork.includes("EMENDATION") || currentWork.includes("INTELLECT")) {
        currentDomain = "epistemology";
      } else if (currentWork.includes("CORRESPONDENCE")) {
        currentDomain = "philosophy";
      } else {
        currentDomain = "philosophy";
      }
      continue;
    }
    
    const positionMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (positionMatch && positionMatch[2].length > 15) {
      const positionText = positionMatch[2];
      
      chunks.push({
        content: positionText,
        work: currentWork,
        domain: currentDomain
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

async function embedSpinozaPositions() {
  console.log("Starting Spinoza positions embedding...");
  
  const filePath = path.join(__dirname, "../data/spinoza/Spinoza_Complete_Positions.txt");
  
  if (!fs.existsSync(filePath)) {
    console.error("Spinoza positions file not found at:", filePath);
    return;
  }
  
  const chunks = await parseSpinozaPositions(filePath);
  console.log(`Parsed ${chunks.length} Spinoza position statements`);
  
  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    try {
      const embedding = await getEmbedding(chunk.content);
      
      await db.insert(paperChunks).values({
        figureId: "spinoza",
        author: "Baruch Spinoza",
        paperTitle: `Spinoza - ${chunk.work}`,
        content: chunk.content,
        embedding: embedding,
        chunkIndex: i,
        domain: chunk.domain,
        significance: "HIGH",
        sourceWork: chunk.work
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
  
  console.log(`\n=== SPINOZA EMBEDDING COMPLETE ===`);
  console.log(`Successfully embedded: ${successCount}`);
  console.log(`Skipped (duplicates): ${skipCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total chunks: ${chunks.length}`);
}

embedSpinozaPositions()
  .then(() => {
    console.log("Spinoza embedding script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

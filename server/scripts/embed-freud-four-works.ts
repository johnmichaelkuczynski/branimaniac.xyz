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
}

async function parsePositions(filePath: string): Promise<PositionChunk[]> {
  const content = fs.readFileSync(filePath, "utf-8");
  const chunks: PositionChunk[] = [];
  
  const lines = content.split("\n");
  let currentWork = "Freud Works";
  
  const workPatterns = [
    { pattern: /PART I:.*TOTEM AND TABOO/i, work: "Totem and Taboo" },
    { pattern: /PART II:.*LAY ANALYSIS/i, work: "The Question of Lay Analysis" },
    { pattern: /PART III:.*OUTLINE OF PSYCHOANALYSIS/i, work: "An Outline of Psychoanalysis" },
    { pattern: /PART IV:.*OBSESSIONAL NEUROSIS.*RAT MAN/i, work: "Notes Upon a Case of Obsessional Neurosis (Rat Man)" },
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    for (const wp of workPatterns) {
      if (wp.pattern.test(line)) {
        currentWork = wp.work;
        break;
      }
    }
    
    const positionMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (positionMatch && positionMatch[2].length > 20) {
      let positionText = positionMatch[2];
      chunks.push({
        content: positionText,
        work: currentWork
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

async function embedFreud() {
  console.log("Starting Freud Four Works embedding...");
  
  const filePath = path.join(__dirname, "../data/freud/Freud_Four_Works.txt");
  
  if (!fs.existsSync(filePath)) {
    console.error("Positions file not found at:", filePath);
    return;
  }
  
  const chunks = await parsePositions(filePath);
  console.log(`Parsed ${chunks.length} position statements`);
  
  const workCounts: Record<string, number> = {};
  chunks.forEach(c => {
    workCounts[c.work] = (workCounts[c.work] || 0) + 1;
  });
  console.log("By work:", workCounts);
  
  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    try {
      const embedding = await getEmbedding(chunk.content);
      
      await db.insert(paperChunks).values({
        figureId: "freud",
        author: "Sigmund Freud",
        paperTitle: chunk.work,
        content: chunk.content,
        embedding: embedding,
        chunkIndex: i,
        domain: "psychoanalysis",
        significance: "HIGH",
        sourceWork: `Freud - ${chunk.work}`
      });
      
      successCount++;
      
      if (successCount % 25 === 0) {
        console.log(`Progress: ${successCount}/${chunks.length} embedded (${((successCount/chunks.length)*100).toFixed(1)}%)`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 60));
      
    } catch (error: any) {
      if (error.message?.includes("duplicate key")) {
        skipCount++;
      } else {
        console.error(`Error at ${i}:`, error.message || error);
        errorCount++;
        if (errorCount > 10) {
          console.log("Too many errors, stopping...");
          break;
        }
      }
    }
  }
  
  console.log(`\n=== FREUD FOUR WORKS EMBEDDING COMPLETE ===`);
  console.log(`Successfully embedded: ${successCount}`);
  console.log(`Skipped (duplicates): ${skipCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total chunks: ${chunks.length}`);
}

embedFreud()
  .then(() => {
    console.log("Embedding script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

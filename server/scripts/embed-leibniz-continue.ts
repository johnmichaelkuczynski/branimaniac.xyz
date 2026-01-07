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
  let currentWork = "Leibniz Writings";
  
  const workPatterns = [
    { pattern: /Discourse on Metaphysics/i, work: "Discourse on Metaphysics" },
    { pattern: /Correspondence with Arnauld/i, work: "Correspondence with Arnauld" },
    { pattern: /New Essays on Human Understanding/i, work: "New Essays on Human Understanding" },
    { pattern: /Theodicy/i, work: "Theodicy" },
    { pattern: /Monadology/i, work: "Monadology" },
    { pattern: /Correspondence with Clarke/i, work: "Correspondence with Clarke" },
    { pattern: /On the Nature of Body/i, work: "On the Nature of Body" },
    { pattern: /Logical Writings/i, work: "Logical Writings" },
    { pattern: /Ars Combinatoria/i, work: "Ars Combinatoria" },
    { pattern: /On Universal Synthesis/i, work: "On Universal Synthesis and Analysis" },
    { pattern: /On Transubstantiation/i, work: "On Transubstantiation" },
    { pattern: /Political Writings/i, work: "Political Writings" },
    { pattern: /Mathematical/i, work: "Mathematical Writings" },
    { pattern: /VARIOUS TECHNICAL WORKS/i, work: "Technical Works" },
    { pattern: /On Freedom/i, work: "On Freedom" },
    { pattern: /Principles of Nature and Grace/i, work: "Principles of Nature and Grace" },
    { pattern: /Primary Truths/i, work: "Primary Truths" },
    { pattern: /Dynamics/i, work: "Dynamics" },
    { pattern: /Calculus/i, work: "Calculus Writings" },
    { pattern: /Characteristic/i, work: "Universal Characteristic" },
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    for (const wp of workPatterns) {
      if (wp.pattern.test(line) && !line.match(/^\d+\./)) {
        currentWork = wp.work;
        break;
      }
    }
    
    const positionMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (positionMatch && positionMatch[2].length > 15) {
      const positionText = positionMatch[2];
      
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

async function embedLeibnizContinue() {
  console.log("Continuing Leibniz embedding from position 1706...");
  
  const filePath = path.join(__dirname, "../data/leibniz/Leibniz_Positions.txt");
  
  if (!fs.existsSync(filePath)) {
    console.error("Positions file not found at:", filePath);
    return;
  }
  
  const chunks = await parsePositions(filePath);
  console.log(`Total positions: ${chunks.length}`);
  
  const startIndex = 1990;
  const remainingChunks = chunks.slice(startIndex);
  console.log(`Starting from index ${startIndex}, ${remainingChunks.length} remaining`);
  
  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;
  
  for (let i = 0; i < remainingChunks.length; i++) {
    const chunk = remainingChunks[i];
    const globalIndex = startIndex + i;
    
    try {
      const embedding = await getEmbedding(chunk.content);
      
      await db.insert(paperChunks).values({
        figureId: "leibniz",
        author: "Gottfried Wilhelm Leibniz",
        paperTitle: chunk.work,
        content: chunk.content,
        embedding: embedding,
        chunkIndex: globalIndex,
        domain: "philosophy",
        significance: "HIGH",
        sourceWork: `Leibniz - ${chunk.work}`
      });
      
      successCount++;
      
      if (successCount % 50 === 0) {
        console.log(`Progress: ${successCount}/${remainingChunks.length} embedded (${((successCount/remainingChunks.length)*100).toFixed(1)}%)`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 60));
      
    } catch (error: any) {
      if (error.message?.includes("duplicate key")) {
        skipCount++;
      } else {
        console.error(`Error at index ${globalIndex}:`, error.message || error);
        errorCount++;
        if (errorCount > 10) {
          console.log("Too many errors, stopping...");
          break;
        }
      }
    }
  }
  
  console.log(`\n=== LEIBNIZ CONTINUATION COMPLETE ===`);
  console.log(`Successfully embedded: ${successCount}`);
  console.log(`Skipped (duplicates): ${skipCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Remaining was: ${remainingChunks.length}`);
}

embedLeibnizContinue()
  .then(() => {
    console.log("Continuation script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

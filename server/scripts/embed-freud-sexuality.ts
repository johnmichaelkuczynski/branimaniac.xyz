import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function embedSexuality() {
  console.log("Starting Three Essays on Sexuality embedding...");
  
  const filePath = path.join(__dirname, "../data/freud/Freud_Three_Essays_Sexuality.txt");
  const content = fs.readFileSync(filePath, "utf-8");
  
  const lines = content.split("\n");
  const positions: string[] = [];
  
  for (const line of lines) {
    const match = line.trim().match(/^(\d+)\.\s+(.+)$/);
    if (match && match[2].length > 20) {
      positions.push(match[2]);
    }
  }
  
  console.log(`Parsed ${positions.length} positions`);
  
  let successCount = 0;
  
  for (let i = 0; i < positions.length; i++) {
    const position = positions[i];
    
    try {
      const embedding = await getEmbedding(position);
      
      await db.insert(paperChunks).values({
        figureId: "freud",
        author: "Sigmund Freud",
        paperTitle: "Three Essays on the Theory of Sexuality",
        content: position,
        embedding: embedding,
        chunkIndex: i,
        domain: "psychoanalysis",
        significance: "HIGH",
        sourceWork: "Freud - Three Essays on the Theory of Sexuality (1905)"
      });
      
      successCount++;
      if (successCount % 10 === 0) {
        console.log(`Progress: ${successCount}/${positions.length}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 60));
    } catch (error: any) {
      console.error(`Error at ${i}:`, error.message);
    }
  }
  
  console.log(`\n=== COMPLETE: ${successCount} positions embedded ===`);
}

embedSexuality().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

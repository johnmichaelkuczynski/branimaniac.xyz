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
  dialogue: string;
}

async function parsePositions(filePath: string): Promise<PositionChunk[]> {
  const content = fs.readFileSync(filePath, "utf-8");
  const chunks: PositionChunk[] = [];
  
  const lines = content.split("\n");
  let currentDialogue = "Plato Dialogues";
  
  const dialoguePatterns = [
    { pattern: /APOLOGY/i, dialogue: "Apology" },
    { pattern: /CRITO/i, dialogue: "Crito" },
    { pattern: /CHARMIDES/i, dialogue: "Charmides" },
    { pattern: /LACHES/i, dialogue: "Laches" },
    { pattern: /LYSIS/i, dialogue: "Lysis" },
    { pattern: /EUTHYPHRO/i, dialogue: "Euthyphro" },
    { pattern: /\bION\b/i, dialogue: "Ion" },
    { pattern: /PROTAGORAS/i, dialogue: "Protagoras" },
    { pattern: /EUTHYDEMUS/i, dialogue: "Euthydemus" },
    { pattern: /GORGIAS/i, dialogue: "Gorgias" },
    { pattern: /HIPPIAS MINOR/i, dialogue: "Hippias Minor" },
    { pattern: /HIPPIAS MAJOR/i, dialogue: "Hippias Major" },
    { pattern: /\bMENO\b/i, dialogue: "Meno" },
    { pattern: /PHAEDO/i, dialogue: "Phaedo" },
    { pattern: /SYMPOSIUM/i, dialogue: "Symposium" },
    { pattern: /REPUBLIC/i, dialogue: "Republic" },
    { pattern: /CRATYLUS/i, dialogue: "Cratylus" },
    { pattern: /PHAEDRUS/i, dialogue: "Phaedrus" },
    { pattern: /THEAETETUS/i, dialogue: "Theaetetus" },
    { pattern: /PARMENIDES/i, dialogue: "Parmenides" },
    { pattern: /SOPHIST/i, dialogue: "Sophist" },
    { pattern: /STATESMAN/i, dialogue: "Statesman" },
    { pattern: /PHILEBUS/i, dialogue: "Philebus" },
    { pattern: /TIMAEUS/i, dialogue: "Timaeus" },
    { pattern: /CRITIAS/i, dialogue: "Critias" },
    { pattern: /\bLAWS\b/i, dialogue: "Laws" },
    { pattern: /ALCIBIADES I/i, dialogue: "Alcibiades I" },
    { pattern: /ALCIBIADES II/i, dialogue: "Alcibiades II" },
    { pattern: /CLITOPHON/i, dialogue: "Clitophon" },
    { pattern: /EPINOMIS/i, dialogue: "Epinomis" },
    { pattern: /EPISTLES/i, dialogue: "Epistles" },
    { pattern: /HIPPARCHUS/i, dialogue: "Hipparchus" },
    { pattern: /\bMINOS\b/i, dialogue: "Minos" },
    { pattern: /THEAGES/i, dialogue: "Theages" },
    { pattern: /RIVAL LOVERS/i, dialogue: "Rival Lovers" },
    { pattern: /ON JUSTICE/i, dialogue: "On Justice" },
    { pattern: /ON VIRTUE/i, dialogue: "On Virtue" },
    { pattern: /DEMODOCUS/i, dialogue: "Demodocus" },
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    for (const dp of dialoguePatterns) {
      if (dp.pattern.test(line) && !line.match(/^\d+\./)) {
        currentDialogue = dp.dialogue;
        break;
      }
    }
    
    const positionMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (positionMatch && positionMatch[2].length > 15) {
      let positionText = positionMatch[2];
      positionText = positionText.replace(/^\*\*/, '').replace(/\*\*$/, '');
      
      chunks.push({
        content: positionText,
        dialogue: currentDialogue
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

async function embedPlato() {
  console.log("Starting Plato embedding...");
  
  const filePath = path.join(__dirname, "../data/plato/Plato_Positions.txt");
  
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
        figureId: "plato",
        author: "Plato",
        paperTitle: chunk.dialogue,
        content: chunk.content,
        embedding: embedding,
        chunkIndex: i,
        domain: "philosophy",
        significance: "HIGH",
        sourceWork: `Plato - ${chunk.dialogue}`
      });
      
      successCount++;
      
      if (successCount % 50 === 0) {
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
  
  console.log(`\n=== PLATO EMBEDDING COMPLETE ===`);
  console.log(`Successfully embedded: ${successCount}`);
  console.log(`Skipped (duplicates): ${skipCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total chunks: ${chunks.length}`);
}

embedPlato()
  .then(() => {
    console.log("Embedding script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

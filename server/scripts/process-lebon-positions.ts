import { db } from "../db";
import { thinkerPositions, thinkerQuotes } from "@shared/schema";
import * as fs from "fs";

// Parse the position statements file which already has structured positions
async function main() {
  const text = fs.readFileSync("lebon-texts/LE_BON_POSITION_STATEMENTS_1766192613553.txt", "utf-8");
  
  const sections = text.split(/\*\*([^*]+)\*\*/g);
  let currentSource = "Complete Works";
  let posCount = 0;
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    
    // Check if this is a source header
    if (section.includes("(") && section.includes(")") && section.length < 100) {
      currentSource = section.replace(/\(\d{4}\)/, "").trim();
      continue;
    }
    
    // Extract numbered positions
    const lines = section.split("\n");
    for (const line of lines) {
      const match = line.match(/^\d+\.\s+(.+)$/);
      if (match && match[1].length > 20) {
        const position = match[1].trim();
        const topic = detectTopic(position);
        
        try {
          await db.insert(thinkerPositions).values({
            thinkerId: "le_bon",
            thinkerName: "Gustave Le Bon",
            position: position,
            source: currentSource,
            topic: topic,
            category: "crowd psychology"
          }).onConflictDoNothing();
          posCount++;
        } catch (e) {}
      }
    }
  }
  
  console.log(`Inserted ${posCount} positions from position statements file`);
}

function detectTopic(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("crowd")) return "crowd psychology";
  if (lower.includes("race") || lower.includes("racial")) return "race psychology";
  if (lower.includes("revolution")) return "revolution";
  if (lower.includes("social") || lower.includes("socialism")) return "socialism";
  if (lower.includes("education")) return "education";
  if (lower.includes("belief") || lower.includes("opinion")) return "beliefs and opinions";
  if (lower.includes("leader")) return "leadership";
  if (lower.includes("war") || lower.includes("military")) return "war psychology";
  return "social psychology";
}

main().then(() => process.exit(0));

/**
 * Import philosophical positions from text files into the positions table
 * 
 * Usage: npx tsx scripts/import-positions.ts
 */

import { db } from "../server/db";
import { positions } from "../shared/schema";
import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "server/data");

const THINKER_MAP: Record<string, string> = {
  "freud": "Sigmund Freud",
  "nietzsche": "Friedrich Nietzsche",
  "plato": "Plato",
  "aristotle": "Aristotle",
  "jung": "Carl Jung",
  "russell": "Bertrand Russell",
  "kant": "Immanuel Kant",
  "spinoza": "Baruch Spinoza",
  "leibniz": "Gottfried Wilhelm Leibniz",
  "schopenhauer": "Arthur Schopenhauer",
  "kuczynski": "J.-M. Kuczynski",
  "newton": "Isaac Newton",
  "galileo": "Galileo Galilei",
  "berkeley": "George Berkeley",
  "hume": "David Hume",
  "confucius": "Confucius",
  "smith": "Adam Smith",
  "goldman": "Emma Goldman",
  "reich": "Wilhelm Reich",
  "james-allen": "James Allen",
};

interface ParsedPosition {
  thinker: string;
  topic: string;
  position: string;
  source: string;
  page: string | null;
}

function parsePositionFile(content: string, thinker: string, filename: string): ParsedPosition[] {
  const positions: ParsedPosition[] = [];
  
  // Extract topic from filename or headers
  let currentTopic = filename
    .replace(/_Positions\.txt$/, "")
    .replace(/_/g, " ")
    .replace(/\d+\s*/, "");
  
  // Look for topic headers like "=== TOPIC ===" or "TOPIC:"
  const topicMatch = content.match(/POSITION STATEMENTS FOR [^:]+:\s*([^\n]+)/i);
  if (topicMatch) {
    currentTopic = topicMatch[1].trim();
  }
  
  // Parse numbered positions (e.g., "1. The pleasure principle...")
  const lines = content.split("\n");
  let currentSection = currentTopic;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect section headers (lines with ===)
    if (trimmed.startsWith("===") || trimmed.endsWith("===")) {
      continue;
    }
    
    // Detect topic headers (ALL CAPS lines)
    if (trimmed.length > 3 && trimmed.length < 100 && trimmed === trimmed.toUpperCase() && !trimmed.match(/^\d/)) {
      currentSection = trimmed.replace(/[=\-]/g, "").trim();
      if (currentSection.length > 0) {
        currentTopic = currentSection;
      }
      continue;
    }
    
    // Parse numbered positions
    const positionMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (positionMatch) {
      const positionText = positionMatch[2].trim();
      if (positionText.length > 10) {
        positions.push({
          thinker,
          topic: currentTopic,
          position: positionText,
          source: filename.replace(".txt", ""),
          page: null,
        });
      }
    }
  }
  
  return positions;
}

async function importPositions() {
  console.log("=== IMPORTING PHILOSOPHICAL POSITIONS ===\n");
  
  let totalPositions = 0;
  const stats: Record<string, number> = {};
  
  // Process each thinker folder
  for (const [folder, thinkerName] of Object.entries(THINKER_MAP)) {
    const folderPath = path.join(DATA_DIR, folder);
    
    if (!fs.existsSync(folderPath)) {
      console.log(`Skipping ${folder} - folder not found`);
      continue;
    }
    
    const files = fs.readdirSync(folderPath)
      .filter(f => f.endsWith(".txt") && f.toLowerCase().includes("position"));
    
    if (files.length === 0) {
      console.log(`No position files found in ${folder}`);
      continue;
    }
    
    console.log(`Processing ${thinkerName} (${files.length} files)...`);
    let thinkerPositions = 0;
    
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const content = fs.readFileSync(filePath, "utf-8");
      
      const parsed = parsePositionFile(content, thinkerName, file);
      
      for (const pos of parsed) {
        try {
          await db.insert(positions).values({
            thinker: pos.thinker,
            topic: pos.topic,
            position: pos.position,
            source: pos.source,
            page: pos.page,
          });
          thinkerPositions++;
          totalPositions++;
        } catch (error: any) {
          if (!error.message.includes("duplicate")) {
            console.error(`  Error inserting position: ${error.message}`);
          }
        }
      }
      
      console.log(`  ${file}: ${parsed.length} positions`);
    }
    
    stats[thinkerName] = thinkerPositions;
    console.log(`  Total for ${thinkerName}: ${thinkerPositions}\n`);
  }
  
  console.log("\n=== IMPORT COMPLETE ===");
  console.log(`Total positions imported: ${totalPositions}`);
  console.log("\nBreakdown by thinker:");
  for (const [thinker, count] of Object.entries(stats)) {
    if (count > 0) {
      console.log(`  ${thinker}: ${count}`);
    }
  }
}

importPositions().catch(console.error);

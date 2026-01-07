import { db } from "../db";
import { thinkerPositions, thinkerQuotes } from "@shared/schema";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const FREUD_FILES = [
  "freud-texts/Freud_-_Complete_Works_(Over_4000_pages,_Most_Comprehensive_Ve_1766191599518.txt",
  "freud-texts/Freud_-_Complete_Works_(Over_4000_pages,_Most_Comprehensive_Ve_1766191599520.txt",
  "freud-texts/Freud_-_Complete_Works_(Over_4000_pages,_Most_Comprehensive_Ve_1766191599522.txt",
  "freud-texts/Freud_-_Complete_Works_(Over_4000_pages,_Most_Comprehensive_Ve_1766191599524.txt",
  "freud-texts/Freud_-_Complete_Works_(Over_4000_pages,_Most_Comprehensive_Ve_1766191599525.txt",
  "freud-texts/Freud_-_Complete_Works_(Over_4000_pages,_Most_Comprehensive_Ve_1766191599526.txt",
  "freud-texts/Freud_-_Complete_Works_(Over_4000_pages,_Most_Comprehensive_Ve_1766191599528.txt",
  "freud-texts/Freud_-_Complete_Works_(Over_4000_pages,_Most_Comprehensive_Ve_1766191599529.txt",
  "freud-texts/Freud_-_Complete_Works_(Over_4000_pages,_Most_Comprehensive_Ve_1766191599530.txt",
  "freud-texts/Freud_-_Complete_Works_(Over_4000_pages,_Most_Comprehensive_Ve_1766191599531.txt",
  "freud-texts/Freud_-_Complete_Works_(Over_4000_pages,_Most_Comprehensive_Ve_1766191635677.txt",
  "freud-texts/Freud_-_Complete_Works_(Over_4000_pages,_Most_Comprehensive_Ve_1766191635678.txt",
  "freud-texts/Freud_-_Complete_Works_(Over_4000_pages,_Most_Comprehensive_Ve_1766191635679.txt",
  "freud-texts/Freud_-_Complete_Works_(Over_4000_pages,_Most_Comprehensive_Ve_1766191635680.txt",
  "freud-texts/Freud_-_Complete_Works_(Over_4000_pages,_Most_Comprehensive_Ve_1766191635681.txt",
  "freud-texts/Freud_-_Complete_Works_(Over_4000_pages,_Most_Comprehensive_Ve_1766191635682.txt",
  "freud-texts/Freud_-_Complete_Works_(Over_4000_pages,_Most_Comprehensive_Ve_1766191635683.txt",
  "freud-texts/Freud_-_Complete_Works_(Over_4000_pages,_Most_Comprehensive_Ve_1766191635684.txt",
  "freud-texts/Freud_-_Complete_Works_(Over_4000_pages,_Most_Comprehensive_Ve_1766191635685.txt",
  "freud-texts/Freud__Dictionary_of_Psychoanalysis_1766071293112.txt",
];

const FREUD_TOPICS = [
  "unconscious", "dreams", "repression", "libido", "ego", "id", "superego",
  "sexuality", "neurosis", "psychoanalysis", "transference", "resistance",
  "oedipus complex", "castration", "hysteria", "anxiety", "defense mechanisms",
  "childhood", "memory", "trauma", "pleasure principle", "death drive",
  "sublimation", "narcissism", "civilization", "religion", "therapy"
];

function detectTopic(text: string): string {
  const lowerText = text.toLowerCase();
  for (const topic of FREUD_TOPICS) {
    if (lowerText.includes(topic)) return topic;
  }
  return "psychoanalysis";
}

function detectCategory(text: string): string {
  const lowerText = text.toLowerCase();
  if (lowerText.includes("dream") || lowerText.includes("sleep")) return "dream interpretation";
  if (lowerText.includes("sexual") || lowerText.includes("libido")) return "sexuality";
  if (lowerText.includes("neurosis") || lowerText.includes("hysteria")) return "psychopathology";
  if (lowerText.includes("unconscious") || lowerText.includes("conscious")) return "metapsychology";
  if (lowerText.includes("child") || lowerText.includes("infant")) return "developmental psychology";
  if (lowerText.includes("therapy") || lowerText.includes("treatment")) return "clinical technique";
  if (lowerText.includes("civilization") || lowerText.includes("society")) return "cultural theory";
  return "psychoanalytic theory";
}

function extractSourceFromContext(text: string): string {
  const patterns = [
    /(?:from|in)\s+["']?([A-Z][^"'\n]+?)["']?(?:\s*\(|\s*,|\s*\.)/,
    /([A-Z][A-Za-z\s]+)\s*\(\d{4}\)/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return "Complete Works";
}

function splitIntoChunks(text: string, chunkSize: number = 8000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = "";
  
  for (const para of paragraphs) {
    if (currentChunk.length + para.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += "\n\n" + para;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

async function extractPositionsFromChunk(chunk: string, chunkIndex: number): Promise<Array<{position: string, source: string, topic: string, category: string}>> {
  const prompt = `You are analyzing Sigmund Freud's writings to extract distinct philosophical and psychological positions.

TEXT FROM FREUD'S WORKS:
${chunk}

TASK: Extract 15-25 distinct POSITIONS (theoretical claims, arguments, or conclusions) from this text. Each position should be:
- A complete, standalone theoretical claim (1-3 sentences)
- Represent Freud's actual views as expressed in the text
- Be substantive and meaningful (not trivial observations)

Format EXACTLY as:
POSITION: [the position statement]
SOURCE: [work title if identifiable, otherwise "Complete Works"]
TOPIC: [main topic: unconscious/dreams/repression/sexuality/neurosis/ego/etc]
CATEGORY: [category: metapsychology/dream interpretation/psychopathology/clinical technique/sexuality/developmental psychology/cultural theory]

Extract positions now:`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }]
    });
    
    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    const positions: Array<{position: string, source: string, topic: string, category: string}> = [];
    
    const positionMatches = responseText.matchAll(/POSITION:\s*(.+?)(?:\nSOURCE:\s*(.+?))?(?:\nTOPIC:\s*(.+?))?(?:\nCATEGORY:\s*(.+?))?(?=\n\nPOSITION:|\n*$)/gs);
    
    for (const match of positionMatches) {
      const position = match[1]?.trim();
      const source = match[2]?.trim() || "Complete Works";
      const topic = match[3]?.trim() || detectTopic(position);
      const category = match[4]?.trim() || detectCategory(position);
      
      if (position && position.length > 30) {
        positions.push({ position, source, topic, category });
      }
    }
    
    console.log(`[Chunk ${chunkIndex}] Extracted ${positions.length} positions`);
    return positions;
  } catch (error) {
    console.error(`[Chunk ${chunkIndex}] Error extracting positions:`, error);
    return [];
  }
}

async function extractQuotesFromChunk(chunk: string, chunkIndex: number): Promise<Array<{quote: string, source: string, topic: string}>> {
  const prompt = `You are extracting memorable quotes from Sigmund Freud's writings.

TEXT FROM FREUD'S WORKS:
${chunk}

TASK: Extract 8-12 distinct, quotable passages from this text. Each quote should be:
- A complete, memorable statement (1-3 sentences)
- Philosophically or psychologically significant
- Directly from the source material (exact or near-exact wording)

Format EXACTLY as:
QUOTE: [exact quote text]
SOURCE: [work title if identifiable]
TOPIC: [main topic]

Extract quotes now:`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }]
    });
    
    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    const quotes: Array<{quote: string, source: string, topic: string}> = [];
    
    const quoteMatches = responseText.matchAll(/QUOTE:\s*(.+?)(?:\nSOURCE:\s*(.+?))?(?:\nTOPIC:\s*(.+?))?(?=\n\nQUOTE:|\n*$)/gs);
    
    for (const match of quoteMatches) {
      const quote = match[1]?.trim().replace(/^["']|["']$/g, '');
      const source = match[2]?.trim() || "Complete Works";
      const topic = match[3]?.trim() || detectTopic(quote);
      
      if (quote && quote.length > 20 && quote.length < 500) {
        quotes.push({ quote, source, topic });
      }
    }
    
    console.log(`[Chunk ${chunkIndex}] Extracted ${quotes.length} quotes`);
    return quotes;
  } catch (error) {
    console.error(`[Chunk ${chunkIndex}] Error extracting quotes:`, error);
    return [];
  }
}

async function insertPositions(positions: Array<{position: string, source: string, topic: string, category: string}>) {
  let inserted = 0;
  const batchSize = 50;
  for (let i = 0; i < positions.length; i += batchSize) {
    const batch = positions.slice(i, i + batchSize);
    try {
      await db.insert(thinkerPositions).values(
        batch.map(pos => ({
          thinkerId: "freud",
          thinkerName: "Sigmund Freud",
          position: pos.position,
          source: pos.source,
          topic: pos.topic,
          category: pos.category,
        }))
      ).onConflictDoNothing();
      inserted += batch.length;
    } catch (error) {
      // Try one by one on failure
      for (const pos of batch) {
        try {
          await db.insert(thinkerPositions).values({
            thinkerId: "freud",
            thinkerName: "Sigmund Freud",
            position: pos.position,
            source: pos.source,
            topic: pos.topic,
            category: pos.category,
          }).onConflictDoNothing();
          inserted++;
        } catch { /* duplicate */ }
      }
    }
  }
  return inserted;
}

async function insertQuotes(quotes: Array<{quote: string, source: string, topic: string}>) {
  let inserted = 0;
  const batchSize = 50;
  for (let i = 0; i < quotes.length; i += batchSize) {
    const batch = quotes.slice(i, i + batchSize);
    try {
      await db.insert(thinkerQuotes).values(
        batch.map(q => ({
          thinkerId: "freud",
          thinkerName: "Sigmund Freud",
          quote: q.quote,
          source: q.source,
          topic: q.topic,
        }))
      ).onConflictDoNothing();
      inserted += batch.length;
    } catch (error) {
      // Try one by one on failure
      for (const q of batch) {
        try {
          await db.insert(thinkerQuotes).values({
            thinkerId: "freud",
            thinkerName: "Sigmund Freud",
            quote: q.quote,
            source: q.source,
            topic: q.topic,
          }).onConflictDoNothing();
          inserted++;
        } catch { /* duplicate */ }
      }
    }
  }
  return inserted;
}

async function processFreudTexts() {
  console.log("=== FREUD TEXT PROCESSING STARTED ===");
  console.log(`Processing ${FREUD_FILES.length} files...`);
  
  let totalPositions = 0;
  let totalQuotes = 0;
  let totalChunks = 0;
  
  for (const filePath of FREUD_FILES) {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }
    
    console.log(`\n--- Processing: ${path.basename(filePath)} ---`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const chunks = splitIntoChunks(content, 6000);
    console.log(`Split into ${chunks.length} chunks`);
    
    for (let i = 0; i < chunks.length; i++) {
      totalChunks++;
      console.log(`\n[${totalChunks}] Processing chunk ${i + 1}/${chunks.length}...`);
      
      // Extract and insert positions
      const positions = await extractPositionsFromChunk(chunks[i], totalChunks);
      const posInserted = await insertPositions(positions);
      totalPositions += posInserted;
      
      // Extract and insert quotes
      const quotes = await extractQuotesFromChunk(chunks[i], totalChunks);
      const quotesInserted = await insertQuotes(quotes);
      totalQuotes += quotesInserted;
      
      console.log(`Running totals: ${totalPositions} positions, ${totalQuotes} quotes`);
      
      // Rate limiting - pause between chunks
      await new Promise(r => setTimeout(r, 500));
      
      // Progress check - stop early if we've hit targets
      if (totalPositions >= 20000 && totalQuotes >= 5000) {
        console.log("\n=== TARGETS REACHED ===");
        break;
      }
    }
    
    if (totalPositions >= 20000 && totalQuotes >= 5000) {
      break;
    }
  }
  
  console.log("\n=== PROCESSING COMPLETE ===");
  console.log(`Total positions inserted: ${totalPositions}`);
  console.log(`Total quotes inserted: ${totalQuotes}`);
  
  // Verify counts in database
  const posCount = await db.execute(sql`SELECT COUNT(*) as count FROM thinker_positions WHERE thinker_id = 'freud'`);
  const quoteCount = await db.execute(sql`SELECT COUNT(*) as count FROM thinker_quotes WHERE thinker_id = 'freud'`);
  
  console.log(`\nDatabase verification:`);
  console.log(`Freud positions in DB: ${posCount.rows[0]?.count}`);
  console.log(`Freud quotes in DB: ${quoteCount.rows[0]?.count}`);
}

// Run the script
processFreudTexts().catch(console.error);

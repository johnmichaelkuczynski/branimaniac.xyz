import { db } from "../db";
import { thinkerPositions, thinkerQuotes } from "@shared/schema";
import * as fs from "fs";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const LEBON_FILES = fs.readdirSync("lebon-texts").filter(f => f.endsWith(".txt")).map(f => `lebon-texts/${f}`);

async function extractFromChunk(chunk: string, source: string) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    temperature: 0.3,
    messages: [{ role: "user", content: `Extract from Gustave Le Bon's text. Format each as:
POSITION: [theoretical claim/argument - 1-2 sentences]
QUOTE: [exact quote from text - verbatim]
TOPIC: [crowd psychology/race psychology/revolution/socialism/education/beliefs/leadership/war psychology/social psychology]

TEXT FROM "${source}":
${chunk.slice(0, 6000)}

Extract 10 distinct POSITIONS and 15 exact QUOTES:` }]
  });
  
  const content = response.content[0].type === 'text' ? response.content[0].text : '';
  const positions: any[] = [];
  const quotes: any[] = [];
  
  const lines = content.split('\n');
  let currentPos = '', currentQuote = '', currentTopic = 'crowd psychology';
  
  for (const line of lines) {
    if (line.startsWith('POSITION:')) currentPos = line.replace('POSITION:', '').trim();
    if (line.startsWith('QUOTE:')) currentQuote = line.replace('QUOTE:', '').trim();
    if (line.startsWith('TOPIC:')) {
      currentTopic = line.replace('TOPIC:', '').trim().toLowerCase();
      if (currentPos && currentPos.length > 20) positions.push({ position: currentPos, source, topic: currentTopic });
      if (currentQuote && currentQuote.length > 20) quotes.push({ quote: currentQuote, source, topic: currentTopic });
      currentPos = ''; currentQuote = '';
    }
  }
  return { positions, quotes };
}

async function main() {
  const startChunk = parseInt(process.argv[2] || '0');
  const fileIndex = parseInt(process.argv[3] || '0');
  
  if (fileIndex >= LEBON_FILES.length) {
    console.log("All files processed!");
    return;
  }
  
  const file = LEBON_FILES[fileIndex];
  const sourceName = file.includes("CROWD") ? "The Crowd" : 
                     file.includes("Revolution") ? "The Psychology of Revolution" :
                     file.includes("evolution") ? "The Evolution of Forces" :
                     file.includes("POSITION") ? "Position Statements" : "Complete Works";
  
  console.log(`Processing file ${fileIndex}: ${file} (${sourceName}), chunk ${startChunk}`);
  
  const text = fs.readFileSync(file, 'utf-8');
  const chunks = text.split(/\n\s*\n/).reduce((acc, para) => {
    const last = acc[acc.length - 1] || '';
    if (last.length + para.length > 6000) { acc.push(para); }
    else { acc[acc.length - 1] = last + '\n\n' + para; }
    return acc;
  }, [''] as string[]).filter(c => c.length > 500);
  
  console.log(`File has ${chunks.length} chunks`);
  
  let totalPos = 0, totalQuotes = 0;
  const endChunk = Math.min(startChunk + 5, chunks.length);
  
  for (let i = startChunk; i < endChunk; i++) {
    console.log(`Chunk ${i+1}/${chunks.length}...`);
    try {
      const { positions, quotes } = await extractFromChunk(chunks[i], sourceName);
      
      for (const p of positions) {
        await db.insert(thinkerPositions).values({
          thinkerId: "le_bon", thinkerName: "Gustave Le Bon",
          position: p.position, source: p.source, topic: p.topic, category: "crowd psychology"
        }).onConflictDoNothing();
        totalPos++;
      }
      
      for (const q of quotes) {
        await db.insert(thinkerQuotes).values({
          thinkerId: "le_bon", thinkerName: "Gustave Le Bon",
          quote: q.quote, source: q.source, topic: q.topic
        }).onConflictDoNothing();
        totalQuotes++;
      }
      
      console.log(`Added ${positions.length} positions, ${quotes.length} quotes`);
    } catch (e) { console.log(`Error: ${e}`); }
  }
  
  console.log(`DONE: ${totalPos} positions, ${totalQuotes} quotes added`);
  console.log(`Next: npx tsx server/scripts/quick-lebon-extract.ts ${endChunk} ${fileIndex}`);
}

main();

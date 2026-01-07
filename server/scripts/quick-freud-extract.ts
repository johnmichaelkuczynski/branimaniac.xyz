import { db } from "../db";
import { thinkerPositions, thinkerQuotes } from "@shared/schema";
import * as fs from "fs";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const FREUD_FILES = fs.readdirSync("freud-texts").filter(f => f.endsWith(".txt")).map(f => `freud-texts/${f}`);

async function extractFromChunk(chunk: string) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    temperature: 0.3,
    messages: [{ role: "user", content: `Extract from Freud text. Format each as:
POSITION: [claim]
QUOTE: [exact quote]
SOURCE: [work title]
TOPIC: [topic]

TEXT:
${chunk.slice(0, 6000)}

Extract 10 positions and 5 quotes:` }]
  });
  
  const content = response.content[0].type === 'text' ? response.content[0].text : '';
  const positions: any[] = [];
  const quotes: any[] = [];
  
  const lines = content.split('\n');
  let currentPos = '', currentQuote = '', currentSource = 'Complete Works', currentTopic = 'psychoanalysis';
  
  for (const line of lines) {
    if (line.startsWith('POSITION:')) currentPos = line.replace('POSITION:', '').trim();
    if (line.startsWith('QUOTE:')) currentQuote = line.replace('QUOTE:', '').trim();
    if (line.startsWith('SOURCE:')) currentSource = line.replace('SOURCE:', '').trim();
    if (line.startsWith('TOPIC:')) {
      currentTopic = line.replace('TOPIC:', '').trim();
      if (currentPos) positions.push({ position: currentPos, source: currentSource, topic: currentTopic, category: 'psychoanalytic theory' });
      if (currentQuote) quotes.push({ quote: currentQuote, source: currentSource, topic: currentTopic });
      currentPos = ''; currentQuote = '';
    }
  }
  return { positions, quotes };
}

async function main() {
  const startChunk = parseInt(process.argv[2] || '0');
  const fileIndex = parseInt(process.argv[3] || '0');
  
  if (fileIndex >= FREUD_FILES.length) {
    console.log("All files processed!");
    return;
  }
  
  const file = FREUD_FILES[fileIndex];
  console.log(`Processing file ${fileIndex}: ${file}, starting at chunk ${startChunk}`);
  
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
      const { positions, quotes } = await extractFromChunk(chunks[i]);
      
      for (const p of positions) {
        await db.insert(thinkerPositions).values({
          thinkerId: "freud", thinkerName: "Sigmund Freud",
          position: p.position, source: p.source, topic: p.topic, category: p.category
        }).onConflictDoNothing();
        totalPos++;
      }
      
      for (const q of quotes) {
        await db.insert(thinkerQuotes).values({
          thinkerId: "freud", thinkerName: "Sigmund Freud",
          quote: q.quote, source: q.source, topic: q.topic
        }).onConflictDoNothing();
        totalQuotes++;
      }
      
      console.log(`Added ${positions.length} positions, ${quotes.length} quotes`);
    } catch (e) { console.log(`Error: ${e}`); }
  }
  
  console.log(`DONE: ${totalPos} positions, ${totalQuotes} quotes added`);
  console.log(`Next: npx tsx server/scripts/quick-freud-extract.ts ${endChunk} ${fileIndex}`);
}

main();

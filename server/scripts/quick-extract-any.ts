import { db } from "../db";
import { thinkerPositions, thinkerQuotes } from "@shared/schema";
import * as fs from "fs";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const THINKERS: Record<string, { id: string; name: string; dir: string; topics: string }> = {
  jung: { id: "jung", name: "Carl Jung", dir: "jung-texts", topics: "unconscious/archetypes/individuation/psyche/shadow/anima/persona/dreams/symbolism/introversion/extraversion/collective unconscious" },
  spencer: { id: "herbert_spencer", name: "Herbert Spencer", dir: "spencer-texts", topics: "evolution/ethics/psychology/sociology/individualism/social organism/survival/progress/liberty/justice/utilitarianism" },
  darwin: { id: "charles_darwin", name: "Charles Darwin", dir: "darwin-texts", topics: "natural selection/evolution/species/variation/heredity/sexual selection/adaptation/survival/descent/instinct/geology" }
};

async function extractFromChunk(chunk: string, source: string, thinker: typeof THINKERS[string]) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 5000,
    temperature: 0.3,
    messages: [{ role: "user", content: `Extract from ${thinker.name}'s text. Format each as:
POSITION: [theoretical claim/argument - 1-2 sentences capturing the philosophical/scientific position]
QUOTE: [exact quote from text - verbatim, 15-100 words]
TOPIC: [${thinker.topics}]

TEXT FROM "${source}":
${chunk.slice(0, 7000)}

Extract 15 distinct POSITIONS and 20 exact QUOTES. Be thorough:` }]
  });
  
  const content = response.content[0].type === 'text' ? response.content[0].text : '';
  const positions: any[] = [];
  const quotes: any[] = [];
  
  const lines = content.split('\n');
  let currentPos = '', currentQuote = '', currentTopic = 'evolution';
  
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
  const thinkerKey = process.argv[2];
  const startChunk = parseInt(process.argv[3] || '0');
  const fileIndex = parseInt(process.argv[4] || '0');
  
  if (!thinkerKey || !THINKERS[thinkerKey]) {
    console.log("Usage: npx tsx quick-extract-any.ts <jung|spencer|darwin> <startChunk> <fileIndex>");
    return;
  }
  
  const thinker = THINKERS[thinkerKey];
  const files = fs.readdirSync(thinker.dir).filter(f => f.endsWith(".txt")).map(f => `${thinker.dir}/${f}`);
  
  if (fileIndex >= files.length) {
    console.log(`All ${thinker.name} files processed!`);
    return;
  }
  
  const file = files[fileIndex];
  const sourceName = file.split('/').pop()?.replace(/_\d+\.txt$/, '').replace(/_/g, ' ').slice(0, 60) || "Works";
  
  console.log(`[${thinker.name}] File ${fileIndex+1}/${files.length}: ${file.slice(0, 60)}...`);
  
  const text = fs.readFileSync(file, 'utf-8');
  const chunks = text.split(/\n\s*\n/).reduce((acc, para) => {
    const last = acc[acc.length - 1] || '';
    if (last.length + para.length > 7000) { acc.push(para); }
    else { acc[acc.length - 1] = last + '\n\n' + para; }
    return acc;
  }, [''] as string[]).filter(c => c.length > 500);
  
  console.log(`File has ${chunks.length} chunks, starting at ${startChunk}`);
  
  let totalPos = 0, totalQuotes = 0;
  const endChunk = Math.min(startChunk + 3, chunks.length);
  
  for (let i = startChunk; i < endChunk; i++) {
    console.log(`Chunk ${i+1}/${chunks.length}...`);
    try {
      const { positions, quotes } = await extractFromChunk(chunks[i], sourceName, thinker);
      
      for (const p of positions) {
        await db.insert(thinkerPositions).values({
          thinkerId: thinker.id, thinkerName: thinker.name,
          position: p.position, source: p.source, topic: p.topic, category: "philosophy"
        }).onConflictDoNothing();
        totalPos++;
      }
      
      for (const q of quotes) {
        await db.insert(thinkerQuotes).values({
          thinkerId: thinker.id, thinkerName: thinker.name,
          quote: q.quote, source: q.source, topic: q.topic
        }).onConflictDoNothing();
        totalQuotes++;
      }
      
      console.log(`  +${positions.length} positions, +${quotes.length} quotes`);
    } catch (e) { console.log(`Error: ${e}`); }
  }
  
  console.log(`BATCH DONE: ${totalPos} positions, ${totalQuotes} quotes`);
  
  if (endChunk < chunks.length) {
    console.log(`NEXT: npx tsx server/scripts/quick-extract-any.ts ${thinkerKey} ${endChunk} ${fileIndex}`);
  } else if (fileIndex + 1 < files.length) {
    console.log(`NEXT FILE: npx tsx server/scripts/quick-extract-any.ts ${thinkerKey} 0 ${fileIndex + 1}`);
  }
}

main();

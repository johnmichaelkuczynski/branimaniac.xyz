import { db } from "../db";
import { thinkerPositions, thinkerQuotes } from "@shared/schema";
import * as fs from "fs";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

interface ThinkerConfig {
  id: string;
  name: string;
  dir: string;
  topics: string;
}

const THINKERS: Record<string, ThinkerConfig> = {
  maimonides: { 
    id: "maimonides", 
    name: "Moses Maimonides", 
    dir: "maimonides-texts", 
    topics: "theology/metaphysics/ethics/divine attributes/prophecy/providence/free will/immortality/creation/negative theology/law/Torah/reason/faith" 
  },
  schopenhauer: { 
    id: "schopenhauer", 
    name: "Arthur Schopenhauer", 
    dir: "schopenhauer-texts", 
    topics: "will/representation/pessimism/suffering/aesthetics/ethics/compassion/genius/art/music/death/asceticism/women/suicide/freedom" 
  },
  gibbon: { 
    id: "gibbon", 
    name: "Edward Gibbon", 
    dir: "gibbon-texts", 
    topics: "Roman history/decline/fall/empire/Christianity/barbarism/civilization/corruption/military/politics/religion/virtue/decadence" 
  },
  dewey: { 
    id: "dewey", 
    name: "John Dewey", 
    dir: "dewey-texts", 
    topics: "pragmatism/education/democracy/experience/inquiry/instrumentalism/ethics/logic/aesthetics/social reform/growth/habit" 
  }
};

async function extractFromChunk(chunk: string, source: string, thinker: ThinkerConfig, extractionType: 'positions' | 'quotes' | 'both') {
  const prompt = extractionType === 'quotes' 
    ? `Extract EXACT QUOTES from ${thinker.name}'s text. These must be VERBATIM passages - the author's actual words, not paraphrases.

Format each as:
QUOTE: [exact verbatim quote from text, 15-150 words, preserving original wording]
TOPIC: [${thinker.topics}]

TEXT FROM "${source}":
${chunk.slice(0, 8000)}

Extract 25-30 EXACT QUOTES. Be thorough - find memorable, insightful passages:`
    : extractionType === 'positions'
    ? `Extract PHILOSOPHICAL POSITIONS from ${thinker.name}'s text. These are the author's theoretical claims, arguments, and positions - NOT direct quotes.

Format each as:
POSITION: [theoretical claim/argument in 1-2 sentences - what the thinker believes or argues]
TOPIC: [${thinker.topics}]

TEXT FROM "${source}":
${chunk.slice(0, 8000)}

Extract 20-25 distinct POSITIONS. Be thorough - identify every significant claim:`
    : `Extract from ${thinker.name}'s text. Format each as:
POSITION: [theoretical claim/argument - 1-2 sentences capturing the philosophical position]
QUOTE: [exact verbatim quote from text - 15-100 words]
TOPIC: [${thinker.topics}]

TEXT FROM "${source}":
${chunk.slice(0, 8000)}

Extract 15 distinct POSITIONS and 20 exact QUOTES. Be thorough:`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6000,
    temperature: 0.3,
    messages: [{ role: "user", content: prompt }]
  });
  
  const content = response.content[0].type === 'text' ? response.content[0].text : '';
  const positions: { position: string; source: string; topic: string }[] = [];
  const quotes: { quote: string; source: string; topic: string }[] = [];
  
  const lines = content.split('\n');
  let currentPos = '', currentQuote = '', currentTopic = 'philosophy';
  
  for (const line of lines) {
    if (line.startsWith('POSITION:')) {
      if (currentPos && currentPos.length > 20) {
        positions.push({ position: currentPos, source, topic: currentTopic });
      }
      currentPos = line.replace('POSITION:', '').trim();
    }
    if (line.startsWith('QUOTE:')) {
      if (currentQuote && currentQuote.length > 20) {
        quotes.push({ quote: currentQuote, source, topic: currentTopic });
      }
      currentQuote = line.replace('QUOTE:', '').trim();
    }
    if (line.startsWith('TOPIC:')) {
      currentTopic = line.replace('TOPIC:', '').trim().toLowerCase();
      if (currentPos && currentPos.length > 20) {
        positions.push({ position: currentPos, source, topic: currentTopic });
        currentPos = '';
      }
      if (currentQuote && currentQuote.length > 20) {
        quotes.push({ quote: currentQuote, source, topic: currentTopic });
        currentQuote = '';
      }
    }
  }
  
  if (currentPos && currentPos.length > 20) positions.push({ position: currentPos, source, topic: currentTopic });
  if (currentQuote && currentQuote.length > 20) quotes.push({ quote: currentQuote, source, topic: currentTopic });
  
  return { positions, quotes };
}

async function main() {
  const thinkerKey = process.argv[2];
  const startChunk = parseInt(process.argv[3] || '0');
  const fileIndex = parseInt(process.argv[4] || '0');
  const chunksPerBatch = parseInt(process.argv[5] || '5');
  const extractionType = (process.argv[6] || 'both') as 'positions' | 'quotes' | 'both';
  
  if (!thinkerKey || !THINKERS[thinkerKey]) {
    console.log("Usage: npx tsx server/scripts/extract-thinker-batch.ts <thinker> <startChunk> <fileIndex> <chunksPerBatch> <positions|quotes|both>");
    console.log("Thinkers:", Object.keys(THINKERS).join(', '));
    return;
  }
  
  const thinker = THINKERS[thinkerKey];
  
  if (!fs.existsSync(thinker.dir)) {
    console.log(`Directory ${thinker.dir} not found!`);
    return;
  }
  
  const files = fs.readdirSync(thinker.dir).filter(f => f.endsWith(".txt")).map(f => `${thinker.dir}/${f}`);
  
  if (files.length === 0) {
    console.log(`No .txt files found in ${thinker.dir}`);
    return;
  }
  
  if (fileIndex >= files.length) {
    console.log(`All ${thinker.name} files processed!`);
    return;
  }
  
  const file = files[fileIndex];
  const sourceName = file.split('/').pop()?.replace(/_\d+\.txt$/, '').replace(/_/g, ' ').replace('.txt', '').slice(0, 80) || "Works";
  
  console.log(`\n[${thinker.name}] File ${fileIndex+1}/${files.length}: ${sourceName}`);
  console.log(`Extraction type: ${extractionType}`);
  
  const text = fs.readFileSync(file, 'utf-8');
  
  const chunks = text.split(/\n\s*\n/).reduce((acc, para) => {
    const last = acc[acc.length - 1] || '';
    if (last.length + para.length > 8000) { acc.push(para); }
    else { acc[acc.length - 1] = last + '\n\n' + para; }
    return acc;
  }, [''] as string[]).filter(c => c.length > 500);
  
  console.log(`File has ${chunks.length} chunks, starting at ${startChunk}, processing ${chunksPerBatch} chunks`);
  
  let totalPos = 0, totalQuotes = 0;
  const endChunk = Math.min(startChunk + chunksPerBatch, chunks.length);
  
  for (let i = startChunk; i < endChunk; i++) {
    console.log(`Chunk ${i+1}/${chunks.length}...`);
    try {
      const { positions, quotes } = await extractFromChunk(chunks[i], sourceName, thinker, extractionType);
      
      for (const p of positions) {
        try {
          await db.insert(thinkerPositions).values({
            thinkerId: thinker.id, 
            thinkerName: thinker.name,
            position: p.position, 
            source: p.source, 
            topic: p.topic, 
            category: "philosophy"
          }).onConflictDoNothing();
          totalPos++;
        } catch (e) {}
      }
      
      for (const q of quotes) {
        try {
          await db.insert(thinkerQuotes).values({
            thinkerId: thinker.id, 
            thinkerName: thinker.name,
            quote: q.quote, 
            source: q.source, 
            topic: q.topic
          }).onConflictDoNothing();
          totalQuotes++;
        } catch (e) {}
      }
      
      console.log(`  +${positions.length} positions, +${quotes.length} quotes`);
    } catch (e: any) { 
      console.log(`Error: ${e.message?.slice(0, 100)}`); 
    }
  }
  
  console.log(`\nBATCH DONE: +${totalPos} positions, +${totalQuotes} quotes`);
  
  if (endChunk < chunks.length) {
    console.log(`\nNEXT: npx tsx server/scripts/extract-thinker-batch.ts ${thinkerKey} ${endChunk} ${fileIndex} ${chunksPerBatch} ${extractionType}`);
  } else if (fileIndex + 1 < files.length) {
    console.log(`\nNEXT FILE: npx tsx server/scripts/extract-thinker-batch.ts ${thinkerKey} 0 ${fileIndex + 1} ${chunksPerBatch} ${extractionType}`);
  } else {
    console.log(`\nALL ${thinker.name.toUpperCase()} FILES COMPLETE!`);
  }
}

main();

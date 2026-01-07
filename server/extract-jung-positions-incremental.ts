import { db } from "./db";
import { paperChunks } from "@shared/schema";
import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface JungPosition {
  positionId: string;
  domain: string;
  thesis: string;
  keyArguments: string[];
  sourceWork: string;
  sourceLocation: string;
  significance: string;
  relatedConcepts: string[];
}

const EXTRACTION_PROMPT = `You are analyzing Carl Jung's works to extract structured theoretical positions.

Extract ALL distinct positions you find. For each:

1. positionId: "JUNG-[ABBREV]-###" (AP=Analytical Psych, TU=Theory Unconscious, PT=Psych Types, DA=Dream Analysis, IP=Individuation, AS=Archetypes/Symbols, SY=Synchronicity, RS=Religion/Spirit, AM=Alchemy/Myth, CT=Complex Theory)
2. domain: One of the 10 Jung domains
3. thesis: Clear theoretical claim
4. keyArguments: 3-5 supporting arguments
5. sourceWork: Source title
6. sourceLocation: Chapter/section if known
7. significance: Theoretical importance
8. relatedConcepts: 2-4 related concepts

Return ONLY valid JSON array. Extract EVERYTHING significant.`;

async function extractPositions(text: string, sourceWork: string, start: number): Promise<JungPosition[]> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      temperature: 0.3,
      messages: [{
        role: "user",
        content: `${EXTRACTION_PROMPT}\n\nSOURCE: ${sourceWork}\n\nTEXT:\n\n${text}`
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') return [];

    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const positions = JSON.parse(jsonMatch[0]) as JungPosition[];
    return positions.map((p, idx) => ({
      ...p,
      positionId: p.positionId.replace(/\d+$/, String(start + idx).padStart(3, '0'))
    }));
  } catch (error) {
    console.error(`  ✗ Error:`, error);
    return [];
  }
}

async function main() {
  const workToProcess = process.argv[2];
  
  if (!workToProcess) {
    console.log('\n❌ Usage: tsx extract-jung-positions-incremental.ts "Work Title"\n');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`  EXTRACTING: ${workToProcess}`);
  console.log('='.repeat(80) + '\n');

  const result = await db.execute(`
    SELECT content FROM paper_chunks 
    WHERE author = 'Carl Jung' 
      AND paper_title = '${workToProcess.replace(/'/g, "''")}' 
      AND significance = 'VERBATIM_TEXT'
    ORDER BY chunk_index
    LIMIT 30
  `);

  if (result.rows.length === 0) {
    console.log('  ❌ No chunks found for this work\n');
    process.exit(1);
  }

  console.log(`  📄 Processing ${result.rows.length} chunks\n`);

  const chunks = result.rows.map((r: any) => r.content);
  const fullText = chunks.join('\n\n');

  console.log(`  🔍 Extracting positions...`);
  const positions = await extractPositions(fullText, workToProcess, 1);

  console.log(`  ✅ Extracted ${positions.length} positions\n`);

  // Save to incremental file
  const filename = `server/jung-positions-${workToProcess.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.json`;
  fs.writeFileSync(filename, JSON.stringify(positions, null, 2));
  console.log(`  💾 Saved to: ${filename}\n`);

  console.log('='.repeat(80) + '\n');
}

main().catch(console.error);

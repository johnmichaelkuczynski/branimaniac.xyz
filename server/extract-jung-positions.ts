import { db } from "./db";
import { paperChunks } from "@shared/schema";
import Anthropic from "@anthropic-ai/sdk";

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

const JUNG_DOMAINS = [
  "Analytical Psychology",
  "Theory of the Unconscious",
  "Psychological Types",
  "Dream Analysis",
  "Individuation Process",
  "Archetypes and Symbols",
  "Synchronicity",
  "Religion and Spirituality",
  "Alchemy and Mythology",
  "Complex Theory"
];

const EXTRACTION_PROMPT = `You are analyzing Carl Jung's philosophical and psychological works to extract structured positions.

Extract as many distinct theoretical positions as you can find in the text. For each position, provide:

1. positionId: Format "JUNG-[DOMAIN_ABBREV]-###" (e.g., "JUNG-AP-001" for Analytical Psychology)
2. domain: One of these domains:
   - Analytical Psychology
   - Theory of the Unconscious
   - Psychological Types
   - Dream Analysis
   - Individuation Process
   - Archetypes and Symbols
   - Synchronicity
   - Religion and Spirituality
   - Alchemy and Mythology
   - Complex Theory
3. thesis: Clear statement of Jung's theoretical position
4. keyArguments: Array of 3-5 supporting arguments Jung makes
5. sourceWork: Title of the work this appears in
6. sourceLocation: Specific section/chapter if identifiable
7. significance: Why this position matters theoretically
8. relatedConcepts: Array of 2-4 related Jungian concepts

Focus on:
- Distinctive theoretical claims about the psyche
- Methodological positions on analysis
- Concepts about archetypes and collective unconscious
- Claims about psychological types and functions
- Theories of dreams and symbols
- Views on individuation and self-realization
- Synchronicity and meaningful coincidence
- Religious and spiritual dimensions of psyche
- Alchemical symbolism and transformation

Return ONLY valid JSON array of positions. Extract ALL significant positions you find.`;

async function extractPositionsFromText(
  text: string,
  sourceWork: string,
  startPosition: number
): Promise<JungPosition[]> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      temperature: 0.3,
      messages: [{
        role: "user",
        content: `${EXTRACTION_PROMPT}\n\nSOURCE WORK: ${sourceWork}\n\nTEXT TO ANALYZE:\n\n${text}`
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') return [];

    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log(`  ⚠️  No JSON found in response`);
      return [];
    }

    const positions = JSON.parse(jsonMatch[0]) as JungPosition[];
    
    // Renumber positions sequentially
    return positions.map((p, idx) => ({
      ...p,
      positionId: p.positionId.replace(/\d+$/, String(startPosition + idx).padStart(3, '0'))
    }));

  } catch (error) {
    console.error(`  ✗ Extraction failed:`, error);
    return [];
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('  JUNG POSITION EXTRACTION - COMPREHENSIVE DATABASE BUILD');
  console.log('='.repeat(80) + '\n');

  // Get all Jung verbatim chunks grouped by work
  const result = await db.execute(`
    SELECT paper_title, array_agg(content ORDER BY chunk_index) as chunks
    FROM paper_chunks 
    WHERE author = 'Carl Jung' AND significance = 'VERBATIM_TEXT'
    GROUP BY paper_title
    ORDER BY paper_title
  `);

  const works = result.rows as { paper_title: string; chunks: string[] }[];
  console.log(`  📚 Found ${works.length} Jung works to process\n`);

  let allPositions: JungPosition[] = [];
  let globalPositionCounter = 1;

  for (const work of works) {
    console.log(`\n  📖 Processing: ${work.paper_title}`);
    console.log(`     Chunks available: ${work.chunks.length}`);

    // Process in batches of 10 chunks (20K chars) for comprehensive extraction
    const BATCH_SIZE = 10;
    let workPositions: JungPosition[] = [];

    for (let i = 0; i < work.chunks.length; i += BATCH_SIZE) {
      const batchChunks = work.chunks.slice(i, i + BATCH_SIZE);
      const batchText = batchChunks.join('\n\n');
      
      console.log(`     Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(work.chunks.length / BATCH_SIZE)}: Extracting positions...`);

      const positions = await extractPositionsFromText(
        batchText,
        work.paper_title,
        globalPositionCounter
      );

      if (positions.length > 0) {
        workPositions.push(...positions);
        globalPositionCounter += positions.length;
        console.log(`     ✅ Extracted ${positions.length} positions (total: ${globalPositionCounter - 1})`);
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 1000));
    }

    allPositions.push(...workPositions);
    console.log(`  ✅ ${work.paper_title}: ${workPositions.length} positions extracted`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`  📊 EXTRACTION SUMMARY`);
  console.log('='.repeat(80));
  console.log(`  Total positions extracted: ${allPositions.length}`);
  
  // Domain breakdown
  const domainCounts: Record<string, number> = {};
  allPositions.forEach(p => {
    domainCounts[p.domain] = (domainCounts[p.domain] || 0) + 1;
  });
  
  console.log(`\n  📋 By Domain:`);
  Object.entries(domainCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([domain, count]) => {
      console.log(`     ${domain}: ${count}`);
    });

  // Save positions to file
  const outputPath = 'server/jung-positions-extracted.json';
  const fs = await import('fs');
  fs.writeFileSync(outputPath, JSON.stringify(allPositions, null, 2));
  console.log(`\n  💾 Positions saved to: ${outputPath}`);

  console.log('\n' + '='.repeat(80));
  console.log('  🎉 JUNG POSITION EXTRACTION COMPLETE!');
  console.log('='.repeat(80) + '\n');
}

main().catch(console.error);

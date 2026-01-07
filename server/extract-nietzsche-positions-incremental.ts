import Anthropic from '@anthropic-ai/sdk';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * FRIEDRICH NIETZSCHE - STRUCTURED POSITIONS EXTRACTION
 * 
 * Extracts structured philosophical positions from Nietzsche's complete works
 * Uses Claude Sonnet 4 for high-quality extraction
 * 
 * Domains: Ethics, Aesthetics, Psychology, Cultural Criticism, Epistemology, 
 *          Metaphysics, Philosophy of Values, Philosophy of Religion
 */

const NIETZSCHE_FILES = [
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part1_1763700996553.txt',
    title: 'Birth of Tragedy & Early Works',
    batchSize: 15000
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part2_1763700996553.txt',
    title: 'Philosophical Foundations',
    batchSize: 15000
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part3_1763700996554.txt',
    title: 'Ethics & Truth',
    batchSize: 15000
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part4_1763700996549.txt',
    title: 'Religion & Culture',
    batchSize: 15000
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part5_1763700996551.txt',
    title: 'Middle Period Works',
    batchSize: 15000
  },
  {
    path: 'attached_assets/1 NIETZSCHE COMPLETE WORKS_Part6_1763700996552.txt',
    title: 'Late Works & Fragments',
    batchSize: 15000
  }
];

const OUTPUT_DIR = 'server/nietzsche-positions';

const EXTRACTION_PROMPT = `You are extracting Friedrich Nietzsche's philosophical positions from his works.

For each distinct philosophical position, extract:
1. **title**: Clear, specific title (e.g., "Master-Slave Morality Distinction", "Eternal Recurrence as Life Test")
2. **thesis**: The core claim in 1-2 sentences
3. **key_arguments**: 3-5 main supporting arguments or explanations
4. **source_citation**: Specific work/section reference
5. **domain**: Primary area (Ethics, Aesthetics, Psychology, Cultural Criticism, Epistemology, Metaphysics, etc.)
6. **theoretical_significance**: Why this position matters in Nietzsche's thought

Focus on:
- Master-slave morality, will to power, eternal recurrence, perspectivism
- Critiques of Christianity, morality, metaphysics, truth
- Aesthetic theory (Apollonian/Dionysian, tragedy)
- Psychology of ressentiment, nihilism, decadence
- Übermensch, self-overcoming, amor fati
- Cultural criticism and revaluation of values

Return as JSON array of positions. Extract 15-25 positions per batch.`;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function extractPositionsFromBatch(text: string, workTitle: string): Promise<any[]> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    temperature: 0.3,
    messages: [{
      role: 'user',
      content: `${EXTRACTION_PROMPT}\n\nWork: ${workTitle}\n\nText:\n${text}`
    }]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  const jsonMatch = content.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.warn('No JSON array found in response');
    return [];
  }

  return JSON.parse(jsonMatch[0]);
}

async function processFile(filePath: string, workTitle: string, batchSize: number) {
  console.log(`\n📖 Processing: ${workTitle}`);
  
  const content = await readFile(filePath, 'utf-8');
  const words = content.split(/\s+/);
  
  console.log(`   📊 Total words: ${words.length.toLocaleString()}`);
  
  const numBatches = Math.ceil(words.length / batchSize);
  console.log(`   🔄 Processing in ${numBatches} batches of ~${batchSize} words`);
  
  let allPositions: any[] = [];
  
  for (let i = 0; i < numBatches; i++) {
    const batchWords = words.slice(i * batchSize, (i + 1) * batchSize);
    const batchText = batchWords.join(' ');
    
    console.log(`   ⚙️  Batch ${i + 1}/${numBatches} (${batchWords.length.toLocaleString()} words)...`);
    
    try {
      const positions = await extractPositionsFromBatch(batchText, workTitle);
      allPositions = allPositions.concat(positions);
      console.log(`   ✅ Extracted ${positions.length} positions (total: ${allPositions.length})`);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`   ❌ Error in batch ${i + 1}:`, error);
    }
  }
  
  return allPositions;
}

async function main() {
  console.log('⚡ NIETZSCHE - STRUCTURED POSITIONS EXTRACTION');
  console.log('='.repeat(80));
  
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }
  
  for (const file of NIETZSCHE_FILES) {
    const positions = await processFile(file.path, file.title, file.batchSize);
    
    const sanitizedTitle = file.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const outputPath = `${OUTPUT_DIR}/${sanitizedTitle}_positions.json`;
    
    await writeFile(outputPath, JSON.stringify(positions, null, 2));
    console.log(`   💾 Saved ${positions.length} positions to ${outputPath}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 NIETZSCHE POSITION EXTRACTION COMPLETE');
  console.log('💡 Next step: Run merge-nietzsche-positions.ts to add to database');
  console.log('='.repeat(80));
}

main();

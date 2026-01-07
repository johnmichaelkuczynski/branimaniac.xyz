import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * GALILEO POSITION EXTRACTION - INCREMENTAL PROCESSING
 * 
 * Extracts structured philosophical/scientific positions from Galileo's works
 * Processes in batches to avoid timeouts and token limits
 * 
 * Domains: Astronomy, Physics, Mathematics, Scientific Method, Philosophy of Science
 */

const GALILEO_FILES = [
  {
    path: 'attached_assets/Delphi Collected Works of Galileo Galilei (Illustrated) (Delphi Series Seven Book 26)_Part1_1763693476535.txt',
    title: 'The Starry Messenger and Biographical Works',
    batchSize: 15000
  },
  {
    path: 'attached_assets/Delphi Collected Works of Galileo Galilei (Illustrated) (Delphi Series Seven Book 26)_Part2_1763693476539.txt',
    title: 'Discourse on Floating Bodies',
    batchSize: 15000
  },
  {
    path: 'attached_assets/Delphi Collected Works of Galileo Galilei (Illustrated) (Delphi Series Seven Book 26)_Part3_1763693476539.txt',
    title: 'Dialogues on Solar Spots and Philosophy',
    batchSize: 15000
  },
  {
    path: 'attached_assets/Delphi Collected Works of Galileo Galilei (Illustrated) (Delphi Series Seven Book 26)_Part4_1763693476540.txt',
    title: 'Dialogues on Motion and Mechanics',
    batchSize: 15000
  },
  {
    path: 'attached_assets/Delphi Collected Works of Galileo Galilei (Illustrated) (Delphi Series Seven Book 26)_Part5_1763693476532.txt',
    title: 'Astronomical Calculations and New Stars',
    batchSize: 15000
  },
  {
    path: 'attached_assets/Delphi Collected Works of Galileo Galilei (Illustrated) (Delphi Series Seven Book 26)_Part6_1763694160417.txt',
    title: 'Dialogues on Tides and Earth Motion',
    batchSize: 15000
  },
  {
    path: 'attached_assets/Delphi Collected Works of Galileo Galilei (Illustrated) (Delphi Series Seven Book 26)_Part7_1763694160419.txt',
    title: 'Mathematical Demonstrations - Pendulums and Vibrations',
    batchSize: 15000
  },
  {
    path: 'attached_assets/Delphi Collected Works of Galileo Galilei (Illustrated) (Delphi Series Seven Book 26)_Part8_1763694160420.txt',
    title: 'Mathematical Demonstrations - Projectile Motion',
    batchSize: 15000
  },
  {
    path: 'attached_assets/Delphi Collected Works of Galileo Galilei (Illustrated) (Delphi Series Seven Book 26)_Part9_1763694160420.txt',
    title: 'Biographical Encyclopedia Entry',
    batchSize: 10000
  }
];

const OUTPUT_DIR = 'server/galileo-positions';

const EXTRACTION_PROMPT = `You are extracting Galileo Galilei's scientific and philosophical positions from his works.

CRITICAL INSTRUCTIONS:
1. Extract ACTUAL positions Galileo took in his writings
2. Focus on SUBSTANTIVE scientific/philosophical claims, not trivial observations
3. Each position should be a distinct theoretical or empirical claim
4. Include the source work title for each position

DOMAINS TO COVER:
- Astronomy (heliocentric system, lunar mountains, Jupiter's moons, sunspots)
- Physics (motion, mechanics, falling bodies, projectiles)
- Mathematics (geometric proofs, calculations, proportions)
- Scientific Method (observation, experimentation, measurement)
- Philosophy of Science (nature of scientific knowledge, role of mathematics)
- Critique of Aristotelianism (scholastic physics, authority vs. observation)

OUTPUT FORMAT (JSON array):
[
  {
    "title": "Brief title of position (5-10 words)",
    "thesis": "Clear statement of Galileo's position (1-2 sentences)",
    "arguments": ["Key argument 1", "Key argument 2", "Key argument 3"],
    "source": "Exact work title where this appears",
    "domain": "Primary domain (Astronomy/Physics/Mathematics/Scientific Method/Philosophy of Science)",
    "significance": "Why this position mattered scientifically/philosophically"
  }
]

QUALITY STANDARDS:
- Each position must be SUBSTANTIVE (not "Galileo observed the moon")
- Theses must be SPECIFIC (not "Galileo supported heliocentrism" but "Earth orbits Sun annually while rotating daily")
- Arguments must show Galileo's REASONING (observations, experiments, mathematical proofs)
- Extract 20-40 positions per batch

Read the following text and extract Galileo's positions:`;

async function extractPositionsFromBatch(text: string, workTitle: string): Promise<any[]> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: `${EXTRACTION_PROMPT}\n\nWORK: ${workTitle}\n\nTEXT:\n${text}`
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('   ⚠️  No JSON array found in response');
      return [];
    }

    const positions = JSON.parse(jsonMatch[0]);
    return Array.isArray(positions) ? positions : [];

  } catch (error) {
    console.error('   ❌ Extraction error:', error);
    return [];
  }
}

function splitIntoBatches(text: string, batchSize: number): string[] {
  const words = text.split(/\s+/);
  const batches: string[] = [];
  
  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize).join(' ');
    if (batch.trim().length > 1000) {
      batches.push(batch);
    }
  }
  
  return batches;
}

async function extractGalileoPositions() {
  console.log('🔭 GALILEO POSITION EXTRACTION - INCREMENTAL PROCESSING');
  console.log('='.repeat(80));
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  let totalPositions = 0;
  
  for (const file of GALILEO_FILES) {
    console.log(`\n📖 Processing: ${file.title}`);
    
    try {
      const fullPath = path.resolve(file.path);
      
      if (!fs.existsSync(fullPath)) {
        console.log(`   ⚠️  File not found: ${fullPath}`);
        continue;
      }
      
      const content = fs.readFileSync(fullPath, 'utf-8');
      const batches = splitIntoBatches(content, file.batchSize);
      
      console.log(`   📊 Split into ${batches.length} batches`);
      
      const allPositions: any[] = [];
      
      for (let i = 0; i < batches.length; i++) {
        console.log(`   🔄 Processing batch ${i + 1}/${batches.length}...`);
        
        const positions = await extractPositionsFromBatch(batches[i], file.title);
        allPositions.push(...positions);
        
        console.log(`   ✅ Extracted ${positions.length} positions from batch ${i + 1}`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const outputFile = path.join(OUTPUT_DIR, `${file.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
      fs.writeFileSync(outputFile, JSON.stringify(allPositions, null, 2));
      
      totalPositions += allPositions.length;
      console.log(`   💾 Saved ${allPositions.length} positions to ${path.basename(outputFile)}`);
      
    } catch (error) {
      console.error(`   ❌ Error processing ${file.title}:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 EXTRACTION COMPLETE');
  console.log(`   Total Positions: ${totalPositions}`);
  console.log(`   Output Directory: ${OUTPUT_DIR}`);
  console.log('='.repeat(80));
}

export { extractGalileoPositions };

// Execute immediately
extractGalileoPositions()
  .then(() => {
    console.log('✅ Position extraction completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Position extraction failed:', error);
    process.exit(1);
  });

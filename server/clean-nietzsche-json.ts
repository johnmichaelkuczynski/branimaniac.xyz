import fs from 'fs';

const inputFile = 'attached_assets/Pasted--total-2438-positions-id-1-text-Only-that-which-has-no-history-can-be-def-1763754208314_1763754208316.txt';
const outputFile = 'attached_assets/nietzsche-positions-cleaned.json';

console.log('\n🔧 CLEANING NIETZSCHE PROTODATABASE\n');
console.log('='.repeat(60));

const content = fs.readFileSync(inputFile, 'utf-8');

// Remove comment lines
const lines = content.split('\n');
const cleanLines = lines.filter(line => {
  const trimmed = line.trim();
  return trimmed && !trimmed.startsWith('//');
});

console.log(`Original lines: ${lines.length}`);
console.log(`After removing comments: ${cleanLines.length}`);

// Join and extract all position objects
const cleanedContent = cleanLines.join('\n');

// Extract individual position entries
const positionPattern = /\{"id":(\d+|":41"),"text":"([^"]|\\")*?","work":"([^"]|\\")*?","section":"([^"]|\\")*?","year":\d+,"tags":\[[^\]]*\]\}/g;
const positions: any[] = [];
const seenIds = new Set<number>();

let match;
while ((match = positionPattern.exec(cleanedContent)) !== null) {
  try {
    // Fix malformed IDs like ":41
    let positionStr = match[0];
    positionStr = positionStr.replace(/"id":":(\d+)/, '"id":$1');
    positionStr = positionStr.replace(/"_transformation":/g, '"year":');
    
    const position = JSON.parse(positionStr);
    
    // Only add unique IDs
    if (!seenIds.has(position.id)) {
      positions.push(position);
      seenIds.add(position.id);
    }
  } catch (e) {
    // Skip malformed entries
  }
}

console.log(`\n✅ Extracted ${positions.length} unique positions`);

// Sort by ID
positions.sort((a, b) => a.id - b.id);

console.log(`📊 ID range: ${positions[0]?.id} to ${positions[positions.length - 1]?.id}`);

// Count by work
const workCounts: Record<string, number> = {};
positions.forEach(p => {
  workCounts[p.work] = (workCounts[p.work] || 0) + 1;
});

console.log(`\n📚 Positions by work:`);
Object.entries(workCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([work, count]) => {
    console.log(`   ${work}: ${count}`);
  });

// Save cleaned JSON
const output = {
  total: positions.length,
  positions: positions
};

fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

console.log(`\n💾 Saved to: ${outputFile}`);
console.log('='.repeat(60) + '\n');

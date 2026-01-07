import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Position {
  positionId: string;
  domain: string;
  paperTitle: string;
  content: string;
  author: string;
  figureId: string;
  sourceWork: string;
  chunkIndex: number;
}

function parseV29Database(fileContent: string): Position[] {
  const positions: Position[] = [];
  const lines = fileContent.split('\n');
  
  let currentWork = '';
  let currentDomain = '';
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Match work headers like "WORK-001: ANALYTIC PHILOSOPHY COMPLETE - 50 POSITIONS"
    const workMatch = line.match(/^WORK-(\d+[A-Z]?):\s*(.+?)\s*-\s*\d+\s*POSITIONS?$/i);
    if (workMatch) {
      currentWork = workMatch[2].trim();
      i++;
      continue;
    }
    
    // Match domain headers like "**EPISTEMOLOGY (15 positions): EP-001 to EP-026**"
    const domainMatch = line.match(/^\*\*([A-Z\s]+)\s*\(\d+\s*positions?\):/i);
    if (domainMatch) {
      currentDomain = domainMatch[1].trim();
      i++;
      continue;
    }
    
    // Match position entries like "**Position EP-001: Rationalist Foundationalism**"
    const posMatch = line.match(/^\*\*Position\s+([A-Z]+-\d+):\s*(.+?)\*\*$/);
    if (posMatch) {
      const positionId = posMatch[1];
      const title = posMatch[2].trim();
      
      // Next line should start with "- " and contain the content
      i++;
      let content = '';
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        const contentLine = lines[i].trim().substring(2); // Remove "- " prefix
        content += (content ? ' ' : '') + contentLine;
        i++;
      }
      
      if (content) {
        positions.push({
          positionId,
          domain: currentDomain,
          paperTitle: title,
          content,
          author: 'J.-M. Kuczynski',
          figureId: 'common',
          sourceWork: currentWork || 'Unknown',
          chunkIndex: 0
        });
      }
      continue;
    }
    
    i++;
  }
  
  return positions;
}

// Main execution
const inputPath = join(__dirname, '..', 'attached_assets', 'KUCZYNSKI_DATABASE_v29_COMPLETE_EXTRACTION_1763348511140.md');
const outputPath = join(__dirname, '..', 'attached_assets', 'KUCZYNSKI_DATABASE_v29.json');

try {
  console.log('📖 Reading v29 database...');
  const fileContent = readFileSync(inputPath, 'utf-8');
  
  console.log('🔍 Parsing positions...');
  const positions = parseV29Database(fileContent);
  
  console.log(`✅ Extracted ${positions.length} positions`);
  
  // Group by domain for summary
  const byDomain = positions.reduce((acc, p) => {
    acc[p.domain] = (acc[p.domain] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\nPositions by domain:');
  Object.entries(byDomain)
    .sort((a, b) => b[1] - a[1])
    .forEach(([domain, count]) => {
      console.log(`  ${domain}: ${count}`);
    });
  
  // Write to JSON
  writeFileSync(outputPath, JSON.stringify(positions, null, 2));
  console.log(`\n💾 Saved to ${outputPath}`);
  
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

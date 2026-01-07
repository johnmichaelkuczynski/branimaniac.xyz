import fs from 'fs';
import path from 'path';

interface CollegePaperPosition {
  position_id: string;
  domain: string;
  paper_title: string;
  content: string;
  author: string;
  source_work: string;
}

function parseCollegePapers(filePath: string): CollegePaperPosition[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const positions: CollegePaperPosition[] = [];
  let currentDomain = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Extract domain
    if (line.includes('DOMAIN:')) {
      const domainMatch = line.match(/DOMAIN:\s*(.+?)(?:\s*\(continued\))?$/);
      if (domainMatch) {
        currentDomain = domainMatch[1].trim();
      }
      continue;
    }
    
    // Also track section headers that might indicate domains
    if (line.startsWith('===') && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (nextLine.includes('DOMAIN:')) {
        const domainMatch = nextLine.match(/DOMAIN:\s*(.+?)(?:\s*\(continued\))?$/);
        if (domainMatch) {
          currentDomain = domainMatch[1].trim();
        }
      }
    }
    
    // Format 1: **Position CODE-CPXXX: Title**
    if (line.startsWith('**Position ')) {
      const positionMatch = line.match(/\*\*Position ([A-Z\-]+-CP\d+): (.+?)\*\*/);
      if (positionMatch) {
        const positionId = positionMatch[1];
        const paperTitle = positionMatch[2];
        
        // Get content from next line (starts with "- ")
        let content = '';
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine.startsWith('- ')) {
            content = nextLine.substring(2); // Remove "- " prefix
          }
        }
        
        positions.push({
          position_id: positionId,
          domain: currentDomain || 'GENERAL',
          paper_title: paperTitle,
          content: content,
          author: 'J.-M. Kuczynski',
          source_work: 'WORK-041: College Papers Plus (2019)'
        });
      }
    }
    
    // Format 2: NUMBER. [CODE-XXX] Title
    // Example: 1. [ACT-007] Psychopathy as Incapacity for Non-Pragmatic Agency
    // More flexible regex: starts with number, period, space, then bracket
    if (/^\d+\.\s+\[/.test(line)) {
      const numberedMatch = line.match(/^\d+\.\s+\[([A-Z\-]+\d*)\]\s+(.+)/);
      if (numberedMatch) {
        const positionId = numberedMatch[1];
        const paperTitle = numberedMatch[2];
        
        // Look ahead for "Thesis:" line (within next 5 lines)
        let content = '';
        for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
          const lookAheadLine = lines[j].trim();
          if (lookAheadLine.startsWith('Thesis:')) {
            content = lookAheadLine.substring(7).trim(); // Remove "Thesis: " prefix
            break;
          }
        }
        
        // If no content found, skip this position
        if (!content) {
          continue;
        }
        
        positions.push({
          position_id: positionId,
          domain: currentDomain || 'GENERAL',
          paper_title: paperTitle,
          content: content,
          author: 'J.-M. Kuczynski',
          source_work: 'WORK-041: College Papers Plus (2019)'
        });
      }
    }
  }
  
  return positions;
}

// Main execution
const inputFile = path.join(process.cwd(), 'attached_assets', '900 PLUS POSITIONS_1763351104150.txt');
const outputFile = path.join(process.cwd(), 'server', 'college-papers-positions.json');

console.log('🔍 Parsing College Papers Plus extraction...');
const positions = parseCollegePapers(inputFile);

console.log(`✅ Extracted ${positions.length} positions`);

// Count by domain
const domainCounts = positions.reduce((acc, pos) => {
  acc[pos.domain] = (acc[pos.domain] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('\n📊 Positions by domain:');
Object.entries(domainCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([domain, count]) => {
    console.log(`   ${domain}: ${count}`);
  });

// Show sample positions
console.log('\n📄 Sample extracted positions:');
positions.slice(0, 3).forEach(pos => {
  console.log(`   [${pos.position_id}] ${pos.paper_title.substring(0, 50)}...`);
});
positions.slice(220, 223).forEach(pos => {
  console.log(`   [${pos.position_id}] ${pos.paper_title.substring(0, 50)}...`);
});

// Write to JSON file
fs.writeFileSync(outputFile, JSON.stringify(positions, null, 2));
console.log(`\n💾 Saved to: ${outputFile}`);

export { parseCollegePapers };

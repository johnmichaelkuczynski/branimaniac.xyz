import fs from 'fs';
import path from 'path';

interface FreudPosition {
  position_id: string;
  domain: string;
  position: string;
  content: string;
  source_work: string;
  author: string;
}

async function parseFreudDatabase() {
  console.log("=== Freud Database Text-to-JSON Converter ===\n");
  
  const inputPath = path.join(process.cwd(), "attached_assets", 
    "Pasted--FREUD-DATABASE-EXTRACT-BEYOND-THE-PLEASURE-PRINCIPLE-1922-WORK-METADATA-Author-Sigmu-1763347231967_1763347231968.txt");
  
  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.split('\n');
  
  const positions: FreudPosition[] = [];
  let currentWork = "";
  let currentDomain = "";
  let positionCounter = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect work title
    if (line.startsWith('# FREUD DATABASE EXTRACT:')) {
      const match = line.match(/EXTRACT:\s*(.+)/);
      if (match) {
        currentWork = match[1].trim();
      }
    }
    
    // Detect domain sections
    if (line.startsWith('###')) {
      currentDomain = line.replace(/^###\s*/, '').trim();
    }
    
    // Detect positions
    if (line.startsWith('**Position ')) {
      const positionMatch = line.match(/\*\*Position (\d+):\s*(.+)\*\*/);
      if (positionMatch) {
        const positionNumber = positionMatch[1];
        const positionTitle = positionMatch[2];
        
        // Collect content lines (bullet points after the position title)
        const contentLines: string[] = [];
        let j = i + 1;
        while (j < lines.length && lines[j].trim().startsWith('-')) {
          contentLines.push(lines[j].trim().substring(2)); // Remove "- "
          j++;
        }
        
        if (contentLines.length > 0 && currentWork) {
          positions.push({
            position_id: `FREUD-${String(positionCounter).padStart(4, '0')}`,
            domain: currentDomain || "General",
            position: positionTitle,
            content: contentLines.join(' '),
            source_work: currentWork,
            author: "Freud"
          });
          positionCounter++;
        }
      }
    }
    
    // Also detect positions in alternative format (e.g., "TOTM-001: ...")
    if (line.match(/^-\s+[A-Z]+-\d+:/)) {
      const altMatch = line.match(/^-\s+([A-Z]+-\d+):\s*(.+)/);
      if (altMatch) {
        const posId = altMatch[1];
        const posContent = altMatch[2];
        
        if (currentWork) {
          positions.push({
            position_id: `FREUD-${String(positionCounter).padStart(4, '0')}`,
            domain: currentDomain || "General",
            position: posContent,
            content: posContent,
            source_work: currentWork,
            author: "Freud"
          });
          positionCounter++;
        }
      }
    }
  }
  
  console.log(`✅ Parsed ${positions.length} positions from Freud database`);
  
  // Write to JSON file
  const outputPath = path.join(process.cwd(), "attached_assets", "FREUD_DATABASE_v1_COMPLETE.json");
  const jsonData = {
    version: "v1_COMPLETE",
    author: "Sigmund Freud",
    total_positions: positions.length,
    positions: positions
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
  console.log(`✅ Wrote JSON database to: ${outputPath}`);
  console.log(`\nSample positions:`);
  positions.slice(0, 3).forEach(p => {
    console.log(`  - ${p.position_id}: ${p.position.substring(0, 60)}...`);
  });
}

parseFreudDatabase().catch(console.error);

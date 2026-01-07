import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface BlogPosition {
  positionId: string;
  domain: string;
  paperTitle: string;
  content: string;
  author: string;
  figureId: string;
  sourceWork: string;
  chunkIndex: number;
}

function parseBlogEssays(fileContent: string): BlogPosition[] {
  const positions: BlogPosition[] = [];
  const lines = fileContent.split('\n');
  
  let blogCounter = 1;
  let i = 0;
  
  while (i < lines.length) {
    // Look for essay marker: title line followed by "John-Michael Kuczynski"
    if (i + 1 < lines.length && lines[i + 1].trim() === 'John-Michael Kuczynski') {
      const title = lines[i].trim();
      i += 2; // Skip title and author
      
      // Skip date line (e.g., "Jul 9", "May 23")
      if (i < lines.length && lines[i].trim().match(/^[A-Z][a-z]{2}\s+\d+/)) {
        i++;
      }
      
      // Skip "X min read" line
      if (i < lines.length && lines[i].trim().match(/^\d+\s+min\s+read$/i)) {
        i++;
      }
      
      // Collect content until next essay starts
      let content = '';
      while (i < lines.length) {
        const line = lines[i].trim();
        
        // Check if next essay starts
        if (i + 1 < lines.length && lines[i + 1].trim() === 'John-Michael Kuczynski') {
          break;
        }
        
        // Skip meta lines
        if (line && !line.match(/^Post not marked as liked/i) && !line.match(/^Share$/i)) {
          content += (content ? ' ' : '') + line;
        }
        i++;
      }
      
      if (content.length > 100 && title.length > 0) {
        positions.push({
          positionId: `BLOG-${String(blogCounter).padStart(3, '0')}`,
          domain: 'BLOG ESSAYS',
          paperTitle: title,
          content: content.substring(0, 8000), // Truncate very long essays
          author: 'J.-M. Kuczynski',
          figureId: 'common',
          sourceWork: 'Blog Essays Collection',
          chunkIndex: 0
        });
        blogCounter++;
      }
    } else {
      i++;
    }
  }
  
  return positions;
}

// Main execution
const inputPath = join(__dirname, '..', 'attached_assets', 'PHIL SCI BLOG_1763348557342.txt');
const outputPath = join(__dirname, '..', 'attached_assets', 'BLOG_ESSAYS.json');

try {
  console.log('📖 Reading blog essays...');
  const fileContent = readFileSync(inputPath, 'utf-8');
  
  console.log('🔍 Parsing essays...');
  const positions = parseBlogEssays(fileContent);
  
  console.log(`✅ Extracted ${positions.length} blog essays`);
  
  // Write to JSON
  writeFileSync(outputPath, JSON.stringify(positions, null, 2));
  console.log(`💾 Saved to ${outputPath}`);
  
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

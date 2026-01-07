import { db } from '../db';
import { textChunks } from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';

async function embedPoincare() {
  const content = fs.readFileSync(path.join(process.cwd(), 'attached_assets/Pasted--Poincar-discovered-that-deterministic-systems-can-exhi_1765866541650.txt'), 'utf-8');
  
  const lines = content.split('\n').filter(line => line.trim().startsWith('-'));
  
  console.log(`Found ${lines.length} Poincaré positions`);
  
  let inserted = 0;
  for (const line of lines) {
    const position = line.replace(/^-\s*/, '').trim();
    if (position.length > 20) {
      await db.insert(textChunks).values({
        thinker: 'Henri Poincaré',
        chunkText: position,
        sourceFile: 'Poincaré Positions',
        chunkIndex: inserted
      });
      inserted++;
    }
  }
  
  console.log(`Inserted ${inserted} positions for Henri Poincaré`);
}

embedPoincare().catch(console.error);

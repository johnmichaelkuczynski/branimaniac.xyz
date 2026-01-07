import { ingestPlatoPositions } from './plato-db';
import path from 'path';

async function main() {
  console.log('⚡ PLATO POSITIONS → SQLite DATABASE INGESTION\n');
  console.log('=' .repeat(70) + '\n');
  
  const jsonPath = path.join(process.cwd(), 'attached_assets', 'plato-positions-cleaned.json');
  
  try {
    const count = ingestPlatoPositions(jsonPath);
    
    console.log('🎉 INGESTION COMPLETE!\n');
    console.log(`✅ Successfully loaded ${count} Plato positions into SQLite database`);
    console.log(`📁 Database location: plato-positions.db\n`);
    
  } catch (error) {
    console.error('❌ INGESTION FAILED:', error);
    process.exit(1);
  }
}

main();

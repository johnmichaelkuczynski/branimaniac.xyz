import fs from 'fs';
import Database from 'better-sqlite3';

const DB_PATH = 'nietzsche-positions.db';
const inputFile = 'attached_assets/nietzsche-positions-cleaned.json';

console.log('\n📥 INGESTING NIETZSCHE POSITIONS INTO SQLITE\n');
console.log('='.repeat(60));

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS nietzsche_positions (
    id INTEGER PRIMARY KEY,
    text TEXT NOT NULL,
    work TEXT NOT NULL,
    section TEXT NOT NULL,
    year INTEGER NOT NULL,
    tags TEXT NOT NULL
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_work ON nietzsche_positions(work);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_year ON nietzsche_positions(year);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_text ON nietzsche_positions(text);`);

console.log('✅ Database initialized');

const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
console.log(`Total positions to ingest: ${data.total}`);

const stmt = db.prepare(`
  INSERT OR REPLACE INTO nietzsche_positions (id, text, work, section, year, tags)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((positions: any[]) => {
  for (const position of positions) {
    stmt.run(
      position.id,
      position.text,
      position.work,
      position.section,
      position.year,
      JSON.stringify(position.tags)
    );
  }
});

insertMany(data.positions);

const count = db.prepare('SELECT COUNT(*) as count FROM nietzsche_positions').get() as { count: number };
const workCount = db.prepare('SELECT COUNT(DISTINCT work) as count FROM nietzsche_positions').get() as { count: number };
const yearCount = db.prepare('SELECT COUNT(DISTINCT year) as count FROM nietzsche_positions').get() as { count: number };

console.log(`\n✅ Ingestion complete:`);
console.log(`   Total positions in database: ${count.count}`);
console.log(`   Unique works: ${workCount.count}`);
console.log(`   Year range: ${yearCount.count} distinct years`);

db.close();

console.log('\n' + '='.repeat(60) + '\n');

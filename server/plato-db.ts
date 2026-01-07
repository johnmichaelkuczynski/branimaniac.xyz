import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';

export interface PlatoPosition {
  id: string;
  dialogue: string;
  location: string;
  speaker: string;
  claim: string;
  context: string;
  keywords: string;
}

const DB_PATH = path.join(process.cwd(), 'plato-positions.db');

export function initPlatoDatabase() {
  const db = new Database(DB_PATH);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS plato_positions (
      id TEXT PRIMARY KEY,
      dialogue TEXT NOT NULL,
      location TEXT NOT NULL,
      speaker TEXT NOT NULL,
      claim TEXT NOT NULL,
      context TEXT NOT NULL,
      keywords TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_dialogue ON plato_positions(dialogue);
    CREATE INDEX IF NOT EXISTS idx_speaker ON plato_positions(speaker);
    CREATE INDEX IF NOT EXISTS idx_keywords ON plato_positions(keywords);
  `);
  
  return db;
}

export function getPlatoDatabase() {
  return new Database(DB_PATH);
}

export function ingestPlatoPositions(jsonPath: string) {
  const db = initPlatoDatabase();
  
  console.log('📚 Loading Plato positions from JSON...\n');
  
  const jsonData = readFileSync(jsonPath, 'utf-8');
  const positions = JSON.parse(jsonData);
  
  console.log(`📦 Found ${positions.length} positions\n`);
  
  const insert = db.prepare(`
    INSERT OR REPLACE INTO plato_positions (id, dialogue, location, speaker, claim, context, keywords)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  let inserted = 0;
  const insertMany = db.transaction((positions: any[]) => {
    for (const pos of positions) {
      insert.run(
        pos.id,
        pos.dialogue,
        pos.location,
        pos.speaker,
        pos.claim,
        pos.context,
        JSON.stringify(pos.keywords)
      );
      inserted++;
    }
  });
  
  insertMany(positions);
  
  console.log(`✅ Inserted ${inserted} positions into SQLite database\n`);
  
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT dialogue) as dialogues,
      COUNT(DISTINCT speaker) as speakers
    FROM plato_positions
  `).get() as { total: number; dialogues: number; speakers: number };
  
  console.log('📊 DATABASE STATISTICS:');
  console.log(`   Total positions: ${stats.total}`);
  console.log(`   Dialogues: ${stats.dialogues}`);
  console.log(`   Speakers: ${stats.speakers}\n`);
  
  db.close();
  
  return inserted;
}

// Escape LIKE wildcards to prevent SQL injection
function escapeLikeWildcards(input: string): string {
  return input
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/%/g, '\\%')     // Escape %
    .replace(/_/g, '\\_');    // Escape _
}

export function searchPlatoPositions(query: {
  dialogue?: string;
  speaker?: string;
  keyword?: string;
  searchText?: string;
  limit?: number;
}): PlatoPosition[] {
  const db = getPlatoDatabase();
  
  let sql = 'SELECT * FROM plato_positions WHERE 1=1';
  const params: any[] = [];
  
  if (query.dialogue) {
    sql += ' AND dialogue = ?';
    params.push(query.dialogue);
  }
  
  if (query.speaker) {
    sql += ' AND speaker = ?';
    params.push(query.speaker);
  }
  
  if (query.keyword) {
    sql += " AND keywords LIKE ? ESCAPE '\\'";
    params.push(`%${escapeLikeWildcards(query.keyword)}%`);
  }
  
  if (query.searchText) {
    sql += " AND (claim LIKE ? ESCAPE '\\' OR context LIKE ? ESCAPE '\\')";
    const escaped = escapeLikeWildcards(query.searchText);
    params.push(`%${escaped}%`, `%${escaped}%`);
  }
  
  sql += ' ORDER BY id';
  
  // Enforce maximum limit of 100 rows
  const maxLimit = Math.min(query.limit || 50, 100);
  sql += ' LIMIT ?';
  params.push(maxLimit);
  
  const stmt = db.prepare(sql);
  const results = stmt.all(...params) as PlatoPosition[];
  
  db.close();
  
  return results.map(row => ({
    ...row,
    keywords: JSON.parse(row.keywords)
  })) as any;
}

export function getAllDialogues(): string[] {
  const db = getPlatoDatabase();
  const results = db.prepare('SELECT DISTINCT dialogue FROM plato_positions ORDER BY dialogue').all() as { dialogue: string }[];
  db.close();
  return results.map(r => r.dialogue);
}

export function getAllSpeakers(): string[] {
  const db = getPlatoDatabase();
  const results = db.prepare('SELECT DISTINCT speaker FROM plato_positions ORDER BY speaker').all() as { speaker: string }[];
  db.close();
  return results.map(r => r.speaker);
}

import Database from 'better-sqlite3';
import { existsSync } from 'fs';

export interface NietzschePosition {
  id: number;
  text: string;
  work: string;
  section: string;
  year: number;
  tags: string; // JSON string
}

const DB_PATH = 'nietzsche-positions.db';

export function getNietzscheDatabase(): Database.Database {
  return new Database(DB_PATH);
}

export function initializeNietzscheDatabase(): void {
  const db = getNietzscheDatabase();
  
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
  
  db.close();
  
  console.log('✅ Nietzsche database initialized');
}

export function insertNietzschePosition(position: {
  id: number;
  text: string;
  work: string;
  section: string;
  year: number;
  tags: string[];
}): number {
  const db = getNietzscheDatabase();
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO nietzsche_positions (id, text, work, section, year, tags)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    position.id,
    position.text,
    position.work,
    position.section,
    position.year,
    JSON.stringify(position.tags)
  );
  
  db.close();
  
  return result.changes;
}

function escapeLikeWildcards(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

export function searchNietzschePositions(query: {
  work?: string;
  year?: number;
  keyword?: string;
  searchText?: string;
  limit?: number;
}): NietzschePosition[] {
  const db = getNietzscheDatabase();
  
  let sql = 'SELECT * FROM nietzsche_positions WHERE 1=1';
  const params: any[] = [];
  
  if (query.work) {
    sql += ' AND work = ?';
    params.push(query.work);
  }
  
  if (query.year) {
    sql += ' AND year = ?';
    params.push(query.year);
  }
  
  if (query.keyword) {
    sql += " AND tags LIKE ? ESCAPE '\\'";
    params.push(`%${escapeLikeWildcards(query.keyword)}%`);
  }
  
  if (query.searchText) {
    sql += " AND (text LIKE ? ESCAPE '\\' OR section LIKE ? ESCAPE '\\')";
    const escaped = escapeLikeWildcards(query.searchText);
    params.push(`%${escaped}%`, `%${escaped}%`);
  }
  
  sql += ' ORDER BY id';
  
  const maxLimit = Math.min(query.limit || 50, 100);
  sql += ' LIMIT ?';
  params.push(maxLimit);
  
  const stmt = db.prepare(sql);
  const results = stmt.all(...params) as NietzschePosition[];
  
  db.close();
  
  return results.map(row => ({
    ...row,
    tags: JSON.parse(row.tags)
  })) as any;
}

export function getAllWorks(): string[] {
  const db = getNietzscheDatabase();
  const results = db.prepare('SELECT DISTINCT work FROM nietzsche_positions ORDER BY work').all() as { work: string }[];
  db.close();
  return results.map(r => r.work);
}

export function getAllYears(): number[] {
  const db = getNietzscheDatabase();
  const results = db.prepare('SELECT DISTINCT year FROM nietzsche_positions ORDER BY year').all() as { year: number }[];
  db.close();
  return results.map(r => r.year);
}

export function getDatabaseStats(): { totalPositions: number; works: number; years: number } {
  const db = getNietzscheDatabase();
  const count = db.prepare('SELECT COUNT(*) as count FROM nietzsche_positions').get() as { count: number };
  const workCount = db.prepare('SELECT COUNT(DISTINCT work) as count FROM nietzsche_positions').get() as { count: number };
  const yearCount = db.prepare('SELECT COUNT(DISTINCT year) as count FROM nietzsche_positions').get() as { count: number };
  db.close();
  
  return {
    totalPositions: count.count,
    works: workCount.count,
    years: yearCount.count
  };
}

import { db } from '../db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';

async function addEngelsQuotes() {
  const filePath = 'attached_assets/ENGELS_POSITIONS_AND_QUESTIONS_1766067164742.txt';
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const quotes: { quote: string; topic: string }[] = [];
  let currentTopic = 'Historical Materialism';
  
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('###') || trimmed.startsWith('## ')) {
      const topicMatch = trimmed.match(/^#+\s*(?:\d+\.\s*)?(.+)$/);
      if (topicMatch) {
        currentTopic = topicMatch[1].trim();
      }
      continue;
    }
    
    const match = trimmed.match(/^\d+\.\s+(.+)$/);
    if (match && match[1].length >= 20 && !match[1].startsWith('**Q:**')) {
      quotes.push({ quote: match[1], topic: currentTopic });
    }
  }

  console.log(`Found ${quotes.length} Engels quotes to insert`);
  
  let insertCount = 0;
  for (const q of quotes) {
    try {
      const escapedQuote = q.quote.replace(/'/g, "''");
      const escapedTopic = q.topic.replace(/'/g, "''");
      
      await db.execute(sql.raw(`
        INSERT INTO thinker_quotes (thinker_id, thinker_name, quote, topic) 
        VALUES ('engels', 'Friedrich Engels', '${escapedQuote}', '${escapedTopic}')
      `));
      insertCount++;
    } catch (e: any) {
      if (!e.message?.includes('duplicate')) {
        console.error(`Insert error: ${e.message?.slice(0, 60)}`);
      }
    }
  }
  
  console.log(`Inserted ${insertCount} Engels quotes`);
  
  const result = await db.execute(sql`SELECT COUNT(*) as count FROM thinker_quotes WHERE thinker_id = 'engels'`);
  console.log(`Total Engels quotes: ${result.rows[0]?.count}`);
  
  process.exit(0);
}

addEngelsQuotes().catch(e => {
  console.error(e);
  process.exit(1);
});

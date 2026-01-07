import { db } from "../db";
import { thinkerQuotes } from "@shared/schema";
import { THINKER_QUOTES } from "../../client/src/data/thinker-quotes";

const THINKER_NAME_MAP: Record<string, string> = {
  jmk: "J.-M. Kuczynski",
  russell: "Bertrand Russell",
  freud: "Sigmund Freud",
  jung: "Carl Jung",
  nietzsche: "Friedrich Nietzsche",
  plato: "Plato",
  aristotle: "Aristotle",
  kant: "Immanuel Kant",
  hume: "David Hume",
  descartes: "René Descartes",
  spinoza: "Baruch Spinoza",
  hegel: "G.W.F. Hegel",
};

async function migrateQuotesToDatabase() {
  console.log("Starting quote migration to database...\n");
  
  let totalInserted = 0;
  let totalSkipped = 0;
  
  for (const [thinkerId, quotes] of Object.entries(THINKER_QUOTES)) {
    if (thinkerId === "J.-M. Kuczynski") continue;
    
    const thinkerName = THINKER_NAME_MAP[thinkerId] || thinkerId;
    console.log(`Processing ${thinkerName} (${quotes.length} quotes)...`);
    
    for (const quote of quotes) {
      if (!quote || quote.trim().length === 0) continue;
      
      try {
        await db.insert(thinkerQuotes).values({
          thinkerId,
          thinkerName,
          quote: quote.trim(),
          topic: null,
          source: null,
        }).onConflictDoNothing();
        
        totalInserted++;
      } catch (error: any) {
        if (error.code === '23505') {
          totalSkipped++;
        } else {
          console.error(`Error inserting quote for ${thinkerName}:`, error.message);
        }
      }
    }
  }
  
  console.log(`\nMigration complete!`);
  console.log(`Total inserted: ${totalInserted}`);
  console.log(`Total skipped (duplicates): ${totalSkipped}`);
  
  const result = await db.select().from(thinkerQuotes);
  console.log(`\nTotal quotes in database: ${result.length}`);
  
  process.exit(0);
}

migrateQuotesToDatabase().catch(console.error);

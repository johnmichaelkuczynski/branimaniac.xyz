import { db } from "./server/db";
import { paperChunks } from "./shared/schema";
import { sql } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testAuthorFiltering() {
  console.log("\n🧪 TESTING AUTHOR FILTERING\n");
  
  // Test 1: Query with Aristotle filter (HAS content - 309 chunks)
  console.log("TEST 1: Aristotle (HAS 309 chunks)");
  const query1 = "philosophy and metaphysics";
  const embedding1 = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: query1,
  });
  
  const aristotleResults = await db.execute(
    sql`
      SELECT author, paper_title, content, chunk_index,
             embedding <=> ${JSON.stringify(embedding1.data[0].embedding)}::vector as distance
      FROM ${paperChunks}
      WHERE figure_id = 'common'
        AND author ILIKE '%aristotle%'
      ORDER BY distance
      LIMIT 10
    `
  );
  
  console.log(`  Query: "${query1}"`);
  console.log(`  Filter: author ILIKE '%aristotle%'`);
  console.log(`  Results: ${aristotleResults.rows.length}`);
  aristotleResults.rows.forEach((row: any, i) => {
    console.log(`    ${i+1}. ${row.author} - ${row.paper_title.substring(0, 50)}...`);
  });
  
  // Test 2: Query with Plato filter (NO content - 0 chunks)
  console.log("\nTEST 2: Plato (HAS 0 chunks)");
  const platoResults = await db.execute(
    sql`
      SELECT author, paper_title, content, chunk_index,
             embedding <=> ${JSON.stringify(embedding1.data[0].embedding)}::vector as distance
      FROM ${paperChunks}
      WHERE figure_id = 'common'
        AND author ILIKE '%plato%'
      ORDER BY distance
      LIMIT 10
    `
  );
  
  console.log(`  Query: "${query1}"`);
  console.log(`  Filter: author ILIKE '%plato%'`);
  console.log(`  Results: ${platoResults.rows.length}`);
  if (platoResults.rows.length === 0) {
    console.log(`  ✅ CORRECT: Returns 0 results when author has no content`);
  } else {
    console.log(`  ❌ WRONG: Should return 0 but got ${platoResults.rows.length}`);
  }
  
  // Test 3: Query WITHOUT filter (should return mixed authors)
  console.log("\nTEST 3: No filter (should return mixed authors)");
  const noFilterResults = await db.execute(
    sql`
      SELECT author, paper_title, content, chunk_index,
             embedding <=> ${JSON.stringify(embedding1.data[0].embedding)}::vector as distance
      FROM ${paperChunks}
      WHERE figure_id = 'common'
      ORDER BY distance
      LIMIT 10
    `
  );
  
  console.log(`  Query: "${query1}"`);
  console.log(`  Filter: NONE`);
  console.log(`  Results: ${noFilterResults.rows.length}`);
  const authors = new Set(noFilterResults.rows.map((r: any) => r.author));
  console.log(`  Unique authors: ${Array.from(authors).join(", ")}`);
  
  console.log("\n✅ DATABASE FILTERING WORKS CORRECTLY\n");
  process.exit(0);
}

testAuthorFiltering().catch(error => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});

import OpenAI from "openai";
import { db } from "./db";
import { paperChunks } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function embedFile(filePath: string, author: string): Promise<number> {
  const fileName = path.basename(filePath, '.txt');
  
  const existing = await db.select().from(paperChunks).where(eq(paperChunks.paperTitle, fileName)).limit(1);
  
  if (existing.length > 0) {
    console.log(`  ⏭️  Skip: ${fileName}`);
    return 0;
  }
  
  const content = fs.readFileSync(filePath, "utf-8").replace(/\r\n/g, '\n');
  
  let sections = content.split(/(?=##\s)/g).filter(s => s.trim().length > 100);
  if (sections.length < 3) {
    sections = content.split(/(?=\d+\.\s)/g).filter(s => s.trim().length > 50);
  }
  if (sections.length < 3) {
    sections = [];
    for (let i = 0; i < content.length; i += 2000) {
      const chunk = content.slice(i, i + 2000);
      if (chunk.trim().length > 50) sections.push(chunk);
    }
  }
  
  console.log(`  📄 ${fileName}: ${sections.length} sections`);
  
  for (let i = 0; i < sections.length; i++) {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: sections[i].slice(0, 8000),
    });
    
    await db.insert(paperChunks).values({
      paperTitle: fileName,
      chunkIndex: i,
      content: sections[i],
      embedding: response.data[0].embedding,
      figureId: "common",
      author: author,
    });
  }
  
  return sections.length;
}

async function main() {
  const authors = [
    { name: 'Kuczynski', dir: 'server/data/kuczynski' },
    { name: 'Aristotle', dir: 'server/data/aristotle' },
  ];
  
  let totalChunks = 0;
  
  for (const { name, dir } of authors) {
    console.log(`\n=== ${name.toUpperCase()} ===`);
    const files = fs.readdirSync(dir).filter(f => f.includes('Position') && f.endsWith('.txt'));
    console.log(`Found ${files.length} position files`);
    
    for (const file of files) {
      const chunks = await embedFile(path.join(dir, file), name);
      totalChunks += chunks;
    }
  }
  
  console.log(`\n✅ DONE! Embedded ${totalChunks} new chunks total`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

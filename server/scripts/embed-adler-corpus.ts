import OpenAI from "openai";
import { db } from "../db";
import { textChunks } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function chunkText(text: string, maxChunkSize: number = 1500): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const cleanParagraph = paragraph.trim();
    if (!cleanParagraph) continue;

    if (currentChunk.length + cleanParagraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = cleanParagraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + cleanParagraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(c => c.length > 50);
}

async function embedAdler() {
  console.log("===========================================");
  console.log("ALFRED ADLER CORPUS EMBEDDING");
  console.log("===========================================\n");

  const files = [
    {
      path: path.join(process.cwd(), 'attached_assets', 'THE_NEUROTIC_CONSTITUTION_Outlines_of_a_Comparative_Individual_1765867734632.txt'),
      title: 'The Neurotic Constitution'
    },
    {
      path: path.join(process.cwd(), 'attached_assets', 'Pasted--ALFRED-ADLER-WHAT-LIFE-COULD-MEAN-TO-YOU-ALFRED-ADLER-_1765867785008.txt'),
      title: 'What Life Could Mean to You'
    }
  ];

  let totalChunksInserted = 0;

  for (const file of files) {
    console.log(`\nProcessing: ${file.title}`);
    
    const existingCount = await db.select({ count: sql<number>`count(*)` })
      .from(textChunks)
      .where(and(
        eq(textChunks.thinker, 'Alfred Adler'),
        eq(textChunks.sourceFile, file.title)
      ));
    
    if (!fs.existsSync(file.path)) {
      console.log(`  File not found: ${file.path}`);
      continue;
    }

    const content = fs.readFileSync(file.path, 'utf-8');
    const allChunks = chunkText(content);
    
    const existingCountNum = Number(existingCount[0]?.count || 0);
    
    if (existingCountNum >= allChunks.length) {
      console.log(`  ${file.title} is fully embedded!`);
      continue;
    }

    const chunksToProcess = allChunks.slice(existingCountNum, existingCountNum + 150);
    
    console.log(`  Total chunks: ${allChunks.length}`);
    console.log(`  Already embedded: ${existingCountNum}`);
    console.log(`  Processing: ${chunksToProcess.length}`);

    for (let i = 0; i < chunksToProcess.length; i++) {
      const chunk = chunksToProcess[i];
      const chunkIndex = existingCountNum + i;
      
      await db.insert(textChunks).values({
        thinker: 'Alfred Adler',
        sourceFile: file.title,
        chunkText: chunk,
        chunkIndex: chunkIndex
      });
    }

    console.log(`  Inserted: ${chunksToProcess.length}`);
    console.log(`  Total now: ${existingCountNum + chunksToProcess.length}/${allChunks.length}`);
    console.log(`  Remaining: ${allChunks.length - existingCountNum - chunksToProcess.length}`);
    totalChunksInserted += chunksToProcess.length;
  }

  console.log(`\nALFRED ADLER CORPUS EMBEDDING COMPLETE`);
  console.log(`Total chunks inserted this run: ${totalChunksInserted}`);
}

embedAdler().catch(console.error);

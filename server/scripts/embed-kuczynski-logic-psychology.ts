import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

function chunkText(text: string, maxChunkSize: number = 1200): string[] {
  // Split on double newlines (paragraph breaks) or section headers
  const lines = text.split(/\n/);
  const chunks: string[] = [];
  let currentChunk = "";
  
  for (const line of lines) {
    const cleanLine = line.trim();
    
    // Start new chunk on section headers (Part X, Example X, etc.)
    const isHeader = /^(Part \d|Example \d|Section \d|Chapter \d|Abstract|Introduction|Conclusion|References)/i.test(cleanLine);
    
    if (isHeader && currentChunk.length > 200) {
      chunks.push(currentChunk.trim());
      currentChunk = cleanLine + "\n";
    } else if (currentChunk.length + cleanLine.length > maxChunkSize && currentChunk.length > 200) {
      chunks.push(currentChunk.trim());
      currentChunk = cleanLine + "\n";
    } else {
      currentChunk += cleanLine + "\n";
    }
  }
  
  if (currentChunk.trim().length > 50) {
    chunks.push(currentChunk.trim());
  }
  
  // Filter out very short chunks
  return chunks.filter(c => c.length > 100);
}

async function embedKuczynskiLogicPsychology() {
  console.log("Starting Kuczynski Logic/Psychology works embedding...");
  
  const files = [
    {
      path: "attached_assets/AI_and_Philosophy-1_1765874631382.txt",
      title: "AI and Philosophy",
      topics: ["logic", "psychology", "AI", "reasoning", "cognition", "classical logic", "System L", "pattern recognition", "neural networks", "rationality"]
    },
    {
      path: "attached_assets/Pasted-AI-Logic-vs-Classical-Logic-Discovery-vs-Formalization-_1765874677718.txt", 
      title: "AI Logic vs Classical Logic",
      topics: ["logic", "psychology", "classical logic", "discovery", "formalization", "reasoning", "inference", "psychologism"]
    },
    {
      path: "attached_assets/Pasted--The-Incompleteness-of-Deductive-Logic-And-Its-Conseque_1765874892451.txt",
      title: "Incompleteness of Deductive Logic",
      topics: ["logic", "psychology", "deductive logic", "incompleteness", "recursion", "rationality", "pattern recognition", "epistemology", "induction"]
    }
  ];
  
  let totalChunks = 0;
  
  for (const file of files) {
    const filePath = path.join(process.cwd(), file.path);
    
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }
    
    console.log(`\nProcessing: ${file.title}`);
    const content = fs.readFileSync(filePath, "utf-8");
    const chunks = chunkText(content);
    
    console.log(`  Found ${chunks.length} chunks`);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        console.log(`  Embedding chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
        const embedding = await getEmbedding(chunk);
        
        await db.insert(paperChunks).values({
          figureId: "kuczynski",
          paperTitle: file.title,
          chunkIndex: i,
          content: chunk,
          embedding: embedding,
          author: "Kuczynski",
          topics: file.topics,
        });
        
        totalChunks++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (error) {
        console.error(`  Error embedding chunk ${i + 1}:`, error);
      }
    }
    
    console.log(`  Completed: ${file.title}`);
  }
  
  console.log(`\n✅ Successfully embedded ${totalChunks} total chunks for Kuczynski Logic/Psychology works`);
}

embedKuczynskiLogicPsychology()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

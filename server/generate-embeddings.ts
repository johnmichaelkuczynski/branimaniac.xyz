import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "./db";
import { paperChunks } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Author name mapping for auto-scanned folders
const authorFolderToName: Record<string, string> = {
  "kuczynski": "J.-M. Kuczynski",
  "freud": "Sigmund Freud",
  "nietzsche": "Friedrich Nietzsche",
  "russell": "Bertrand Russell",
  "plato": "Plato",
  "aristotle": "Aristotle",
  "jung": "Carl Jung",
  "galileo": "Galileo Galilei",
  "james-allen": "James Allen",
  "james": "William James",
  "marx": "Karl Marx",
  "darwin": "Charles Darwin",
  "kant": "Immanuel Kant",
  "hume": "David Hume",
  "locke": "John Locke",
  "berkeley": "George Berkeley",
  "leibniz": "Gottfried Wilhelm Leibniz",
  "poe": "Edgar Allan Poe",
  "reich": "Wilhelm Reich",
  "orwell": "George Orwell",
  "dostoevsky": "Fyodor Dostoevsky",
  "tolstoy": "Leo Tolstoy",
  "confucius": "Confucius",
  "aesop": "Aesop",
  "grimm": "Brothers Grimm",
  "goldman": "Emma Goldman",
  "tocqueville": "Alexis de Tocqueville",
  "voltaire": "Voltaire",
  "luther": "Martin Luther",
  "rousseau": "Jean-Jacques Rousseau",
  "engels": "Friedrich Engels",
  "von-mises": "Ludwig von Mises",
  "veblen": "Thorstein Veblen",
  "adler": "Alfred Adler",
  "bierce": "Ambrose Bierce",
  "bergson": "Henri Bergson",
  "poincare": "Henri Poincaré",
  "keynes": "John Maynard Keynes",
  "machiavelli": "Niccolò Machiavelli",
  "newton": "Isaac Newton",
  "le-bon": "Gustave Le Bon",
  "swett": "Orison Swett Marden",
  "gibbon": "Edward Gibbon",
  "maimonides": "Moses Maimonides",
  "jack-london": "Jack London",
  "schopenhauer": "Arthur Schopenhauer",
  "hegel": "Georg Wilhelm Friedrich Hegel",
};

// UNIFIED KNOWLEDGE BASE: ALL texts go into Common Fund
// ALL batches default to "common" figure ID - dynamically resolved
const batchToFigure: Record<string, string> = {};

// REQUIRED: Author attribution mapping - dynamically resolved from authorFolderToName
const batchToAuthor: Record<string, string> = {};

// Helper function to recursively scan directories for .txt files
function scanDirectoryRecursively(dirPath: string, basePath: string): { file: string; title: string }[] {
  const results: { file: string; title: string }[] = [];
  
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relativePath = fullPath.replace(join(__dirname, ''), '').replace(/^\//, '');
      
      if (entry.isDirectory()) {
        // Recursively scan subdirectories (e.g., quotes/)
        results.push(...scanDirectoryRecursively(fullPath, basePath));
      } else if (entry.isFile() && entry.name.endsWith('.txt')) {
        results.push({
          file: relativePath,
          title: entry.name.replace(/\.txt$/i, '')
        });
      }
    }
  } catch (error) {
    console.warn(`⚠️  Could not scan directory ${dirPath}:`, error);
  }
  
  return results;
}

// Multi-author configuration: AUTO-SCAN ALL AUTHOR FOLDERS (including subdirectories)
const figuresPapers = {
  // AUTO-SCAN ALL AUTHORS: Dynamically load ALL .txt files from ALL author folders and subdirectories
  ...(() => {
    const dataPath = join(__dirname, "data");
    const authorBatches: Record<string, any[]> = {};
    
    try {
      const authorFolders = readdirSync(dataPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      for (const authorFolder of authorFolders) {
        const authorPath = join(dataPath, authorFolder);
        // Recursively scan all subdirectories (including quotes/, etc.)
        const files = scanDirectoryRecursively(authorPath, authorPath);
        
        if (files.length > 0) {
          authorBatches[`auto_${authorFolder}`] = files;
          console.log(`📂 Auto-discovered ${files.length} files from data/${authorFolder}/ (including subdirs)`);
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not auto-scan data folder:', error);
    }
    
    return authorBatches;
  })(),
};

function chunkText(text: string, targetWordsPerChunk: number = 300): string[] {
  const paragraphs = text.split(/\n\s*\n+/);
  const chunks: string[] = [];
  let currentChunk = "";
  
  for (const paragraph of paragraphs) {
    const paragraphWords = paragraph.trim().split(/\s+/).length;
    const currentWords = currentChunk.split(/\s+/).length;
    
    if (currentWords + paragraphWords <= targetWordsPerChunk * 1.2) {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph.trim();
    } else {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = paragraph.trim();
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(c => c.split(/\s+/).length > 20);
}

async function generateEmbedding(text: string, retryHalved: boolean = false): Promise<number[] | null> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error: any) {
    const errorMessage = error?.error?.message || error?.message || '';
    if (error?.status === 400 && errorMessage.includes('maximum context length')) {
      const wordCount = text.split(/\s+/).length;
      
      if (!retryHalved && wordCount > 100) {
        console.log(` ⚠️  Chunk too large (~${wordCount} words), will split and retry`);
        return null;
      }
      
      console.log(` ⚠️  Chunk too large (~${wordCount} words), skipping`);
      return null;
    }
    throw error;
  }
}

async function main() {
  const targetFigure = process.argv[2] || "all";
  const includePattern = process.argv[3]; // Optional filter pattern for targeted embedding
  
  console.log(`🚀 Starting embedding generation for: ${targetFigure}\n`);
  if (includePattern) {
    console.log(`🎯 TARGETED MODE: Only embedding files matching "${includePattern}"\n`);
  }
  
  let figuresToProcess: [string, typeof figuresPapers[keyof typeof figuresPapers]][] = [];
  
  if (targetFigure === "all") {
    figuresToProcess = Object.entries(figuresPapers);
    console.log("🗑️  Clearing ALL existing embeddings...");
    await db.delete(paperChunks);
    console.log("✓ Cleared\n");
  } else {
    const papers = figuresPapers[targetFigure as keyof typeof figuresPapers];
    if (!papers) {
      console.error(`❌ Unknown figure: ${targetFigure}`);
      console.log(`Available figures: ${Object.keys(figuresPapers).join(", ")}`);
      process.exit(1);
    }
    
    // Apply filter if pattern provided
    let filteredPapers = papers;
    if (includePattern) {
      filteredPapers = papers.filter(p => 
        p.file.toLowerCase().includes(includePattern.toLowerCase()) ||
        p.title.toLowerCase().includes(includePattern.toLowerCase())
      );
      console.log(`🎯 Filtered to ${filteredPapers.length} files matching "${includePattern}"`);
      if (filteredPapers.length === 0) {
        console.error(`❌ No files match pattern "${includePattern}"`);
        process.exit(1);
      }
    }
    
    figuresToProcess = [[targetFigure, filteredPapers]];
    console.log(`📦 Batch mode: Will skip papers that already exist\n`);
  }
  
  let totalChunks = 0;
  let totalPapers = 0;
  
  // Process each figure's papers
  for (const [batchId, papers] of figuresToProcess) {
    // Get actual figure ID (for batches like jmk_batch1 -> jmk)
    const actualFigureId = batchToFigure[batchId] || "common";
    
    // Get author name: auto_kuczynski -> J.-M. Kuczynski
    let authorName = batchToAuthor[batchId];
    if (!authorName && batchId.startsWith('auto_')) {
      const folderName = batchId.replace('auto_', '');
      authorName = authorFolderToName[folderName] || folderName;
    }
    if (!authorName) authorName = "Unknown Author";
    
    console.log(`\n📚 Processing ${batchId.toUpperCase()} → ${actualFigureId} (${papers.length} papers)...\n`);
    
    for (const paper of papers) {
      try {
        // Check if this paper already exists - get count to enable resume
        const existing = await db.select().from(paperChunks)
          .where(and(
            eq(paperChunks.figureId, actualFigureId),
            eq(paperChunks.paperTitle, paper.title)
          ));
        
        console.log(`📄 Processing: ${paper.title}`);
        
        const content = readFileSync(join(__dirname, paper.file), "utf-8");
        // Use smaller chunks (300 words) for papers that were too large at 500
        const targetWords = paper.title.includes("Frege") || paper.title.includes("Putnam") ? 300 : 500;
        const chunks = chunkText(content, targetWords);
        
        console.log(`   Found ${chunks.length} chunks`);
        
        // Check if paper is complete by verifying contiguous sequence 0…n-1
        const existingIndices = existing.map(e => e.chunkIndex).sort((a, b) => a - b);
        const isComplete = existing.length === chunks.length && 
                          existingIndices.every((idx, i) => idx === i);
        
        if (isComplete) {
          console.log(`   ✓ Already complete (${existing.length}/${chunks.length} chunks), skipping`);
          totalPapers++;
          continue;
        } else if (existing.length > 0) {
          console.log(`   ⚠️  Resuming: ${existing.length}/${chunks.length} chunks already embedded`);
        }
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          
          process.stdout.write(`   Embedding chunk ${i + 1}/${chunks.length}...`);
          
          const embedding = await generateEmbedding(chunk);
          
          // Skip chunks that are too large
          if (embedding === null) {
            process.stdout.write(` skipped (too large)\n`);
            continue;
          }
          
          // Use ON CONFLICT DO NOTHING for idempotent inserts (unique constraint on figureId + paperTitle + chunkIndex)
          await db.insert(paperChunks).values({
            figureId: actualFigureId,  // Use actual figure ID, not batch name
            author: authorName,  // REQUIRED: Explicit author attribution (dynamically resolved)
            paperTitle: paper.title,
            content: chunk,
            embedding: embedding as any, // pgvector handles array conversion
            chunkIndex: i,
          }).onConflictDoNothing();
          
          process.stdout.write(` ✓\n`);
          totalChunks++;
          
          // Rate limiting: Wait 250ms between requests to avoid hitting OpenAI limits (conservative for batch processing)
          await new Promise(resolve => setTimeout(resolve, 250));
        }
        
        console.log(`✓ ${paper.title} complete\n`);
        totalPapers++;
      } catch (error) {
        console.error(`❌ Error processing ${paper.title}:`, error);
      }
    }
  }
  
  console.log(`\n🎉 Done! Generated ${totalChunks} embeddings across ${totalPapers} papers from ${Object.keys(figuresPapers).length} figures.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

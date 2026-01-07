import { db } from "./db";
import { positions, chunks, argumentsTable } from "@shared/schema";
import { sql, ilike, or } from "drizzle-orm";
import OpenAI from "openai";

// Table reference for RAG queries - uses chunks table with embeddings
const chunksTable = sql.identifier("chunks");

// Structured position data from positions table
export interface StructuredPosition {
  thinker: string;
  topic: string;
  position_text: string;
  source: string | null;
}

/**
 * Query structured philosophical positions by thinker and/or topic keywords
 * Returns matching positions from the positions table for context injection
 */
export async function searchPositions(
  thinker?: string,
  topicKeywords?: string[],
  limit: number = 20
): Promise<StructuredPosition[]> {
  try {
    // positions table schema: id, thinker, position, topic, created_at
    let query = sql`SELECT thinker, topic, position_text FROM positions WHERE 1=1`;
    
    if (thinker) {
      query = sql`${query} AND thinker ILIKE ${'%' + thinker + '%'}`;
    }
    
    if (topicKeywords && topicKeywords.length > 0) {
      const topicConditions = topicKeywords.map(kw => 
        sql`(topic ILIKE ${'%' + kw + '%'} OR position_text ILIKE ${'%' + kw + '%'})`
      );
      query = sql`${query} AND (${sql.join(topicConditions, sql` OR `)})`;
    }
    
    query = sql`${query} ORDER BY RANDOM() LIMIT ${limit}`;
    
    const results = await db.execute(query);
    
    return (results.rows || []).map((row: any) => ({
      thinker: row.thinker,
      topic: row.topic || 'general',
      position_text: row.position_text,
      source: 'works',
    }));
  } catch (error) {
    console.error("Error searching positions:", error);
    return [];
  }
}

/**
 * Get positions for a specific thinker to include in LLM context
 */
export async function getPositionsForThinker(
  thinker: string,
  question: string,
  limit: number = 15
): Promise<string> {
  const keywords = question.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  const relevantPositions = await searchPositions(thinker, keywords, limit);
  
  if (relevantPositions.length === 0) {
    return '';
  }
  
  let context = `\n=== STRUCTURED POSITIONS FROM ${thinker.toUpperCase()} ===\n\n`;
  
  for (const pos of relevantPositions) {
    context += `[${pos.topic}] ${pos.position_text}\n`;
  }
  
  context += `\n=== END POSITIONS ===\n`;
  
  return context;
}

// Text chunk data from chunks table (RAG source texts)
export interface TextChunkResult {
  thinker: string;
  sourceFile: string;
  chunkText: string;
  chunkIndex: number;
}

/**
 * RAG TEXT SEARCH: Query chunks table by thinker and keywords
 * Returns the most relevant chunks from the thinker's source texts
 * Uses PostgreSQL full-text search with keyword matching
 */
/**
 * DOMAIN-AWARE TEXT CHUNK SEARCH
 * 
 * CRITICAL IMPROVEMENT: This search now:
 * 1. Prioritizes source files whose NAMES match the query topic (e.g., "Financial Regulation" file for finance questions)
 * 2. Uses improved keyword extraction that keeps important domain terms
 * 3. Falls back to semantic matching via source_text_id relevance, NOT random chunks
 * 4. Filters out psychology/OCD content when query is about economics/finance/politics
 */
export async function searchTextChunks(
  thinker: string,
  question: string,
  limit: number = 10
): Promise<TextChunkResult[]> {
  try {
    const questionLower = question.toLowerCase();
    
    // STEP 1: Detect query domain to filter irrelevant content
    const financeKeywords = ['financial', 'regulation', 'bank', 'banking', 'economy', 'economic', 'fed', 'federal reserve', 'wall street', 'market', 'stock', 'investment', 'monetary', 'fiscal', 'inflation', 'capitalism', 'tax', 'taxation'];
    const psychologyKeywords = ['ocd', 'obsessive', 'compulsive', 'addiction', 'alcoholic', 'neurosis', 'psychoanalysis', 'therapy', 'mental illness', 'mental disorder', 'anxiety disorder'];
    const logicPhilosophyKeywords = ['logic', 'logical', 'syllogism', 'modus ponens', 'deduction', 'deductive', 'inference', 'proposition', 'truth', 'validity', 'valid', 'axiom', 'theorem', 'proof', 'mathematics', 'mathematical', 'philosophy', 'philosophical', 'epistemology', 'metaphysics', 'ontology', 'semantics', 'syntax', 'formal', 'reasoning', 'reason', 'argument', 'premise', 'conclusion', 'contradiction', 'tautology', 'fallacy', 'godel', 'incompleteness', 'turing', 'computation', 'algorithm', 'set theory', 'predicate', 'quantifier', 'modal', 'necessity', 'possibility', 'a priori', 'analytic', 'synthetic', 'causation', 'knowledge', 'belief', 'justification'];
    
    const isFinanceQuery = financeKeywords.some(kw => questionLower.includes(kw));
    const isPsychologyQuery = psychologyKeywords.some(kw => questionLower.includes(kw));
    const isLogicPhilosophyQuery = logicPhilosophyKeywords.some(kw => questionLower.includes(kw));
    
    // Determine if query should exclude psychology content (logic/philosophy/finance but NOT psychology)
    const shouldExcludePsychology = (isFinanceQuery || isLogicPhilosophyQuery) && !isPsychologyQuery;
    
    // STEP 2: Extract keywords - IMPROVED: keep words >= 3 chars, expanded stopword list
    const stopwords = ['what', 'when', 'where', 'which', 'that', 'this', 'have', 'does', 'would', 'could', 'should', 'about', 'think', 'your', 'with', 'from', 'they', 'their', 'there', 'been', 'being', 'were', 'will', 'show', 'shown', 'last', 'years', 'year', 'united', 'states', 'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out'];
    
    const keywords = questionLower
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !stopwords.includes(w));
    
    console.log(`[TextChunk Search] Query: "${question.substring(0, 50)}..." | Keywords: ${keywords.join(', ')} | Domain: ${isLogicPhilosophyQuery ? 'LOGIC/PHILOSOPHY' : isFinanceQuery ? 'FINANCE' : isPsychologyQuery ? 'PSYCHOLOGY' : 'GENERAL'} | Exclude Psych: ${shouldExcludePsychology}`);
    
    // STEP 3: PRIORITY SEARCH - Find source files whose NAMES match the query topic
    // This ensures "financial regulation" questions pull from "Financial_Regulation.txt"
    const sourceFileMatches: string[] = [];
    if (keywords.length > 0) {
      const sourceFileKeywordConditions = keywords.slice(0, 5).map(kw => 
        sql`source_text_id ILIKE ${'%' + kw + '%'}`
      );
      
      const sourceFileResults = await db.execute(
        sql`SELECT DISTINCT source_text_id 
            FROM chunks 
            WHERE thinker ILIKE ${'%' + thinker + '%'}
              AND (${sql.join(sourceFileKeywordConditions, sql` OR `)})
            LIMIT 10`
      );
      
      sourceFileMatches.push(...(sourceFileResults.rows || []).map((r: any) => r.source_text_id));
      console.log(`[TextChunk Search] Found ${sourceFileMatches.length} source files matching topic: ${sourceFileMatches.slice(0, 3).join(', ')}`);
    }
    
    // STEP 4: If we found topic-relevant source files, prioritize chunks FROM those files
    if (sourceFileMatches.length > 0) {
      const sourceFileConditions = sourceFileMatches.map(sf => sql`source_text_id = ${sf}`);
      
      // Build content keyword matching for ranking within relevant files
      let orderClause = sql`RANDOM()`;
      if (keywords.length > 0) {
        const matchCountExpr = keywords.slice(0, 8).map(kw => 
          sql`CASE WHEN chunk_text ILIKE ${'%' + kw + '%'} THEN 1 ELSE 0 END`
        );
        orderClause = sql`(${sql.join(matchCountExpr, sql` + `)}) DESC, RANDOM()`;
      }
      
      const results = await db.execute(
        sql`SELECT thinker, source_text_id, chunk_text, chunk_index
            FROM chunks 
            WHERE thinker ILIKE ${'%' + thinker + '%'}
              AND (${sql.join(sourceFileConditions, sql` OR `)})
            ORDER BY ${orderClause}
            LIMIT ${limit}`
      );
      
      const chunks = (results.rows || []).map((row: any) => ({
        thinker: row.thinker,
        sourceFile: row.source_text_id,
        chunkText: row.chunk_text,
        chunkIndex: row.chunk_index
      }));
      
      if (chunks.length > 0) {
        console.log(`[TextChunk Search] Returning ${chunks.length} chunks from topic-relevant files`);
        return chunks;
      }
    }
    
    // STEP 5: Fallback - keyword search across all chunks (original behavior, but no random fallback)
    if (keywords.length > 0) {
      const keywordConditions = keywords.slice(0, 8).map(kw => 
        sql`chunk_text ILIKE ${'%' + kw + '%'}`
      );
      
      const matchCountExpr = keywords.slice(0, 8).map(kw => 
        sql`CASE WHEN chunk_text ILIKE ${'%' + kw + '%'} THEN 1 ELSE 0 END`
      );
      
      // DOMAIN FILTERING: Exclude psychology files for logic/philosophy/finance queries
      let excludeCondition = sql`1=1`;
      if (shouldExcludePsychology) {
        excludeCondition = sql`source_text_id NOT ILIKE '%OCD%' AND source_text_id NOT ILIKE '%addiction%' AND source_text_id NOT ILIKE '%Pathology%' AND source_text_id NOT ILIKE '%alcoholic%' AND source_text_id NOT ILIKE '%neurosis%' AND source_text_id NOT ILIKE '%compulsive%' AND chunk_text NOT ILIKE '%OCD%' AND chunk_text NOT ILIKE '%obsessive-compulsive%'`;
        console.log(`[TextChunk Search] Excluding psychology content for ${isLogicPhilosophyQuery ? 'LOGIC/PHILOSOPHY' : 'FINANCE'} query`);
      }
      
      const results = await db.execute(
        sql`SELECT thinker, source_text_id, chunk_text, chunk_index,
                   (${sql.join(matchCountExpr, sql` + `)}) as match_count
            FROM chunks 
            WHERE thinker ILIKE ${'%' + thinker + '%'}
              AND (${sql.join(keywordConditions, sql` OR `)})
              AND ${excludeCondition}
            ORDER BY match_count DESC
            LIMIT ${limit}`
      );
      
      const chunks = (results.rows || []).map((row: any) => ({
        thinker: row.thinker,
        sourceFile: row.source_text_id,
        chunkText: row.chunk_text,
        chunkIndex: row.chunk_index
      }));
      
      if (chunks.length > 0) {
        console.log(`[TextChunk Search] Returning ${chunks.length} chunks from keyword search`);
        return chunks;
      }
    }
    
    // STEP 6: Last resort - return empty rather than random irrelevant chunks
    // Random chunks cause the LLM to shoehorn unrelated content into answers
    console.log(`[TextChunk Search] No relevant chunks found - returning empty to avoid irrelevant content`);
    return [];
    
  } catch (error) {
    console.error("Error searching text chunks:", error);
    return [];
  }
}

/**
 * Get formatted text chunks for a thinker to include in LLM context
 * This is the primary RAG function for philosopher responses
 */
export async function getTextChunksForThinker(
  thinker: string,
  question: string,
  limit: number = 8
): Promise<string> {
  const chunks = await searchTextChunks(thinker, question, limit);
  
  // Log chunk retrieval for debugging RAG pipeline
  console.log(`[RAG] chunks returned: ${chunks.length}, thinker: ${thinker}`);
  
  if (chunks.length === 0) {
    return '';
  }
  
  let context = `\n=== SOURCE TEXTS FROM ${thinker.toUpperCase()}'S WRITINGS ===\n\n`;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    // Clean up the source file name for display
    const sourceTitle = chunk.sourceFile
      .replace(/\.txt$/i, '')
      .replace(/_/g, ' ')
      .replace(/^\d+\s*/, '');
    
    context += `[Source ${i + 1}: ${sourceTitle}]\n${chunk.chunkText}\n\n`;
  }
  
  context += `=== END SOURCE TEXTS ===\n`;
  
  return context;
}

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// Structured chunk data for API responses
export interface StructuredChunk {
  author: string; // REQUIRED: Author attribution for every chunk
  paperTitle: string;
  content: string;
  chunkIndex: number;
  distance: number;
  source: 'own' | 'common' | 'shared'; // 'shared' = General Knowledge Fund
  figureId: string;
  tokens: number;
}

/**
 * VERBATIM TEXT SEARCH: Returns verbatim text chunks from chunks table
 * Uses thinker and chunk_text columns (actual schema)
 */
export async function searchVerbatimChunks(
  question: string,
  topK: number = 10,
  authorFilter?: string
): Promise<StructuredChunk[]> {
  try {
    const embeddingResponse = await getOpenAI().embeddings.create({
      model: "text-embedding-ada-002",
      input: question,
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;
    
    const whereClause = authorFilter 
      ? sql`WHERE thinker ILIKE ${'%' + authorFilter + '%'}`
      : sql`WHERE 1=1`;
    
    const results = await db.execute(
      sql`
        SELECT thinker, source_text_id, chunk_text, chunk_index, 
               embedding <=> ${JSON.stringify(queryEmbedding)}::vector as distance
        FROM chunks
        ${whereClause}
        ORDER BY distance
        LIMIT ${topK}
      `
    );
    
    return (results.rows || []).map((row: any) => {
      return {
        author: row.thinker,
        paperTitle: row.source_text_id || 'Works',
        content: row.chunk_text,
        chunkIndex: row.chunk_index,
        distance: row.distance,
        source: 'common' as const,
        figureId: 'common',
        tokens: Math.ceil((row.chunk_text || '').split(/\s+/).length * 1.3)
      };
    });
  } catch (error) {
    console.error("Error in searchVerbatimChunks:", error);
    return [];
  }
}

/**
 * UNIFIED KNOWLEDGE BASE: Core semantic search using chunks table
 * Uses actual DB columns: thinker, source_text_id, chunk_text, chunk_index, embedding
 */
export async function searchPhilosophicalChunks(
  question: string,
  topK: number = 15,
  figureId: string = "common",
  authorFilter?: string
): Promise<StructuredChunk[]> {
  try {
    const embeddingResponse = await getOpenAI().embeddings.create({
      model: "text-embedding-ada-002",
      input: question,
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;
    
    // Build WHERE clause based on filters
    let whereClause = sql`1=1`;
    if (authorFilter) {
      whereClause = sql`thinker ILIKE ${'%' + authorFilter + '%'}`;
      console.log(`[Vector Search] Filtering by thinker: "${authorFilter}"`);
    } else if (figureId && figureId !== 'common') {
      whereClause = sql`thinker ILIKE ${'%' + figureId + '%'}`;
    }
    
    const results = await db.execute(
      sql`
        SELECT thinker, source_text_id, chunk_text, chunk_index,
               embedding <=> ${JSON.stringify(queryEmbedding)}::vector as distance
        FROM chunks
        WHERE ${whereClause}
        ORDER BY distance
        LIMIT ${topK}
      `
    );
    
    console.log(`[Vector Search] Found ${results.rows?.length || 0} chunks`);
    
    return (results.rows || []).map((row: any) => ({
      author: row.thinker,
      paperTitle: row.source_text_id || 'Works',
      content: row.chunk_text,
      chunkIndex: row.chunk_index,
      distance: row.distance,
      source: 'common' as const,
      figureId: figureId,
      tokens: Math.ceil((row.chunk_text || '').split(/\s+/).length * 1.3)
    }));
    
  } catch (error) {
    console.error("Vector search error:", error);
    return [];
  }
}

/**
 * GENERAL KNOWLEDGE FUND: Shared knowledge base accessible to ALL philosophers
 * Uses actual DB columns: thinker, source_text_id, chunk_text, chunk_index, embedding
 */
export async function searchGeneralKnowledgeFund(
  question: string,
  topK: number = 5
): Promise<StructuredChunk[]> {
  try {
    const embeddingResponse = await getOpenAI().embeddings.create({
      model: "text-embedding-ada-002",
      input: question,
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;
    
    // Search for general knowledge (thinker = 'generalknowledge')
    const results = await db.execute(
      sql`
        SELECT thinker, source_text_id, chunk_text, chunk_index,
               embedding <=> ${JSON.stringify(queryEmbedding)}::vector as distance
        FROM chunks
        WHERE thinker = 'generalknowledge'
        ORDER BY distance
        LIMIT ${topK}
      `
    );
    
    return (results.rows || []).map((row: any) => ({
      author: row.thinker,
      paperTitle: row.source_text_id || 'General Knowledge',
      content: row.chunk_text,
      chunkIndex: row.chunk_index,
      distance: row.distance,
      source: 'shared' as const,
      figureId: 'general_knowledge',
      tokens: Math.ceil((row.chunk_text || '').split(/\s+/).length * 1.3)
    }));
  } catch (error) {
    console.error("Error searching General Knowledge Fund:", error);
    return [];
  }
}

/**
 * Format General Knowledge Fund results for injection into prompts
 * Clearly labels content as modern research notes, not the philosopher's own views
 */
export async function getGeneralKnowledgeContext(
  question: string,
  limit: number = 5
): Promise<string> {
  const chunks = await searchGeneralKnowledgeFund(question, limit);
  
  if (chunks.length === 0) {
    return '';
  }
  
  let context = `
=== MODERN KNOWLEDGE FUND ===

The following information comes from modern research and scholarship that was not available
during your lifetime. Use these as reference notes to inform your response, but these are
NOT your own views - cite them explicitly as modern sources when referencing.

`;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    context += `[Modern Source ${i + 1}: ${chunk.paperTitle}]\n${chunk.content}\n\n`;
  }
  
  context += `=== END MODERN KNOWLEDGE FUND ===

NOTE: The above represents contemporary research. When using this information, acknowledge
it as modern scholarship that advances or extends ideas from your era.
`;
  
  return context;
}

// Structured argument data from arguments table
export interface StructuredArgument {
  thinker: string;
  argumentType: string;
  premises: string[];
  conclusion: string;
  sourceSection: string | null;
  sourceDocument: string | null;
  importance: number;
  counterarguments: string[] | null;
}

/**
 * ARGUMENT STATEMENTS SEARCH: Query structured philosophical arguments
 * Returns arguments from the arguments table matching thinker and keywords
 * Uses embedding-based semantic search when embeddings are available
 */
export async function searchArgumentStatements(
  thinker: string,
  question: string,
  limit: number = 10
): Promise<StructuredArgument[]> {
  try {
    const questionLower = question.toLowerCase();
    
    // Extract keywords for fallback search
    const stopwords = ['what', 'when', 'where', 'which', 'that', 'this', 'have', 'does', 'would', 'could', 'should', 'about', 'think', 'your', 'with', 'from', 'they', 'their', 'there', 'been', 'being', 'were', 'will', 'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'was', 'one'];
    
    const keywords = questionLower
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !stopwords.includes(w));
    
    // First try: semantic search with embeddings (if available)
    try {
      const embeddingResponse = await getOpenAI().embeddings.create({
        model: "text-embedding-ada-002",
        input: question,
      });
      
      const queryEmbedding = embeddingResponse.data[0].embedding;
      
      const results = await db.execute(
        sql`SELECT thinker, argument_type, premises, conclusion, topic, source_text_id, importance,
                   embedding <=> ${JSON.stringify(queryEmbedding)}::vector as distance
            FROM arguments 
            WHERE thinker ILIKE ${'%' + thinker + '%'}
              AND embedding IS NOT NULL
            ORDER BY distance
            LIMIT ${limit}`
      );
      
      if (results.rows && results.rows.length > 0) {
        console.log(`[Argument Search] Found ${results.rows.length} arguments via semantic search for "${thinker}"`);
        return (results.rows || []).map((row: any) => ({
          thinker: row.thinker,
          argumentType: row.argument_type,
          premises: row.premises || [],
          conclusion: row.conclusion,
          sourceSection: row.topic || '',
          sourceDocument: row.source_text_id || '',
          importance: row.importance,
          counterarguments: [],
        }));
      }
    } catch (embeddingError) {
      console.log(`[Argument Search] Embedding search failed, falling back to keyword search`);
    }
    
    // Fallback: keyword-based search on conclusion/premises text
    if (keywords.length > 0) {
      const keywordConditions = keywords.slice(0, 5).map(kw => 
        sql`(conclusion ILIKE ${'%' + kw + '%'} OR premises::text ILIKE ${'%' + kw + '%'})`
      );
      
      const results = await db.execute(
        sql`SELECT thinker, argument_type, premises, conclusion, topic, source_text_id, importance
            FROM arguments 
            WHERE thinker ILIKE ${'%' + thinker + '%'}
              AND (${sql.join(keywordConditions, sql` OR `)})
            ORDER BY importance DESC
            LIMIT ${limit}`
      );
      
      console.log(`[Argument Search] Found ${results.rows?.length || 0} arguments via keyword search for "${thinker}"`);
      return (results.rows || []).map((row: any) => ({
        thinker: row.thinker,
        argumentType: row.argument_type,
        premises: row.premises || [],
        conclusion: row.conclusion,
        sourceSection: row.topic || '',
        sourceDocument: row.source_text_id || '',
        importance: row.importance,
        counterarguments: [],
      }));
    }
    
    // Last resort: return top arguments by importance for this thinker
    const results = await db.execute(
      sql`SELECT thinker, argument_type, premises, conclusion, topic, source_text_id, importance
          FROM arguments 
          WHERE thinker ILIKE ${'%' + thinker + '%'}
          ORDER BY importance DESC
          LIMIT ${limit}`
    );
    
    console.log(`[Argument Search] Returning top ${results.rows?.length || 0} arguments by importance for "${thinker}"`);
    return (results.rows || []).map((row: any) => ({
      thinker: row.thinker,
      argumentType: row.argument_type,
      premises: row.premises || [],
      conclusion: row.conclusion,
      sourceSection: row.topic || '',
      sourceDocument: row.source_text_id || '',
      importance: row.importance,
      counterarguments: [],
    }));
    
  } catch (error) {
    console.error("Error searching argument statements:", error);
    return [];
  }
}

/**
 * Format argument statements for injection into LLM context
 * Shows structured premises → conclusion format for clarity
 */
export async function getArgumentsForThinker(
  thinker: string,
  question: string,
  limit: number = 8
): Promise<string> {
  const arguments_ = await searchArgumentStatements(thinker, question, limit);
  
  if (arguments_.length === 0) {
    return '';
  }
  
  let context = `\n=== STRUCTURED ARGUMENTS FROM ${thinker.toUpperCase()} ===\n\n`;
  
  for (let i = 0; i < arguments_.length; i++) {
    const arg = arguments_[i];
    context += `[Argument ${i + 1}] (${arg.argumentType}, importance: ${arg.importance}/10)\n`;
    if (arg.sourceDocument || arg.sourceSection) {
      context += `Source: ${arg.sourceDocument || 'Unknown'}${arg.sourceSection ? ` - ${arg.sourceSection}` : ''}\n`;
    }
    context += `Premises:\n`;
    for (let j = 0; j < arg.premises.length; j++) {
      context += `  ${j + 1}. ${arg.premises[j]}\n`;
    }
    context += `→ Conclusion: ${arg.conclusion}\n`;
    if (arg.counterarguments && arg.counterarguments.length > 0) {
      context += `Counterarguments addressed: ${arg.counterarguments.join('; ')}\n`;
    }
    context += '\n';
  }
  
  context += `=== END STRUCTURED ARGUMENTS ===\n`;
  
  return context;
}

export async function findRelevantChunks(
  question: string,
  topK: number = 15,
  figureId: string = "kuczynski"
): Promise<string> {
  // Convert figureId to author name for filtering
  const authorNameMap: Record<string, string> = {
    "kuczynski": "Kuczynski",
    "freud": "Freud",
    "nietzsche": "Nietzsche",
    "marx": "Marx",
    "berkeley": "Berkeley",
    "james": "James",
    "dostoevsky": "Dostoevsky",
    "plato": "Plato",
    "spinoza": "Spinoza",
    "russell": "Russell",
    "galileo": "Galileo",
    "bacon": "Bacon",
    "leibniz": "Leibniz",
    "aristotle": "Aristotle",
    "kant": "Kant",
    "darwin": "Darwin",
    "bergson": "Bergson",
    "schopenhauer": "Schopenhauer",
    "jung": "Jung",
    "aesop": "Aesop",
    "newton": "Newton",
    "hegel": "Hegel",
    "engels": "Engels",
    "dewey": "Dewey",
    "mill": "Mill",
    "descartes": "Descartes",
    "allen": "Allen"
  };
  
  const authorFilter = authorNameMap[figureId] || undefined;
  
  // Map figureId to full thinker name for chunks table
  const thinkerNameMap: Record<string, string> = {
    "kuczynski": "J.-M. Kuczynski",
    "freud": "Sigmund Freud",
    "nietzsche": "Friedrich Nietzsche",
    "marx": "Karl Marx",
    "berkeley": "George Berkeley",
    "james": "William James",
    "plato": "Plato",
    "spinoza": "Baruch Spinoza",
    "russell": "Bertrand Russell",
    "galileo": "Galileo Galilei",
    "leibniz": "Gottfried Wilhelm Leibniz",
    "aristotle": "Aristotle",
    "kant": "Immanuel Kant",
    "darwin": "Charles Darwin",
    "bergson": "Henri Bergson",
    "schopenhauer": "Arthur Schopenhauer",
    "jung": "Carl Jung",
    "aesop": "Aesop",
    "newton": "Isaac Newton",
    "hume": "David Hume",
    "confucius": "Confucius",
    "goldman": "Emma Goldman",
    "hegel": "G.W.F. Hegel",
    "locke": "John Locke",
    "machiavelli": "Niccolò Machiavelli",
    "voltaire": "Voltaire",
    "rousseau": "Jean-Jacques Rousseau",
    "tocqueville": "Alexis de Tocqueville",
    "veblen": "Thorstein Veblen",
    "smith": "Adam Smith",
    "reich": "Wilhelm Reich",
    "engels": "Friedrich Engels",
    "dewey": "John Dewey",
    "mill": "John Stuart Mill",
    "descartes": "René Descartes",
    "allen": "James Allen",
  };
  
  const thinkerName = thinkerNameMap[figureId] || authorFilter || figureId;
  
  // RAG RETRIEVAL ORDER: positions → arguments → chunks
  console.log(`[RAG] Starting retrieval for figureId: ${figureId}, authorFilter: ${authorFilter}, thinkerName: ${thinkerName}`);
  
  // 1. Structured positions (curated, highest signal)
  const positionsContext = authorFilter 
    ? await getPositionsForThinker(authorFilter, question, 10)
    : '';
  
  // 2. Structured arguments (premises → conclusion format)
  const argumentsContext = await getArgumentsForThinker(figureId, question, 6);
  
  // 3. Text chunks from source texts - use figureId (lowercase) to match database format
  const textChunksContext = await getTextChunksForThinker(figureId, question, 8);
  
  // 4. Paper chunks with vector embeddings
  const chunks = await searchPhilosophicalChunks(question, topK, figureId, authorFilter);
  
  // Get figure name for messages
  const figureName = thinkerName || "this author";
  
  // Build response in the correct order
  let response = `
=== CONCEPTUAL BRIEFING: ${figureName.toUpperCase()}'S WRITINGS ===

You are ${figureName}. The following passages are from YOUR actual writings.
Use these as the foundation for your response - speak AS this philosopher, grounded in these texts.

`;

  // 1. Add structured positions first (highest priority)
  if (positionsContext) {
    response += positionsContext;
  }
  
  // 2. Add structured arguments (premises → conclusion format)
  if (argumentsContext) {
    response += argumentsContext;
  }
  
  // 3. Add text chunks from source texts
  if (textChunksContext) {
    response += textChunksContext;
  }
  
  // 4. Add embedded paper chunks
  if (chunks.length > 0) {
    response += `\n=== ADDITIONAL REFERENCE MATERIAL ===\n\n`;
    for (let i = 0; i < Math.min(chunks.length, 5); i++) {
      const chunk = chunks[i];
      response += `[Reference ${i + 1}] ${chunk.paperTitle} by ${chunk.author}\n${chunk.content}\n\n`;
    }
  }
  
  // QUATERNARY: Add General Knowledge Fund (modern research available to all philosophers)
  const generalKnowledgeContext = await getGeneralKnowledgeContext(question, 5);
  if (generalKnowledgeContext) {
    response += generalKnowledgeContext;
  }
  
  // If no content found at all
  if (!textChunksContext && !positionsContext && !argumentsContext && chunks.length === 0) {
    return `
=== NO SOURCE TEXTS FOUND ===

No source texts were found for ${figureName} in the database.
Use your knowledge of ${figureName}'s philosophical approach and writings to respond.
`;
  }
  
  response += `
=== END OF BRIEFING MATERIAL ===

INSTRUCTIONS:
- You ARE ${figureName}. Respond in first person as this philosopher.
- Ground your response in the source texts above.
- Reason as this philosopher would reason, using their actual concepts and methods.
- Reference specific ideas from the source texts when relevant.
- Speak with the authentic voice and style of ${figureName}.
`;
  
  return response;
}

/**
 * Author name normalization mapping - COMPREHENSIVE COVERAGE
 * Maps ANY variation of author names to their canonical database form
 * Handles: full names, abbreviated names, punctuation variants, case variants
 */
const AUTHOR_ALIASES: Record<string, string> = {
  // Kuczynski variants
  'john-michael kuczynski': 'Kuczynski',
  'johnmichael kuczynski': 'Kuczynski',
  'j-m kuczynski': 'Kuczynski',
  'jm kuczynski': 'Kuczynski',
  'j.m. kuczynski': 'Kuczynski',
  'j.-m. kuczynski': 'Kuczynski',
  'j m kuczynski': 'Kuczynski',
  
  // Russell variants
  'bertrand russell': 'Russell',
  'bertrand arthur william russell': 'Russell',
  'b russell': 'Russell',
  'b. russell': 'Russell',
  
  // Galileo variants
  'galileo galilei': 'Galileo',
  
  // Nietzsche variants
  'friedrich nietzsche': 'Nietzsche',
  'friedrich wilhelm nietzsche': 'Nietzsche',
  'f nietzsche': 'Nietzsche',
  'f. nietzsche': 'Nietzsche',
  
  // Freud variants
  'sigmund freud': 'Freud',
  's freud': 'Freud',
  's. freud': 'Freud',
  
  // James variants
  'william james': 'James',
  'w james': 'James',
  'w. james': 'James',
  
  // Leibniz variants
  'gottfried leibniz': 'Leibniz',
  'gottfried wilhelm leibniz': 'Leibniz',
  'g leibniz': 'Leibniz',
  'g. leibniz': 'Leibniz',
  'g.w. leibniz': 'Leibniz',
  
  // Le Bon variants
  'gustave le bon': 'Le Bon',
  'le bon': 'Le Bon',
  
  // Darwin variants
  'charles darwin': 'Darwin',
  'charles robert darwin': 'Darwin',
  'c darwin': 'Darwin',
  'c. darwin': 'Darwin',
  
  // Kant variants
  'immanuel kant': 'Kant',
  'i kant': 'Kant',
  'i. kant': 'Kant',
  
  // Schopenhauer variants
  'arthur schopenhauer': 'Schopenhauer',
  'a schopenhauer': 'Schopenhauer',
  'a. schopenhauer': 'Schopenhauer',
  
  // Jung variants
  'carl jung': 'Jung',
  'carl gustav jung': 'Jung',
  'c jung': 'Jung',
  'c. jung': 'Jung',
  'c.g. jung': 'Jung',
  'cg jung': 'Jung',
  
  // Poe variants
  'edgar allan poe': 'Poe',
  'edgar poe': 'Poe',
  'e.a. poe': 'Poe',
  'e. a. poe': 'Poe',
  
  // Marx variants
  'karl marx': 'Marx',
  'k marx': 'Marx',
  'k. marx': 'Marx',
  
  // Keynes variants
  'john maynard keynes': 'Keynes',
  'j.m. keynes': 'Keynes',
  'jm keynes': 'Keynes',
  
  // Locke variants
  'john locke': 'Locke',
  'j locke': 'Locke',
  'j. locke': 'Locke',
  
  // Newton variants
  'isaac newton': 'Newton',
  'i newton': 'Newton',
  'i. newton': 'Newton',
  'sir isaac newton': 'Newton',
  
  // Hume variants
  'david hume': 'Hume',
  'd hume': 'Hume',
  'd. hume': 'Hume',
  
  // Machiavelli variants
  'niccolo machiavelli': 'Machiavelli',
  'niccolò machiavelli': 'Machiavelli',
  'n machiavelli': 'Machiavelli',
  'n. machiavelli': 'Machiavelli',
  
  // Bierce variants
  'ambrose bierce': 'Bierce',
  'a bierce': 'Bierce',
  'a. bierce': 'Bierce',
  
  // Poincare variants
  'henri poincare': 'Poincare',
  'henri poincaré': 'Poincare',
  'h poincare': 'Poincare',
  'h. poincare': 'Poincare',
  'h. poincaré': 'Poincare',
  
  // Bergson variants
  'henri bergson': 'Bergson',
  'h bergson': 'Bergson',
  'h. bergson': 'Bergson',
  
  // London variants
  'jack london': 'London',
  'john griffith london': 'London',
  'j london': 'London',
  'j. london': 'London',
  
  // Adler variants
  'alfred adler': 'Adler',
  'a adler': 'Adler',
  'a. adler': 'Adler',
  
  // Engels variants
  'friedrich engels': 'Engels',
  'f engels': 'Engels',
  'f. engels': 'Engels',
  
  // Rousseau variants
  'jean-jacques rousseau': 'Rousseau',
  'jeanjacques rousseau': 'Rousseau',
  'j.j. rousseau': 'Rousseau',
  'jj rousseau': 'Rousseau',
  'j-j rousseau': 'Rousseau',
  
  // Von Mises variants
  'ludwig von mises': 'Mises',
  'von mises': 'Mises',
  'l von mises': 'Mises',
  'l. von mises': 'Mises',
  
  // Veblen variants
  'thorstein veblen': 'Veblen',
  'thorstein bunde veblen': 'Veblen',
  't veblen': 'Veblen',
  't. veblen': 'Veblen',
  
  // Swett variants
  'sophia swett': 'Swett',
  's swett': 'Swett',
  's. swett': 'Swett',
  
  // Berkeley variants
  'george berkeley': 'Berkeley',
  'bishop berkeley': 'Berkeley',
  'g berkeley': 'Berkeley',
  'g. berkeley': 'Berkeley',
  
  // Maimonides variants
  'moses maimonides': 'Maimonides',
  'rabbi moses ben maimon': 'Maimonides',
  'rambam': 'Maimonides',
  
  // Gibbon variants
  'edward gibbon': 'Edward Gibbon',
  'e gibbon': 'Edward Gibbon',
  'e. gibbon': 'Edward Gibbon',
  
  // Additional common variants
  'hegel': 'Hegel',
  'georg hegel': 'Hegel',
  'g.w.f. hegel': 'Hegel',
  'gwf hegel': 'Hegel',
  'descartes': 'Descartes',
  'rené descartes': 'Descartes',
  'rene descartes': 'Descartes',
  'dewey': 'Dewey',
  'john dewey': 'Dewey',
  'lenin': 'Lenin',
  'vladimir lenin': 'Lenin',
  'vladimir ilyich lenin': 'Lenin',
  'spinoza': 'Spinoza',
  'baruch spinoza': 'Spinoza',
  'benedict spinoza': 'Spinoza',
  'hobbes': 'Hobbes',
  'thomas hobbes': 'Hobbes',
  'mill': 'Mill',
  'john stuart mill': 'Mill',
  'j.s. mill': 'Mill',
  'smith': 'Smith',
  'adam smith': 'Smith',
  'spencer': 'Spencer',
  'herbert spencer': 'Spencer',
  'peirce': 'Peirce',
  'charles peirce': 'Peirce',
  'charles sanders peirce': 'Peirce',
  'c.s. peirce': 'Peirce',
  'plato': 'Plato',
  'aristotle': 'Aristotle',
};

/**
 * Strip diacritics/accents from string (é → e, ñ → n, etc.)
 * Critical for matching "POINCARÉ" to database "Poincare"
 */
function stripDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalize author name to canonical form for database lookup
 * ROBUST: Handles ANY variation - strips accents, punctuation, normalizes case, extracts last name
 */
export function normalizeAuthorName(authorInput: string): string {
  if (!authorInput) return authorInput;
  
  // Step 1: Normalize to lowercase and remove extra whitespace
  let normalized = authorInput.toLowerCase().trim();
  
  // Step 2: Strip diacritics (é → e, ñ → n, etc.) - CRITICAL for "POINCARÉ" → "Poincare"
  normalized = stripDiacritics(normalized);
  
  // Step 3: Strip all punctuation except hyphens (keep "jean-jacques")
  normalized = normalized.replace(/[.,'";:]/g, '');
  
  // Step 4: Normalize multiple spaces to single space
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Step 5: Check alias map (exact match after normalization)
  if (AUTHOR_ALIASES[normalized]) {
    return AUTHOR_ALIASES[normalized];
  }
  
  // Step 6: Fallback - extract last name intelligently
  // Split on spaces and filter out common prefixes
  const words = normalized.split(/\s+/).filter(w => 
    w.length > 2 && !['von', 'van', 'de', 'del', 'della', 'le', 'la'].includes(w)
  );
  
  if (words.length > 0) {
    // Take the last significant word and capitalize
    const lastName = words[words.length - 1];
    return lastName.charAt(0).toUpperCase() + lastName.slice(1);
  }
  
  // Step 7: If still nothing, just capitalize the input
  return authorInput.charAt(0).toUpperCase() + authorInput.slice(1).toLowerCase();
}

/**
 * Map figureId (from EZHW/external apps) to canonical author name
 * Maintains backward compatibility with figureId-based queries
 */
export function mapFigureIdToAuthor(figureId: string): string | undefined {
  if (!figureId || figureId === 'common') return undefined;
  
  const FIGURE_ID_TO_AUTHOR: Record<string, string> = {
    'kuczynski': 'J.-M. Kuczynski',
    'russell': 'Bertrand Russell',
    'galileo': 'Galileo',
    'nietzsche': 'Friedrich Nietzsche',
    'spinoza': 'Baruch Spinoza',
    'bacon': 'Francis Bacon',
    'freud': 'Sigmund Freud',
    'william-james': 'William James',
    'leibniz': 'Gottfried Wilhelm Leibniz',
    'aristotle': 'Aristotle',
    'lebon': 'Gustave Le Bon',
    'plato': 'Plato',
    'darwin': 'Charles Darwin',
    'kant': 'Immanuel Kant',
    'schopenhauer': 'Arthur Schopenhauer',
    'bergson': 'Henri Bergson',
    'jung': 'Carl Jung',
    'bierce': 'Ambrose Bierce',
    'marx': 'Karl Marx',
    'poe': 'Edgar Allan Poe',
    'machiavelli': 'Niccolò Machiavelli',
    'keynes': 'John Maynard Keynes',
    'hume': 'David Hume',
    'james-allen': 'James Allen',
    'newton': 'Isaac Newton',
    'locke': 'John Locke',
    'london': 'Jack London',
    'poincare': 'Henri Poincaré',
    'la-rochefoucauld': 'François de La Rochefoucauld',
    'dewey': 'John Dewey',
    'descartes': 'René Descartes',
    'lenin': 'Vladimir Lenin',
    'hegel': 'G.W.F. Hegel',
    'hobbes': 'Thomas Hobbes',
    'berkeley': 'George Berkeley',
    'veblen': 'Thorstein Veblen',
    'rousseau': 'Jean-Jacques Rousseau',
    'mill': 'John Stuart Mill',
    'engels': 'Friedrich Engels',
    'mises': 'Ludwig von Mises',
    'smith': 'Adam Smith',
    'spencer': 'Herbert Spencer',
    'marden': 'Orison Swett Marden',
    'adler': 'Alfred Adler',
    'peirce': 'Charles Sanders Peirce',
    'maimonides': 'Moses Maimonides',
    'gibbon': 'Edward Gibbon',
    'reich': 'Wilhelm Reich',
    'orwell': 'George Orwell',
  };
  
  return FIGURE_ID_TO_AUTHOR[figureId.toLowerCase()];
}

/**
 * Detect author name from query text using database lookup
 * Returns author name if detected, undefined otherwise
 */
export async function detectAuthorFromQuery(queryText: string): Promise<string | undefined> {
  // COMPLETE author list for ZHI external API detection
  const authorPatterns = [
    'Kuczynski', 'Russell', 'Galileo', 'Nietzsche', 'Spinoza', 'Bacon',
    'Freud', 'James', 'Leibniz', 'Aristotle', 'Le Bon', 'Plato',
    'Darwin', 'Kant', 'Schopenhauer', 'Bergson', 'Jung', 'Bierce',
    'Marx', 'Poe', 'Machiavelli', 'Keynes', 'Hume', 'Newton',
    'Locke', 'London', 'Poincare', 'La Rochefoucauld', 'Dewey',
    'Descartes', 'Lenin', 'Hegel', 'Hobbes', 'Berkeley', 'Veblen',
    'Rousseau', 'Mill', 'Engels', 'Mises', 'Smith', 'Spencer',
    'Marden', 'Swett', 'Adler', 'Peirce', 'Maimonides', 'Gibbon',
    'Reich', 'Stekel', 'Orwell', 'Allen'
  ];
  
  const queryUpper = queryText.toUpperCase();
  
  for (const authorName of authorPatterns) {
    if (queryUpper.includes(authorName.toUpperCase())) {
      // Verify this author exists in database
      const chunks = await db.execute(
        sql`SELECT COUNT(*) as count FROM chunks 
            WHERE thinker ILIKE ${'%' + authorName + '%'} 
            LIMIT 1`
      );
      
      const count = (chunks.rows[0] as any)?.count;
      if (count && parseInt(count) > 0) {
        return authorName;
      }
    }
  }
  
  return undefined;
}

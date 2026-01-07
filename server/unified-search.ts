import OpenAI from "openai";
import { db } from "./db";
import { chunks, positions, argumentsTable, quotes } from "@shared/schema";
import { sql } from "drizzle-orm";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface SearchHit {
  id: string;
  type: "chunk" | "position" | "argument" | "quote";
  thinker: string;
  content: string;
  topic?: string | null;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface UnifiedSearchResult {
  hits: SearchHit[];
  query: string;
  embeddingTime: number;
  searchTime: number;
  totalHits: number;
}

async function embedQuery(query: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: query,
  });
  return response.data[0].embedding;
}

async function vectorSearchChunks(
  embedding: number[],
  thinker: string | null,
  limit: number
): Promise<SearchHit[]> {
  const embeddingStr = `[${embedding.join(",")}]`;
  
  let query = sql`
    SELECT 
      id,
      thinker,
      chunk_text as content,
      NULL as topic,
      1 - (embedding <=> ${embeddingStr}::vector) as score
    FROM chunks
    WHERE embedding IS NOT NULL
  `;
  
  if (thinker) {
    query = sql`
      SELECT 
        id,
        thinker,
        chunk_text as content,
        NULL as topic,
        1 - (embedding <=> ${embeddingStr}::vector) as score
      FROM chunks
      WHERE embedding IS NOT NULL AND thinker = ${thinker}
    `;
  }
  
  const results = await db.execute(sql`
    ${query}
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `);
  
  return (results.rows as any[]).map((r) => ({
    id: r.id,
    type: "chunk" as const,
    thinker: r.thinker,
    content: r.content,
    topic: r.topic,
    score: parseFloat(r.score) || 0,
  }));
}

async function vectorSearchPositions(
  embedding: number[],
  thinker: string | null,
  limit: number
): Promise<SearchHit[]> {
  const embeddingStr = `[${embedding.join(",")}]`;
  
  const thinkerClause = thinker ? sql`AND thinker = ${thinker}` : sql``;
  
  const results = await db.execute(sql`
    SELECT 
      id,
      thinker,
      position_text as content,
      topic,
      1 - (embedding <=> ${embeddingStr}::vector) as score
    FROM positions
    WHERE embedding IS NOT NULL ${thinkerClause}
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `);
  
  return (results.rows as any[]).map((r) => ({
    id: r.id,
    type: "position" as const,
    thinker: r.thinker,
    content: r.content,
    topic: r.topic,
    score: parseFloat(r.score) || 0,
  }));
}

async function vectorSearchArguments(
  embedding: number[],
  thinker: string | null,
  limit: number
): Promise<SearchHit[]> {
  const embeddingStr = `[${embedding.join(",")}]`;
  
  const thinkerClause = thinker ? sql`AND thinker = ${thinker}` : sql``;
  
  const results = await db.execute(sql`
    SELECT 
      id,
      thinker,
      conclusion as content,
      topic,
      premises,
      argument_type,
      importance,
      1 - (embedding <=> ${embeddingStr}::vector) as score
    FROM arguments
    WHERE embedding IS NOT NULL ${thinkerClause}
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `);
  
  return (results.rows as any[]).map((r) => ({
    id: r.id,
    type: "argument" as const,
    thinker: r.thinker,
    content: r.content,
    topic: r.topic,
    score: parseFloat(r.score) || 0,
    metadata: {
      premises: r.premises,
      argumentType: r.argument_type,
      importance: r.importance,
    },
  }));
}

async function vectorSearchQuotes(
  embedding: number[],
  thinker: string | null,
  limit: number
): Promise<SearchHit[]> {
  const embeddingStr = `[${embedding.join(",")}]`;
  
  const thinkerClause = thinker ? sql`AND thinker = ${thinker}` : sql``;
  
  const results = await db.execute(sql`
    SELECT 
      id,
      thinker,
      quote_text as content,
      topic,
      1 - (embedding <=> ${embeddingStr}::vector) as score
    FROM quotes
    WHERE embedding IS NOT NULL ${thinkerClause}
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `);
  
  return (results.rows as any[]).map((r) => ({
    id: r.id,
    type: "quote" as const,
    thinker: r.thinker,
    content: r.content,
    topic: r.topic,
    score: parseFloat(r.score) || 0,
  }));
}

async function keywordSearch(
  query: string,
  thinker: string | null,
  limit: number
): Promise<SearchHit[]> {
  const sanitized = query.trim();
  if (sanitized.length < 3) return [];
  
  const thinkerClause = thinker ? sql`AND thinker = ${thinker}` : sql``;
  
  try {
    const results = await db.execute(sql`
      (
        SELECT id, 'chunk' as type, thinker, chunk_text as content, NULL as topic,
               ts_rank(to_tsvector('english', chunk_text), plainto_tsquery('english', ${sanitized})) as score
        FROM chunks
        WHERE to_tsvector('english', chunk_text) @@ plainto_tsquery('english', ${sanitized}) ${thinkerClause}
        LIMIT ${Math.ceil(limit / 4)}
      )
      UNION ALL
      (
        SELECT id, 'position' as type, thinker, position_text as content, topic,
               ts_rank(to_tsvector('english', position_text), plainto_tsquery('english', ${sanitized})) as score
        FROM positions
        WHERE to_tsvector('english', position_text) @@ plainto_tsquery('english', ${sanitized}) ${thinkerClause}
        LIMIT ${Math.ceil(limit / 4)}
      )
      UNION ALL
      (
        SELECT id, 'argument' as type, thinker, conclusion as content, topic,
               ts_rank(to_tsvector('english', conclusion), plainto_tsquery('english', ${sanitized})) as score
        FROM arguments
        WHERE to_tsvector('english', conclusion) @@ plainto_tsquery('english', ${sanitized}) ${thinkerClause}
        LIMIT ${Math.ceil(limit / 4)}
      )
      UNION ALL
      (
        SELECT id, 'quote' as type, thinker, quote_text as content, topic,
               ts_rank(to_tsvector('english', quote_text), plainto_tsquery('english', ${sanitized})) as score
        FROM quotes
        WHERE to_tsvector('english', quote_text) @@ plainto_tsquery('english', ${sanitized}) ${thinkerClause}
        LIMIT ${Math.ceil(limit / 4)}
      )
      ORDER BY score DESC
      LIMIT ${limit}
    `);
    
    return (results.rows as any[]).map((r) => ({
      id: r.id,
      type: r.type as SearchHit["type"],
      thinker: r.thinker,
      content: r.content,
      topic: r.topic,
      score: parseFloat(r.score) || 0,
    }));
  } catch (error) {
    console.error("[keywordSearch] Error:", error);
    return [];
  }
}

function rerank(hits: SearchHit[]): SearchHit[] {
  const seen = new Set<string>();
  const deduped: SearchHit[] = [];
  
  for (const hit of hits) {
    const key = `${hit.type}:${hit.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(hit);
    }
  }
  
  return deduped.sort((a, b) => {
    const typeWeight = { position: 1.2, argument: 1.15, quote: 1.1, chunk: 1.0 };
    const aScore = a.score * (typeWeight[a.type] || 1);
    const bScore = b.score * (typeWeight[b.type] || 1);
    return bScore - aScore;
  });
}

export async function unifiedSearch(
  query: string,
  options: {
    thinker?: string | null;
    limit?: number;
    includeKeyword?: boolean;
  } = {}
): Promise<UnifiedSearchResult> {
  const { thinker = null, limit = 20, includeKeyword = true } = options;
  const perTableLimit = Math.ceil(limit / 2);
  
  const embeddingStart = Date.now();
  const embedding = await embedQuery(query);
  const embeddingTime = Date.now() - embeddingStart;
  
  const searchStart = Date.now();
  
  const [chunkHits, positionHits, argumentHits, quoteHits, keywordHits] =
    await Promise.all([
      vectorSearchChunks(embedding, thinker, perTableLimit),
      vectorSearchPositions(embedding, thinker, perTableLimit),
      vectorSearchArguments(embedding, thinker, perTableLimit),
      vectorSearchQuotes(embedding, thinker, perTableLimit),
      includeKeyword ? keywordSearch(query, thinker, perTableLimit) : Promise.resolve([]),
    ]);
  
  const searchTime = Date.now() - searchStart;
  
  const allHits = [
    ...chunkHits,
    ...positionHits,
    ...argumentHits,
    ...quoteHits,
    ...keywordHits.map((h) => ({ ...h, score: h.score * 0.5 })),
  ];
  
  const ranked = rerank(allHits);
  const topHits = ranked.slice(0, limit);
  
  return {
    hits: topHits,
    query,
    embeddingTime,
    searchTime,
    totalHits: allHits.length,
  };
}

export function formatCitations(hits: SearchHit[]): string {
  if (hits.length === 0) return "";
  
  const grouped: Record<string, SearchHit[]> = {};
  for (const hit of hits) {
    if (!grouped[hit.type]) grouped[hit.type] = [];
    grouped[hit.type].push(hit);
  }
  
  let output = "\n\n--- RETRIEVED KNOWLEDGE ---\n\n";
  
  if (grouped.position?.length) {
    output += "=== CORE POSITIONS ===\n";
    for (const p of grouped.position.slice(0, 5)) {
      output += `[${p.thinker}] ${p.content}\n`;
      if (p.topic) output += `  Topic: ${p.topic}\n`;
    }
    output += "\n";
  }
  
  if (grouped.argument?.length) {
    output += "=== KEY ARGUMENTS ===\n";
    for (const a of grouped.argument.slice(0, 3)) {
      const meta = a.metadata as any;
      if (meta?.premises) {
        output += `[${a.thinker}] Premises:\n`;
        for (const p of meta.premises) {
          output += `  - ${p}\n`;
        }
        output += `  Conclusion: ${a.content}\n`;
      } else {
        output += `[${a.thinker}] ${a.content}\n`;
      }
    }
    output += "\n";
  }
  
  if (grouped.quote?.length) {
    output += "=== RELEVANT QUOTES ===\n";
    for (const q of grouped.quote.slice(0, 4)) {
      output += `[${q.thinker}] "${q.content}"\n`;
    }
    output += "\n";
  }
  
  if (grouped.chunk?.length) {
    output += "=== TEXT PASSAGES ===\n";
    for (const c of grouped.chunk.slice(0, 4)) {
      const snippet = c.content.length > 300 ? c.content.slice(0, 300) + "..." : c.content;
      output += `[${c.thinker}] ${snippet}\n\n`;
    }
  }
  
  return output;
}

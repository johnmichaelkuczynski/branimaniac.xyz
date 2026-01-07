import { db } from "./db";
import { positions, quotes, chunks } from "@shared/schema";
import { sql } from "drizzle-orm";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export interface TraceEvent {
  timestamp: number;
  type: 'query' | 'search_start' | 'passage_found' | 'passage_rejected' | 'direct_answer' | 'alignment_check' | 'generation_start' | 'complete' | 'error';
  table?: 'positions' | 'quotes' | 'chunks';
  sql?: string;
  passage?: string;
  passageId?: number;
  reason?: string;
  answerNumber?: 1 | 2 | 3;
  aligned?: boolean;
  conflicting?: boolean;
  message?: string;
}

export interface DirectAnswer {
  text: string;
  source: 'positions' | 'quotes' | 'chunks';
  sourceId: number | string;
  topic?: string;
  relevanceScore: number;
}

export interface AuditResult {
  question: string;
  thinker: string;
  timestamp: Date;
  directAnswers: DirectAnswer[];
  aligned: boolean;
  conflicting: boolean;
  hasDirectAnswer: boolean;
  trace: TraceEvent[];
  adjacentMaterial: string[];
  finalDecision: 'aligned' | 'conflicting' | 'no_direct_answer';
}

async function embedQuery(question: string): Promise<number[] | null> {
  if (!openai) return null;
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: question.slice(0, 8000),
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("[Audit] Embedding error:", error);
    return null;
  }
}

function isDirectAnswer(passage: string, question: string): { isDirect: boolean; score: number; reason: string } {
  const passageLower = passage.toLowerCase();
  const questionLower = question.toLowerCase();
  
  const questionWords = questionLower
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['what', 'when', 'where', 'which', 'that', 'this', 'have', 'does', 'would', 'could', 'should', 'about', 'think', 'your', 'with', 'from', 'they', 'their', 'there', 'been', 'being', 'were', 'will'].includes(w));
  
  if (questionWords.length === 0) {
    return { isDirect: false, score: 0, reason: "Question has no searchable keywords" };
  }
  
  let matchCount = 0;
  for (const word of questionWords) {
    if (passageLower.includes(word)) {
      matchCount++;
    }
  }
  
  const matchRatio = matchCount / questionWords.length;
  
  if (matchRatio >= 0.5 && passage.length >= 50) {
    return { isDirect: true, score: matchRatio, reason: `Matches ${matchCount}/${questionWords.length} key terms` };
  }
  
  if (matchRatio >= 0.3 && passage.length >= 100) {
    return { isDirect: true, score: matchRatio * 0.8, reason: `Partial match: ${matchCount}/${questionWords.length} terms` };
  }
  
  return { isDirect: false, score: matchRatio, reason: `Only ${matchCount}/${questionWords.length} terms match` };
}

function checkAlignment(answers: DirectAnswer[]): { aligned: boolean; conflicting: boolean } {
  if (answers.length < 2) {
    return { aligned: true, conflicting: false };
  }
  
  const texts = answers.map(a => a.text.toLowerCase());
  
  const contradictionPatterns = [
    [/\bis\b/, /\bis not\b/],
    [/\bexists\b/, /\bdoes not exist\b/],
    [/\btrue\b/, /\bfalse\b/],
    [/\bgood\b/, /\bbad\b/],
    [/\bpossible\b/, /\bimpossible\b/],
    [/\bnecessary\b/, /\bunnecessary\b/],
    [/\balways\b/, /\bnever\b/],
    [/\ball\b/, /\bnone\b/],
    [/\bshould\b/, /\bshould not\b/],
    [/\bmust\b/, /\bmust not\b/],
  ];
  
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      for (const [pattern1, pattern2] of contradictionPatterns) {
        if ((pattern1.test(texts[i]) && pattern2.test(texts[j])) ||
            (pattern2.test(texts[i]) && pattern1.test(texts[j]))) {
          return { aligned: false, conflicting: true };
        }
      }
    }
  }
  
  return { aligned: true, conflicting: false };
}

export async function auditedCorpusSearch(
  question: string,
  thinker: string,
  onTraceEvent?: (event: TraceEvent) => void
): Promise<AuditResult> {
  const trace: TraceEvent[] = [];
  const directAnswers: DirectAnswer[] = [];
  const adjacentMaterial: string[] = [];
  
  const emit = (event: TraceEvent) => {
    trace.push(event);
    if (onTraceEvent) {
      onTraceEvent(event);
    }
  };
  
  emit({ timestamp: Date.now(), type: 'query', message: `Searching corpus for: "${question}"` });
  
  const queryEmbedding = await embedQuery(question);
  
  emit({ timestamp: Date.now(), type: 'search_start', table: 'positions', message: 'Searching POSITIONS table first (highest signal)' });
  
  const positionsSql = `SELECT id, position_text, topic FROM positions WHERE thinker ILIKE '%${thinker}%' ORDER BY ${queryEmbedding ? 'embedding <=> $1::vector' : 'RANDOM()'} LIMIT 20`;
  emit({ timestamp: Date.now(), type: 'query', table: 'positions', sql: positionsSql });
  
  try {
    let positionsResult;
    if (queryEmbedding) {
      positionsResult = await db.execute(sql`
        SELECT id, position_text, topic,
               embedding <=> ${JSON.stringify(queryEmbedding)}::vector as distance
        FROM positions 
        WHERE thinker ILIKE ${'%' + thinker + '%'}
        ORDER BY distance
        LIMIT 20
      `);
    } else {
      positionsResult = await db.execute(sql`
        SELECT id, position_text, topic
        FROM positions 
        WHERE thinker ILIKE ${'%' + thinker + '%'}
        LIMIT 20
      `);
    }
    
    for (const row of positionsResult.rows || []) {
      const r = row as any;
      const { isDirect, score, reason } = isDirectAnswer(r.position_text, question);
      
      if (isDirect && directAnswers.length < 3) {
        emit({
          timestamp: Date.now(),
          type: 'direct_answer',
          table: 'positions',
          passage: r.position_text.substring(0, 200) + '...',
          passageId: r.id,
          answerNumber: (directAnswers.length + 1) as 1 | 2 | 3,
          reason: reason
        });
        
        directAnswers.push({
          text: r.position_text,
          source: 'positions',
          sourceId: r.id,
          topic: r.topic,
          relevanceScore: score
        });
      } else {
        emit({
          timestamp: Date.now(),
          type: 'passage_rejected',
          table: 'positions',
          passage: r.position_text.substring(0, 100) + '...',
          passageId: r.id,
          reason: reason
        });
        
        if (!isDirect && score > 0.1) {
          adjacentMaterial.push(r.position_text);
        }
      }
      
      if (directAnswers.length >= 3) break;
    }
  } catch (error) {
    emit({ timestamp: Date.now(), type: 'error', table: 'positions', message: `Error: ${error}` });
  }
  
  if (directAnswers.length < 3) {
    emit({ timestamp: Date.now(), type: 'search_start', table: 'quotes', message: 'Searching QUOTES table (need more direct answers)' });
    
    const quotesSql = `SELECT id, quote_text, topic, source_text_id FROM quotes WHERE thinker ILIKE '%${thinker}%' ORDER BY ${queryEmbedding ? 'embedding <=> $1::vector' : 'RANDOM()'} LIMIT 20`;
    emit({ timestamp: Date.now(), type: 'query', table: 'quotes', sql: quotesSql });
    
    try {
      let quotesResult;
      if (queryEmbedding) {
        quotesResult = await db.execute(sql`
          SELECT id, quote_text, topic, source_text_id,
                 embedding <=> ${JSON.stringify(queryEmbedding)}::vector as distance
          FROM quotes 
          WHERE thinker ILIKE ${'%' + thinker + '%'}
          ORDER BY distance
          LIMIT 20
        `);
      } else {
        quotesResult = await db.execute(sql`
          SELECT id, quote_text, topic, source_text_id
          FROM quotes 
          WHERE thinker ILIKE ${'%' + thinker + '%'}
          LIMIT 20
        `);
      }
      
      for (const row of quotesResult.rows || []) {
        const r = row as any;
        const { isDirect, score, reason } = isDirectAnswer(r.quote_text, question);
        
        if (isDirect && directAnswers.length < 3) {
          emit({
            timestamp: Date.now(),
            type: 'direct_answer',
            table: 'quotes',
            passage: r.quote_text.substring(0, 200) + '...',
            passageId: r.id,
            answerNumber: (directAnswers.length + 1) as 1 | 2 | 3,
            reason: reason
          });
          
          directAnswers.push({
            text: r.quote_text,
            source: 'quotes',
            sourceId: r.id,
            topic: r.topic || r.source_text_id,
            relevanceScore: score
          });
        } else {
          emit({
            timestamp: Date.now(),
            type: 'passage_rejected',
            table: 'quotes',
            passage: r.quote_text.substring(0, 100) + '...',
            passageId: r.id,
            reason: reason
          });
          
          if (!isDirect && score > 0.1) {
            adjacentMaterial.push(r.quote_text);
          }
        }
        
        if (directAnswers.length >= 3) break;
      }
    } catch (error) {
      emit({ timestamp: Date.now(), type: 'error', table: 'quotes', message: `Error: ${error}` });
    }
  }
  
  if (directAnswers.length < 3) {
    emit({ timestamp: Date.now(), type: 'search_start', table: 'chunks', message: 'Searching CHUNKS table (full works, last resort)' });
    
    const chunksSql = `SELECT id, chunk_text, source_text_id FROM chunks WHERE thinker ILIKE '%${thinker}%' ORDER BY ${queryEmbedding ? 'embedding <=> $1::vector' : 'RANDOM()'} LIMIT 30`;
    emit({ timestamp: Date.now(), type: 'query', table: 'chunks', sql: chunksSql });
    
    try {
      let chunksResult;
      if (queryEmbedding) {
        chunksResult = await db.execute(sql`
          SELECT id, chunk_text, source_text_id,
                 embedding <=> ${JSON.stringify(queryEmbedding)}::vector as distance
          FROM chunks 
          WHERE thinker ILIKE ${'%' + thinker + '%'}
          ORDER BY distance
          LIMIT 30
        `);
      } else {
        chunksResult = await db.execute(sql`
          SELECT id, chunk_text, source_text_id
          FROM chunks 
          WHERE thinker ILIKE ${'%' + thinker + '%'}
          LIMIT 30
        `);
      }
      
      for (const row of chunksResult.rows || []) {
        const r = row as any;
        const { isDirect, score, reason } = isDirectAnswer(r.chunk_text, question);
        
        if (isDirect && directAnswers.length < 3) {
          emit({
            timestamp: Date.now(),
            type: 'direct_answer',
            table: 'chunks',
            passage: r.chunk_text.substring(0, 200) + '...',
            passageId: r.id,
            answerNumber: (directAnswers.length + 1) as 1 | 2 | 3,
            reason: reason
          });
          
          directAnswers.push({
            text: r.chunk_text,
            source: 'chunks',
            sourceId: r.id,
            topic: r.source_text_id,
            relevanceScore: score
          });
        } else {
          emit({
            timestamp: Date.now(),
            type: 'passage_rejected',
            table: 'chunks',
            passage: r.chunk_text.substring(0, 100) + '...',
            passageId: r.id,
            reason: reason
          });
          
          if (!isDirect && score > 0.1) {
            adjacentMaterial.push(r.chunk_text);
          }
        }
        
        if (directAnswers.length >= 3) break;
      }
    } catch (error) {
      emit({ timestamp: Date.now(), type: 'error', table: 'chunks', message: `Error: ${error}` });
    }
  }
  
  const alignment = checkAlignment(directAnswers);
  
  emit({
    timestamp: Date.now(),
    type: 'alignment_check',
    aligned: alignment.aligned,
    conflicting: alignment.conflicting,
    message: directAnswers.length >= 3 
      ? (alignment.conflicting ? 'Found 3 answers but they CONFLICT - will present separately' : 'Found 3 aligned answers - proceeding')
      : `Only found ${directAnswers.length} direct answers - using adjacent material`
  });
  
  let finalDecision: 'aligned' | 'conflicting' | 'no_direct_answer';
  if (directAnswers.length >= 1 && !alignment.conflicting) {
    finalDecision = 'aligned';
  } else if (alignment.conflicting) {
    finalDecision = 'conflicting';
  } else {
    finalDecision = 'no_direct_answer';
  }
  
  emit({
    timestamp: Date.now(),
    type: 'complete',
    message: `Search complete. Decision: ${finalDecision}. Found ${directAnswers.length} direct answers, ${adjacentMaterial.length} adjacent passages.`
  });
  
  return {
    question,
    thinker,
    timestamp: new Date(),
    directAnswers,
    aligned: alignment.aligned,
    conflicting: alignment.conflicting,
    hasDirectAnswer: directAnswers.length > 0,
    trace,
    adjacentMaterial: adjacentMaterial.slice(0, 5),
    finalDecision
  };
}

export function generateAuditReport(result: AuditResult): string {
  const lines: string[] = [];
  
  lines.push('=' .repeat(60));
  lines.push('AUDIT REPORT: CORPUS SEARCH TRACE');
  lines.push('=' .repeat(60));
  lines.push('');
  lines.push(`Question: ${result.question}`);
  lines.push(`Thinker: ${result.thinker}`);
  lines.push(`Timestamp: ${result.timestamp.toISOString()}`);
  lines.push(`Final Decision: ${result.finalDecision.toUpperCase()}`);
  lines.push('');
  
  lines.push('-'.repeat(60));
  lines.push('EXECUTION TRACE');
  lines.push('-'.repeat(60));
  
  for (const event of result.trace) {
    const time = new Date(event.timestamp).toISOString().split('T')[1];
    let line = `[${time}] ${event.type.toUpperCase()}`;
    
    if (event.table) line += ` (${event.table})`;
    if (event.message) line += `: ${event.message}`;
    if (event.sql) line += `\n    SQL: ${event.sql.substring(0, 100)}...`;
    if (event.passage) line += `\n    Passage: "${event.passage}"`;
    if (event.reason) line += `\n    Reason: ${event.reason}`;
    if (event.answerNumber) line += `\n    -> Direct Answer #${event.answerNumber}`;
    
    lines.push(line);
  }
  
  lines.push('');
  lines.push('-'.repeat(60));
  lines.push('DIRECT ANSWERS FOUND');
  lines.push('-'.repeat(60));
  
  if (result.directAnswers.length === 0) {
    lines.push('No direct answers found in corpus.');
  } else {
    for (let i = 0; i < result.directAnswers.length; i++) {
      const answer = result.directAnswers[i];
      lines.push(`\nDirect Answer #${i + 1}:`);
      lines.push(`  Source: ${answer.source} (ID: ${answer.sourceId})`);
      lines.push(`  Topic: ${answer.topic || 'N/A'}`);
      lines.push(`  Relevance Score: ${(answer.relevanceScore * 100).toFixed(1)}%`);
      lines.push(`  Text: "${answer.text.substring(0, 500)}${answer.text.length > 500 ? '...' : ''}"`);
    }
  }
  
  lines.push('');
  lines.push('-'.repeat(60));
  lines.push('ALIGNMENT ANALYSIS');
  lines.push('-'.repeat(60));
  lines.push(`Answers Aligned: ${result.aligned ? 'YES' : 'NO'}`);
  lines.push(`Contradictions Detected: ${result.conflicting ? 'YES' : 'NO'}`);
  
  if (result.adjacentMaterial.length > 0) {
    lines.push('');
    lines.push('-'.repeat(60));
    lines.push('ADJACENT MATERIAL (used if no direct answer)');
    lines.push('-'.repeat(60));
    for (let i = 0; i < result.adjacentMaterial.length; i++) {
      lines.push(`\n[${i + 1}] ${result.adjacentMaterial[i].substring(0, 300)}...`);
    }
  }
  
  lines.push('');
  lines.push('=' .repeat(60));
  lines.push('END OF AUDIT REPORT');
  lines.push('=' .repeat(60));
  
  return lines.join('\n');
}

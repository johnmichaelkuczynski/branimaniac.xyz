import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PaperChunk {
  title: string;
  content: string;
  relevanceScore: number;
}

// Load all papers at startup
const papers = {
  pragmatism: readFileSync(join(__dirname, "kuczynski_pragmatism.txt"), "utf-8"),
  analyticPhil: readFileSync(join(__dirname, "kuczynski_analytic_philosophy.txt"), "utf-8"),
  ocd: readFileSync(join(__dirname, "kuczynski_ocd_philosophy.txt"), "utf-8"),
  ai: readFileSync(join(__dirname, "kuczynski_ai_philosophy.txt"), "utf-8"),
  apriori: readFileSync(join(__dirname, "kuczynski_apriori.txt"), "utf-8"),
  theoryOfKnowledge: readFileSync(join(__dirname, "kuczynski_theory_of_knowledge.txt"), "utf-8"),
  possibleWorlds: readFileSync(join(__dirname, "kuczynski_possible_worlds.txt"), "utf-8"),
  counterfactuals: readFileSync(join(__dirname, "kuczynski_counterfactuals.txt"), "utf-8"),
  theoreticalKnowledge: readFileSync(join(__dirname, "kuczynski_theoretical_knowledge.txt"), "utf-8"),
  analysisOfAnalysis: readFileSync(join(__dirname, "kuczynski_analysis_of_analysis.txt"), "utf-8"),
  intensionality: readFileSync(join(__dirname, "kuczynski_intensionality.pdf"), "utf-8"),
  presemantic: readFileSync(join(__dirname, "kuczynski_presemantic.pdf"), "utf-8"),
  causation: readFileSync(join(__dirname, "kuczynski_causation.txt"), "utf-8"),
  russell: readFileSync(join(__dirname, "kuczynski_russell.txt"), "utf-8"),
  fregeLogicism: readFileSync(join(__dirname, "kuczynski_frege_logicism.txt"), "utf-8"),
  thoughtLanguage: readFileSync(join(__dirname, "kuczynski_thought_language.txt"), "utf-8"),
};

const paperTitles: { [key: string]: string } = {
  pragmatism: "Pragmatism: Epistemology Posing as Metaphysics",
  analyticPhil: "Analytic Philosophy",
  ocd: "OCD and Philosophy",
  ai: "AI and Philosophy",
  apriori: "A Priori Knowledge",
  theoryOfKnowledge: "Outline of a Theory of Knowledge",
  possibleWorlds: "Possible World Semantics",
  counterfactuals: "Counterfactuals",
  theoreticalKnowledge: "Theoretical Knowledge and Inductive Inference",
  analysisOfAnalysis: "The Analysis of Analysis",
  intensionality: "Intensionality, Modality, and Rationality",
  presemantic: "Presemantic Implicature and Cognitive Content",
  causation: "Causation",
  russell: "Russell's Improvements on Frege's Work",
  fregeLogicism: "Frege's Formalization of Logic and Logicism",
  thoughtLanguage: "The Relationship between Thought and Language",
};

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 100);
}

function extractKeywords(question: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "should", "could", "can", "may", "might", "what", "when",
    "where", "why", "how", "who", "which", "this", "that", "these", "those"
  ]);
  
  return question
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
}

function calculateRelevance(paragraph: string, keywords: string[]): number {
  const lowerPara = paragraph.toLowerCase();
  let score = 0;
  
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}`, "gi");
    const matches = lowerPara.match(regex);
    if (matches) {
      score += matches.length * 2;
    }
    if (lowerPara.includes(keyword)) {
      score += 1;
    }
  }
  
  return score;
}

export function findRelevantParagraphs(question: string, maxParagraphs: number = 6): string {
  const keywords = extractKeywords(question);
  const chunks: PaperChunk[] = [];
  
  for (const [key, content] of Object.entries(papers)) {
    const paragraphs = splitIntoParagraphs(content);
    
    for (const paragraph of paragraphs) {
      const relevanceScore = calculateRelevance(paragraph, keywords);
      
      if (relevanceScore > 0) {
        chunks.push({
          title: paperTitles[key],
          content: paragraph,
          relevanceScore,
        });
      }
    }
  }
  
  chunks.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  const topChunks = chunks.slice(0, maxParagraphs);
  
  if (topChunks.length === 0) {
    return `
=== NO DIRECTLY RELEVANT PASSAGES FOUND ===

The user's question doesn't match specific passages from the papers.
Use your full philosophical intelligence informed by Kuczynski's overall approach.
Extrapolate and reason philosophically in his style.
`;
  }
  
  let result = `
=== RELEVANT PASSAGES FROM KUCZYNSKI'S PAPERS ===

Found ${topChunks.length} relevant passage(s) for your question.
Use these as your foundation, then extrapolate with your full intelligence.

`;
  
  for (let i = 0; i < topChunks.length; i++) {
    const chunk = topChunks[i];
    result += `
--- PASSAGE ${i + 1}: ${chunk.title} ---
${chunk.content}

`;
  }
  
  result += `
=== END OF RELEVANT PASSAGES ===

INSTRUCTIONS:
1. Ground your answer in these passages (include at least one verbatim quote)
2. Use your full philosophical intelligence to extrapolate beyond them
3. Maintain Kuczynski's rigorous, analytical style
4. Answer varies each time - explore different angles
`;
  
  return result;
}

export function getAllPapers(): string {
  let result = `
=== YOUR COMPLETE PHILOSOPHICAL LIBRARY ===

--- PRAGMATISM: EPISTEMOLOGY POSING AS METAPHYSICS ---
${papers.pragmatism}

--- ANALYTIC PHILOSOPHY ---
${papers.analyticPhil.substring(0, 140000)}

--- OCD AND PHILOSOPHY ---
${papers.ocd}

--- AI AND PHILOSOPHY ---
${papers.ai}

--- A PRIORI KNOWLEDGE AND OTHER PHILOSOPHICAL WORKS ---
${papers.apriori}

--- OUTLINE OF A THEORY OF KNOWLEDGE ---
${papers.theoryOfKnowledge}

--- POSSIBLE WORLD SEMANTICS ---
${papers.possibleWorlds}

--- COUNTERFACTUALS ---
${papers.counterfactuals}

--- THEORETICAL KNOWLEDGE AND INDUCTIVE INFERENCE ---
${papers.theoreticalKnowledge}

--- THE ANALYSIS OF ANALYSIS: ANALYTIC PHILOSOPHY AS LOGICAL ANALYSIS ---
${papers.analysisOfAnalysis}

--- INTENSIONALITY, MODALITY, AND RATIONALITY: PRESEMANTIC CONSIDERATIONS ---
${papers.intensionality}

--- PRESEMANTIC IMPLICATURE AND COGNITIVE CONTENT ---
${papers.presemantic}

--- CHAPTER 3: CAUSATION ---
${papers.causation}

--- CHAPTER 6: RUSSELL'S IMPROVEMENTS ON FREGE'S WORK ---
${papers.russell}

--- CHAPTER 7: SOME REMARKS ON LOGICISM AND ON FREGE'S FORMALIZATION OF LOGIC ---
${papers.fregeLogicism}

--- CHAPTER 8: THE RELATIONSHIP BETWEEN THOUGHT AND LANGUAGE ---
${papers.thoughtLanguage}
`;
  
  return result;
}

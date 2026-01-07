import { db } from "./db";
import { paperChunks } from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface RussellPosition {
  positionId: string;
  domain: string;
  title: string;
  thesis: string;
  keyArguments: string[];
  sourceWork: string;
  sourceLocation: string;
  significance: string;
  relatedConcepts: string[];
}

// COMPREHENSIVE RUSSELL POSITIONS DATABASE  
// Covering all major domains and works
const RUSSELL_CORE_POSITIONS: RussellPosition[] = [
  // === EPISTEMOLOGY ===
  {
    positionId: "RUSSELL-EPIST-001",
    domain: "EPISTEMOLOGY",
    title: "Knowledge by Acquaintance vs. Knowledge by Description",
    thesis: "All knowledge ultimately rests on knowledge by acquaintance with particulars (sense-data, memory, self) and universals, while knowledge by description is derivative and involves both acquaintance and knowledge of truths.",
    keyArguments: [
      "We are directly acquainted with sense-data without inference",
      "We are acquainted with universals like whiteness and resemblance",
      "Physical objects are known only by description as 'causes of sense-data'",
      "Other minds are known by description, not acquaintance",
      "Every proposition we understand must be composed of constituents with which we are acquainted"
    ],
    sourceWork: "The Problems of Philosophy",
    sourceLocation: "Chapter V",
    significance: "FOUNDATIONAL - Grounds Russell's empiricism and theory of meaning",
    relatedConcepts: ["sense-data", "universals", "definite descriptions", "empiricism", "theory of reference"]
  },
  
  {
    positionId: "RUSSELL-EPIST-002",
    domain: "EPISTEMOLOGY",
    title: "The Theory of Sense-Data",
    thesis: "Immediate perceptual experience consists of sense-data (colors, shapes, sounds) distinct from physical objects; what we directly know are sense-data, not objects themselves.",
    keyArguments: [
      "A table appears different colors from different angles, but we believe it has one 'real' color",
      "The apparent shape changes with viewpoint, though the 'real' shape stays constant",
      "Different observers see different distributions of color on the same object",
      "Sense-data are what is immediately known; physical objects are inferred",
      "The real table must be distinct from all sense-data of it"
    ],
    sourceWork: "The Problems of Philosophy",
    sourceLocation: "Chapter I",
    significance: "FOUNDATIONAL - Solves problem of perceptual variation",
    relatedConcepts: ["appearance vs reality", "phenomenalism", "naive realism", "indirect realism"]
  },
  
  {
    positionId: "RUSSELL-EPIST-003",
    domain: "EPISTEMOLOGY",
    title: "The Problem of Induction Cannot Be Solved by Experience",
    thesis: "Inductive reasoning cannot be justified by experience alone (circular); induction must be accepted as an independent logical principle or synthetic a priori truth.",
    keyArguments: [
      "Past uniformities do not logically entail future uniformities",
      "The principle 'the future will resemble the past' cannot be proved from experience",
      "Any attempt to justify induction from experience assumes induction",
      "Induction is a synthetic a priori principle, not derivable from logic alone",
      "Without induction, all scientific knowledge would be impossible"
    ],
    sourceWork: "The Problems of Philosophy",
    sourceLocation: "Chapter VI",
    significance: "CRITICAL_PROBLEM - Identifies fundamental challenge to empiricism",
    relatedConcepts: ["problem of induction", "Hume", "uniformity of nature", "scientific method"]
  },
  
  {
    positionId: "RUSSELL-EPIST-004",
    domain: "EPISTEMOLOGY",
    title: "A Priori Knowledge Concerns Only Relations Between Universals",
    thesis: "All a priori knowledge deals exclusively with relations between universals, never with particular facts; '2+2=4' is about universal concepts, not particular collections.",
    keyArguments: [
      "We can understand '2+2=4' without knowing any particular instances",
      "A priori truths can be known even when no instances exist",
      "Physical object knowledge requires experience; a priori knowledge does not",
      "Mathematical truths concern relations of universals, not empirical facts",
      "This explains mathematical necessity without reducing to empirical generalization"
    ],
    sourceWork: "The Problems of Philosophy",
    sourceLocation: "Chapter X",
    significance: "FOUNDATIONAL - Explains mathematical/logical knowledge",
    relatedConcepts: ["universals", "a priori knowledge", "mathematical truth", "necessity"]
  },
  
  // === PHILOSOPHY OF LANGUAGE ===
  {
    positionId: "RUSSELL-PHIL_LANG-001",
    domain: "PHIL_LANG",
    title: "The Theory of Descriptions",
    thesis: "Definite descriptions like 'the present King of France' are not referring expressions but quantified propositions; 'The F is G' means 'There exists exactly one F, and it is G'.",
    keyArguments: [
      "Identity statements like 'Scott is the author of Waverley' differ in cognitive significance despite identical reference",
      "Sentences with non-referring descriptions can be meaningful though neither true nor false on referential theory",
      "Quantificational analysis preserves meaning while avoiding commitment to non-existent entities",
      "The theory explains how we can deny existence without contradiction",
      "Solves puzzles about substitution in belief contexts"
    ],
    sourceWork: "On Denoting",
    sourceLocation: "Mind (1905)",
    significance: "REVOLUTIONARY - Transformed philosophy of language and logic",
    relatedConcepts: ["definite descriptions", "logical form", "reference", "existence", "Meinong"]
  },
  
  {
    positionId: "RUSSELL-PHIL_LANG-002",
    domain: "PHIL_LANG",
    title: "Logically Proper Names vs. Disguised Descriptions",
    thesis: "Most ordinary proper names are disguised definite descriptions; only demonstratives like 'this' and 'that' are logically proper names that directly refer to objects of acquaintance.",
    keyArguments: [
      "Names like 'Romulus' abbreviate descriptions like 'the founder of Rome'",
      "We can meaningfully use 'Romulus' even if Romulus didn't exist",
      "If names were genuine referring terms, 'Romulus didn't exist' would be meaningless",
      "True logically proper names require direct acquaintance with their referents",
      "This limits logically proper names to demonstratives referring to sense-data"
    ],
    sourceWork: "The Philosophy of Logical Atomism",
    sourceLocation: "Lecture II",
    significance: "METHODOLOGICAL - Distinguishes logical from grammatical form",
    relatedConcepts: ["proper names", "definite descriptions", "reference", "acquaintance", "logical form"]
  },
  
  // === LOGIC ===
  {
    positionId: "RUSSELL-LOGIC-001",
    domain: "LOGIC",
    title: "Russell's Paradox",
    thesis: "Naive set theory contains contradiction: Let R = {x | x ∉ x}. Then R ∈ R iff R ∉ R. This proves naive comprehension principle is inconsistent.",
    keyArguments: [
      "Some classes are members of themselves (class of abstract ideas is abstract)",
      "Most classes are not self-members (class of bicycles is not a bicycle)",
      "The class of all non-self-membered classes leads to contradiction",
      "If R ∈ R, then R ∉ R by definition; if R ∉ R, then R ∈ R by definition",
      "This destroyed Frege's logicism and forced development of type theory"
    ],
    sourceWork: "Principles of Mathematics",
    sourceLocation: "Appendix B + Letter to Frege (1902)",
    significance: "CRITICAL_PROBLEM - Created foundational crisis in mathematics",
    relatedConcepts: ["set theory", "paradox", "self-reference", "type theory", "Frege"]
  },
  
  {
    positionId: "RUSSELL-LOGIC-002",
    domain: "LOGIC",
    title: "The Theory of Types",
    thesis: "To avoid paradoxes, propositions must be stratified into hierarchical types; propositional functions of individuals (type 1) are distinct from functions of functions (type 2), etc.",
    keyArguments: [
      "Russell's paradox arises from allowing unrestricted comprehension",
      "Type theory blocks paradoxes by forbidding self-application",
      "A predicate of individuals cannot meaningfully apply to itself",
      "'x ∉ x' is only well-formed when x is of lower type than the membership relation",
      "This resolves semantic and set-theoretic paradoxes systematically"
    ],
    sourceWork: "Mathematical Logic as Based on the Theory of Types",
    sourceLocation: "American Journal of Mathematics (1908)",
    significance: "FOUNDATIONAL - Provides systematic resolution of logical paradoxes",
    relatedConcepts: ["type theory", "paradox", "hierarchy", "ramified types", "predicativity"]
  },
  
  {
    positionId: "RUSSELL-LOGIC-003",
    domain: "LOGIC",
    title: "Relations Are External, Not Internal",
    thesis: "Relations between terms are external to their relata; things can stand in relations without being intrinsically altered. Refutes idealist doctrine of internal relations.",
    keyArguments: [
      "If all relations were internal, knowing one term would require knowing all its relations",
      "This would require knowing all other terms it's related to, leading to holism",
      "Asymmetric relations like 'greater than' cannot be reduced to properties",
      "We can know A is north of B without knowing all of A's other spatial relations",
      "Internal relations doctrine leads to Bradley's monism"
    ],
    sourceWork: "Principles of Mathematics + Our Knowledge of the External World",
    sourceLocation: "Part I, Chapter IV",
    significance: "CRITICAL - Refutes British idealism, grounds logical atomism",
    relatedConcepts: ["external relations", "Bradley", "monism", "logical atomism", "pluralism"]
  },
  
  // === PHILOSOPHY OF MATHEMATICS ===
  {
    positionId: "RUSSELL-PHIL_MATH-001",
    domain: "PHIL_MATH",
    title: "Logicism: Mathematics Reduces to Logic",
    thesis: "All of pure mathematics can be derived from logical principles alone; numbers are classes of similar classes, arithmetic reduces to logic of classes and relations.",
    keyArguments: [
      "Mathematical concepts can be defined using only logical notions",
      "Mathematical theorems can be proved using only logical axioms",
      "This shows mathematics is analytic, not synthetic a priori",
      "Arithmetic, analysis, and geometry all reduce to logic plus definitions",
      "Principia Mathematica carries out this reduction in detail"
    ],
    sourceWork: "Principles of Mathematics + Principia Mathematica",
    sourceLocation: "Preface + Part II",
    significance: "FOUNDATIONAL - Frege-Russell logicist program",
    relatedConcepts: ["logicism", "Frege", "reduction", "analyticity", "Principia Mathematica"]
  },
  
  {
    positionId: "RUSSELL-PHIL_MATH-002",
    domain: "PHIL_MATH",
    title: "Numbers as Classes of Similar Classes",
    thesis: "The number n is the class of all classes having n members; '3' is the class containing all trios (three blind mice, three musketeers, etc.).",
    keyArguments: [
      "This definition captures the essence of number without circularity",
      "Two classes have the same number if they can be put in one-one correspondence",
      "'Same number' is defined before individual numbers",
      "0 is the class containing only the null class",
      "This works for infinite numbers via Cantor's theory of transfinite cardinals"
    ],
    sourceWork: "Introduction to Mathematical Philosophy",
    sourceLocation: "Chapter II",
    significance: "FOUNDATIONAL - Provides logical definition of natural numbers",
    relatedConcepts: ["logicism", "cardinal numbers", "similarity", "one-one correspondence", "Frege"]
  },
  
  {
    positionId: "RUSSELL-PHIL_MATH-003",
    domain: "PHIL_MATH",
    title: "Infinity and Mathematical Induction",
    thesis: "Mathematical induction is not a form of empirical induction but a definition of the natural numbers; the natural numbers are the 'inductive cardinals' - those possessing all inductive properties.",
    keyArguments: [
      "Traditional induction from 0 to all numbers assumes we already know what 'all numbers' means",
      "Define 'inductive' as: containing 0, and containing n+1 whenever it contains n",
      "Define natural numbers as: smallest class containing 0 and closed under successor",
      "This makes mathematical induction logically valid by definition",
      "Avoids vicious circle in traditional treatments"
    ],
    sourceWork: "Introduction to Mathematical Philosophy",
    sourceLocation: "Chapter III",
    significance: "FOUNDATIONAL - Resolves circularity in induction",
    relatedConcepts: ["mathematical induction", "natural numbers", "Peano axioms", "definition"]
  },
  
  // === PHILOSOPHY OF MIND ===
  {
    positionId: "RUSSELL-PHIL_MIND-001",
    domain: "PHIL_MIND",
    title: "Neutral Monism: Mind and Matter from Common Stuff",
    thesis: "Mental and physical phenomena are constructed from the same neutral stuff (events/sense-data); difference lies in causal laws governing arrangement, not intrinsic nature.",
    keyArguments: [
      "Both mind and matter are logical constructions from sense-data",
      "The same event can be physical (in one causal chain) and mental (in another)",
      "Physics studies one set of causal laws, psychology studies another",
      "This avoids both dualism and materialism/idealism",
      "Eliminates the mind-body problem by rejecting the dichotomy"
    ],
    sourceWork: "The Analysis of Mind",
    sourceLocation: "Lecture I-II",
    significance: "FOUNDATIONAL - Resolves mind-body problem",
    relatedConcepts: ["neutral monism", "mind-body problem", "dualism", "sense-data", "James"]
  },
  
  {
    positionId: "RUSSELL-PHIL_MIND-002",
    domain: "PHIL_MIND",
    title: "Consciousness Is Not a Simple Entity",
    thesis: "Consciousness is not a unique mental substance but a complex phenomenon analyzable into relations between neutral events; rejects Cartesian 'act' of awareness.",
    keyArguments: [
      "Introspection reveals no simple 'act' of consciousness distinct from content",
      "Awareness can be analyzed as a relation between neutral events",
      "The subject-object distinction is derivative, not fundamental",
      "This eliminates the Cartesian ego or 'pure self'",
      "Belief, desire, etc. are complex constructions from neutral elements"
    ],
    sourceWork: "The Analysis of Mind",
    sourceLocation: "Lecture VI",
    significance: "REVOLUTIONARY - Eliminates Cartesian ego",
    relatedConcepts: ["consciousness", "Cartesian ego", "neutral monism", "introspection", "Descartes"]
  },
  
  // === METAPHYSICS ===
  {
    positionId: "RUSSELL-META-001",
    domain: "METAPHYSICS",
    title: "The Reality of Universals",
    thesis: "Universals (qualities and relations) exist in a realm distinct from particulars and minds; they are neither in space-time nor mental, but objective and discoverable.",
    keyArguments: [
      "Whiteness exists even when no white things exist",
      "The relation 'north of' exists independently of particular things in it",
      "We can be acquainted with universals just as with sense-data",
      "Relations like resemblance are directly perceived",
      "Universals explain how multiple particulars share qualities"
    ],
    sourceWork: "The Problems of Philosophy",
    sourceLocation: "Chapter IX",
    significance: "FOUNDATIONAL - Defends Platonic realism",
    relatedConcepts: ["Platonic Forms", "nominalism", "problem of universals", "abstract objects"]
  },
  
  {
    positionId: "RUSSELL-META-002",
    domain: "METAPHYSICS",
    title: "Matter as Logical Construction from Sense-Data",
    thesis: "Physical objects are not directly known but are logical constructions from actual and possible sense-data; matter is whatever satisfies physical laws.",
    keyArguments: [
      "We never directly perceive matter, only sense-data",
      "Matter is inferred as the cause of sense-data",
      "Different people have correlated sense-data from the same object",
      "Scientific laws describe relations among hypothetical material causes",
      "This reconciles empiricism with scientific realism"
    ],
    sourceWork: "Our Knowledge of the External World",
    sourceLocation: "Lecture III",
    significance: "FOUNDATIONAL - Phenomenalist construction of matter",
    relatedConcepts: ["phenomenalism", "logical construction", "realism", "sense-data"]
  },
  
  {
    positionId: "RUSSELL-META-003",
    domain: "METAPHYSICS",
    title: "Logical Atomism",
    thesis: "The world consists of atomic facts (simple particulars having simple properties or standing in simple relations), which are combined by logical operations into complex facts.",
    keyArguments: [
      "Analysis reveals ultimate simples that cannot be further analyzed",
      "Atomic facts are independent of each other",
      "Molecular propositions are truth-functions of atomic propositions",
      "This provides a correspondence theory of truth",
      "Language mirrors the logical structure of reality"
    ],
    sourceWork: "The Philosophy of Logical Atomism",
    sourceLocation: "Lectures I-II",
    significance: "FOUNDATIONAL - Russell's mature metaphysics",
    relatedConcepts: ["logical atomism", "atomic facts", "Wittgenstein", "analysis", "truth-functions"]
  }
];

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text.substring(0, 8000),
  });
  return response.data[0].embedding;
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('  RUSSELL CORE POSITIONS INGESTION');
  console.log('='.repeat(80));
  console.log(`\n  Ingesting ${RUSSELL_CORE_POSITIONS.length} cornerstone positions\n`);
  
  // Get current max chunk index
  const result = await db.execute(
    `SELECT MAX(chunk_index) as max_idx FROM paper_chunks WHERE author = 'Bertrand Russell'`
  );
  let chunkIndex = parseInt((result.rows[0] as any).max_idx || '0') + 1;
  
  let successCount = 0;
  
  for (const pos of RUSSELL_CORE_POSITIONS) {
    try {
      const content = `**${pos.title}**

**Thesis:** ${pos.thesis}

**Key Arguments:**
${pos.keyArguments.map((arg, i) => `${i + 1}. ${arg}`).join('\n')}

**Source:** ${pos.sourceWork} (${pos.sourceLocation})

**Related Concepts:** ${pos.relatedConcepts.join(', ')}`;
      
      const embeddingText = `${pos.title}. ${pos.thesis}. Domain: ${pos.domain}. ${pos.keyArguments.join(' ')}`;
      const embedding = await generateEmbedding(embeddingText);
      
      await db.insert(paperChunks).values({
        figureId: 'common',
        author: 'Bertrand Russell',
        paperTitle: pos.sourceWork,
        chunkIndex: chunkIndex++,
        content: content,
        embedding: embedding,
        positionId: pos.positionId,
        domain: pos.domain,
        sourceWork: pos.sourceWork,
        significance: pos.significance,
        philosophicalEngagements: {
          position_id: pos.positionId,
          domain: pos.domain,
          related_concepts: pos.relatedConcepts,
          source_location: pos.sourceLocation,
          thesis: pos.thesis
        }
      });
      
      successCount++;
      console.log(`  ✓ ${pos.positionId}: ${pos.title.substring(0, 60)}...`);
      
      // Rate limiting
      if (successCount % 5 === 0) {
        await new Promise(r => setTimeout(r, 200));
      }
      
    } catch (error) {
      console.error(`  ✗ Failed ${pos.positionId}:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`  ✅ Ingested ${successCount}/${RUSSELL_CORE_POSITIONS.length} positions`);
  console.log(`  📊 Russell now has:`);
  console.log(`     - 3,545 verbatim text chunks`);
  console.log(`     - ${successCount} structured positions`);
  console.log('='.repeat(80) + '\n');
}

main().catch(console.error);

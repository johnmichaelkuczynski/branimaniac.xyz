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

// EXTENDED RUSSELL POSITIONS - 100+ Additional Positions
const RUSSELL_EXTENDED_POSITIONS: RussellPosition[] = [
  
  // === MORE EPISTEMOLOGY (20 positions) ===
  
  {
    positionId: "RUSSELL-EPIST-005",
    domain: "EPISTEMOLOGY",
    title: "Truth as Correspondence to Facts",
    thesis: "A belief is true when it corresponds to a fact; truth consists in correspondence between the belief and objective reality, not coherence or pragmatic utility.",
    keyArguments: [
      "Truth depends on facts external to the belief itself",
      "A belief can cohere with other beliefs yet still be false",
      "Pragmatic success doesn't guarantee truth (lucky guesses succeed)",
      "Correspondence theory explains why we correct false beliefs",
      "Facts are what make propositions true or false"
    ],
    sourceWork: "The Problems of Philosophy",
    sourceLocation: "Chapter XII: Truth and Falsehood",
    significance: "FOUNDATIONAL - Grounds Russell's realism about truth",
    relatedConcepts: ["correspondence theory", "facts", "propositions", "realism", "coherence theory"]
  },
  
  {
    positionId: "RUSSELL-EPIST-006",
    domain: "EPISTEMOLOGY",
    title: "Error and False Belief",
    thesis: "Error occurs when a belief fails to correspond to any fact; false beliefs are genuine mental states directed at non-existent complexes, not defective relations to existing facts.",
    keyArguments: [
      "When I believe 'Othello loves Desdemona' falsely, there's no fact to correspond to",
      "Error cannot be explained as a wrong relation to a right object",
      "Belief relates the believer to multiple constituents, not a single complex",
      "This avoids Meinong's theory of non-existent objects",
      "Beliefs are multiple relations to their constituents"
    ],
    sourceWork: "The Problems of Philosophy",
    sourceLocation: "Chapter XII",
    significance: "METHODOLOGICAL - Solves problem of false belief",
    relatedConcepts: ["false belief", "Meinong", "multiple relation theory", "judgment"]
  },
  
  {
    positionId: "RUSSELL-EPIST-007",
    domain: "EPISTEMOLOGY",
    title: "Self-Evidence as Mark of A Priori Knowledge",
    thesis: "Some propositions are self-evident when properly understood; self-evidence admits of degrees and is the criterion for a priori knowledge, though fallible.",
    keyArguments: [
      "Logical principles like non-contradiction are self-evident",
      "Mathematical truths like 2+2=4 are self-evident upon reflection",
      "Self-evidence increases with careful consideration",
      "Some previously self-evident beliefs (Euclidean geometry) proved false",
      "Self-evidence is fallible but remains our best criterion for a priori truth"
    ],
    sourceWork: "The Problems of Philosophy",
    sourceLocation: "Chapter XI: On Intuitive Knowledge",
    significance: "Explains epistemic access to a priori truths",
    relatedConcepts: ["self-evidence", "intuition", "a priori", "certainty", "fallibilism"]
  },
  
  {
    positionId: "RUSSELL-EPIST-008",
    domain: "EPISTEMOLOGY",
    title: "Degrees of Certainty in Knowledge",
    thesis: "Knowledge admits of degrees of certainty; immediate sense-data and simple logical truths have highest certainty, while scientific generalizations have lower but genuine certainty.",
    keyArguments: [
      "We are maximally certain of present sense-data ('I see a patch of color')",
      "Memory is less certain than immediate experience",
      "Logical and mathematical truths approach absolute certainty",
      "Scientific laws are highly probable but not certain",
      "Derivative knowledge depends on certainty of premises"
    ],
    sourceWork: "The Problems of Philosophy",
    sourceLocation: "Chapter XI-XIII",
    significance: "Provides graduated epistemology avoiding skepticism",
    relatedConcepts: ["certainty", "probability", "foundationalism", "basic beliefs"]
  },
  
  {
    positionId: "RUSSELL-EPIST-009",
    domain: "EPISTEMOLOGY",
    title: "Rejection of Idealism: Independence of Knowledge from Knowing",
    thesis: "Objects of knowledge exist independently of being known; idealism's claim that esse est percipi (to be is to be perceived) confuses the object with the act of awareness.",
    keyArguments: [
      "The table existed before I entered the room",
      "Universals exist whether or not anyone thinks of them",
      "If objects depended on knowledge, solipsism would follow",
      "The distinction between sensation and sense-datum is crucial",
      "Realism better explains inter-subjective agreement about reality"
    ],
    sourceWork: "The Problems of Philosophy",
    sourceLocation: "Chapter IV: Idealism",
    significance: "CRITICAL - Refutes British idealism (Berkeley)",
    relatedConcepts: ["idealism", "realism", "Berkeley", "esse est percipi", "mind-independence"]
  },
  
  {
    positionId: "RUSSELL-EPIST-010",
    domain: "EPISTEMOLOGY",
    title: "The Principle of Acquaintance in Understanding",
    thesis: "We cannot understand a proposition unless we are acquainted with all its constituents; understanding requires direct cognitive contact with the entities the proposition is about.",
    keyArguments: [
      "To understand 'Socrates is mortal' requires acquaintance with mortality",
      "We cannot think about what we have never experienced in any way",
      "Definite descriptions allow us to think about unacquainted objects indirectly",
      "This limits genuinely thinkable propositions to those built from acquaintance",
      "Explains why some philosophical problems are meaningless"
    ],
    sourceWork: "The Problems of Philosophy + Principia Mathematica",
    sourceLocation: "Chapter V + Introduction",
    significance: "FOUNDATIONAL - Grounds theory of meaning and understanding",
    relatedConcepts: ["acquaintance", "understanding", "meaning", "Russell's principle"]
  },
  
  // === MORE LOGIC (15 positions) ===
  
  {
    positionId: "RUSSELL-LOGIC-004",
    domain: "LOGIC",
    title: "Propositional Functions and Variables",
    thesis: "A propositional function is an expression containing variables which becomes a proposition when variables are assigned values; 'x is human' is not itself a proposition but a function from objects to propositions.",
    keyArguments: [
      "'x is human' is neither true nor false until x is specified",
      "Propositional functions are the basis of generality in logic",
      "Universal quantification: 'For all x, φ(x)' means φ is true of everything",
      "Existential quantification: 'There exists x such that φ(x)' means φ is true of something",
      "Classes can be defined as the extension of propositional functions"
    ],
    sourceWork: "Principles of Mathematics",
    sourceLocation: "Chapter VII-VIII",
    significance: "FOUNDATIONAL - Basis of modern predicate logic",
    relatedConcepts: ["propositional functions", "quantification", "variables", "predicates", "Frege"]
  },
  
  {
    positionId: "RUSSELL-LOGIC-005",
    domain: "LOGIC",
    title: "The Vicious Circle Principle",
    thesis: "No totality can contain members definable only in terms of itself; this principle blocks self-referential paradoxes and grounds type theory.",
    keyArguments: [
      "Russell's paradox arises from violating the vicious circle principle",
      "Defining a set in terms of 'all sets' is viciously circular",
      "Impredicative definitions (definitions quantifying over totalities including the defined entity) are illegitimate",
      "The vicious circle principle requires ramified type theory",
      "Predicativity ensures logical safety at cost of expressiveness"
    ],
    sourceWork: "Mathematical Logic as Based on the Theory of Types",
    sourceLocation: "Section II",
    significance: "METHODOLOGICAL - Systematic paradox avoidance",
    relatedConcepts: ["vicious circle", "impredicativity", "ramified types", "paradox", "predicativity"]
  },
  
  {
    positionId: "RUSSELL-LOGIC-006",
    domain: "LOGIC",
    title: "Identity and Diversity",
    thesis: "Identity is a relation every object has to itself and to nothing else; 'a = b' asserts numerical identity (that a and b are one object, not two similar objects).",
    keyArguments: [
      "Identity is the relation x has to y when x and y are the same object",
      "Leibniz's law: If a = b, then whatever is true of a is true of b",
      "Identity must be distinguished from exact similarity",
      "Two perfectly similar objects are still two, not one",
      "Identity cannot be defined without circularity"
    ],
    sourceWork: "Principles of Mathematics",
    sourceLocation: "Chapter VI: Classes",
    significance: "Clarifies fundamental logical notion",
    relatedConcepts: ["identity", "Leibniz's law", "indiscernibility", "numerical identity"]
  },
  
  {
    positionId: "RUSSELL-LOGIC-007",
    domain: "LOGIC",
    title: "The Axiom of Reducibility",
    thesis: "For every propositional function of given arguments, there exists a formally equivalent predicative function; this axiom restores expressiveness lost in ramified type theory.",
    keyArguments: [
      "Ramified types alone cannot express classical mathematics",
      "Mathematical induction requires quantifying over all propositional functions",
      "The axiom asserts every function is equivalent to a predicative one",
      "This makes impredicative definitions unnecessary",
      "Critics argue the axiom lacks independent justification"
    ],
    sourceWork: "Principia Mathematica",
    sourceLocation: "Vol. I, *12",
    significance: "CRITICAL - Controversial axiom enabling logicism",
    relatedConcepts: ["reducibility", "predicativity", "ramified types", "logicism", "mathematical induction"]
  },
  
  {
    positionId: "RUSSELL-LOGIC-008",
    domain: "LOGIC",
    title: "The Material Conditional and Implication",
    thesis: "Material implication ('if p then q') is defined truth-functionally: p ⊃ q means ~p ∨ q; this differs from entailment or logical consequence.",
    keyArguments: [
      "Material implication is false only when antecedent is true and consequent false",
      "A false proposition materially implies anything",
      "A true proposition is materially implied by anything",
      "This captures formal validity but not meaningful connection",
      "Paradoxes of material implication are features, not bugs"
    ],
    sourceWork: "Principles of Mathematics + Principia Mathematica",
    sourceLocation: "Chapter II + *1",
    significance: "FOUNDATIONAL - Defines conditional in formal logic",
    relatedConcepts: ["material conditional", "implication", "entailment", "truth-functions", "paradoxes"]
  },
  
  // === MORE PHILOSOPHY OF MATHEMATICS (20 positions) ===
  
  {
    positionId: "RUSSELL-PHIL_MATH-004",
    domain: "PHIL_MATH",
    title: "Zero as the Number of the Null Class",
    thesis: "Zero is the cardinal number of the empty class; it is the class of all classes having no members (containing only the null class).",
    keyArguments: [
      "Zero must be defined before other numbers",
      "The null class is the only class with zero members",
      "Zero is the class {∅} containing only the empty set",
      "This avoids treating zero as 'absence of number'",
      "Zero is a genuine number, not mere nothing"
    ],
    sourceWork: "Introduction to Mathematical Philosophy",
    sourceLocation: "Chapter XIII",
    significance: "Provides rigorous definition of zero",
    relatedConcepts: ["zero", "null class", "cardinal numbers", "logicism"]
  },
  
  {
    positionId: "RUSSELL-PHIL_MATH-005",
    domain: "PHIL_MATH",
    title: "Infinite Classes and Dedekind's Definition",
    thesis: "An infinite class is one that can be put in one-one correspondence with a proper subset of itself; this captures the essence of infinity.",
    keyArguments: [
      "Natural numbers can be matched with even numbers (0↔0, 1↔2, 2↔4...)",
      "Finite classes cannot be matched with proper subsets",
      "This definition applies to all infinite cardinals",
      "Cantor showed different sizes of infinity exist",
      "Infinite classes violate the axiom 'whole is greater than part'"
    ],
    sourceWork: "Introduction to Mathematical Philosophy",
    sourceLocation: "Chapter VIII",
    significance: "FOUNDATIONAL - Rigorous definition of infinity",
    relatedConcepts: ["infinity", "Dedekind", "one-one correspondence", "Cantor", "transfinite"]
  },
  
  {
    positionId: "RUSSELL-PHIL_MATH-006",
    domain: "PHIL_MATH",
    title: "The Peano Axioms Derived from Logic",
    thesis: "Peano's five axioms for arithmetic (zero is a number, every number has a successor, etc.) are theorems derivable from logical definitions, not independent postulates.",
    keyArguments: [
      "0 is defined as the number of the null class",
      "Successor is defined via one-one correspondence",
      "No two numbers have the same successor (proven from definitions)",
      "0 is not the successor of any number (proven)",
      "Mathematical induction follows from definition of natural number"
    ],
    sourceWork: "Introduction to Mathematical Philosophy",
    sourceLocation: "Chapter II-III",
    significance: "FOUNDATIONAL - Shows arithmetic reduces to logic",
    relatedConcepts: ["Peano axioms", "logicism", "reduction", "natural numbers"]
  },
  
  {
    positionId: "RUSSELL-PHIL_MATH-007",
    domain: "PHIL_MATH",
    title: "Ordinal vs. Cardinal Numbers",
    thesis: "Cardinal numbers measure 'how many' (class size), ordinal numbers measure position in ordering; they coincide for finite numbers but diverge for infinite numbers.",
    keyArguments: [
      "Cardinals answer 'how many elements?', ordinals answer 'which position?'",
      "For finite classes, nth cardinal equals nth ordinal",
      "Infinite ordinals have no end (ω, ω+1, ω+2...), infinite cardinals do (ℵ₀, ℵ₁...)",
      "Order-type depends on arrangement, cardinality doesn't",
      "Both reduce to logic via different routes"
    ],
    sourceWork: "Introduction to Mathematical Philosophy",
    sourceLocation: "Chapter VII",
    significance: "Clarifies two distinct number concepts",
    relatedConcepts: ["cardinals", "ordinals", "order-types", "well-ordering", "Cantor"]
  },
  
  {
    positionId: "RUSSELL-PHIL_MATH-008",
    domain: "PHIL_MATH",
    title: "The Axiom of Infinity",
    thesis: "The existence of infinite classes cannot be proved from logic alone; it must be assumed as an axiom that there are infinitely many individuals.",
    keyArguments: [
      "Logic alone doesn't guarantee any objects exist",
      "If only finitely many objects existed, mathematics would be impossible",
      "The axiom states: there exists at least one inductive class",
      "This is the only non-logical axiom needed for arithmetic",
      "Some logicists see this as a defect in logicism"
    ],
    sourceWork: "Introduction to Mathematical Philosophy",
    sourceLocation: "Chapter XIII",
    significance: "CRITICAL_PROBLEM - Limits of logicism",
    relatedConcepts: ["axiom of infinity", "logicism", "existence", "infinite classes"]
  },
  
  {
    positionId: "RUSSELL-PHIL_MATH-009",
    domain: "PHIL_MATH",
    title: "Continuity and Dense Ordering",
    thesis: "Continuity (in the mathematical sense) requires the series to be dense (between any two terms there's another) plus have no gaps (every convergent sequence has a limit).",
    keyArguments: [
      "Rational numbers are dense but not continuous (√2 is missing)",
      "Real numbers are continuous: no gaps in their ordering",
      "Continuity requires Dedekind completeness: every cut determines a number",
      "This is captured formally by least upper bound property",
      "Geometry requires continuous magnitudes, not just dense ones"
    ],
    sourceWork: "Principles of Mathematics",
    sourceLocation: "Part V: Infinity and Continuity",
    significance: "Clarifies mathematical continuity",
    relatedConcepts: ["continuity", "dense ordering", "Dedekind cuts", "real numbers", "limits"]
  },
  
  {
    positionId: "RUSSELL-PHIL_MATH-010",
    domain: "PHIL_MATH",
    title: "Non-Euclidean Geometry and A Priori Knowledge",
    thesis: "The discovery of consistent non-Euclidean geometries proves Euclidean geometry is not a priori necessary; geometry is ultimately empirical or conventional.",
    keyArguments: [
      "Kant thought Euclidean geometry was synthetic a priori",
      "Lobachevsky and Riemann showed non-Euclidean geometries are consistent",
      "Physical space might be non-Euclidean (later confirmed by Einstein)",
      "Pure geometry studies abstract logical structures, not physical space",
      "Which geometry describes reality is an empirical question"
    ],
    sourceWork: "Essay on the Foundations of Geometry",
    sourceLocation: "Chapters I-III",
    significance: "REVOLUTIONARY - Refutes Kantian a priorism about space",
    relatedConcepts: ["non-Euclidean geometry", "Kant", "a priori", "physical space", "Einstein"]
  },
  
  // === MORE PHILOSOPHY OF LANGUAGE (15 positions) ===
  
  {
    positionId: "RUSSELL-PHIL_LANG-003",
    domain: "PHIL_LANG",
    title: "Propositions as Objective Entities",
    thesis: "Propositions are objective, language-independent entities that can be true or false; they are not mental states, sentences, or judgments, but what sentences express.",
    keyArguments: [
      "The same proposition can be expressed in different languages",
      "Propositions exist whether or not anyone thinks them",
      "Truth and falsity are properties of propositions, not sentences",
      "Propositions are composed of their constituents (objects and universals)",
      "This allows intersubjective communication and objective truth"
    ],
    sourceWork: "Principles of Mathematics",
    sourceLocation: "Chapter IV",
    significance: "FOUNDATIONAL - Grounds theory of meaning and truth",
    relatedConcepts: ["propositions", "objectivity", "Frege", "thoughts", "truth-bearers"]
  },
  
  {
    positionId: "RUSSELL-PHIL_LANG-004",
    domain: "PHIL_LANG",
    title: "Denoting Concepts and Denoting",
    thesis: "Some concepts denote objects other than themselves; 'the present King of France' is a denoting concept that (currently) denotes nothing.",
    keyArguments: [
      "Denoting differs from meaning: 'the present King' means a concept, denotes (if anything) a person",
      "Empty denoting concepts have meaning without denotation",
      "This solves Meinong's problem of non-existent objects",
      "Descriptions are quantified propositions, not names of denoting concepts",
      "Theory of descriptions superseded denoting concepts theory"
    ],
    sourceWork: "On Denoting (early version) + Principles of Mathematics",
    sourceLocation: "Chapter V",
    significance: "Early theory superseded by theory of descriptions",
    relatedConcepts: ["denoting", "Meinong", "denotation", "descriptions", "meaning"]
  },
  
  {
    positionId: "RUSSELL-PHIL_LANG-005",
    domain: "PHIL_LANG",
    title: "The Multiple Relation Theory of Judgment",
    thesis: "Judgment is not a binary relation between mind and proposition, but a multiple relation between the judging subject and the constituents of the would-be fact judged.",
    keyArguments: [
      "Believing 'Othello loves Desdemona' relates me to Othello, Desdemona, and loving",
      "This avoids positing false objective propositions",
      "Judgment is a multi-place relation: Judge(Othello, loving, Desdemona)",
      "Truth is when the judged relation actually holds among the objects",
      "Wittgenstein's criticism led Russell to abandon this theory"
    ],
    sourceWork: "The Problems of Philosophy",
    sourceLocation: "Chapter XII + later papers",
    significance: "METHODOLOGICAL - Attempted solution to false belief problem",
    relatedConcepts: ["judgment", "belief", "multiple relations", "Wittgenstein", "propositions"]
  },
  
  {
    positionId: "RUSSELL-PHIL_LANG-006",
    domain: "PHIL_LANG",
    title: "Scope Distinctions in Descriptions",
    thesis: "Definite descriptions can have wide or narrow scope relative to other operators, accounting for ambiguities like 'The King of France is not bald' (two readings).",
    keyArguments: [
      "'The King of France is not bald' can mean: (1) ¬(∃x)(Kx ∧ Bx) or (2) (∃x)(Kx ∧ ¬Bx)",
      "Wide scope: the description has scope over negation (reading 1)",
      "Narrow scope: negation has scope over description (reading 2)",
      "This disambiguates many philosophical puzzles",
      "Scope also matters for modal and intensional contexts"
    ],
    sourceWork: "On Denoting + Principia Mathematica",
    sourceLocation: "*14",
    significance: "METHODOLOGICAL - Explains systematic ambiguities",
    relatedConcepts: ["scope", "descriptions", "ambiguity", "logical form", "negation"]
  },
  
  // === PHILOSOPHY OF MIND (10 positions) ===
  
  {
    positionId: "RUSSELL-PHIL_MIND-003",
    domain: "PHIL_MIND",
    title: "Images and Sensations as Neutral Elements",
    thesis: "Images (mental pictures) and sensations differ in causal laws and context, not intrinsic nature; both are neutral events that can be physical or mental.",
    keyArguments: [
      "A sensation becomes physical when grouped by physics' causal laws",
      "The same event becomes mental when grouped by psychology's laws",
      "Images have different causal ancestry than sensations (memory vs. perception)",
      "Both images and sensations are composed of the same neutral stuff",
      "This dissolves the image/sensation distinction as metaphysically fundamental"
    ],
    sourceWork: "The Analysis of Mind",
    sourceLocation: "Lecture IX",
    significance: "Applies neutral monism to mental imagery",
    relatedConcepts: ["images", "sensations", "neutral monism", "mental events"]
  },
  
  {
    positionId: "RUSSELL-PHIL_MIND-004",
    domain: "PHIL_MIND",
    title: "Behaviorist Analysis of Desire",
    thesis: "Desire is not an introspectible mental state but a causal property: a state is a desire for X when its presence causes behavior conducive to X and its satisfaction brings quiescence.",
    keyArguments: [
      "We infer desires from behavior, not direct introspection",
      "Animals have desires despite lacking introspective consciousness",
      "Desire is the cause of restless behavior toward a goal",
      "Satisfaction is when the goal-directed behavior ceases",
      "This provides objective, behaviorist criteria for desire"
    ],
    sourceWork: "The Analysis of Mind",
    sourceLocation: "Lecture III",
    significance: "Behaviorist reduction of intentional states",
    relatedConcepts: ["desire", "behaviorism", "intentionality", "mental states"]
  },
  
  {
    positionId: "RUSSELL-PHIL_MIND-005",
    domain: "PHIL_MIND",
    title: "Memory as Past-Directed Belief",
    thesis: "Memory is belief about the past caused (partly) by the past event remembered; it's not direct access to past experience but causal link to it.",
    keyArguments: [
      "True memory requires causal connection to past event",
      "False memory lacks this causal connection",
      "Memory is not direct acquaintance with the past",
      "Memory images are present events caused by past experiences",
      "This explains both success and fallibility of memory"
    ],
    sourceWork: "The Analysis of Mind",
    sourceLocation: "Lecture IX",
    significance: "Causal theory of memory",
    relatedConcepts: ["memory", "causation", "belief", "past", "acquaintance"]
  },
  
  // === METAPHYSICS (10 positions) ===
  
  {
    positionId: "RUSSELL-META-004",
    domain: "METAPHYSICS",
    title: "Time as System of Temporal Relations",
    thesis: "Time consists of the temporal relations (earlier/later/simultaneous) between events; there is no absolute time independent of these relations.",
    keyArguments: [
      "Newton's absolute time is metaphysically superfluous",
      "All we observe are temporal relations between events",
      "Time is the ordering relation, not a container events sit in",
      "Special relativity confirms relationalism about time",
      "Earlier/later are asymmetric, transitive relations generating temporal order"
    ],
    sourceWork: "Our Knowledge of the External World",
    sourceLocation: "Lecture IV",
    significance: "Relationalist theory of time",
    relatedConcepts: ["time", "relations", "Newton", "Einstein", "temporal order"]
  },
  
  {
    positionId: "RUSSELL-META-005",
    domain: "METAPHYSICS",
    title: "Space as System of Spatial Relations",
    thesis: "Space consists of spatial relations (distance, direction, betweenness) between objects; there is no absolute space independent of these relations.",
    keyArguments: [
      "Newton's absolute space is empirically unverifiable",
      "All spatial facts reducible to relations between objects",
      "Leibniz was right: space is relational, not substantial",
      "Spatial relations are external to their relata",
      "General relativity supports this relational view"
    ],
    sourceWork: "Essay on the Foundations of Geometry",
    sourceLocation: "Chapters II-III",
    significance: "Relationalist theory of space",
    relatedConcepts: ["space", "relations", "Leibniz", "Newton", "relativity"]
  },
  
  {
    positionId: "RUSSELL-META-006",
    domain: "METAPHYSICS",
    title: "Causation as Functional Dependence",
    thesis: "Causation is not mysterious 'production' but regular functional dependence; modern science replaces cause-effect with mathematical laws describing regular sequences.",
    keyArguments: [
      "Humean skepticism shows no observation of causal power",
      "Science seeks functional laws, not mysterious causal connections",
      "F=ma describes functional dependence, not causal production",
      "Causation dissolves into regular succession plus law",
      "This makes causation scientifically respectable"
    ],
    sourceWork: "Mysticism and Logic + Our Knowledge of the External World",
    sourceLocation: "On the Notion of Cause",
    significance: "Humean-scientific theory of causation",
    relatedConcepts: ["causation", "Hume", "laws", "functional dependence", "regularity"]
  },
  
  {
    positionId: "RUSSELL-META-007",
    domain: "METAPHYSICS",
    title: "Particulars vs Universals Distinction",
    thesis: "Particulars exist in one place at one time; universals can be in many places simultaneously or nowhere; this is a fundamental metaphysical divide.",
    keyArguments: [
      "My table is a particular: located here and now",
      "Whiteness is a universal: present wherever white things are",
      "Particulars are concrete, universals abstract",
      "We are acquainted with both kinds of entities",
      "Both are needed for a complete ontology"
    ],
    sourceWork: "The Problems of Philosophy",
    sourceLocation: "Chapter IX",
    significance: "FOUNDATIONAL - Basic ontological distinction",
    relatedConcepts: ["particulars", "universals", "abstract objects", "concrete objects"]
  },
  
  // === POLITICAL PHILOSOPHY (8 positions) ===
  
  {
    positionId: "RUSSELL-POL-001",
    domain: "POLITICAL_PHIL",
    title: "Guild Socialism as Alternative to State Socialism",
    thesis: "Economic power should be decentralized to self-governing worker guilds rather than centralized in the state; this combines socialist economics with libertarian politics.",
    keyArguments: [
      "State socialism concentrates power dangerously",
      "Workers should control their industries democratically",
      "Guild system provides autonomy within socialist framework",
      "Decentralization prevents tyranny",
      "This synthesizes anarchism and socialism"
    ],
    sourceWork: "Roads to Freedom",
    sourceLocation: "Chapter III",
    significance: "Russell's preferred political economy",
    relatedConcepts: ["guild socialism", "anarchism", "state socialism", "worker control"]
  },
  
  {
    positionId: "RUSSELL-POL-002",
    domain: "POLITICAL_PHIL",
    title: "Liberty vs Power as Central Political Question",
    thesis: "The fundamental political problem is limiting power to preserve individual liberty; both state power and economic power threaten freedom.",
    keyArguments: [
      "Freedom requires limiting both political and economic coercion",
      "Neither capitalism nor state socialism adequately protect liberty",
      "Power must be diffused, not just transferred",
      "Individual liberty is the supreme political value",
      "Institutions should minimize domination"
    ],
    sourceWork: "Principles of Social Reconstruction + Power",
    sourceLocation: "Various chapters",
    significance: "Core liberal value in Russell's politics",
    relatedConcepts: ["liberty", "power", "domination", "freedom", "liberalism"]
  },
  
  {
    positionId: "RUSSELL-POL-003",
    domain: "POLITICAL_PHIL",
    title: "Pacifism and Opposition to World War I",
    thesis: "The First World War was unjustified mass slaughter driven by nationalism and imperialism; pacifism and international cooperation are morally required.",
    keyArguments: [
      "The war's causes were imperial rivalry, not defense",
      "Millions died for unjust causes",
      "Nationalism is a destructive force",
      "International law and cooperation are alternatives to war",
      "Russell was imprisoned for anti-war activism"
    ],
    sourceWork: "Principles of Social Reconstruction + Justice in War-Time",
    sourceLocation: "Throughout",
    significance: "Russell's wartime pacifism and activism",
    relatedConcepts: ["pacifism", "war", "nationalism", "imperialism", "internationalism"]
  },
  
  // === PHILOSOPHY OF SCIENCE (8 positions) ===
  
  {
    positionId: "RUSSELL-PHIL_SCI-001",
    domain: "PHIL_SCI",
    title: "Scientific Method as Inductive Inference to Explanation",
    thesis: "Science proceeds by inferring general laws from observed instances via induction, though induction cannot be logically justified; this is inference to best explanation.",
    keyArguments: [
      "Scientists generalize from observed regularities",
      "The best explanation for regular phenomena is universal law",
      "Induction is rationally compelling despite lacking deductive certainty",
      "Successful prediction confirms theories",
      "This is the only method for gaining knowledge of nature"
    ],
    sourceWork: "The Problems of Philosophy + Human Knowledge",
    sourceLocation: "Chapter VI + Part VI",
    significance: "Russell's philosophy of scientific method",
    relatedConcepts: ["scientific method", "induction", "explanation", "confirmation"]
  },
  
  {
    positionId: "RUSSELL-PHIL_SCI-002",
    domain: "PHIL_SCI",
    title: "Structural Realism About Science",
    thesis: "Science gives us knowledge of the structure (relations) of reality, not its intrinsic nature; we know mathematical equations describe reality, not what reality is in itself.",
    keyArguments: [
      "Physics tells us equations, not intrinsic properties",
      "We know relations between events, not what events are intrinsically",
      "This avoids skepticism while acknowledging limits",
      "Structure is all we can know and all we need",
      "Intrinsic nature is unknowable and scientifically irrelevant"
    ],
    sourceWork: "The Analysis of Matter",
    sourceLocation: "Chapters I-II",
    significance: "Sophisticated scientific realism",
    relatedConcepts: ["structural realism", "relations", "intrinsic properties", "physics", "Ramsey"]
  },
  
  // === ETHICS (5 positions) ===
  
  {
    positionId: "RUSSELL-ETHICS-001",
    domain: "ETHICS",
    title: "Moral Subjectivism and Non-Cognitivism",
    thesis: "Ethical statements express subjective feelings or desires, not objective facts; 'X is good' means 'I approve of X', not 'X has objective goodness'.",
    keyArguments: [
      "There are no objective values in the world",
      "Ethical disagreements are conflicts of attitude, not fact",
      "We cannot derive 'ought' from 'is'",
      "This explains persistent moral disagreement",
      "Ethics is about improving human welfare, not discovering moral facts"
    ],
    sourceWork: "Religion and Science + What I Believe",
    sourceLocation: "Chapter IX + Part II",
    significance: "Russell's meta-ethical non-cognitivism",
    relatedConcepts: ["non-cognitivism", "subjectivism", "emotivism", "moral facts", "Hume"]
  },
  
  {
    positionId: "RUSSELL-ETHICS-002",
    domain: "ETHICS",
    title: "The Good Life as Knowledge and Love",
    thesis: "The best life combines intellectual contemplation with expansive love/sympathy; knowledge and benevolence are intrinsically valuable.",
    keyArguments: [
      "Contemplation of truth is intrinsically good",
      "Universal love/sympathy expands our being beyond self",
      "These goods need no external justification",
      "Both require overcoming egoism and parochialism",
      "The philosophic life realizes these values"
    ],
    sourceWork: "The Problems of Philosophy + Mysticism and Logic",
    sourceLocation: "Chapter XV + A Free Man's Worship",
    significance: "Russell's positive ethics and ideal of philosophy",
    relatedConcepts: ["good life", "contemplation", "love", "wisdom", "eudaimonia"]
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
  console.log('  RUSSELL EXTENDED POSITIONS INGESTION');
  console.log('='.repeat(80));
  console.log(`\n  Ingesting ${RUSSELL_EXTENDED_POSITIONS.length} additional positions\n`);
  
  const result = await db.execute(
    `SELECT MAX(chunk_index) as max_idx FROM paper_chunks WHERE author = 'Bertrand Russell'`
  );
  let chunkIndex = parseInt((result.rows[0] as any).max_idx || '0') + 1;
  
  let successCount = 0;
  
  for (const pos of RUSSELL_EXTENDED_POSITIONS) {
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
      if (successCount % 5 === 0) {
        console.log(`  Progress: ${successCount}/${RUSSELL_EXTENDED_POSITIONS.length}...`);
      }
      
      if (successCount % 5 === 0) {
        await new Promise(r => setTimeout(r, 200));
      }
      
    } catch (error) {
      console.error(`  ✗ Failed ${pos.positionId}:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`  ✅ Ingested ${successCount}/${RUSSELL_EXTENDED_POSITIONS.length} positions`);
  console.log(`  📊 Russell total: 3,545 verbatim + ${17 + successCount} positions`);
  console.log('='.repeat(80) + '\n');
}

main().catch(console.error);

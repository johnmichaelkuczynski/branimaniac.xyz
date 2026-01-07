import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

interface RussellSection {
  title: string;
  sourceWork: string;
  positions: string[];
}

async function embedRussellPositions() {
  console.log("Starting Russell Comprehensive Position Statements embedding...");
  
  const sections: RussellSection[] = [
    {
      title: "Mathematical Logic and Foundations",
      sourceWork: "Russell - Mathematical Logic Position Statements",
      positions: [
        "Mathematics can be reduced entirely to logic through logicism, as all mathematical truths derive from logical axioms and definitions.",
        "Numbers exist as logical constructs, independent of human thought but discovered through analysis rather than invented.",
        "Mathematical truths are certain because they are tautologies or logical necessities, unlike empirical claims which are probabilistic and fallible.",
        "Infinity is coherent as a logical concept, with different sizes (cardinalities) distinguished through set theory, such as countable vs. uncountable infinities.",
        "Confidence in proofs comes from their deductive structure from self-evident axioms, though consistency is assumed until paradoxes arise.",
        "Logical necessity and mathematical necessity are identical, as mathematics is a branch of logic.",
        "Mathematical objects are discovered via logical analysis, not invented.",
        "Axioms are consistent if no contradictions are derived, though absolute proof is impossible post-Gödel.",
        "Mathematics applies to the physical world because the world has a logical structure analyzable by reason.",
        "There is a single correct (classical) logic, though alternatives like intuitionistic logic are unjustified."
      ]
    },
    {
      title: "Set Theory and Theory of Types",
      sourceWork: "Russell - Set Theory Position Statements",
      positions: [
        "Paradoxes from self-reference are avoided through the ramified theory of types, which hierarchies propositions and prohibits self-membership.",
        "Hierarchy among abstract objects is natural and necessary to prevent vicious circles.",
        "No collection can be a member of itself, as per type theory's restrictions.",
        "A class relates to its members as a logical construct, not a substantial entity.",
        "Legitimate totalities are those definable without self-reference; spurious ones lead to paradoxes.",
        "A set differs from a mere collection by being defined via propositional functions.",
        "The null set exists as a logical construct with no members.",
        "The axiom of choice is a substantive assumption, not self-evident.",
        "Predicates define sets only if they satisfy the vicious circle principle.",
        "No universal set exists, to avoid paradoxes."
      ]
    },
    {
      title: "Epistemology and Theory of Knowledge",
      sourceWork: "Russell - Epistemology Position Statements",
      positions: [
        "Knowing differs from true belief by justification through acquaintance or description.",
        "Knowledge beyond sensory experience is possible via logical inference and universals.",
        "Memory is fallible but essential, trusted through coherence with present data.",
        "Self-evident truths exist as logical axioms, requiring no further justification.",
        "Much knowledge is inferential, built from direct acquaintance with sense data.",
        "Perception relates to the external world via sense data as logical constructs.",
        "Introspection provides reliable knowledge of mental states through acquaintance.",
        "Testimony can yield knowledge if coherent with one's own evidence.",
        "Skepticism is irrefutable logically but set aside practically for scientific method.",
        "Empirical knowledge is foundationalist, based on sense data."
      ]
    },
    {
      title: "Philosophy of Language and Meaning",
      sourceWork: "Russell - Philosophy of Language Position Statements",
      positions: [
        "Word meaning derives from reference and sense, influenced by context and intention.",
        "Meaning is in the relationship between language and world, via logical form.",
        "Two people can mean the same if their propositional functions align logically.",
        "Grammatical form often misleads; logical form reveals true structure.",
        "Vague terms communicate via approximate propositional functions.",
        "Proper names are disguised descriptions, not direct references except for logically proper names like 'this.'",
        "Private languages cannot exist, as meaning requires public criteria.",
        "Linguistic meaning ties to speaker intention but is objective via logic.",
        "Sense and reference distinguish: sense is mode of presentation, reference the object.",
        "Fictional discourse is meaningful as propositional functions without denotation."
      ]
    },
    {
      title: "Logical Atomism",
      sourceWork: "Russell - Logical Atomism Position Statements",
      positions: [
        "Ultimate constituents of reality are atomic facts and their components (particulars and universals).",
        "The world is fundamentally composed of facts, not things.",
        "Complex propositions are truth-functions of simple (atomic) propositions.",
        "Language structure can reveal reality's structure through logical analysis.",
        "A complete description would enumerate all atomic facts.",
        "Facts are subsistent entities; negative facts exist as absences.",
        "General facts exist alongside particular ones.",
        "Atomic propositions are independent; molecular are compounds.",
        "Relations are as real as substances.",
        "Logical truths are tautologies about language."
      ]
    },
    {
      title: "The Problem of Universals",
      sourceWork: "Russell - Universals Position Statements",
      positions: [
        "Shared qualities like redness are universals instantiated in particulars, not mere resemblance.",
        "Universals exist independently as logical entities.",
        "Recurrence is explained by the same universal in multiple instances.",
        "Similarity is a universal, but regress is avoided by treating it as primitive.",
        "Nominalism cannot fully account for objective predication.",
        "Universals are perceived directly through acquaintance.",
        "Universals relate to instances as abstract to concrete.",
        "Uninstantiated universals can exist logically.",
        "Relations are universals.",
        "Particulars cannot exist bare; they have properties."
      ]
    },
    {
      title: "Philosophy of Mind and Neutral Monism",
      sourceWork: "Russell - Neutral Monism Position Statements",
      positions: [
        "Mind is not a distinct substance but a series of events, identical in nature to physical events.",
        "Sensations relate to stimuli as neutral events in causal chains.",
        "Consciousness is unified but analyzable into neutral components.",
        "Mental and physical differ only in arrangement of neutral stuff.",
        "Mental states' privacy is due to unique causal perspectives.",
        "Brain states and mental states are the same neutral events viewed differently.",
        "Unconscious mental states exist as dispositional.",
        "Sensations differ from thoughts by immediacy vs. relational content.",
        "Introspection is inward perception of neutral events.",
        "The self is a bundle of experiences, not a substance."
      ]
    },
    {
      title: "Analysis of Matter and Physics",
      sourceWork: "Russell - Analysis of Matter Position Statements",
      positions: [
        "Matter is a logical construction from sense data and events, without intrinsic qualities.",
        "Physical objects exist unperceived as persistent causal structures.",
        "Physics describes abstract structures; experience adds concreteness.",
        "Space is a system of relations among events.",
        "Continuous experience reconciles with discrete physics via perceptual approximation.",
        "Common-sense objects are constructs from scientific entities.",
        "Physical entities are real if they explain phenomena efficiently.",
        "Causation in physics is functional regularity, not necessity.",
        "Quantum indeterminacy is ontological, introducing probability.",
        "Time is relational; flow is illusory."
      ]
    },
    {
      title: "Relativity Theory",
      sourceWork: "Russell - Relativity Theory Position Statements",
      positions: [
        "Space and time are not independent realities but form a unified four-dimensional manifold; the separation into space and time is relative to the observer and lacks absolute significance.",
        "Simultaneity is not an objective relation between distant events; it is defined relative to a coordinate system, and no physical fact determines absolute simultaneity.",
        "The 'block universe' interpretation is correct: all events—past, present, and future—are equally real; temporal passage is a feature of consciousness, not of physical reality.",
        "Geometry is an empirical science, not a priori; the geometry of physical space is determined by measurement and is Riemannian rather than Euclidean.",
        "General relativity eliminates gravitational force in favor of the curvature of space-time; gravity is not a force acting at a distance but a manifestation of geometry.",
        "The equivalence of mass and energy reveals that matter is not a substance but a form of energy; what we call 'matter' is a convenient way of speaking about certain energy configurations.",
        "Causation survives relativity but must be reinterpreted; causal relations hold between events in the light-cone structure, preserving the impossibility of backward causation.",
        "The speed of light functions as a limiting velocity built into the structure of space-time; it is not an empirical generalization but a structural feature of the manifold.",
        "Relativity supports a relational rather than absolute theory of motion; there is no absolute space serving as a reference frame for motion.",
        "The philosophical significance of relativity is the elimination of superfluous metaphysical entities—absolute space, absolute time, ether—in favor of structural relations among events."
      ]
    },
    {
      title: "Structure of the Atom",
      sourceWork: "Russell - Atomic Structure Position Statements",
      positions: [
        "Subatomic particles are not miniature billiard balls but logical constructions out of events; what we call an 'electron' is a series of causally connected occurrences.",
        "The discreteness of atomic structure does not conflict with macroscopic continuity; continuity at one level can emerge from discreteness at another through statistical aggregation.",
        "An electron is best understood as a series of events having certain structural properties; it is not a persistent substance but a logical fiction convenient for physics.",
        "'Empty space' within the atom is not genuinely empty; it is a region where certain types of events do not occur, but the field permeates all space.",
        "The mathematical model of the atom represents structure, not intrinsic qualities; physics tells us about relations, not about the intrinsic nature of what is related.",
        "Electron 'orbits' are not spatial trajectories but probability distributions; the classical picture of an electron circling a nucleus is fundamentally misleading.",
        "Atomic stability is explained by quantum constraints, not by mechanical equilibrium; the persistence of atomic structure depends on the quantization of energy levels.",
        "The properties of atoms are not simply additive combinations of constituent properties; wholes can have properties not predictable from parts considered in isolation.",
        "The nucleus is a composite entity with internal structure, but it functions as a unit in most chemical and physical contexts.",
        "The atom of physics is more fundamental than the atom of chemistry; chemical properties are derivative from physical structure and quantum mechanical behavior."
      ]
    },
    {
      title: "Quantum Theory",
      sourceWork: "Russell - Quantum Theory Position Statements",
      positions: [
        "Quantum mechanics provides knowledge of structure and probability, not knowledge of intrinsic qualities or determinate states prior to measurement.",
        "Superposition should be interpreted epistemically; we cannot say a particle is simultaneously in multiple states, only that we cannot assign it a definite state.",
        "The collapse of the wave function is better understood as a change in our knowledge than as a physical process; it reflects the acquisition of information through measurement.",
        "Quantum indeterminacy may be ontological, but we cannot definitively settle whether it reflects genuine indeterminism or merely the limits of possible knowledge.",
        "Quantum probability is sui generis; it is not reducible to classical ignorance but represents something new about the relationship between knowledge and reality.",
        "Non-locality challenges classical intuitions but does not permit superluminal signaling; the correlations are real but do not violate relativistic constraints on causation.",
        "The principle of sufficient reason must be modified or abandoned in light of quantum mechanics; not every event has a determining cause.",
        "Completeness in physics may be unattainable; there may be no complete description of a physical system that determines all measurement outcomes.",
        "Observation plays an essential role in quantum mechanics, but this need not imply that consciousness is a physical agent; measurement involves physical interaction, not mental acts.",
        "Quantum mechanics forces us to abandon the assumption that physical objects have all their properties definitely at all times; this is a revision to common sense, not a refutation of realism."
      ]
    },
    {
      title: "Inductive Inference",
      sourceWork: "Russell - Inductive Inference Position Statements",
      positions: [
        "Induction cannot be justified by deductive logic; no formal argument can demonstrate that the future will resemble the past without assuming what is to be proved.",
        "Induction is not merely psychological habit (pace Hume); it is a rational procedure, but its rationality rests on postulates that cannot themselves be inductively or deductively established.",
        "The justification of induction, if there is one, must rest on synthetic a priori principles or on postulates accepted for their fruitfulness in generating knowledge.",
        "Good inductive arguments are distinguished by variety of instances, absence of counterexamples, and conformity to structural principles about natural kinds and causal regularities.",
        "The uniformity of nature is not an empirical discovery but a presupposition of empirical inquiry; without it, learning from experience would be impossible.",
        "Projectible properties are those that correspond to genuine natural kinds; 'grue'-type predicates fail because they do not carve nature at its joints.",
        "Induction is intimately connected with probability; an inductive conclusion is not certain but is rendered probable by the evidence.",
        "Induction can yield rational belief and even knowledge in a fallibilist sense, though not certainty; most of our knowledge rests on inductive foundations.",
        "There is no fixed number of instances that validates induction; the strength of inductive inference depends on the variety and relevance of evidence, not mere quantity.",
        "Induction is not eliminable; hypothetico-deductive method presupposes induction in accepting that successful predictions confirm theories."
      ]
    },
    {
      title: "Postulates of Scientific Inference",
      sourceWork: "Russell - Postulates of Scientific Inference Position Statements",
      positions: [
        "Scientific inference requires postulates that are neither self-evident nor empirically provable; they are presupposed by the practice of science and justified by their fruits.",
        "The postulates include: quasi-permanence (things persist with gradual change), separable causal lines (causal processes can be traced independently), spatio-temporal continuity (causes and effects are contiguous), structural constancy, and analogy (similar structures have similar causal properties).",
        "These postulates are not a priori in the Kantian sense but are conditions for the possibility of the kind of knowledge science provides.",
        "The causal principle—that similar causes produce similar effects—is a postulate, not an empirical generalization; it underlies the possibility of generalization from experience.",
        "Natural kinds are presupposed by scientific inference; we assume that nature divides into classes whose members share causally relevant properties.",
        "Structural continuity—the assumption that structure is preserved across time and through causal processes—is essential for inference from percepts to physical objects.",
        "The postulates are revisable in the sense that we might find we need different postulates, but science cannot proceed without some such presuppositions.",
        "The principle that unobserved entities behave like observed ones is a form of the analogy postulate; it justifies inference from samples to populations.",
        "The minimum set of postulates is difficult to specify precisely, but they must collectively enable inductive generalization, causal inference, and the postulation of unobserved entities.",
        "The assumption of persistent objects is itself a postulate; what we call a 'thing' is a series of events grouped together by causal continuity."
      ]
    },
    {
      title: "Probability",
      sourceWork: "Russell - Probability Position Statements",
      positions: [
        "Probability has both objective and subjective aspects; there are objective frequencies and propensities, but probability also measures rational credence given evidence.",
        "The frequency theory captures part of what we mean by probability: the probability of an event type is the limit of its relative frequency in a long series of trials.",
        "Single-case probabilities are problematic for frequency theory; we can meaningfully assign probabilities to individual events by treating them as members of reference classes.",
        "The principle of indifference—assigning equal probabilities to alternatives when we have no reason to favor one over another—is useful but must be applied cautiously to avoid paradoxes.",
        "In the absence of evidence, we may assign probabilities based on structural considerations or the principle of indifference, but such assignments are tentative and revisable.",
        "Objective chance may exist in quantum mechanics; if so, not all probability is epistemic, and some events are genuinely indeterministic.",
        "Probability and possibility are distinct; probability measures degrees of rational expectation, while possibility concerns what could be the case.",
        "Probability cannot be defined without some circularity or primitive notion; attempts to reduce probability to frequency or logical relations face significant difficulties.",
        "Probability statements about the past are meaningful; they express what it was rational to expect given the evidence available at the time.",
        "Bayesian reasoning is a rational method for updating probabilities in light of evidence, though the assignment of prior probabilities remains problematic."
      ]
    },
    {
      title: "Logical Positivism",
      sourceWork: "Russell - Logical Positivism Position Statements",
      positions: [
        "The verification principle faces serious difficulties: it is not itself empirically verifiable, and it excludes statements we have good reason to consider meaningful.",
        "Meaning cannot be exhaustively analyzed in terms of verification conditions; theoretical terms in science have meaning even when not directly verifiable.",
        "Logical and mathematical truths are analytic and a priori; they do not describe the world but are true in virtue of the meanings of their terms.",
        "Metaphysical statements are not necessarily meaningless; some metaphysical claims are false and therefore meaningful, while others may be genuinely undecidable.",
        "Universal generalizations have meaning even though they cannot be conclusively verified; they can be confirmed by evidence and falsified by counterexamples.",
        "The analytic/synthetic distinction is defensible but not as sharp as the positivists supposed; there is a continuum from purely logical truths to purely empirical claims.",
        "Counterfactuals and dispositional statements are meaningful and reducible to statements about regularities and structures, though the analysis is complex.",
        "Ethics cannot be reduced to mere emotion; there are rational considerations in ethics, even if moral judgments are not empirically verifiable in the same way as scientific claims.",
        "The demarcation between science and non-science is not sharp; science is distinguished by method and degree of confirmation, not by a clear boundary.",
        "The unity of science is a methodological ideal; all sciences share logical structure and empirical method, but reduction to physics is not always possible or illuminating."
      ]
    },
    {
      title: "The Differential Calculus",
      sourceWork: "Russell - Differential Calculus Position Statements",
      positions: [
        "Infinitesimals, as conceived by Leibniz, are logically suspect; the calculus is rigorously grounded in the concept of limit, which involves only finite quantities.",
        "Limits provide the rigorous foundation: a derivative is the limit of difference quotients, and an integral is the limit of sums, with no need for actually infinitesimal quantities.",
        "Instantaneous velocity is a mathematical construct defined as a limit; it is not a velocity possessed at an instant but a limit of average velocities over shrinking intervals.",
        "Mathematical continuity is precisely defined in terms of limits and epsilon-delta conditions; physical continuity is an empirical question about whether nature admits discontinuities.",
        "The calculus is both a discovery about the structure of the continuum and an invention providing tools for physics; the question of discovery versus invention is less important than the question of utility and correctness.",
        "The continuous and the discrete are both mathematically legitimate; the real numbers provide a model of continuity, while the integers model discreteness.",
        "Motion can be analyzed into a series of positions at times; the appearance of an irreducible dynamic element is an illusion, as Zeno's paradoxes show once properly resolved.",
        "Rates of change at an instant are defined through limits and do not require actual change at the instant; the limit captures what happens arbitrarily close to the instant.",
        "The mathematical concept of limit is idealized; physical measurement always involves finite precision, but the idealization is justified by its theoretical success.",
        "The calculus presupposes only the potential infinite—the unbounded continuation of a process—not the actual infinite, though Cantor showed the actual infinite is also coherent."
      ]
    },
    {
      title: "Surds and Impossible Objects",
      sourceWork: "Russell - Surds and Impossibilia Position Statements",
      positions: [
        "Impossible objects have no being whatsoever; there is no realm of subsistence for self-contradictory entities. The round square does not subsist; it simply is not.",
        "We can think about what cannot exist by entertaining propositional contents; to think of a round square is to entertain the proposition 'x is round and x is square' without asserting it or referring to an object.",
        "Logical impossibility is absolute impossibility; what violates the laws of logic cannot exist in any possible world or under any conceivable circumstances.",
        "Self-contradictory descriptions are meaningful in the sense that we understand what they deny; 'round square' is meaningful because we understand roundness and squareness and their incompatibility.",
        "There are no degrees of impossibility; all contradictions are equally impossible, though some may involve more obvious contradictions than others.",
        "Conceivability is a fallible guide to possibility; we may think we conceive something that is actually impossible, or fail to conceive something that is possible.",
        "Statements about impossibilia are meaningful and false; 'the round square is round' is false because there is no round square, not meaningless.",
        "The law of non-contradiction is a fundamental logical truth; it is not a mere psychological habit or a metaphysical postulate but a condition of intelligible discourse.",
        "Terms like 'square circle' do not refer; they are definite descriptions that fail to be satisfied by any object whatsoever.",
        "We cannot coherently quantify over impossible objects; to say 'there exists a round square' is simply false, not true in some impossible-object domain."
      ]
    },
    {
      title: "The Theory of Descriptions",
      sourceWork: "Russell - Theory of Descriptions Position Statements",
      positions: [
        "Definite descriptions are not names but quantified expressions; 'the F' means 'there is exactly one F, and it...'",
        "Sentences about nonexistent objects are meaningful and false, not meaningless; 'the present King of France is bald' is false because there is no present King of France.",
        "'The present King of France is bald' is false, not truth-valueless; it asserts the existence of a unique King of France, and that assertion is false.",
        "Grammatical form systematically misleads us about logical form; the surface subject-predicate structure conceals underlying quantificational complexity.",
        "Definite descriptions differ fundamentally from proper names; genuine names refer directly, while descriptions work through satisfaction of a predicate.",
        "Presupposition can be analyzed in terms of assertion; what appears to be presupposed is part of what is asserted, and so a failed presupposition yields falsehood.",
        "In intensional contexts, descriptions exhibit scope ambiguities; 'George IV wished to know whether Scott was the author of Waverley' can be read with the description inside or outside the scope of 'wished.'",
        "Indefinite descriptions ('a man') are existential quantifiers without the uniqueness condition; 'a man came' means 'there exists at least one man who came.'",
        "An expression is a genuine name if it refers directly without descriptive content; most apparent names in ordinary language are disguised descriptions.",
        "Sentences with multiple descriptions require careful attention to scope; 'the father of the author of Waverley' involves nested descriptions each requiring existential-uniqueness analysis."
      ]
    },
    {
      title: "The Nature of Entailment",
      sourceWork: "Russell - Entailment Position Statements",
      positions: [
        "Entailment is a relation between propositions such that it is impossible for the premises to be true and the conclusion false; it is stricter than material implication.",
        "Material implication is truth-functional and weaker than entailment; 'p materially implies q' means merely 'not (p and not-q),' which holds whenever q is true or p is false.",
        "Logical entailment holds in virtue of logical form alone; analytic entailment may depend on the meanings of non-logical terms.",
        "The paradoxes of material implication (a false proposition implies anything, a necessary truth is implied by anything) are not paradoxes of entailment proper; entailment requires a stronger connection.",
        "A contradiction entails everything in classical logic (ex falso quodlibet); this is a feature of the logic, though relevance logicians dispute whether it captures genuine entailment.",
        "Entailment is connected to explanation but distinct from it; A may entail B without explaining B (e.g., a conjunction entails its conjuncts but does not explain them).",
        "Entailment is necessary; if A entails B, then in all possible circumstances where A holds, B holds.",
        "Relevance may be desirable for a notion of entailment closer to ordinary reasoning, but classical entailment does not require it.",
        "Non-classical logics may define entailment differently, but they depart from the standard logical framework that underlies mathematics and science.",
        "Entailment is a semantic relation (about truth preservation across possibilities); deducibility is a syntactic relation (about derivation in a formal system). In a complete logic, they coincide."
      ]
    },
    {
      title: "Logic and Philosophy",
      sourceWork: "Russell - Logic and Philosophy Position Statements",
      positions: [
        "Logic is the essence of philosophy; philosophical problems, properly analyzed, are problems of logic or dissolve under logical scrutiny.",
        "Many traditional philosophical problems arise from linguistic confusion; logical analysis can expose pseudo-problems that arise from misunderstanding the logical form of statements.",
        "Formal logic is a tool for clarifying natural language, but natural language is often logically misleading; the task of philosophy is to replace vague ordinary language with precise logical notation.",
        "Logical truths are substantive in that they are necessarily true and govern all possible thought; they are not empty because they exclude contradictory states of affairs.",
        "Logic reveals the structure of thought and, to the extent that thought can represent reality, the structure of possible reality; but logic alone does not tell us what actually exists.",
        "Philosophy has a distinctive method: logical analysis, which distinguishes it from empirical science while remaining complementary to science.",
        "The scope of logical analysis is broad; virtually all meaningful statements can be clarified through logical paraphrase, though some may resist complete analysis.",
        "A logic carries ontological commitments; adopting a logic with certain quantifiers and predicates commits one to certain kinds of entities.",
        "Philosophical intuitions must yield to logical argument when they conflict; an intuition that leads to contradiction must be abandoned.",
        "Philosophy, properly conceived, is continuous with science; it differs in generality and in attention to logical structure but not in fundamental method."
      ]
    },
    {
      title: "Formalism in Mathematics",
      sourceWork: "Russell - Formalism Position Statements",
      positions: [
        "Mathematics cannot be reduced to the mere manipulation of uninterpreted symbols; mathematical propositions have content and are about something, even if that something is abstract.",
        "A mathematical proof is not a sequence of marks but a demonstration that certain propositions follow from others; the marks represent meaningful assertions.",
        "The applicability of mathematics to reality is inexplicable if mathematics is merely a game; the fact that mathematical structures correspond to physical structures shows mathematics has content.",
        "Formal systems are important for rigor, but mathematical truth is not constituted by formal derivability; Gödel showed that truth outruns provability in any consistent system.",
        "Consistency is necessary but not sufficient for mathematical legitimacy; a consistent system of arbitrary axioms does not constitute mathematics unless it captures mathematical truths.",
        "Metamathematics is itself interpreted mathematics; we reason mathematically about formal systems, presupposing the mathematics we use in that reasoning.",
        "Gödel's incompleteness theorems refute strong formalism; no consistent formal system can capture all arithmetic truths, showing mathematics is not reducible to formalism.",
        "Mathematical content exceeds what is captured in formal systems; we understand what the formal systems are about, and this understanding is irreducibly semantic.",
        "Mathematical symbolism is not mere notation but expresses definite logical content; the symbols abbreviate complex logical claims.",
        "Formalism cannot account for mathematical understanding; a machine can manipulate symbols without understanding, but mathematicians grasp meanings."
      ]
    },
    {
      title: "Intuitionism in Mathematics",
      sourceWork: "Russell - Intuitionism Position Statements",
      positions: [
        "Mathematical existence should not be tied exclusively to constructibility; the classical notion of existence, independent of our ability to construct, is legitimate and coherent.",
        "The law of excluded middle is valid for well-defined propositions, including those about infinite domains; denying it for mathematical statements impoverishes mathematics unnecessarily.",
        "A mathematical construction is a procedure for establishing a truth; but there may be truths that we cannot establish, and they are truths nonetheless.",
        "Classical mathematics is not inconsistent; intuitionism restricts mathematics based on epistemological scruples that are not mandated by logic itself.",
        "Mathematical truth is distinct from mathematical proof; a proposition may be true even if we have no way of proving it.",
        "Intuitionism creates difficulties for applied mathematics; much of physics relies on classical analysis, which intuitionists reject.",
        "For undecidable propositions, there is a fact of the matter; Goldbach's conjecture is either true or false, even if we never determine which.",
        "Completed infinities are legitimate mathematical objects; the set of natural numbers exists as a completed totality, not merely as an indefinitely extensible sequence.",
        "Mathematical objects that cannot be constructed may still exist; existence in mathematics is not dependent on human cognitive capacities.",
        "The intuitionistic conception is not psychologistic in the crude sense, but it does tie mathematics too closely to human epistemic limitations."
      ]
    },
    {
      title: "Logicism",
      sourceWork: "Russell - Logicism Position Statements",
      positions: [
        "All mathematical concepts can be defined in purely logical terms; number, successor, addition, and all of arithmetic can be constructed from logical notions.",
        "The concept of number is definable logically; a number is the class of all classes equinumerous to a given class (or, in type theory, a more refined version of this).",
        "The axioms required to derive mathematics from logic are: axioms of logic, the axiom of infinity, and the axiom of reducibility (or some substitute); whether these are 'logical' is debatable.",
        "The axiom of infinity—that there exist infinitely many individuals—is not a logical truth in the traditional sense; it is a postulate required for mathematics but goes beyond pure logic.",
        "The axiom of reducibility was introduced to overcome difficulties in type theory; it is controversial whether it is a logical axiom or a mathematical one.",
        "Set theory can be considered part of logic if logic is understood broadly to include the theory of classes; the boundary between logic and mathematics is not sharp.",
        "The distinction between logic and mathematics becomes blurred under logicism; mathematics is logic, so there is no deep distinction, only a division of labor.",
        "Gödel's theorems show that arithmetic truth cannot be completely captured in any formal system, but this does not refute logicism; it shows that logic itself is inexhaustible.",
        "Logical and mathematical knowledge feel different because mathematical proofs are complex and not immediately obvious; but this is a psychological difference, not a difference in kind.",
        "Logical types are necessary to avoid paradoxes; the ramified theory of types provides a hierarchy that prevents self-referential definitions."
      ]
    },
    {
      title: "Empiricism and Its Limits",
      sourceWork: "Russell - Empiricism Position Statements",
      positions: [
        "All substantive knowledge of the world derives ultimately from sensory experience; but logic and mathematics are a priori and do not depend on experience for their justification.",
        "Logical and mathematical truths are analytic, true in virtue of meaning; they do not describe the world and hence do not conflict with empiricism properly understood.",
        "General truths are known through induction from particular experiences, but induction presupposes principles (postulates of scientific inference) that are not themselves empirical.",
        "The concept of causation is derived from experience of regular succession, but the causal principle—that similar causes produce similar effects—is a postulate, not an empirical observation.",
        "Theoretical entities in science are logical constructions out of sense-data or events; they are not directly observed but are inferred as explanatory posits.",
        "Knowledge of our own minds is empirical but immediate; we have direct acquaintance with our mental states in a way we do not with physical objects.",
        "The principle that all knowledge comes from experience is not itself known empirically; it is a methodological principle that guides inquiry.",
        "A priori knowledge is possible for logic and mathematics because these are about relations of ideas, not about matters of fact.",
        "Experience provides the content of knowledge, but the categories we use to organize experience may have a conventional or pragmatic component.",
        "There are limits to empiricism: scientific inference requires postulates that are not themselves derived from experience but make experience intelligible."
      ]
    },
    {
      title: "Rationalism and Its Limits",
      sourceWork: "Russell - Rationalism Position Statements",
      positions: [
        "Reason alone can yield knowledge of logic and mathematics, which are a priori; but knowledge of the physical world requires experience in addition to reason.",
        "Self-evident truths exist in logic; axioms like the law of non-contradiction are known immediately and require no proof.",
        "The applicability of reason to the world is not a mystery; reason reveals structural features that the world happens to exemplify.",
        "Rationalist metaphysics often degenerates into speculation because it attempts to derive substantive truths about existence from pure reason alone.",
        "Logical necessity is broader than metaphysical necessity; what is logically impossible is metaphysically impossible, but not conversely.",
        "Synthetic a priori knowledge, if it exists, is limited to the postulates of scientific inference; Kant's synthetic a priori is largely analytic under modern logic.",
        "Reason can determine relations of ideas with certainty; but matters of existence require empirical input.",
        "Genuine rational insight is distinguished from prejudice by its susceptibility to logical analysis and its coherence with other knowledge.",
        "Competing rationalist systems are adjudicated by examining their logical consistency and their capacity to accommodate empirical findings.",
        "Reason is a product of evolution, but its reliability is vindicated by the success of science; evolutionary origins do not undermine logical validity."
      ]
    },
    {
      title: "Counterfactual Truth",
      sourceWork: "Russell - Counterfactual Truth Position Statements",
      positions: [
        "Counterfactual conditionals can be analyzed in terms of general laws and initial conditions; they are true if the consequent follows from the antecedent given relevant laws.",
        "Counterfactuals describe objective possibilities in the sense that they are grounded in the causal structure of the world, not merely in our interests.",
        "Counterfactuals are intimately connected with causal claims; to say 'if A had occurred, B would have occurred' is to invoke a causal regularity.",
        "Counterfactuals about the distant past are evaluated by considering what would follow from different initial conditions given known laws.",
        "Similarity relations between possible scenarios are not purely subjective; they are constrained by the structure of natural laws.",
        "Counterfactuals with impossible antecedents are problematic; if the antecedent is logically impossible, the counterfactual is vacuously true or undefined.",
        "Counterfactuals relate to laws of nature because laws support counterfactuals while accidental generalizations do not.",
        "Counterfactual truth can be analyzed in terms of non-counterfactual truth about laws and regularities, though the analysis is complex.",
        "What features are held fixed in evaluating counterfactuals depends on the question being asked and the relevant causal structure.",
        "There are counterfactual facts in the sense that counterfactuals have objective truth conditions grounded in causal laws."
      ]
    },
    {
      title: "Modality",
      sourceWork: "Russell - Modality Position Statements",
      positions: [
        "Necessity comes in different kinds: logical necessity (what cannot be denied without contradiction), physical necessity (what follows from natural laws), and perhaps metaphysical necessity.",
        "Possible worlds are useful logical fictions for analyzing modal claims; we need not suppose they exist in the same sense as the actual world.",
        "The actual world is distinguished from merely possible worlds by the fact that it is; actuality is a primitive notion, not analyzable in other terms.",
        "There may be multiple notions of possibility—logical, physical, epistemic—that are not reducible to a single underlying concept.",
        "Modal truths are known through reason; we grasp necessity by understanding logical relations and impossibility by detecting contradiction.",
        "Essence is connected to necessity: the essential properties of a thing are those it has necessarily, in all possible circumstances where it exists.",
        "Modal facts may be reducible to facts about logical relations; necessary truths are those derivable from logical axioms.",
        "Contingent existence is perfectly coherent; most things that exist might not have existed, and this is a genuine feature of reality.",
        "Modality and time are connected but distinct; temporal necessity (what cannot now be changed) is different from logical necessity.",
        "Modal concepts may not be fully definable without circularity; necessity and possibility may be interdefinable but jointly primitive."
      ]
    },
    {
      title: "Religion and Agnosticism",
      sourceWork: "Russell - Religion Position Statements",
      positions: [
        "No rational ground for belief in a deity; cosmological and teleological arguments fail under logical scrutiny.",
        "Religious experience is psychological, not evidential; such experiences tell us about human psychology, not about supernatural realities.",
        "Religion serves fear and social control; the needs it claims to meet can be better met by science and humanism.",
        "Meaningful life is possible without cosmic purpose, via human values and relationships.",
        "Widespread unbelief leads to better ethics than belief; religious morality is often arbitrary or harmful.",
        "Religious claims are meaningful but unfalsifiable, hence unscientific; they make assertions but cannot be tested.",
        "Evil is incompatible with an omnipotent benevolent deity; the problem of evil is decisive against traditional theism.",
        "Religious belief originates in psychology—fear, wish-fulfillment, social conditioning—not revelation or rational insight.",
        "Morality survives without religion, based on human sympathy and rational consideration of consequences.",
        "Mystical experience reveals psychology, not reality; feelings of transcendence are real experiences but poor evidence for metaphysical claims."
      ]
    },
    {
      title: "Ethics and Metaethics",
      sourceWork: "Russell - Ethics Position Statements",
      positions: [
        "Moral judgments express attitudes, not facts; they are closer to expressions of preference than to descriptions of objective properties.",
        "Ethical disputes can be resolved rationally when they concern means, but ultimate ends are matters of preference.",
        "Rightness is based on consequences for happiness; consequentialism captures what is sound in moral intuition.",
        "Moral knowledge is acquired empirically, via understanding human desires and their consequences.",
        "Good relates to what is desired desirably—what we would desire if fully informed and reflective.",
        "Moral and non-moral goods differ by universality; moral goods are those we recommend to everyone similarly situated.",
        "Evolutionary explanations of morality do not undermine its validity; natural origins are compatible with moral truth.",
        "Morality and self-interest align in enlightened views; what is good for each contributes to what is good for all.",
        "There are no moral facts in the sense of mind-independent properties; moral claims express attitudes, not beliefs about an external moral realm.",
        "Moral progress is real, toward greater humanism—reduction of cruelty, expansion of sympathy, respect for individual rights."
      ]
    },
    {
      title: "Education and Progressive Schooling",
      sourceWork: "Russell - Education Position Statements",
      positions: [
        "Education's aim is knowledge, character, and practical skills for happiness and citizenship.",
        "Children should have significant freedom to direct learning, avoiding repression that stunts development.",
        "Competition in education is harmful; cooperation produces better learning and character.",
        "Emotional development is cultivated through freedom and affection, not discipline and fear.",
        "Balance individuality with cultural transmission via child-centered methods that respect natural curiosity.",
        "Formal education should begin around age 6, with early years focused on play and exploration.",
        "Intellectual and moral education are intertwined for rational citizenship; critical thinking enables moral judgment.",
        "Punishment should be minimal and constructive; fear-based education produces neurosis, not learning.",
        "Education should aim for breadth over early specialization; premature narrowing impoverishes the mind.",
        "Critical thinking is cultivated through exposure to evidence and encouragement of doubt, avoiding dogmatism."
      ]
    },
    {
      title: "Political Philosophy and Liberalism",
      sourceWork: "Russell - Political Philosophy Position Statements",
      positions: [
        "State power should be limited to preventing harm and promoting welfare; excessive state power threatens liberty.",
        "Balance liberty and welfare through democratic socialism; pure capitalism and pure socialism both fail.",
        "Democracy is the best form of government as it maximizes freedom and ensures accountability.",
        "Politics and economics should be separated to avoid dangerous concentrations of power.",
        "Just society can tolerate some inequalities if they benefit all, including the least advantaged.",
        "Liberty and equality are compatible via social reforms that expand opportunity without crushing individuality.",
        "Society can be free and secure through international cooperation; nationalism breeds conflict.",
        "Property rights are justified by utility but limited by public good; ownership is not an absolute right.",
        "Prevent majority tyranny via constitutional protections for individual rights.",
        "Nationalism is illegitimate, fostering conflict and irrationality; loyalty to humanity should replace it."
      ]
    },
    {
      title: "History of Western Philosophy",
      sourceWork: "Russell - History of Philosophy Position Statements",
      positions: [
        "Philosophical questions are conceptual, distinct from empirical science or faith-based religion; philosophy clarifies concepts and examines presuppositions.",
        "Philosophy progresses by clarifying problems, though many persist because they touch human limitations.",
        "Persistent problems arise from language ambiguities and the difficulty of transcending human perspective.",
        "Philosophers' ideas are shaped by social conditions; philosophy is not purely abstract but reflects its time.",
        "Few debates are resolved definitively, though some (like certain logical paradoxes) find solutions.",
        "Philosophy makes less cumulative progress than science due to its conceptual rather than empirical nature.",
        "Philosophy refines common sense through analysis; it does not replace common sense but clarifies it.",
        "Distinguish genuine insight from confusion via logical clarity; much traditional philosophy fails this test.",
        "Temperament influences philosophical positions, but logic adjudicates between competing views.",
        "History is essential for understanding philosophy's development; ideas emerge from and respond to earlier ideas."
      ]
    },
    {
      title: "The Philosophy of Leibniz",
      sourceWork: "Russell - Philosophy of Leibniz Position Statements",
      positions: [
        "Reality composed of monads is an ingenious but ultimately inconsistent metaphysics; logical analysis reveals its flaws.",
        "The principle of sufficient reason leads to determinism incompatible with genuine freedom; Leibniz cannot escape this consequence.",
        "This is not the best possible world; the existence of evil undermines Leibniz's theodicy.",
        "Logic and metaphysics are intertwined in Leibniz, but his logic was limited; modern logic exposes the weaknesses.",
        "Pre-established harmony does not solve the mind-body problem; it merely redescribes the problem without explaining it.",
        "The identity of indiscernibles is questionable; there could be two qualitatively identical objects at different locations.",
        "Possible worlds are logical constructs; Leibniz's claim that God chose the best is not demonstrable.",
        "Monads are windowless, but pre-established harmony is an artificial solution lacking explanatory power.",
        "The law of continuity is a methodological maxim, not a metaphysical truth; nature may admit discontinuities.",
        "Leibniz's logic, particularly his subject-predicate analysis, leads to his metaphysics; the logic needs correction first."
      ]
    }
  ];

  let totalEmbedded = 0;
  const batchSize = 5;

  for (const section of sections) {
    console.log(`\nProcessing section: ${section.title}`);
    
    for (let i = 0; i < section.positions.length; i += batchSize) {
      const batch = section.positions.slice(i, i + batchSize);
      
      for (const position of batch) {
        try {
          const embedding = await getEmbedding(position);
          
          await db.insert(paperChunks).values({
            figureId: "russell",
            author: "Bertrand Russell",
            paperTitle: section.sourceWork,
            content: position,
            embedding: embedding,
            chunkIndex: totalEmbedded,
            domain: section.title.toLowerCase().replace(/\s+/g, "_"),
            sourceWork: section.sourceWork,
            significance: "HIGH"
          });
          
          totalEmbedded++;
          console.log(`Embedded position ${totalEmbedded}: ${position.substring(0, 50)}...`);
        } catch (error) {
          console.error(`Error embedding position: ${position.substring(0, 50)}...`, error);
        }
      }
      
      if (i + batchSize < section.positions.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  console.log(`\n=== Russell Embedding Complete ===`);
  console.log(`Total positions embedded: ${totalEmbedded}`);
  console.log(`Sections processed: ${sections.length}`);
}

embedRussellPositions()
  .then(() => {
    console.log("Russell embedding script completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error running Russell embedding script:", error);
    process.exit(1);
  });

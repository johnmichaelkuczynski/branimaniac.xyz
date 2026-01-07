export interface TopicQuestion {
  topic: string;
  description: string;
  questions: string[];
}

export const russellTopics: TopicQuestion[] = [
  {
    topic: "Relativity Theory",
    description: "The philosophical implications of relativity—space-time, simultaneity, the block universe, and the nature of causation.",
    questions: [
      "What is the ontological status of space-time—is it a substance or a system of relations?",
      "If simultaneity is relative to a frame of reference, is there any objective temporal order to events?",
      "Does the relativity of measurement imply the relativity of reality itself?",
      "How do we reconcile the block universe implied by relativity with our experience of temporal passage?",
      "What is the relationship between the geometry of space-time and the distribution of matter?",
      "Is the speed of light a physical limit or a definitional feature of our measurement conventions?",
      "Does general relativity eliminate the need for gravitational force, or merely redescribe it?",
      "How should we interpret the equivalence of mass and energy—are they one thing or two convertible things?",
      "What becomes of causation if the temporal order of events can vary across reference frames?",
      "Does relativity support a relational or absolute conception of motion?"
    ]
  },
  {
    topic: "Structure of the Atom",
    description: "The ontological status of subatomic particles, the nature of electrons, and the relationship between physics and chemistry.",
    questions: [
      "What is the ontological status of subatomic particles—are they things or mathematical abstractions?",
      "How do we reconcile the discrete structure of matter with the apparent continuity of macroscopic objects?",
      "What is an electron—a particle, a wave, a field excitation, or something else entirely?",
      "How do we understand 'empty space' within the atom—is it genuinely empty or filled with fields?",
      "What is the relationship between the mathematical model of the atom and the atom itself?",
      "How do we make sense of electron 'orbits' that are not trajectories in any classical sense?",
      "What determines the stability of atomic structure?",
      "Are the properties of atoms reducible to the properties of their constituents?",
      "How should we interpret the nucleus—as a composite entity or a unified whole?",
      "What is the relationship between the atom of physics and the atom of chemistry?"
    ]
  },
  {
    topic: "Quantum Theory",
    description: "Superposition, wave function collapse, indeterminacy, non-locality, and whether quantum mechanics describes reality or knowledge.",
    questions: [
      "Does quantum mechanics describe reality or merely our knowledge of reality?",
      "What is the meaning of superposition—is a particle genuinely in multiple states simultaneously?",
      "How do we interpret the collapse of the wave function—is it a physical process or an epistemic update?",
      "Is quantum indeterminacy ontological or merely a reflection of our ignorance?",
      "What is the nature of quantum probability—is it the same as classical probability or something fundamentally different?",
      "How do we understand non-locality—does it imply action at a distance?",
      "What becomes of the principle of sufficient reason in a quantum world?",
      "Can there be a complete description of a physical system, or is incompleteness fundamental?",
      "What is the role of observation in quantum mechanics—does consciousness play a physical role?",
      "How do we reconcile quantum mechanics with our ordinary conception of objects having definite properties?"
    ]
  },
  {
    topic: "Inductive Inference",
    description: "The problem of induction, justification of inference, probability, and the relationship to hypothetico-deductive method.",
    questions: [
      "What justifies our expectation that the future will resemble the past?",
      "Is induction a form of inference at all, or merely a psychological habit?",
      "Can induction be justified without circularity?",
      "What distinguishes good inductive arguments from bad ones?",
      "Is there a principle of uniformity of nature, and if so, what is its status?",
      "How do we determine which properties are projectible in inductive inference?",
      "What is the relationship between induction and probability?",
      "Can induction yield knowledge, or only reasonable belief?",
      "How many instances are required before an inductive inference becomes warranted?",
      "Is induction eliminable in favor of hypothetico-deductive method?"
    ]
  },
  {
    topic: "Postulates of Scientific Inference",
    description: "The necessary presuppositions for science—causality, uniformity, natural kinds, and structural continuity.",
    questions: [
      "What assumptions must we make for scientific inference to be possible?",
      "Are the postulates of scientific inference empirical claims or a priori presuppositions?",
      "How do we justify causal assumptions that go beyond observed regularities?",
      "What is the status of the principle that similar causes produce similar effects?",
      "Is the assumption of natural kinds necessary for science, and how is it justified?",
      "What role does the assumption of structural continuity play in scientific inference?",
      "Are the postulates of scientific inference revisable, or are they constitutive of science itself?",
      "How do we justify the assumption that unobserved entities behave like observed ones?",
      "What is the minimum set of assumptions required for scientific knowledge?",
      "Can scientific inference proceed without assuming the existence of persistent objects?"
    ]
  },
  {
    topic: "Probability",
    description: "Objective vs subjective probability, frequency theory, single-case probability, Bayesian reasoning, and objective chance.",
    questions: [
      "Is probability an objective feature of the world or a measure of subjective credence?",
      "What is the relationship between probability and frequency?",
      "Can single events have probabilities, or only types of events?",
      "What is the status of the principle of indifference—is it a priori valid?",
      "How do we assign probabilities when we have no relevant evidence?",
      "Is there such a thing as objective chance, or is all probability epistemic?",
      "What is the relationship between probability and possibility?",
      "Can probability be defined without circularity?",
      "How do we understand probability statements about the past?",
      "Is Bayesian reasoning the correct account of how evidence supports hypotheses?"
    ]
  },
  {
    topic: "Logical Positivism",
    description: "The verification principle, the analytic/synthetic distinction, demarcation of science, and the status of metaphysics.",
    questions: [
      "Is the verification principle itself verifiable or meaningful by its own criterion?",
      "Can meaning be exhaustively analyzed in terms of verification conditions?",
      "What is the status of logical and mathematical truths under verificationism?",
      "Are metaphysical statements genuinely meaningless or merely unverifiable?",
      "How do we account for the meaning of universal generalizations that cannot be fully verified?",
      "Is there a clear distinction between analytic and synthetic statements?",
      "What is the proper analysis of counterfactual and dispositional statements?",
      "Can ethics be reduced to expressions of emotion without cognitive content?",
      "How do we demarcate science from non-science?",
      "Is the unity of science a methodological ideal or a metaphysical thesis?"
    ]
  },
  {
    topic: "The Differential Calculus",
    description: "Infinitesimals, limits, instantaneous velocity, continuity, and the foundations of mathematical analysis.",
    questions: [
      "What are infinitesimals—genuine quantities, useful fictions, or something else?",
      "How do limits provide a rigorous foundation for what Newton and Leibniz did intuitively?",
      "What is the ontological status of instantaneous velocity—is it a real property or a mathematical construct?",
      "How do we understand continuity, and is physical continuity the same as mathematical continuity?",
      "Is the calculus a discovery about reality or an invention for describing it?",
      "What is the relationship between discrete and continuous quantities?",
      "Can motion be analyzed into instantaneous states, or is there an irreducible dynamic element?",
      "How do we make sense of rates of change at an instant when change requires duration?",
      "What is the relationship between the mathematical concept of limit and physical approximation?",
      "Does the calculus presuppose the actual infinite or only the potential infinite?"
    ]
  },
  {
    topic: "Surds and Impossible Objects",
    description: "The status of impossible objects, logical vs physical impossibility, conceivability and possibility.",
    questions: [
      "What is the status of impossible objects—do they have any kind of being?",
      "Can we think about what cannot exist, and if so, what are we thinking about?",
      "What distinguishes logical impossibility from physical impossibility?",
      "Are self-contradictory descriptions meaningless or meaningful but necessarily false?",
      "Can there be degrees of impossibility?",
      "What is the relationship between conceivability and possibility?",
      "How do we explain the apparent meaningfulness of statements about impossibilia?",
      "Is the law of non-contradiction a logical truth, a psychological necessity, or a metaphysical principle?",
      "What is the semantic value of terms like 'square circle'—do they refer to anything?",
      "Can we quantify over impossible objects in a coherent way?"
    ]
  },
  {
    topic: "The Theory of Descriptions",
    description: "Definite descriptions, logical form vs grammatical form, reference, and the present King of France.",
    questions: [
      "What is the logical form of sentences containing definite descriptions?",
      "How do we explain the meaningfulness of sentences about nonexistent objects?",
      "Is 'the present King of France is bald' true, false, or neither?",
      "What is the relationship between grammatical form and logical form?",
      "How do definite descriptions function differently from proper names?",
      "What is presupposition, and how does it differ from assertion?",
      "How do descriptions behave in intensional contexts like belief reports?",
      "Can the theory of descriptions be extended to indefinite descriptions?",
      "What determines whether an expression is a description or a genuine name?",
      "How do we analyze sentences with multiple descriptions?"
    ]
  },
  {
    topic: "The Nature of Entailment",
    description: "Entailment vs implication, logical vs analytic entailment, paradoxes of material implication, relevance logic.",
    questions: [
      "What is the relationship between entailment and implication?",
      "Is entailment a relation between propositions, sentences, or something else?",
      "How do we distinguish logical entailment from analytic entailment?",
      "Are the paradoxes of material implication genuine paradoxes or merely counterintuitive truths?",
      "Does a contradiction entail everything, or is that an artifact of classical logic?",
      "What is the relationship between entailment and explanation?",
      "Can there be contingent entailments, or is all entailment necessary?",
      "Is relevance a requirement for genuine entailment?",
      "How do we understand entailment in non-classical logics?",
      "What is the relationship between entailment and deducibility?"
    ]
  },
  {
    topic: "Logic and Philosophy",
    description: "Whether logic is the essence of philosophy, logical analysis as method, the scope and limits of logical inquiry.",
    questions: [
      "Is logic the essence of philosophy or merely a tool for philosophical inquiry?",
      "Can philosophical problems be dissolved through logical analysis?",
      "What is the proper relationship between formal logic and natural language?",
      "Are logical truths substantive or empty tautologies?",
      "Does logic reveal the structure of reality or only the structure of thought?",
      "Can there be philosophical knowledge that is not reducible to logical knowledge?",
      "Is philosophy continuous with science, or does logic give it a distinct method?",
      "What is the scope of logical analysis—can all meaningful statements be analyzed logically?",
      "Does the adoption of a logic commit one to a metaphysics?",
      "Can philosophical intuitions ever override logical arguments?"
    ]
  },
  {
    topic: "Formalism",
    description: "Whether mathematics is symbol manipulation, the relationship between formal systems and mathematical truth, Gödel's results.",
    questions: [
      "Can mathematics be reduced to the manipulation of uninterpreted symbols?",
      "What distinguishes a mathematical proof from a mere sequence of marks?",
      "If mathematics is a game with symbols, why is it applicable to reality?",
      "What is the relationship between formal systems and mathematical truth?",
      "Can consistency be the only criterion of mathematical legitimacy?",
      "How do we interpret metamathematics if mathematics itself is uninterpreted?",
      "What is the status of Gödel's results for formalist programs?",
      "Is there mathematical content beyond what can be captured in formal systems?",
      "What distinguishes mathematical symbolism from mere notation?",
      "Can formalism account for mathematical understanding as opposed to mere calculation?"
    ]
  },
  {
    topic: "Intuitionism",
    description: "Mathematical existence and constructibility, the law of excluded middle, the relationship between truth and proof.",
    questions: [
      "Is mathematical existence dependent on constructibility?",
      "Must we reject the law of excluded middle for infinite domains?",
      "What is a mathematical construction, and what makes it legitimate?",
      "Is classical mathematics genuinely inconsistent, or merely unjustified?",
      "What is the relationship between mathematical truth and mathematical proof?",
      "Can intuitionism account for applied mathematics?",
      "Is there a fact of the matter about undecidable propositions?",
      "What is the status of completed infinities—are they legitimate mathematical objects?",
      "How do we understand mathematical objects that cannot be constructed?",
      "Is the intuitionistic conception of mathematics psychologistic?"
    ]
  },
  {
    topic: "Logicism",
    description: "The reduction of mathematics to logic, the concept of number, axioms of infinity and reducibility.",
    questions: [
      "Can all mathematical concepts be defined in purely logical terms?",
      "Is the concept of number a logical concept?",
      "What is the status of the axioms required to derive mathematics from logic?",
      "Is the axiom of infinity a logical truth?",
      "How do we understand the axiom of reducibility—is it logical or mathematical?",
      "Can set theory be considered part of logic?",
      "What distinguishes logic from mathematics if mathematics reduces to logic?",
      "Is the logicist program compatible with Gödel's incompleteness theorems?",
      "How do we account for the apparent difference between logical and mathematical knowledge?",
      "What is the relationship between logical types and mathematical structures?"
    ]
  },
  {
    topic: "Empiricism and Its Limits",
    description: "Whether all knowledge traces to experience, the status of a priori knowledge, theoretical entities in science.",
    questions: [
      "Can all knowledge be traced to sensory experience?",
      "What is the status of logical and mathematical knowledge under empiricism?",
      "How do we know general truths on the basis of particular experiences?",
      "Is the concept of causation derivable from experience alone?",
      "What is the empirical status of theoretical entities in science?",
      "Can we have knowledge of our own minds through experience?",
      "Is the principle that all knowledge comes from experience itself known empirically?",
      "How do we account for a priori knowledge if empiricism is true?",
      "What is the relationship between experience and the categories we use to organize it?",
      "Are there limits to what experience can teach us about the ultimate nature of reality?"
    ]
  },
  {
    topic: "Rationalism and Its Limits",
    description: "Whether reason alone yields knowledge of reality, self-evident truths, synthetic a priori knowledge.",
    questions: [
      "Can reason alone, independent of experience, yield knowledge of reality?",
      "What is the status of allegedly self-evident truths?",
      "How do we explain the applicability of reason to a world not created by reason?",
      "Can rationalist metaphysics avoid degenerating into empty speculation?",
      "What is the relationship between logical necessity and metaphysical necessity?",
      "Is there synthetic a priori knowledge, and if so, how is it possible?",
      "Can reason determine matters of existence, or only relations of ideas?",
      "What distinguishes genuine rational insight from mere prejudice?",
      "How do we adjudicate between competing rationalist systems?",
      "Is reason itself a product of evolution, and if so, can we trust it?"
    ]
  },
  {
    topic: "Counterfactual Truth",
    description: "What makes counterfactuals true or false, possible worlds, similarity relations, and laws of nature.",
    questions: [
      "What makes a counterfactual conditional true or false?",
      "Do counterfactuals describe real possibilities or merely reflect our interests?",
      "What is the relationship between counterfactuals and causal claims?",
      "How do we evaluate counterfactuals about events in the distant past?",
      "Are there objective similarity relations between possible worlds?",
      "What is the truth value of counterfactuals with impossible antecedents?",
      "How do counterfactuals relate to laws of nature?",
      "Can counterfactual truth be analyzed in terms of non-counterfactual truth?",
      "What determines which features are held fixed in evaluating counterfactuals?",
      "Are there counterfactual facts, or only counterfactual assertions?"
    ]
  },
  {
    topic: "Modality",
    description: "The nature of necessity and possibility, possible worlds, essence, modal knowledge.",
    questions: [
      "What is the nature of necessity—is it logical, metaphysical, or something else?",
      "Are possible worlds real, or merely useful fictions?",
      "What distinguishes the actual world from merely possible worlds?",
      "Is there a single notion of possibility, or multiple irreducible notions?",
      "How do we know modal truths—through reason, imagination, or something else?",
      "What is the relationship between essence and necessity?",
      "Are modal facts reducible to non-modal facts?",
      "Is there such a thing as contingent existence, and how do we understand it?",
      "What is the relationship between modality and time?",
      "Can modal concepts be defined without circularity?"
    ]
  }
];

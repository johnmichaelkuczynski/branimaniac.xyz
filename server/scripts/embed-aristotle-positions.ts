import OpenAI from "openai";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ARISTOTLE_POSITIONS = [
  // Categories (20 positions)
  { domain: "categories", content: "Primary substances (individual things—'this man,' 'this horse') are ontologically fundamental; everything else is either predicated of them or present in them.", work: "Categories" },
  { domain: "categories", content: "Secondary substances are the species and genera under which primary substances fall; they are less fundamental but still substantial.", work: "Categories" },
  { domain: "categories", content: "There are exactly ten categories (highest genera of being): substance, quantity, quality, relation, place, time, position, state, action, affection.", work: "Categories" },
  { domain: "categories", content: "The 'said of' relation (predication) is distinct from the 'present in' relation (inherence).", work: "Categories" },
  { domain: "categories", content: "Substance admits no contrary—there is no opposite of 'man' or 'horse.'", work: "Categories" },
  { domain: "categories", content: "Substance does not admit of degrees—one man is not more a man than another.", work: "Categories" },
  { domain: "categories", content: "Substance can receive contraries while remaining numerically one (the same individual can become hot, then cold).", work: "Categories" },
  { domain: "categories", content: "Quantity is either discrete or continuous—number is discrete; line, surface, body, time, and place are continuous.", work: "Categories" },
  { domain: "categories", content: "Quantity has no contrary and does not admit of degrees.", work: "Categories" },
  { domain: "categories", content: "Parts of some quantities have position relative to one another (parts of a line), while others do not (units of number).", work: "Categories" },
  { domain: "categories", content: "Relatives are defined correlatively—a master is master of a slave; double is double of a half.", work: "Categories" },
  { domain: "categories", content: "Some relatives are simultaneous by nature with their correlatives; knowing which correlative exists entails knowing the other exists.", work: "Categories" },
  { domain: "categories", content: "Quality has four species: states/dispositions, natural capacities, affective qualities, and shape/figure.", work: "Categories" },
  { domain: "categories", content: "Quality admits both contraries and degrees—something can be more or less white; justice is contrary to injustice.", work: "Categories" },
  { domain: "categories", content: "The similar and dissimilar are predicated only in respect of quality.", work: "Categories" },
  { domain: "categories", content: "There are four types of opposition: contradictory, contrary, privative (possession/privation), and relative.", work: "Categories" },
  { domain: "categories", content: "Contradictories admit no intermediate and one must be true of any subject; some contraries admit intermediates (black/white), others do not (odd/even).", work: "Categories" },
  { domain: "categories", content: "Privation differs from negation—blindness is privation of sight in what naturally has sight, not mere absence.", work: "Categories" },
  { domain: "categories", content: "Priority has multiple senses: temporal, existential (what can exist without the other), order of exposition, and value.", work: "Categories" },
  { domain: "categories", content: "Change/motion falls into six species: generation, corruption, increase, diminution, alteration, and locomotion.", work: "Categories" },

  // On Interpretation (20 positions)
  { domain: "on_interpretation", content: "Words are symbols of mental affections, which are likenesses of things; written words are symbols of spoken words.", work: "On Interpretation" },
  { domain: "on_interpretation", content: "Mental affections are the same for all humans, though spoken and written words differ by convention across languages.", work: "On Interpretation" },
  { domain: "on_interpretation", content: "Nouns and verbs in isolation are neither true nor false—truth and falsity require combination or separation in a statement.", work: "On Interpretation" },
  { domain: "on_interpretation", content: "A noun signifies by convention and without reference to time; no part of it has independent meaning.", work: "On Interpretation" },
  { domain: "on_interpretation", content: "A verb additionally co-signifies time and is always a sign of something said of something else.", work: "On Interpretation" },
  { domain: "on_interpretation", content: "Indefinite nouns ('not-man') and indefinite verbs ('does-not-recover') are not genuine nouns or verbs but distinct forms.", work: "On Interpretation" },
  { domain: "on_interpretation", content: "The statement (logos apophantikos) is the only form of discourse that admits truth or falsity; prayers, commands, and questions do not.", work: "On Interpretation" },
  { domain: "on_interpretation", content: "Every statement is either an affirmation (kataphasis) or a denial (apophasis).", work: "On Interpretation" },
  { domain: "on_interpretation", content: "A simple statement predicates one thing of one subject; composite statements join multiple predications.", work: "On Interpretation" },
  { domain: "on_interpretation", content: "Contradictory pairs consist of an affirmation and its corresponding denial; exactly one must be true, the other false.", work: "On Interpretation" },
  { domain: "on_interpretation", content: "Universal, particular, and indefinite statements differ in logical force—'every man is white' differs from 'some man is white' differs from 'man is white.'", work: "On Interpretation" },
  { domain: "on_interpretation", content: "Contradictory opposition differs from contrary opposition—'every man is just' and 'no man is just' are contraries (both can be false), not contradictories.", work: "On Interpretation" },
  { domain: "on_interpretation", content: "With singular statements about present or past facts, the law of bivalence holds without exception.", work: "On Interpretation" },
  { domain: "on_interpretation", content: "Future contingent statements (e.g., 'there will be a sea-battle tomorrow') pose a problem: assigning definite truth-values seems to imply fatalism.", work: "On Interpretation" },
  { domain: "on_interpretation", content: "The sea-battle argument: if every future-tensed statement is already true or false, then everything happens by necessity and deliberation is pointless.", work: "On Interpretation" },
  { domain: "on_interpretation", content: "Aristotle's solution (variously interpreted): the disjunction 'there will or will not be a sea-battle' is necessarily true, but neither disjunct is determinately true now.", work: "On Interpretation" },
  { domain: "on_interpretation", content: "Modal notions—possibility, impossibility, necessity, contingency—attach to statements and must be analyzed carefully.", work: "On Interpretation" },
  { domain: "on_interpretation", content: "'Possible' and 'not impossible' are logically equivalent; 'necessary' and 'not possible not' are equivalent.", work: "On Interpretation" },
  { domain: "on_interpretation", content: "The square of opposition for modal statements differs from that for assertoric statements; modal contradictories must be carefully identified.", work: "On Interpretation" },
  { domain: "on_interpretation", content: "There is a logical asymmetry between necessity and possibility: what is necessary is possible, but not vice versa; what is impossible is not possible, but not everything not-possible is impossible in the same sense.", work: "On Interpretation" },

  // Prior Analytics (20 positions)
  { domain: "prior_analytics", content: "A syllogism is a discourse in which, certain things being stated, something other than what is stated follows of necessity from their being so.", work: "Prior Analytics" },
  { domain: "prior_analytics", content: "Every syllogism consists of exactly three terms: major, minor, and middle.", work: "Prior Analytics" },
  { domain: "prior_analytics", content: "Every syllogism consists of exactly two premises and one conclusion.", work: "Prior Analytics" },
  { domain: "prior_analytics", content: "The middle term appears in both premises but not in the conclusion; it is the cause of the conclusion's necessity.", work: "Prior Analytics" },
  { domain: "prior_analytics", content: "There are exactly three syllogistic figures, distinguished by the position of the middle term in the premises.", work: "Prior Analytics" },
  { domain: "prior_analytics", content: "First figure: middle is subject in one premise, predicate in the other—produces the most perfect and self-evident syllogisms.", work: "Prior Analytics" },
  { domain: "prior_analytics", content: "Second figure: middle is predicate in both premises—suited for negative conclusions.", work: "Prior Analytics" },
  { domain: "prior_analytics", content: "Third figure: middle is subject in both premises—suited for particular conclusions.", work: "Prior Analytics" },
  { domain: "prior_analytics", content: "Premises and conclusions are either universal or particular, and either affirmative or negative, yielding four propositional forms (A, E, I, O in medieval terminology).", work: "Prior Analytics" },
  { domain: "prior_analytics", content: "Only certain combinations of premise-pairs yield valid conclusions; Aristotle systematically identifies which moods are valid in each figure.", work: "Prior Analytics" },
  { domain: "prior_analytics", content: "First-figure moods (Barbara, Celarent, Darii, Ferio) are perfect—their validity is self-evident and requires no proof.", work: "Prior Analytics" },
  { domain: "prior_analytics", content: "Imperfect syllogisms (in second and third figures) can be perfected by reduction to first-figure moods.", work: "Prior Analytics" },
  { domain: "prior_analytics", content: "Conversion is a key method of reduction: E-propositions and I-propositions convert simply; A-propositions convert only to I-propositions.", work: "Prior Analytics" },
  { domain: "prior_analytics", content: "Reductio ad impossibile is another method for proving validity: assume the contradictory of the desired conclusion and derive a contradiction.", work: "Prior Analytics" },
  { domain: "prior_analytics", content: "Ekthesis (exposition/setting out) is a third proof method involving selection of an individual instance.", work: "Prior Analytics" },
  { domain: "prior_analytics", content: "Some premise combinations yield no valid conclusion at all—Aristotle proves invalidity by counterexample.", work: "Prior Analytics" },
  { domain: "prior_analytics", content: "Modal syllogistic extends the theory to premises involving necessity, possibility, and contingency.", work: "Prior Analytics" },
  { domain: "prior_analytics", content: "Mixed modal syllogisms (one necessary premise, one assertoric) can yield necessary conclusions under certain conditions.", work: "Prior Analytics" },
  { domain: "prior_analytics", content: "The logic is fundamentally term logic, not propositional logic—it concerns relations among terms via predication.", work: "Prior Analytics" },
  { domain: "prior_analytics", content: "The syllogistic provides the formal structure for scientific demonstration, though demonstration proper requires additional conditions treated in the Posterior Analytics.", work: "Prior Analytics" },

  // Posterior Analytics (20 positions)
  { domain: "posterior_analytics", content: "Scientific knowledge (episteme) is knowledge of the cause and of the fact that it could not be otherwise—it is necessary, not contingent.", work: "Posterior Analytics" },
  { domain: "posterior_analytics", content: "All teaching and learning proceed from pre-existing knowledge, either of the fact that something is or of the meaning of terms.", work: "Posterior Analytics" },
  { domain: "posterior_analytics", content: "Scientific knowledge is acquired through demonstration (apodeixis)—a syllogism that produces knowledge.", work: "Posterior Analytics" },
  { domain: "posterior_analytics", content: "A demonstration must proceed from premises that are true, primary, immediate, better known than, prior to, and causally explanatory of the conclusion.", work: "Posterior Analytics" },
  { domain: "posterior_analytics", content: "Demonstrative premises must be necessary—one cannot have scientific knowledge of what could be otherwise.", work: "Posterior Analytics" },
  { domain: "posterior_analytics", content: "There is a regress problem: if every premise requires demonstration, we face infinite regress, circularity, or foundationalism.", work: "Posterior Analytics" },
  { domain: "posterior_analytics", content: "Aristotle's solution is foundationalism: demonstration rests on first principles (archai) that are known but not themselves demonstrated.", work: "Posterior Analytics" },
  { domain: "posterior_analytics", content: "First principles are grasped by nous (intellectual intuition), not by demonstration—nous is more certain than scientific knowledge.", work: "Posterior Analytics" },
  { domain: "posterior_analytics", content: "First principles include axioms (common to all sciences), definitions, and hypotheses (existence assumptions).", work: "Posterior Analytics" },
  { domain: "posterior_analytics", content: "Each science has its own proper principles concerning its proper genus; one cannot demonstrate across genera (no 'metabasis').", work: "Posterior Analytics" },
  { domain: "posterior_analytics", content: "Definitions state the essence (to ti en einai)—the 'what it was to be' that thing.", work: "Posterior Analytics" },
  { domain: "posterior_analytics", content: "A proper definition is reached through division of genus by differentiae until the infima species is isolated.", work: "Posterior Analytics" },
  { domain: "posterior_analytics", content: "Demonstration reveals the 'reasoned fact' (to dioti), not merely the 'bare fact' (to hoti)—it shows why, not just that.", work: "Posterior Analytics" },
  { domain: "posterior_analytics", content: "The middle term in a demonstration expresses the cause; finding the middle term is finding the explanation.", work: "Posterior Analytics" },
  { domain: "posterior_analytics", content: "There are four types of cause (material, formal, efficient, final), and different demonstrations exhibit different causal relations.", work: "Posterior Analytics" },
  { domain: "posterior_analytics", content: "Per se (kath' hauto) predication differs from accidental predication; science concerns only per se attributes of its subject genus.", work: "Posterior Analytics" },
  { domain: "posterior_analytics", content: "Scientific demonstration concerns what holds universally and always, or at least for the most part—not the exceptional or coincidental.", work: "Posterior Analytics" },
  { domain: "posterior_analytics", content: "Nominal definitions (what a term signifies) differ from real definitions (what the essence of the thing is).", work: "Posterior Analytics" },
  { domain: "posterior_analytics", content: "The existence of a thing must be established before its essence can be demonstrated; you cannot define what does not exist.", work: "Posterior Analytics" },
  { domain: "posterior_analytics", content: "The structure of a science is thus: establish the existence of basic subjects, grasp definitions and axioms through nous, then demonstrate per se attributes of those subjects through their causes.", work: "Posterior Analytics" },

  // Topics (20 positions)
  { domain: "topics", content: "The Topics concerns dialectical reasoning—syllogisms from reputable opinions (endoxa), not from necessary truths as in demonstration.", work: "Topics" },
  { domain: "topics", content: "Dialectic is useful for training, for conversation with the many, and for philosophical sciences (by revealing aporiai and first principles).", work: "Topics" },
  { domain: "topics", content: "A dialectical proposition is one that seems true to all, to most, or to the wise (and among the wise, to all, most, or the most notable).", work: "Topics" },
  { domain: "topics", content: "A problem is a thesis about which people either hold no opinion, or the many disagree with the wise, or there is disagreement within either group.", work: "Topics" },
  { domain: "topics", content: "Every dialectical proposition and problem concerns one of four predicables: definition, genus, proprium (unique property), or accident.", work: "Topics" },
  { domain: "topics", content: "A definition states the essence and is convertible with its subject—it applies to all and only instances of the definiendum.", work: "Topics" },
  { domain: "topics", content: "A genus is predicated essentially of many things differing in species—it says what the subject is but not uniquely.", work: "Topics" },
  { domain: "topics", content: "A proprium is not the essence but belongs to only that species and is convertible with it (e.g., capable of learning grammar / man).", work: "Topics" },
  { domain: "topics", content: "An accident is what may belong or not belong to the same subject—it is neither definition, genus, nor proprium.", work: "Topics" },
  { domain: "topics", content: "The dialectician must collect topoi (commonplaces)—general argumentative strategies applicable across subject matters.", work: "Topics" },
  { domain: "topics", content: "Topoi are organized according to which predicable is at issue: there are topoi for attacking or establishing definitions, genera, propria, and accidents.", work: "Topics" },
  { domain: "topics", content: "Topoi for definition include: checking if the definition fails to be convertible, if it is obscure, if it uses metaphor, if it is circular, if it fails to state the genus.", work: "Topics" },
  { domain: "topics", content: "Topoi for genus include: checking if the proposed genus is not predicated in the 'what is it' category, if something participates in the genus but not the species.", work: "Topics" },
  { domain: "topics", content: "Topoi for proprium include: checking if the property fails to hold of all instances, if it is not convertible, if it holds only sometimes.", work: "Topics" },
  { domain: "topics", content: "Topoi for accident include: examining opposites, correlatives, coordinates, and inflections to find inconsistencies.", work: "Topics" },
  { domain: "topics", content: "Induction is the progression from particulars to universals and is more persuasive to the many; syllogism moves from universals and is more compelling to dialecticians.", work: "Topics" },
  { domain: "topics", content: "The questioner's goal is to extract concessions that yield a contradictory conclusion to the answerer's thesis; the answerer's goal is to avoid contradiction.", work: "Topics" },
  { domain: "topics", content: "One should distinguish multiple senses of a term (homonymy) before proceeding—ambiguity is a source of fallacious refutation.", work: "Topics" },
  { domain: "topics", content: "Dialectical practice requires knowing not just the topoi but when and how to deploy them—order, timing, and concealment matter.", work: "Topics" },
  { domain: "topics", content: "Dialectic is propaedeutic to first philosophy: by thoroughly examining aporiai from all sides, dialectic clears the path toward grasping the first principles that nous ultimately apprehends.", work: "Topics" },

  // Sophistical Refutations (20 positions)
  { domain: "sophistical_refutations", content: "This work concerns apparent but not genuine refutations—arguments that seem to refute but do not actually establish a contradiction.", work: "Sophistical Refutations" },
  { domain: "sophistical_refutations", content: "A genuine refutation (elenchus) is a syllogism that establishes the contradictory of a given thesis; sophistical refutations only appear to do this.", work: "Sophistical Refutations" },
  { domain: "sophistical_refutations", content: "Sophistry is the appearance of wisdom without the reality; the sophist trades in apparent rather than genuine arguments.", work: "Sophistical Refutations" },
  { domain: "sophistical_refutations", content: "There are exactly thirteen types of fallacy, divided into two main classes.", work: "Sophistical Refutations" },
  { domain: "sophistical_refutations", content: "Six fallacies depend on language (in dictione): homonymy, amphiboly, combination, division, accent, and form of expression.", work: "Sophistical Refutations" },
  { domain: "sophistical_refutations", content: "Seven fallacies are independent of language (extra dictionem): accident, secundum quid, ignoratio elenchi, begging the question, consequent, non-cause as cause, and many questions.", work: "Sophistical Refutations" },
  { domain: "sophistical_refutations", content: "Homonymy occurs when a word has multiple meanings and the argument exploits this ambiguity at the term level.", work: "Sophistical Refutations" },
  { domain: "sophistical_refutations", content: "Amphiboly occurs when a whole phrase or sentence admits multiple interpretations due to grammatical structure.", work: "Sophistical Refutations" },
  { domain: "sophistical_refutations", content: "Combination and division involve shifting how words are grouped together or separated across premises and conclusion.", work: "Sophistical Refutations" },
  { domain: "sophistical_refutations", content: "Accent (in Greek) involves exploitation of differences in breathing or pitch that alter meaning.", work: "Sophistical Refutations" },
  { domain: "sophistical_refutations", content: "Form of expression occurs when grammatical similarity suggests ontological similarity—treating a quality-word as if it named a substance.", work: "Sophistical Refutations" },
  { domain: "sophistical_refutations", content: "The fallacy of accident illegitimately transfers a predicate from a subject to something accidentally related to that subject.", work: "Sophistical Refutations" },
  { domain: "sophistical_refutations", content: "Secundum quid ignores a qualification—what is true in a certain respect is treated as true absolutely.", work: "Sophistical Refutations" },
  { domain: "sophistical_refutations", content: "Ignoratio elenchi occurs when one refutes something other than the thesis actually maintained—missing the point.", work: "Sophistical Refutations" },
  { domain: "sophistical_refutations", content: "Begging the question (petitio principii) occurs when the premise assumes what was to be proved, either directly or through equivalents.", work: "Sophistical Refutations" },
  { domain: "sophistical_refutations", content: "The fallacy of the consequent illicitly infers the antecedent from the consequent or converts a universal affirmative simply.", work: "Sophistical Refutations" },
  { domain: "sophistical_refutations", content: "Non-cause as cause treats as essential to the refutation a premise that plays no genuine role in deriving the contradiction.", work: "Sophistical Refutations" },
  { domain: "sophistical_refutations", content: "Many questions disguises multiple questions as one, extracting a single answer that commits the respondent to more than intended.", work: "Sophistical Refutations" },
  { domain: "sophistical_refutations", content: "The solution to each fallacy consists in identifying which of the thirteen types it instantiates and showing precisely where the appearance of validity breaks down.", work: "Sophistical Refutations" },
  { domain: "sophistical_refutations", content: "Dialectical training in recognizing fallacies is essential for philosophy itself—the philosopher must be able to detect sophistical traps to pursue genuine inquiry into truth.", work: "Sophistical Refutations" },

  // Physics (20 positions)
  { domain: "physics", content: "Nature (physis) is an internal principle of motion and rest—natural things have within themselves the source of their own change.", work: "Physics" },
  { domain: "physics", content: "Physics studies natural beings—things that exist by nature as opposed to things that exist by art (techne) or chance.", work: "Physics" },
  { domain: "physics", content: "The physicist must know all four causes: material, formal, efficient, and final—nature is a cause in multiple senses.", work: "Physics" },
  { domain: "physics", content: "Teleology is essential to natural explanation—nature acts for the sake of ends; final causation is not reducible to mechanism.", work: "Physics" },
  { domain: "physics", content: "Chance and spontaneity are real but derivative—they are incidental causes that presuppose the regular, goal-directed order of nature.", work: "Physics" },
  { domain: "physics", content: "The principles of natural things are form, privation, and matter—change requires a persisting substrate and a transition between opposites.", work: "Physics" },
  { domain: "physics", content: "Matter (hyle) is pure potentiality; form (eidos) is actuality—every natural substance is a composite of the two.", work: "Physics" },
  { domain: "physics", content: "Motion (kinesis) is the actuality of what exists potentially, insofar as it is potential—the progressive actualization of a capacity.", work: "Physics" },
  { domain: "physics", content: "There are four kinds of motion: locomotion, alteration, growth/diminution, and (in a qualified sense) generation/corruption.", work: "Physics" },
  { domain: "physics", content: "Motion presupposes the infinite, place, void, and time—each must be analyzed to understand change.", work: "Physics" },
  { domain: "physics", content: "The infinite exists only potentially, never actually—there is no actually infinite body or magnitude, only indefinite divisibility or addition.", work: "Physics" },
  { domain: "physics", content: "Place (topos) is the innermost motionless boundary of the containing body—it is where a thing is, distinct from the thing itself.", work: "Physics" },
  { domain: "physics", content: "Void (kenon) does not exist—motion does not require empty space; in fact void would make motion impossible (no natural direction, no medium for speed differentiation).", work: "Physics" },
  { domain: "physics", content: "Time is the number of motion with respect to before and after—it is dependent on change and on a soul that counts.", work: "Physics" },
  { domain: "physics", content: "The now is to time as the moving body is to motion—a continuity-maker that is always different yet connects past and future.", work: "Physics" },
  { domain: "physics", content: "Continuity characterizes magnitude, motion, and time—they are infinitely divisible and contain no indivisible atomic units.", work: "Physics" },
  { domain: "physics", content: "Zeno's paradoxes are resolved by distinguishing actual from potential infinity—a finite magnitude contains infinitely many potential but not actual parts.", work: "Physics" },
  { domain: "physics", content: "Every motion requires a mover—nothing moves itself in the primary sense; there must be an agent of change distinct from the patient.", work: "Physics" },
  { domain: "physics", content: "There cannot be an infinite regress of movers—there must be a first unmoved mover that initiates motion without itself being moved.", work: "Physics" },
  { domain: "physics", content: "The unmoved mover is eternal, without magnitude, and located at the periphery of the cosmos—it causes the eternal circular motion of the heavens, which in turn causes all sublunary change.", work: "Physics" },

  // On the Heavens (20 positions)
  { domain: "on_the_heavens", content: "The cosmos is a finite, spherical, and eternal whole—it has no beginning and no end in time.", work: "On the Heavens" },
  { domain: "on_the_heavens", content: "There are two distinct regions of the cosmos: the superlunary (heavens) and the sublunary (terrestrial).", work: "On the Heavens" },
  { domain: "on_the_heavens", content: "The heavenly bodies are composed of a fifth element (aether)—distinct from earth, water, air, and fire, and not subject to generation or corruption.", work: "On the Heavens" },
  { domain: "on_the_heavens", content: "Aether's natural motion is eternal circular locomotion—unlike the rectilinear motion natural to the four terrestrial elements.", work: "On the Heavens" },
  { domain: "on_the_heavens", content: "Circular motion is prior to and more perfect than rectilinear motion—it alone can be continuous, uniform, and eternal.", work: "On the Heavens" },
  { domain: "on_the_heavens", content: "The heavens are eternal and unchangeable—the celestial realm admits no generation, corruption, growth, or alteration.", work: "On the Heavens" },
  { domain: "on_the_heavens", content: "The stars and planets are divine beings—their eternal circular motion reflects their perfection and divinity.", work: "On the Heavens" },
  { domain: "on_the_heavens", content: "The celestial spheres are animate and ensouled—their motion is voluntary activity, not mechanical compulsion.", work: "On the Heavens" },
  { domain: "on_the_heavens", content: "The earth is spherical—demonstrated by the shape of its shadow on the moon during eclipses and by the changing visibility of stars as one travels north or south.", work: "On the Heavens" },
  { domain: "on_the_heavens", content: "The earth is at rest at the center of the cosmos—it does not rotate or revolve; the heavens revolve around it.", work: "On the Heavens" },
  { domain: "on_the_heavens", content: "Earth rests at the center by nature, not by constraint—heavy elements naturally move toward the center; earth has nowhere further to fall.", work: "On the Heavens" },
  { domain: "on_the_heavens", content: "The cosmos is unique—there cannot be multiple worlds, because all matter of each element would naturally collect in a single cosmic center.", work: "On the Heavens" },
  { domain: "on_the_heavens", content: "There is nothing outside the cosmos—no void, no body, no place, no time beyond the outermost sphere.", work: "On the Heavens" },
  { domain: "on_the_heavens", content: "The four terrestrial elements have natural rectilinear motions: earth and water move downward (toward center), fire and air move upward (toward periphery).", work: "On the Heavens" },
  { domain: "on_the_heavens", content: "Heaviness and lightness are natural tendencies, not relational properties—earth is absolutely heavy, fire absolutely light.", work: "On the Heavens" },
  { domain: "on_the_heavens", content: "Each element has a natural place to which it moves and in which it rests unless impeded.", work: "On the Heavens" },
  { domain: "on_the_heavens", content: "The elements can transform into one another through qualitative change—unlike aether, which is immutable.", work: "On the Heavens" },
  { domain: "on_the_heavens", content: "The size of the earth is relatively small compared to the celestial spheres—Aristotle cites mathematicians' estimates of its circumference.", work: "On the Heavens" },
  { domain: "on_the_heavens", content: "Against the atomists: indivisible magnitudes and infinite void are impossible—the cosmos is continuous and plenum.", work: "On the Heavens" },
  { domain: "on_the_heavens", content: "The order and regularity of celestial motion evidences cosmic rationality—the heavens manifest an intelligible, purposive structure that physics must explain through final as well as efficient causes.", work: "On the Heavens" },

  // On Generation and Corruption (20 positions)
  { domain: "on_generation_corruption", content: "Generation (genesis) is the coming-to-be of a substance; corruption (phthora) is its ceasing-to-be—these differ fundamentally from alteration.", work: "On Generation and Corruption" },
  { domain: "on_generation_corruption", content: "Alteration is change in quality while the subject persists; generation and corruption involve the subject itself coming into or going out of existence.", work: "On Generation and Corruption" },
  { domain: "on_generation_corruption", content: "Against the Eleatics: generation is real, not mere illusion—things genuinely come to be and pass away.", work: "On Generation and Corruption" },
  { domain: "on_generation_corruption", content: "Against the atomists: generation is not merely rearrangement of eternal particles—substantial change is irreducible to locomotion of atoms.", work: "On Generation and Corruption" },
  { domain: "on_generation_corruption", content: "Matter (hyle) underlies all generation and corruption—it is the persisting substrate that receives successive forms.", work: "On Generation and Corruption" },
  { domain: "on_generation_corruption", content: "Prime matter is pure potentiality with no determinate characteristics of its own—it is never encountered apart from some form.", work: "On Generation and Corruption" },
  { domain: "on_generation_corruption", content: "Generation and corruption are correlative and cyclical—one thing's corruption is another's generation; nothing comes from nothing.", work: "On Generation and Corruption" },
  { domain: "on_generation_corruption", content: "The four elements (earth, water, air, fire) are the simplest bodies into which others are resolved and from which they are composed.", work: "On Generation and Corruption" },
  { domain: "on_generation_corruption", content: "The elements are defined by pairs of contraries: hot/cold and wet/dry—fire is hot and dry, air is hot and wet, water is cold and wet, earth is cold and dry.", work: "On Generation and Corruption" },
  { domain: "on_generation_corruption", content: "Elemental transformation occurs when one contrary replaces another—fire becomes air when dry is replaced by wet (both remain hot).", work: "On Generation and Corruption" },
  { domain: "on_generation_corruption", content: "Elements transform more easily when they share a quality—fire to air is easier than fire to water, which requires both contraries to change.", work: "On Generation and Corruption" },
  { domain: "on_generation_corruption", content: "Mixture (mixis) is genuine combination producing a homogeneous new body—distinct from mere juxtaposition of particles.", work: "On Generation and Corruption" },
  { domain: "on_generation_corruption", content: "In true mixture, the ingredients are preserved potentially but not actually—they can be recovered but are not present as distinct bodies.", work: "On Generation and Corruption" },
  { domain: "on_generation_corruption", content: "Contact and agent-patient interaction are prerequisites for generation and mixture—bodies must be able to act upon and be affected by one another.", work: "On Generation and Corruption" },
  { domain: "on_generation_corruption", content: "Acting and being acted upon require contrariety—things that share no contrary qualities cannot interact.", work: "On Generation and Corruption" },
  { domain: "on_generation_corruption", content: "Agent and patient must be alike in genus but unlike in species—there must be both commonality and opposition.", work: "On Generation and Corruption" },
  { domain: "on_generation_corruption", content: "Combination is reciprocal—in genuine mixture, each ingredient acts on and is acted upon by the others simultaneously.", work: "On Generation and Corruption" },
  { domain: "on_generation_corruption", content: "The efficient cause of terrestrial generation and corruption is ultimately the sun's motion along the ecliptic—its approach and recession cause cycles of coming-to-be and passing-away.", work: "On Generation and Corruption" },
  { domain: "on_generation_corruption", content: "Generation and corruption are eternal and continuous in the sublunary realm—though individuals perish, the species and the cycle persist forever.", work: "On Generation and Corruption" },
  { domain: "on_generation_corruption", content: "The eternity of generation depends on celestial motion—the heavens' eternal circular movement guarantees the perpetual cycle of terrestrial change, linking the cosmic order into a unified whole.", work: "On Generation and Corruption" },

  // Meteorology (20 positions)
  { domain: "meteorology", content: "Meteorology studies phenomena in the region between the heavens and the earth—occurrences in the upper atmosphere and related terrestrial phenomena.", work: "Meteorology" },
  { domain: "meteorology", content: "These phenomena are caused by two exhalations rising from the earth: one hot and dry (smoky/vaporous), the other wet and cold (moist/steamy).", work: "Meteorology" },
  { domain: "meteorology", content: "The dry exhalation is responsible for winds, thunder, lightning, and various fiery phenomena in the upper atmosphere.", work: "Meteorology" },
  { domain: "meteorology", content: "The moist exhalation is responsible for clouds, rain, dew, frost, snow, and hail.", work: "Meteorology" },
  { domain: "meteorology", content: "The region below the moon is filled with these exhalations, which are continuously drawn up by the sun's heat.", work: "Meteorology" },
  { domain: "meteorology", content: "Comets and the Milky Way are not celestial phenomena but atmospheric—they are ignitions of the dry exhalation in the upper air.", work: "Meteorology" },
  { domain: "meteorology", content: "Shooting stars and meteors are likewise combustions of dry exhalation, not objects falling from the heavens.", work: "Meteorology" },
  { domain: "meteorology", content: "The heat of the sun is the primary efficient cause of meteorological phenomena—it drives the evaporative cycle.", work: "Meteorology" },
  { domain: "meteorology", content: "Winds are horizontal movements of the dry exhalation; their direction and character depend on geographical and seasonal factors.", work: "Meteorology" },
  { domain: "meteorology", content: "Thunder is the sound produced when dry exhalation trapped in clouds is violently expelled; lightning is its ignition.", work: "Meteorology" },
  { domain: "meteorology", content: "Lightning is perceived before thunder because sight is faster than hearing—both occur simultaneously but are perceived successively.", work: "Meteorology" },
  { domain: "meteorology", content: "Rain forms when moist exhalation rises, cools, condenses into clouds, and the droplets coalesce until heavy enough to fall.", work: "Meteorology" },
  { domain: "meteorology", content: "Snow is frozen cloud; frost is frozen dew; hail forms when rain freezes during rapid descent through cold air.", work: "Meteorology" },
  { domain: "meteorology", content: "Rivers and springs originate from condensation within the earth and from rainwater collected in subterranean reservoirs—not from inexhaustible underground seas.", work: "Meteorology" },
  { domain: "meteorology", content: "The sea is salty because the dry, earthy exhalation mixes with water; evaporation removes fresh water, leaving salt concentrated.", work: "Meteorology" },
  { domain: "meteorology", content: "The sea's level remains constant because evaporation balances inflow—it neither increases indefinitely nor dries up.", work: "Meteorology" },
  { domain: "meteorology", content: "Earthquakes are caused by dry exhalation trapped underground seeking release—the earth shakes as the pneuma bursts forth.", work: "Meteorology" },
  { domain: "meteorology", content: "Geological change occurs over vast time scales—seas become land, land becomes sea, but so slowly that it escapes historical memory.", work: "Meteorology" },
  { domain: "meteorology", content: "Rainbows, halos, and mock suns are optical phenomena produced by reflection of light from moisture in the air under specific geometric conditions.", work: "Meteorology" },
  { domain: "meteorology", content: "The rainbow displays a fixed order of colors and appears at a specific angle relative to sun and observer—Aristotle attempts a geometrical explanation of its arc and coloration.", work: "Meteorology" },

  // On the Soul (20 positions)
  { domain: "on_the_soul", content: "Soul (psyche) is the form of a natural body having life potentially—it is the first actuality of an organized living body.", work: "On the Soul" },
  { domain: "on_the_soul", content: "Soul and body are not two separate substances but related as form to matter—the soul is the actuality of which the body is the potentiality.", work: "On the Soul" },
  { domain: "on_the_soul", content: "Asking whether soul and body are one is therefore like asking whether the wax and its shape are one—the question dissolves once hylomorphism is understood.", work: "On the Soul" },
  { domain: "on_the_soul", content: "Soul is not itself a body but cannot exist apart from a body (with one possible exception)—it is not independently subsistent.", work: "On the Soul" },
  { domain: "on_the_soul", content: "There are three grades of soul: nutritive (plants), sensitive (animals), and rational (humans)—each higher grade presupposes the lower.", work: "On the Soul" },
  { domain: "on_the_soul", content: "The nutritive soul is the most basic principle of life, responsible for nutrition, growth, and reproduction.", work: "On the Soul" },
  { domain: "on_the_soul", content: "The sensitive soul adds perception, desire, and locomotion—these capacities require bodily organs.", work: "On the Soul" },
  { domain: "on_the_soul", content: "Perception is the reception of sensible form without the matter—the eye receives the form of redness without receiving red paint.", work: "On the Soul" },
  { domain: "on_the_soul", content: "Each sense has its proper object (color for sight, sound for hearing); error concerning proper objects is minimal.", work: "On the Soul" },
  { domain: "on_the_soul", content: "There are also common sensibles (motion, rest, number, shape, magnitude) perceived by multiple senses, and incidental sensibles perceived through association.", work: "On the Soul" },
  { domain: "on_the_soul", content: "The common sense (koine aisthesis) integrates deliverances of the five senses and enables awareness of perceiving.", work: "On the Soul" },
  { domain: "on_the_soul", content: "Imagination (phantasia) is distinct from both perception and thought—it is a movement resulting from actual perception that enables images to persist in the soul.", work: "On the Soul" },
  { domain: "on_the_soul", content: "The rational soul adds the capacity for thought (nous)—grasping universals, engaging in reasoning, contemplating truth.", work: "On the Soul" },
  { domain: "on_the_soul", content: "Thinking differs from perceiving: perception requires bodily organs and is of particulars; thought requires no organ and grasps universals.", work: "On the Soul" },
  { domain: "on_the_soul", content: "The intellect is potentially all intelligibles—it becomes what it thinks by receiving intelligible forms.", work: "On the Soul" },
  { domain: "on_the_soul", content: "Aristotle distinguishes agent intellect and patient intellect—one is like light that makes colors visible; the other is like a tablet on which nothing is written.", work: "On the Soul" },
  { domain: "on_the_soul", content: "The agent intellect is separable, impassible, unmixed, and eternal—this notoriously obscure passage has generated centuries of controversy.", work: "On the Soul" },
  { domain: "on_the_soul", content: "The object of thought in act is identical with the thinking intellect—in thinking a form, the intellect becomes that form.", work: "On the Soul" },
  { domain: "on_the_soul", content: "Desire (orexis) is the source of animal locomotion—movement requires both a cognitive apprehension of a goal and an appetitive striving toward it.", work: "On the Soul" },
  { domain: "on_the_soul", content: "The soul is ultimately defined by its characteristic activities, not its material substrate—to understand what soul is, study what living things distinctively do.", work: "On the Soul" },

  // Parva Naturalia (20 positions)
  { domain: "parva_naturalia", content: "The Parva Naturalia treats phenomena common to soul and body—states that involve psychic capacities but depend essentially on bodily conditions.", work: "Parva Naturalia" },
  { domain: "parva_naturalia", content: "Sense and Sensibilia: The sensible qualities (colors, sounds, odors, flavors, tangible qualities) are objective features of bodies, not mere subjective affections.", work: "Parva Naturalia" },
  { domain: "parva_naturalia", content: "Color is the visible quality of what is visible in itself; it is located at the surface of bodies and requires a transparent medium (light) for perception.", work: "Parva Naturalia" },
  { domain: "parva_naturalia", content: "The number of basic colors is finite and determinate—intermediate colors arise from mixture of extremes (white and black).", work: "Parva Naturalia" },
  { domain: "parva_naturalia", content: "On Memory: Memory is the possession of an image as a likeness of that of which it is an image—it involves a representational reference to the past.", work: "Parva Naturalia" },
  { domain: "parva_naturalia", content: "Memory belongs to the same part of the soul as imagination—it requires phantasmata (mental images).", work: "Parva Naturalia" },
  { domain: "parva_naturalia", content: "Memory is essentially of the past—one cannot remember present perceptions or future expectations; memory intrinsically involves temporal distance.", work: "Parva Naturalia" },
  { domain: "parva_naturalia", content: "Recollection (anamnesis) differs from memory—it is an active search, a quasi-inferential recovery of what was known, moving through associated images.", work: "Parva Naturalia" },
  { domain: "parva_naturalia", content: "Recollection proceeds by association: similarity, contrariety, and contiguity guide the search through the sequence of phantasmata.", work: "Parva Naturalia" },
  { domain: "parva_naturalia", content: "On Sleep and Waking: Sleep is a natural state involving the incapacitation of the primary sense organ—the heart in Aristotle's physiology.", work: "Parva Naturalia" },
  { domain: "parva_naturalia", content: "Sleep results from evaporation of nutriment—warm vapors rise to the head, cool, and descend, causing loss of perceptual awareness.", work: "Parva Naturalia" },
  { domain: "parva_naturalia", content: "Sleep is for the sake of preservation—it rests the sense organs and restores the animal's capacity for waking activity.", work: "Parva Naturalia" },
  { domain: "parva_naturalia", content: "On Dreams: Dreams are movements of phantasia occurring during sleep—residual motions from waking perception that persist and become vivid when external sensation ceases.", work: "Parva Naturalia" },
  { domain: "parva_naturalia", content: "Dreams are not divine prophecies—they are natural phenomena explicable by the mechanics of sense-imagery.", work: "Parva Naturalia" },
  { domain: "parva_naturalia", content: "Some dreams may coincidentally match future events by chance, or the dream may serve as a starting point that influences subsequent action, or the dreamer may perceive subtle bodily signs that portend illness.", work: "Parva Naturalia" },
  { domain: "parva_naturalia", content: "On Divination in Sleep: Most apparently prophetic dreams are coincidences; true divine dreams would require explaining why the gods send them to ordinary people rather than the wise.", work: "Parva Naturalia" },
  { domain: "parva_naturalia", content: "On Length and Shortness of Life: Longevity correlates with the balance and quality of the organism's vital heat and moisture—different species have different natural lifespans.", work: "Parva Naturalia" },
  { domain: "parva_naturalia", content: "On Youth and Old Age, Life and Death: Life depends on innate heat centered in the heart; death occurs when this heat is exhausted or extinguished.", work: "Parva Naturalia" },
  { domain: "parva_naturalia", content: "On Respiration: Breathing serves to cool the vital heat—animals that breathe maintain their heat within viable limits through this refrigeration.", work: "Parva Naturalia" },
  { domain: "parva_naturalia", content: "All these phenomena reveal the intimate union of soul and body—psychic activities are realized in and through physiological processes; studying one requires studying the other.", work: "Parva Naturalia" },

  // History of Animals (20 positions)
  { domain: "history_of_animals", content: "This work is descriptive and data-gathering, not explanatory—it catalogs the differentiae of animals as the empirical basis for causal inquiry in other treatises.", work: "History of Animals" },
  { domain: "history_of_animals", content: "Animals differ in their parts, activities, ways of life, and characters—classification requires attending to multiple dimensions of variation.", work: "History of Animals" },
  { domain: "history_of_animals", content: "Parts are either uniform (homoeomerous) like flesh, bone, and blood, or non-uniform (anhomoeomerous) like face, hand, and eye—non-uniform parts are composed of uniform parts.", work: "History of Animals" },
  { domain: "history_of_animals", content: "Some parts are analogous rather than identical across species—what functions as a lung in one animal may be gills in another.", work: "History of Animals" },
  { domain: "history_of_animals", content: "Animals are classified by mode of reproduction: viviparous (live birth), oviparous (eggs), ovoviviparous (internal eggs hatching inside), and vermiparous (larvae).", work: "History of Animals" },
  { domain: "history_of_animals", content: "Animals are classified by habitat: land, water, air—some are amphibious, living in multiple environments.", work: "History of Animals" },
  { domain: "history_of_animals", content: "Animals are classified by diet: carnivorous, herbivorous, omnivorous, and specialized feeders on particular substances.", work: "History of Animals" },
  { domain: "history_of_animals", content: "Animals are classified by social organization: solitary, gregarious, and political (living in cooperative communities with division of labor, like bees and humans).", work: "History of Animals" },
  { domain: "history_of_animals", content: "Blooded animals (enaima) include humans, viviparous quadrupeds, oviparous quadrupeds, birds, and fish—roughly corresponding to vertebrates.", work: "History of Animals" },
  { domain: "history_of_animals", content: "Bloodless animals (anaima) include cephalopods, crustaceans, testaceans (shelled animals), and insects—roughly corresponding to invertebrates.", work: "History of Animals" },
  { domain: "history_of_animals", content: "Aristotle provides detailed anatomical descriptions based on dissection—internal organs, vascular systems, reproductive structures, and sensory apparatus.", work: "History of Animals" },
  { domain: "history_of_animals", content: "Humans serve as the standard of comparison—human anatomy is best known to us, and other animals are described by similarity and difference from the human case.", work: "History of Animals" },
  { domain: "history_of_animals", content: "Animals exhibit characteristic behaviors and temperaments—courage, timidity, gentleness, ferocity, cunning, stupidity vary across species and correlate with bodily constitution.", work: "History of Animals" },
  { domain: "history_of_animals", content: "Aristotle records detailed observations of reproductive behavior: mating seasons, courtship, copulation, gestation periods, parental care.", work: "History of Animals" },
  { domain: "history_of_animals", content: "Development from embryo to adult is carefully observed—Aristotle famously tracked chick development by opening eggs at successive intervals.", work: "History of Animals" },
  { domain: "history_of_animals", content: "Sexual differentiation exists in most but not all animals—male and female differ in parts, capacities, and temperament.", work: "History of Animals" },
  { domain: "history_of_animals", content: "Some animals arise by spontaneous generation—certain insects, shellfish, and lower organisms were believed to arise from mud, decaying matter, or dew.", work: "History of Animals" },
  { domain: "history_of_animals", content: "Animals exhibit practical intelligence proportionate to their nature—tool use, memory, learning, and communication vary by species.", work: "History of Animals" },
  { domain: "history_of_animals", content: "Aristotle draws on multiple sources: personal observation, reports from hunters, fishermen, beekeepers, travelers, and earlier writers—he distinguishes what he has seen from hearsay.", work: "History of Animals" },
  { domain: "history_of_animals", content: "The History provides the phenomena to be explained—the causes (formal, material, efficient, final) of these differentiae are investigated in Parts of Animals and Generation of Animals.", work: "History of Animals" },

  // Parts of Animals (20 positions)
  { domain: "parts_of_animals", content: "This work provides causal explanations for the anatomical features cataloged in the History of Animals—it asks why animals have the parts they do.", work: "Parts of Animals" },
  { domain: "parts_of_animals", content: "Final causation is primary in biological explanation—parts exist for the sake of their functions; nature does nothing in vain.", work: "Parts of Animals" },
  { domain: "parts_of_animals", content: "The biologist must study form more than matter—the defining features of an animal are its functional organization, not its material constituents.", work: "Parts of Animals" },
  { domain: "parts_of_animals", content: "Necessity in biology is conditional (hypothetical), not absolute—given that an animal is to perform a certain function, certain material conditions are necessary.", work: "Parts of Animals" },
  { domain: "parts_of_animals", content: "One should not disdain the study of lowly creatures—every natural kind exhibits order and beauty to those who investigate its causes.", work: "Parts of Animals" },
  { domain: "parts_of_animals", content: "Parts exist either for the sake of survival (to zen) or for the sake of living well (to eu zen)—some organs are indispensable, others serve flourishing.", work: "Parts of Animals" },
  { domain: "parts_of_animals", content: "Uniform parts (flesh, bone, blood) are composed of the four elements and serve as matter for non-uniform parts.", work: "Parts of Animals" },
  { domain: "parts_of_animals", content: "Non-uniform parts (organs, limbs) are composed of uniform parts and perform the characteristic functions of the animal.", work: "Parts of Animals" },
  { domain: "parts_of_animals", content: "Blood is the final form of nutriment and the material from which all other parts are constituted—it is the fundamental vital fluid.", work: "Parts of Animals" },
  { domain: "parts_of_animals", content: "The heart is the central organ of the body—the seat of vital heat, the source of blood, and the origin of the vascular system.", work: "Parts of Animals" },
  { domain: "parts_of_animals", content: "The brain exists to cool the blood and counterbalance the heart's heat—Aristotle denies it is the seat of sensation or intelligence.", work: "Parts of Animals" },
  { domain: "parts_of_animals", content: "Lungs provide cooling through respiration; animals without lungs use gills or other structures for the same purpose.", work: "Parts of Animals" },
  { domain: "parts_of_animals", content: "Animals with more blood and hotter constitutions are generally more active, intelligent, and courageous—temperament correlates with physiology.", work: "Parts of Animals" },
  { domain: "parts_of_animals", content: "Parts that are necessary for survival (nutritive, sensory, locomotive) are found universally; parts for well-being vary more across species.", work: "Parts of Animals" },
  { domain: "parts_of_animals", content: "Nature provides defensive and offensive parts according to each animal's way of life—horns, tusks, claws, hooves serve protection and predation.", work: "Parts of Animals" },
  { domain: "parts_of_animals", content: "When nature allocates material to one part, it economizes elsewhere—no animal has both horns and tusks; resources are finite.", work: "Parts of Animals" },
  { domain: "parts_of_animals", content: "The right side of the body is naturally stronger and more honorable than the left—humans exhibit this most fully by standing upright.", work: "Parts of Animals" },
  { domain: "parts_of_animals", content: "Humans are the most upright of animals because their nature is most divine—they alone have their upper parts oriented toward the upper cosmos.", work: "Parts of Animals" },
  { domain: "parts_of_animals", content: "Humans have hands because they are rational—not rational because they have hands; the hand is the tool of tools, suited to the versatile intelligence.", work: "Parts of Animals" },
  { domain: "parts_of_animals", content: "Throughout, Aristotle insists on the methodological priority of function over structure—we understand what a part is by understanding what it is for.", work: "Parts of Animals" },

  // Generation of Animals (20 positions)
  { domain: "generation_of_animals", content: "This work explains the efficient and formal causes of animal reproduction—how new organisms come to be and acquire their specific forms.", work: "Generation of Animals" },
  { domain: "generation_of_animals", content: "Sexual reproduction involves the union of male and female contributions, which differ in kind rather than merely in degree.", work: "Generation of Animals" },
  { domain: "generation_of_animals", content: "The male contributes form (the efficient and formal cause) through semen; the female contributes matter (the material cause) through menstrual fluid or its analogue.", work: "Generation of Animals" },
  { domain: "generation_of_animals", content: "Semen does not become part of the embryo—it acts like a craftsman on material, imparting motion and form without contributing substance.", work: "Generation of Animals" },
  { domain: "generation_of_animals", content: "The formative power of semen is carried by pneuma (vital breath)—a substance analogous to aether that transmits soul-capacities.", work: "Generation of Animals" },
  { domain: "generation_of_animals", content: "The female provides catamenia (menstrual blood) as the matter to be shaped—it is concocted blood not yet fully refined into bodily parts.", work: "Generation of Animals" },
  { domain: "generation_of_animals", content: "Conception occurs when male semen acts on female matter, setting it and imparting the movements that will produce the embryo's parts.", work: "Generation of Animals" },
  { domain: "generation_of_animals", content: "Spontaneous generation occurs in some lower organisms when environmental heat acts on suitable matter without sexual union—nature still provides form.", work: "Generation of Animals" },
  { domain: "generation_of_animals", content: "The heart forms first in the embryo—it is the principle of life and the source from which other organs develop.", work: "Generation of Animals" },
  { domain: "generation_of_animals", content: "Development proceeds by epigenesis, not preformation—parts are generated successively, not simply enlarged from a pre-existing miniature.", work: "Generation of Animals" },
  { domain: "generation_of_animals", content: "The embryo acquires souls successively: first nutritive, then sensitive, finally (in humans) rational—each presupposes its predecessor.", work: "Generation of Animals" },
  { domain: "generation_of_animals", content: "The rational soul enters from outside (thyrathen)—unlike nutritive and sensitive soul, nous has no bodily organ and cannot arise from material processes.", work: "Generation of Animals" },
  { domain: "generation_of_animals", content: "Heredity is explained by the relative strength of male and female formative movements—offspring resemble whichever parent's motions dominate in each respect.", work: "Generation of Animals" },
  { domain: "generation_of_animals", content: "Sex determination depends on the heat and concoction of the semen—hotter, more concocted semen produces males; cooler produces females.", work: "Generation of Animals" },
  { domain: "generation_of_animals", content: "Females are deformed males in a limited sense—the female results when the male formative principle fails to fully master the material.", work: "Generation of Animals" },
  { domain: "generation_of_animals", content: "Monstrosities (terata) arise when formative movements go astray—nature's failures reveal what she normally accomplishes.", work: "Generation of Animals" },
  { domain: "generation_of_animals", content: "Infertility between species results from incompatibility of formative movements and material—hybrids like mules are typically sterile.", work: "Generation of Animals" },
  { domain: "generation_of_animals", content: "Different animals have different gestation periods and developmental sequences—these correlate with the perfection and heat of their natures.", work: "Generation of Animals" },
  { domain: "generation_of_animals", content: "Twins and multiple births occur when the matter is sufficient for more than one individual and the formative movements divide accordingly.", work: "Generation of Animals" },
  { domain: "generation_of_animals", content: "The entire process exhibits teleological order—generation exists for the sake of perpetuating the species, the closest approximation to eternity available to mortal beings.", work: "Generation of Animals" },

  // Metaphysics (20 positions)
  { domain: "metaphysics", content: "There is a science that studies being qua being—not any particular kind of being, but what it is to be at all, and the attributes that belong to being as such.", work: "Metaphysics" },
  { domain: "metaphysics", content: "This science also studies first principles and highest causes—it is first philosophy, architectonic over all particular sciences.", work: "Metaphysics" },
  { domain: "metaphysics", content: "Substance (ousia) is the primary sense of being—all other categories (quality, quantity, relation, etc.) depend on substance for their existence.", work: "Metaphysics" },
  { domain: "metaphysics", content: "The question 'what is being?' reduces to the question 'what is substance?'—this is the central inquiry of metaphysics.", work: "Metaphysics" },
  { domain: "metaphysics", content: "Substance is that which is neither said of nor present in a subject—it is the ultimate subject of predication that underlies all else.", work: "Metaphysics" },
  { domain: "metaphysics", content: "Candidates for substance include matter, form, and the composite—Aristotle argues that form has the best claim to being substance in the primary sense.", work: "Metaphysics" },
  { domain: "metaphysics", content: "Form is the 'what it was to be' (to ti en einai)—the essence that makes a thing what it is and answers the question 'what is it?'", work: "Metaphysics" },
  { domain: "metaphysics", content: "Matter is pure potentiality—it is unknowable in itself and becomes determinate only through form.", work: "Metaphysics" },
  { domain: "metaphysics", content: "Definition expresses essence—proper definitions state the form, articulating genus and differentia until the infima species is reached.", work: "Metaphysics" },
  { domain: "metaphysics", content: "Universals are not substances—against Plato, Aristotle argues that no universal (animal, color) exists separately; only particulars are fully real.", work: "Metaphysics" },
  { domain: "metaphysics", content: "Platonic Forms are unnecessary and explanatorily impotent—positing a separate Form of Man does not explain how particular men exist or come to be.", work: "Metaphysics" },
  { domain: "metaphysics", content: "Actuality (energeia) is prior to potentiality (dynamis)—in definition, time, and substance; the actual is what the potential is for.", work: "Metaphysics" },
  { domain: "metaphysics", content: "The prime mover is pure actuality—eternal, immaterial, unchanging, without potentiality; it is thought thinking itself.", work: "Metaphysics" },
  { domain: "metaphysics", content: "The prime mover causes motion as final cause—it moves by being loved, as the object of desire and aspiration for the celestial spheres.", work: "Metaphysics" },
  { domain: "metaphysics", content: "There are multiple unmoved movers—one for each celestial sphere, though the outermost sphere's mover is primary.", work: "Metaphysics" },
  { domain: "metaphysics", content: "Theology is first philosophy—the study of the divine, immaterial, and eternal is the highest and most honorable science.", work: "Metaphysics" },
  { domain: "metaphysics", content: "The principle of non-contradiction is the firmest of all principles—the same attribute cannot both belong and not belong to the same subject in the same respect.", work: "Metaphysics" },
  { domain: "metaphysics", content: "The principle of non-contradiction cannot be demonstrated (that would be circular) but can be defended elenctically—anyone who denies it, in speaking meaningfully, presupposes it.", work: "Metaphysics" },
  { domain: "metaphysics", content: "Unity and being are convertible—whatever is, is one; the senses of unity correspond to the senses of being.", work: "Metaphysics" },
  { domain: "metaphysics", content: "Metaphysics is wisdom (sophia) in the highest sense—knowledge of first causes and principles, pursued for its own sake, making us free rather than servile to practical needs.", work: "Metaphysics" },

  // Nicomachean Ethics (20 positions)
  { domain: "nicomachean_ethics", content: "Every action and pursuit aims at some good—the good is that at which all things aim.", work: "Nicomachean Ethics" },
  { domain: "nicomachean_ethics", content: "The highest human good is eudaimonia (happiness, flourishing)—it is complete, self-sufficient, and chosen for its own sake.", work: "Nicomachean Ethics" },
  { domain: "nicomachean_ethics", content: "Eudaimonia is not pleasure, honor, or wealth—it is activity of the soul in accordance with virtue, and if there are multiple virtues, in accordance with the best and most complete.", work: "Nicomachean Ethics" },
  { domain: "nicomachean_ethics", content: "The function (ergon) of a human being is rational activity—just as a good harpist plays the harp well, a good human lives and acts according to reason well.", work: "Nicomachean Ethics" },
  { domain: "nicomachean_ethics", content: "Virtue (arete) is a hexis (stable disposition)—not a mere feeling or capacity, but a settled state of character acquired through habituation.", work: "Nicomachean Ethics" },
  { domain: "nicomachean_ethics", content: "Moral virtue is a mean between two vices—one of excess, one of deficiency; courage lies between recklessness and cowardice.", work: "Nicomachean Ethics" },
  { domain: "nicomachean_ethics", content: "The mean is relative to us, not arithmetic—what counts as temperate eating differs for an athlete and an invalid.", work: "Nicomachean Ethics" },
  { domain: "nicomachean_ethics", content: "Virtuous action requires choice (prohairesis)—one must know what one is doing, choose it for its own sake, and act from a firm disposition.", work: "Nicomachean Ethics" },
  { domain: "nicomachean_ethics", content: "We are responsible for our characters—though habit shapes us, we are the co-authors of our dispositions through our voluntary actions.", work: "Nicomachean Ethics" },
  { domain: "nicomachean_ethics", content: "Practical wisdom (phronesis) is the intellectual virtue that enables correct deliberation about what conduces to the good life—it is inseparable from moral virtue.", work: "Nicomachean Ethics" },
  { domain: "nicomachean_ethics", content: "The moral virtues include courage, temperance, liberality, magnificence, magnanimity, proper ambition, good temper, friendliness, truthfulness, wit, and justice.", work: "Nicomachean Ethics" },
  { domain: "nicomachean_ethics", content: "Justice is the complete virtue in relation to others—it has both a general sense (lawfulness) and a specific sense (fairness in distribution and rectification).", work: "Nicomachean Ethics" },
  { domain: "nicomachean_ethics", content: "Akrasia (weakness of will) is possible—one can know the good yet fail to act on it, overcome by passion; this is neither full virtue nor full vice.", work: "Nicomachean Ethics" },
  { domain: "nicomachean_ethics", content: "Pleasure accompanies unimpeded virtuous activity—it is not the good itself, but a natural concomitant that completes good activity like bloom on youth.", work: "Nicomachean Ethics" },
  { domain: "nicomachean_ethics", content: "Friendship (philia) is essential to the good life—humans are social beings, and no one would choose to live without friends even with all other goods.", work: "Nicomachean Ethics" },
  { domain: "nicomachean_ethics", content: "There are three kinds of friendship: for utility, pleasure, and virtue—only the last is complete and enduring, based on mutual recognition of good character.", work: "Nicomachean Ethics" },
  { domain: "nicomachean_ethics", content: "The happy person needs external goods—a measure of health, wealth, friends, and good fortune; virtue alone does not suffice for full flourishing.", work: "Nicomachean Ethics" },
  { domain: "nicomachean_ethics", content: "Contemplation (theoria) is the highest human activity—it is most continuous, self-sufficient, loved for its own sake, and exercises our most divine element.", work: "Nicomachean Ethics" },
  { domain: "nicomachean_ethics", content: "The contemplative life is happiest—it most fully realizes the divine element in us; the life of moral virtue is happy in a secondary way.", work: "Nicomachean Ethics" },
  { domain: "nicomachean_ethics", content: "Ethics is a branch of political science—individual flourishing requires the right social conditions; the lawgiver must understand virtue to cultivate it in citizens.", work: "Nicomachean Ethics" },

  // Eudemian Ethics (20 positions)
  { domain: "eudemian_ethics", content: "The Eudemian Ethics is an independent ethical treatise, not merely a draft of the Nicomachean—it has its own distinctive emphases and arguments.", work: "Eudemian Ethics" },
  { domain: "eudemian_ethics", content: "Eudaimonia is the highest good—it is the end for the sake of which everything else is done, and it consists in living well and acting well.", work: "Eudemian Ethics" },
  { domain: "eudemian_ethics", content: "Eudaimonia requires specifying what kind of life is best—the life of virtue, the life of practical wisdom, or the life of contemplation.", work: "Eudemian Ethics" },
  { domain: "eudemian_ethics", content: "The noble (to kalon) plays a more prominent role here than in the Nicomachean Ethics—virtuous action aims at the noble as its proper end.", work: "Eudemian Ethics" },
  { domain: "eudemian_ethics", content: "Virtue is a mean relative to us, lying between excess and deficiency—this doctrine appears in both treatises but with different emphases.", work: "Eudemian Ethics" },
  { domain: "eudemian_ethics", content: "The three lives traditionally proposed as best are the political, philosophical, and pleasure-seeking—only the first two are serious candidates.", work: "Eudemian Ethics" },
  { domain: "eudemian_ethics", content: "Goods are of three kinds: external goods, goods of the soul, and goods of the body—goods of the soul (virtues) are most authoritative.", work: "Eudemian Ethics" },
  { domain: "eudemian_ethics", content: "Good fortune (eutuchia) differs from happiness—it provides external conditions but is not itself the good we achieve through our own activity.", work: "Eudemian Ethics" },
  { domain: "eudemian_ethics", content: "Some people seem naturally fortunate—Aristotle puzzles over whether this is divine favor, natural temperament, or mere chance.", work: "Eudemian Ethics" },
  { domain: "eudemian_ethics", content: "Deliberation concerns means, not ends—we wish for ends and deliberate about how to achieve them; choice is deliberate desire for what is in our power.", work: "Eudemian Ethics" },
  { domain: "eudemian_ethics", content: "Prohairesis (choice) is central to moral responsibility—actions are voluntary when they proceed from choice based on deliberation.", work: "Eudemian Ethics" },
  { domain: "eudemian_ethics", content: "The particular virtues are analyzed similarly to the Nicomachean treatment—courage, temperance, gentleness, liberality, and others as means between extremes.", work: "Eudemian Ethics" },
  { domain: "eudemian_ethics", content: "Three books of the Eudemian Ethics are shared with the Nicomachean (on justice, intellectual virtues, and friendship)—scholars dispute which treatise they originally belonged to.", work: "Eudemian Ethics" },
  { domain: "eudemian_ethics", content: "Justice is both a complete virtue (general justice) and a specific virtue concerning fair shares and rectification.", work: "Eudemian Ethics" },
  { domain: "eudemian_ethics", content: "Friendship (philia) is extensively analyzed—its species, its relation to self-love, its necessity for the good life.", work: "Eudemian Ethics" },
  { domain: "eudemian_ethics", content: "The person of practical wisdom (phronimos) is the standard of right action—what the wise person would judge to be the mean defines virtue.", work: "Eudemian Ethics" },
  { domain: "eudemian_ethics", content: "Kalokagathia (nobility-and-goodness) is the comprehensive virtue—the unity of all particular virtues in a harmonious, noble character.", work: "Eudemian Ethics" },
  { domain: "eudemian_ethics", content: "The kalokagathic person possesses all virtues and uses external goods rightly—wealth, beauty, and honor are pursued for the sake of noble action.", work: "Eudemian Ethics" },
  { domain: "eudemian_ethics", content: "The Eudemian Ethics concludes with contemplation of god as the proper standard—the best life is ordered toward the service and contemplation of the divine.", work: "Eudemian Ethics" },
  { domain: "eudemian_ethics", content: "Whatever promotes contemplation of god is best; whatever hinders it is bad—this theological framing of the human good is more explicit here than in the Nicomachean Ethics.", work: "Eudemian Ethics" },

  // Magna Moralia (20 positions)
  { domain: "magna_moralia", content: "The Magna Moralia is disputed in authorship—some scholars consider it an early Aristotelian work, others a later summary by a student, but it contains recognizably Peripatetic doctrine.", work: "Magna Moralia" },
  { domain: "magna_moralia", content: "Ethics is a part of political science—the study of individual virtue serves the larger inquiry into how to organize the city for human flourishing.", work: "Magna Moralia" },
  { domain: "magna_moralia", content: "The good is that at which all things aim—but we seek not the universal Good (against Plato) but the practicable human good.", work: "Magna Moralia" },
  { domain: "magna_moralia", content: "Eudaimonia is the highest human good—complete, self-sufficient, and consisting in the activity of virtue over a complete life.", work: "Magna Moralia" },
  { domain: "magna_moralia", content: "The soul has rational and non-rational parts—virtue pertains to both: intellectual virtue to the rational, moral virtue to the non-rational part as it obeys reason.", work: "Magna Moralia" },
  { domain: "magna_moralia", content: "Virtue is a mean between extremes—excess and deficiency are vices; the virtuous disposition hits the intermediate appropriate to the circumstances.", work: "Magna Moralia" },
  { domain: "magna_moralia", content: "The mean is determined by right reason (orthos logos)—the standard is what the practically wise person would judge.", work: "Magna Moralia" },
  { domain: "magna_moralia", content: "Moral virtue arises through habituation—we become courageous by performing courageous acts, temperate by exercising temperance.", work: "Magna Moralia" },
  { domain: "magna_moralia", content: "Voluntary action is action that originates in the agent with knowledge of particulars—compulsion and ignorance excuse.", work: "Magna Moralia" },
  { domain: "magna_moralia", content: "Choice (prohairesis) is deliberate desire for things in our power—it follows deliberation and is essential to moral evaluation.", work: "Magna Moralia" },
  { domain: "magna_moralia", content: "The particular virtues are enumerated and analyzed: courage, temperance, gentleness, liberality, magnificence, magnanimity, and others.", work: "Magna Moralia" },
  { domain: "magna_moralia", content: "Justice is analyzed as both general virtue (lawfulness) and particular virtue (fairness in distributions and transactions).", work: "Magna Moralia" },
  { domain: "magna_moralia", content: "Natural justice exists alongside conventional justice—some things are just by nature, not merely by local enactment.", work: "Magna Moralia" },
  { domain: "magna_moralia", content: "Practical wisdom (phronesis) is the intellectual virtue that discerns the right means to good ends—it is inseparable from moral virtue.", work: "Magna Moralia" },
  { domain: "magna_moralia", content: "Akrasia (incontinence) is acting against one's better judgment due to passion—the incontinent person knows the good but fails to do it.", work: "Magna Moralia" },
  { domain: "magna_moralia", content: "Pleasure accompanies virtuous activity but is not itself the good—it completes activity as a supervenient end.", work: "Magna Moralia" },
  { domain: "magna_moralia", content: "Friendship is necessary for happiness—no one would choose a friendless life even with all other goods.", work: "Magna Moralia" },
  { domain: "magna_moralia", content: "Self-love rightly understood is virtuous—the good person loves what is best in himself (reason) and acts accordingly.", work: "Magna Moralia" },
  { domain: "magna_moralia", content: "The happy person needs external goods and good fortune—virtue is necessary but not sufficient; bodily and external goods matter.", work: "Magna Moralia" },
  { domain: "magna_moralia", content: "The ultimate standard is the noble (to kalon)—the virtuous person chooses virtuous action because it is noble, not merely because it is pleasant or useful.", work: "Magna Moralia" },

  // Politics (20 positions)
  { domain: "politics", content: "Man is by nature a political animal (zoon politikon)—the impulse toward political community is innate; one who lives outside the polis is either a beast or a god.", work: "Politics" },
  { domain: "politics", content: "The polis is prior to the individual in the order of nature—just as the whole is prior to the part, the city is the condition for individual human flourishing.", work: "Politics" },
  { domain: "politics", content: "The polis arises from villages, which arise from households—the progression is from basic reproductive and economic units to the self-sufficient community aimed at the good life.", work: "Politics" },
  { domain: "politics", content: "The household includes three relations: master-slave, husband-wife, parent-child—each has its own proper form of rule.", work: "Politics" },
  { domain: "politics", content: "Slavery is natural for those who lack the deliberative capacity for self-governance—they benefit from direction by natural masters. (Aristotle's most criticized doctrine.)", work: "Politics" },
  { domain: "politics", content: "The purpose of the polis is not mere life but the good life—security and commerce are necessary conditions, but virtue and nobility are the true ends.", work: "Politics" },
  { domain: "politics", content: "Citizenship in the strict sense is defined by participation in deliberative and judicial functions—the citizen shares in ruling and being ruled.", work: "Politics" },
  { domain: "politics", content: "Constitutions are classified by number of rulers (one, few, many) and by whether they rule for the common good or private interest.", work: "Politics" },
  { domain: "politics", content: "Correct constitutions: kingship (one for common good), aristocracy (few for common good), polity (many for common good).", work: "Politics" },
  { domain: "politics", content: "Deviant constitutions: tyranny (one for private interest), oligarchy (few for private interest), democracy (many for private interest).", work: "Politics" },
  { domain: "politics", content: "Polity (politeia) is a mixed constitution blending oligarchic and democratic elements—it empowers the middling citizens and is often the most stable.", work: "Politics" },
  { domain: "politics", content: "The middle class is crucial for political stability—extremes of wealth and poverty breed faction; a large middle moderates conflict.", work: "Politics" },
  { domain: "politics", content: "Faction (stasis) arises from disputes over justice—oligarchs think justice means inequality based on wealth; democrats think it means equality for all free citizens.", work: "Politics" },
  { domain: "politics", content: "Revolution occurs when the balance of power no longer matches the constitutional form—each regime carries the seeds of its own destruction.", work: "Politics" },
  { domain: "politics", content: "The best constitution absolutely would require ideal conditions—virtuous citizens, adequate resources, proper size; it aims at contemplative happiness.", work: "Politics" },
  { domain: "politics", content: "The best practicable constitution must suit the character and circumstances of the actual population—the statesman adapts to available human material.", work: "Politics" },
  { domain: "politics", content: "Education is the statesman's most important task—citizens must be trained in virtue appropriate to the constitution; character shapes regime stability.", work: "Politics" },
  { domain: "politics", content: "Education should be common and public, not private—since the end of the city is one, the training of citizens must be unified.", work: "Politics" },
  { domain: "politics", content: "The curriculum includes letters, gymnastics, music, and drawing—music is especially important for shaping character and enabling noble leisure.", work: "Politics" },
  { domain: "politics", content: "The polis exists ultimately for the sake of noble action and leisure (schole)—war is for peace, business for leisure, and leisure for philosophy and virtuous activity.", work: "Politics" },

  // Rhetoric (20 positions)
  { domain: "rhetoric", content: "Rhetoric is the counterpart (antistrophos) of dialectic—both deal with matters that are common knowledge and belong to no specific science; both argue on opposite sides.", work: "Rhetoric" },
  { domain: "rhetoric", content: "Rhetoric is the faculty of discovering the available means of persuasion in any given case—it is an art (techne), not mere knack or natural talent.", work: "Rhetoric" },
  { domain: "rhetoric", content: "Rhetoric is useful because truth and justice are naturally stronger, but audiences are imperfect; the skilled speaker helps truth prevail.", work: "Rhetoric" },
  { domain: "rhetoric", content: "The rhetorician must be able to argue both sides—not to practice injustice, but to understand the arguments and refute sophistical opponents.", work: "Rhetoric" },
  { domain: "rhetoric", content: "There are three modes of persuasion (pisteis): ethos (character of the speaker), pathos (emotional state of the audience), and logos (the argument itself).", work: "Rhetoric" },
  { domain: "rhetoric", content: "Ethos persuades when the speech makes the speaker appear credible—this must be achieved through the speech itself, not prior reputation.", work: "Rhetoric" },
  { domain: "rhetoric", content: "Pathos persuades by putting the audience into a certain emotional state—emotions alter judgment, so the rhetorician must understand psychology.", work: "Rhetoric" },
  { domain: "rhetoric", content: "Logos persuades through demonstration or apparent demonstration—rhetorical arguments take the form of enthymemes and examples.", work: "Rhetoric" },
  { domain: "rhetoric", content: "The enthymeme is the rhetorical syllogism—it proceeds from probable premises or signs rather than necessary truths, and often leaves premises unstated.", work: "Rhetoric" },
  { domain: "rhetoric", content: "The example (paradeigma) is rhetorical induction—it argues from particular to particular, using historical or invented parallels.", work: "Rhetoric" },
  { domain: "rhetoric", content: "There are three species of rhetoric: deliberative (political), forensic (judicial), and epideictic (ceremonial praise and blame).", work: "Rhetoric" },
  { domain: "rhetoric", content: "Deliberative rhetoric concerns future action—its end is the expedient or harmful; the speaker advises or dissuades the assembly.", work: "Rhetoric" },
  { domain: "rhetoric", content: "Forensic rhetoric concerns past action—its end is the just or unjust; the speaker accuses or defends before a jury.", work: "Rhetoric" },
  { domain: "rhetoric", content: "Epideictic rhetoric concerns present character—its end is the noble or shameful; the speaker praises or blames before spectators.", work: "Rhetoric" },
  { domain: "rhetoric", content: "Each species has its own topics (topoi)—commonplaces and lines of argument suited to its characteristic subject matter.", work: "Rhetoric" },
  { domain: "rhetoric", content: "Book II analyzes the emotions in detail—anger, calm, friendship, enmity, fear, confidence, shame, pity, indignation, envy, emulation—showing their causes and how to arouse or allay them.", work: "Rhetoric" },
  { domain: "rhetoric", content: "Book II also treats character types—youth, old age, prime of life, nobility, wealth, power—since speakers must adapt to their audiences.", work: "Rhetoric" },
  { domain: "rhetoric", content: "Style (lexis) matters because the manner of expression affects persuasion—clarity is the chief virtue, with appropriateness to subject and audience.", work: "Rhetoric" },
  { domain: "rhetoric", content: "Metaphor is the most important stylistic device—it produces clarity, pleasure, and vividness; facility with metaphor indicates natural genius.", work: "Rhetoric" },
  { domain: "rhetoric", content: "Arrangement (taxis) of a speech has essential parts—at minimum a statement of the case and the proof; the elaborated structure includes proem, narration, proof, and epilogue.", work: "Rhetoric" },

  // Poetics (20 positions)
  { domain: "poetics", content: "Poetry is mimesis (imitation/representation)—all poetic arts imitate human action, character, and emotion through different media, objects, and modes.", work: "Poetics" },
  { domain: "poetics", content: "The species of poetry differ by medium (rhythm, language, melody), object (better, worse, or similar characters), and mode (narrative, dramatic, or mixed).", work: "Poetics" },
  { domain: "poetics", content: "Mimesis is natural to humans—we are the most imitative of animals, we learn through imitation, and we take pleasure in representations even of painful things.", work: "Poetics" },
  { domain: "poetics", content: "Tragedy is the imitation of a serious, complete action of magnitude, in embellished language, through enacted drama, accomplishing catharsis of pity and fear.", work: "Poetics" },
  { domain: "poetics", content: "Tragedy has six elements: plot (mythos), character (ethos), thought (dianoia), diction (lexis), melody (melos), and spectacle (opsis)—ranked in that order of importance.", work: "Poetics" },
  { domain: "poetics", content: "Plot is the soul of tragedy—it is the arrangement of incidents; tragedy is primarily imitation of action, not of persons.", work: "Poetics" },
  { domain: "poetics", content: "A good plot must be whole and complete—having a beginning, middle, and end, with parts connected by necessity or probability.", work: "Poetics" },
  { domain: "poetics", content: "The plot must have proper magnitude—long enough to allow the change of fortune, short enough to be grasped as a unity.", work: "Poetics" },
  { domain: "poetics", content: "Unity of plot is not unity of hero—a plot is one when it imitates one complete action; episodic plots that lack necessary connection are inferior.", work: "Poetics" },
  { domain: "poetics", content: "Poetry is more philosophical than history—history tells what happened, poetry what could happen; poetry expresses universals, history particulars.", work: "Poetics" },
  { domain: "poetics", content: "The best plots involve reversal (peripeteia) and recognition (anagnorisis)—the change from ignorance to knowledge, ideally coinciding with the reversal of fortune.", work: "Poetics" },
  { domain: "poetics", content: "The complex plot combining reversal and recognition is superior to the simple plot—it produces the characteristic tragic pleasure most effectively.", work: "Poetics" },
  { domain: "poetics", content: "The ideal tragic hero is neither perfectly virtuous nor villainous—a person of high standing who falls through some hamartia (error/flaw), not vice.", work: "Poetics" },
  { domain: "poetics", content: "The change should be from good fortune to bad—plots ending in prosperity are less tragic; the downfall of the good-but-flawed evokes pity and fear.", work: "Poetics" },
  { domain: "poetics", content: "Pity is aroused by undeserved misfortune; fear by misfortune befalling someone like ourselves—together they produce catharsis.", work: "Poetics" },
  { domain: "poetics", content: "Catharsis is the clarification or purgation of pity and fear—tragedy's emotional effect is beneficial, not corrupting. (The term's precise meaning remains debated.)", work: "Poetics" },
  { domain: "poetics", content: "Character (ethos) must be good, appropriate, like reality, and consistent—characters should act according to necessity or probability given who they are.", work: "Poetics" },
  { domain: "poetics", content: "The denouement should arise from the plot itself—not from the deus ex machina; resolution must follow from prior action.", work: "Poetics" },
  { domain: "poetics", content: "Epic shares many features with tragedy but differs in length, meter (hexameter), and narrative mode—it permits greater scale and multiple simultaneous actions.", work: "Poetics" },
  { domain: "poetics", content: "Tragedy is superior to epic—it achieves its end in shorter compass, has greater unity, and adds the powerful resources of music and spectacle to poetic imitation.", work: "Poetics" }
];

async function embedAristotlePositions() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Get Aristotle's figure record
    const figureResult = await pool.query(
      "SELECT id FROM figures WHERE id = 'aristotle'"
    );
    
    if (figureResult.rows.length === 0) {
      console.error("Aristotle figure not found in database");
      return;
    }
    
    const figureId = figureResult.rows[0].id;
    console.log(`Found Aristotle with figure_id: ${figureId}`);
    
    // Check existing positions
    const existingResult = await pool.query(
      "SELECT COUNT(*) FROM paper_chunks WHERE figure_id = $1",
      [figureId]
    );
    const existingCount = parseInt(existingResult.rows[0].count);
    console.log(`Existing Aristotle positions: ${existingCount}`);
    
    if (existingCount > 0) {
      console.log("Clearing existing Aristotle positions...");
      await pool.query("DELETE FROM paper_chunks WHERE figure_id = $1", [figureId]);
    }
    
    console.log(`Embedding ${ARISTOTLE_POSITIONS.length} Aristotle position statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < ARISTOTLE_POSITIONS.length; i++) {
      const position = ARISTOTLE_POSITIONS[i];
      
      try {
        // Generate embedding
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: position.content
        });
        
        const embedding = embeddingResponse.data[0].embedding;
        
        // Insert into database
        await pool.query(
          `INSERT INTO paper_chunks (paper_title, content, author, chunk_index, embedding, figure_id, domain)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            position.work,
            position.content,
            "Aristotle",
            i,
            JSON.stringify(embedding),
            figureId,
            position.domain
          ]
        );
        
        successCount++;
        
        if ((i + 1) % 20 === 0) {
          console.log(`Progress: ${i + 1}/${ARISTOTLE_POSITIONS.length} positions embedded`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error embedding position ${i + 1}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\nEmbedding complete!`);
    console.log(`Successfully embedded: ${successCount} positions`);
    console.log(`Errors: ${errorCount}`);
    
    // Verify by domain
    const domainCounts = await pool.query(
      `SELECT domain, COUNT(*) as count 
       FROM paper_chunks 
       WHERE figure_id = $1 
       GROUP BY domain 
       ORDER BY count DESC`,
      [figureId]
    );
    
    console.log("\nPositions by domain:");
    for (const row of domainCounts.rows) {
      console.log(`  ${row.domain}: ${row.count}`);
    }
    
  } catch (error) {
    console.error("Fatal error:", error);
  } finally {
    await pool.end();
  }
}

embedAristotlePositions();

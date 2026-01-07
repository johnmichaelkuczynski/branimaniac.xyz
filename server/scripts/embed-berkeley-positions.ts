import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "../../shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const berkeleyPositions = [
  // VISION (10 positions)
  {
    domain: "vision",
    content: "Visual ideas and tangible ideas are entirely heterogeneous—they are different in kind, not merely different instances of the same type of quality. What I see and what I touch are numerically and qualitatively distinct ideas that have no necessary connection to one another."
  },
  {
    domain: "vision",
    content: "Distance is not immediately perceived by sight. The retinal image is flat, containing no intrinsic information about how far away objects are. What we call 'seeing distance' is actually a judgment or inference based on learned associations between visual cues and tactile/kinesthetic experiences."
  },
  {
    domain: "vision",
    content: "The visual field is a language that must be learned. Visual ideas serve as signs that suggest tangible ideas, just as words suggest the things they signify. The connection between visual sign and tactile signified is established entirely through experience, not through any inherent resemblance."
  },
  {
    domain: "vision",
    content: "The apparent magnitude of objects (how large they look) varies with distance and viewing conditions, while tangible magnitude remains constant. This demonstrates that visible extension and tangible extension are distinct kinds of ideas, not the same property apprehended through different channels."
  },
  {
    domain: "vision",
    content: "Confusion in the theory of vision arises from the false assumption that visible and tangible ideas are of the same kind and that we perceive by geometry. We do not calculate distances trigonometrically; we read visual signs that experience has taught us to correlate with tangible realities."
  },
  {
    domain: "vision",
    content: "The proper objects of sight are light and colors, with their various degrees and variations. Everything beyond this—three-dimensional spatial properties, real magnitudes, real shapes—belongs to touch and is merely suggested by visual experience."
  },
  {
    domain: "vision",
    content: "A purely visual experience, unaccompanied by any tactile associations (as in a person born blind who suddenly gains sight), would present no information whatsoever about three-dimensional space, tangible shape, or distance. The visual field would be an uninterpreted array of colors."
  },
  {
    domain: "vision",
    content: "The unity of a perceived object—the fact that we take what we see and what we touch to be 'the same thing'—is not given immediately but is a construction based on the constant conjunction of visual and tactile ideas. Custom and experience alone forge this unity."
  },
  {
    domain: "vision",
    content: "Faintness, confusion, and the interposition of intermediate objects serve as visual signs of distance, not because they geometrically entail distance, but because experience has connected these visual appearances with the tangible experience of remoteness."
  },
  {
    domain: "vision",
    content: "The visual field considered in itself, apart from all tactile associations, would have no depth—it would be, as it were, a two-dimensional manifold of colored points at no distance from the perceiver (since distance itself is a tangible, not visible, idea)."
  },
  // MOLYNEUX'S PROBLEM (10 positions)
  {
    domain: "molyneuxs_problem",
    content: "The answer to Molyneux's problem is decisively negative: a person born blind who gains sight would NOT immediately recognize by sight the shapes they previously knew only by touch. They would need to learn the correlations through experience."
  },
  {
    domain: "molyneuxs_problem",
    content: "The newly sighted person's initial visual experience would be an undifferentiated array of colors with no discernible spatial structure, depth, or recognizable shapes. The visual field would be meaningless until interpreted through learned associations."
  },
  {
    domain: "molyneuxs_problem",
    content: "There is no necessary connection between the visible appearance of a sphere and its tangible properties. The visual idea of a sphere (a flat disk of color with certain shading patterns) has nothing intrinsically in common with the tactile idea of a sphere (a continuous convex surface)."
  },
  {
    domain: "molyneuxs_problem",
    content: "Those who think the newly sighted person would immediately recognize shapes are confusing the distinct ideas of sight and touch, falsely assuming that both senses access the same spatial properties. This is the fundamental error in the theory of vision."
  },
  {
    domain: "molyneuxs_problem",
    content: "The heterogeneity of visual and tactile ideas means there is no a priori bridge between them. The connection must be forged entirely through experience—through repeated correlations of visual appearances with tactile explorations."
  },
  {
    domain: "molyneuxs_problem",
    content: "Molyneux's problem serves as a crucial test case demonstrating that spatial knowledge is not innate. If it were innate, or if there were a common spatial property accessed by both senses, the newly sighted person would recognize shapes immediately."
  },
  {
    domain: "molyneuxs_problem",
    content: "The newly sighted person must learn which visual appearances correspond to which tangible realities, just as a child must learn which words correspond to which things. Vision is a language whose vocabulary must be acquired through experience."
  },
  {
    domain: "molyneuxs_problem",
    content: "The fact that the Cheselden case (and similar cases) confirmed the negative answer to Molyneux's problem provides empirical vindication of the theory that visible and tangible ideas are heterogeneous."
  },
  {
    domain: "molyneuxs_problem",
    content: "There can be no universal language of spatial experience that transcends sense modalities, because each sense modality produces its own distinct type of idea. The 'same space' apparently perceived by sight and touch is a construction, not a given."
  },
  {
    domain: "molyneuxs_problem",
    content: "The unity of the visual and tactile worlds in mature perception is an achievement of experience, not a starting point. The apparent seamlessness of our spatial perception conceals a complex learned coordination of heterogeneous sensory inputs."
  },
  // HOW THE SENSES INTERACT (10 positions)
  {
    domain: "senses_interaction",
    content: "The belief that visual and tactile ideas are properties of the 'same object' arises entirely from the constant conjunction of these ideas in experience. There is no pre-established harmony or necessary connection; only regular correlation teaches us to unite them."
  },
  {
    domain: "senses_interaction",
    content: "There is no 'master sense' or common sensorium that unifies the deliverances of the different senses. Unification is achieved through association, memory, and habit—the mind connects ideas that regularly occur together."
  },
  {
    domain: "senses_interaction",
    content: "Visual ideas serve as signs suggesting tangible ideas, much as words suggest their meanings. The connection is arbitrary (not based on resemblance) but becomes so ingrained through experience that it seems immediate and natural."
  },
  {
    domain: "senses_interaction",
    content: "When I see fire and feel heat, I associate these ideas because they constantly conjoin in experience. The 'source' is not some hidden material substance but the ideas themselves, whose regular connection is maintained by the Author of Nature."
  },
  {
    domain: "senses_interaction",
    content: "The regularity and predictability of sense-correlations tells us something important: that the ideas we perceive are not random or arbitrary but are governed by stable laws instituted by God. This regularity is the 'grammar' of nature's language."
  },
  {
    domain: "senses_interaction",
    content: "One sense does not strictly 'correct' another, since each sense provides its own distinct ideas. Rather, what happens is that we learn to give primacy to certain senses (especially touch) for certain purposes and treat other senses as providing signs for those realities."
  },
  {
    domain: "senses_interaction",
    content: "The 'external world' as ordinarily conceived—the stable, three-dimensional world of tangible objects—is a construction from coordinated sensory patterns. What we call physical objects are collections of ideas whose coherence and stability is maintained by divine providence."
  },
  {
    domain: "senses_interaction",
    content: "Memory plays an essential role in the synthesis of sense information. Without the ability to recall past correlations, we could not learn the visual language or anticipate tangible consequences from visual signs."
  },
  {
    domain: "senses_interaction",
    content: "The coordination of the senses is providentially arranged for our practical benefit. Visual ideas serve to warn us of tangible consequences (pain, pleasure, nourishment, danger) before we undergo them—this is the function of the visual language."
  },
  {
    domain: "senses_interaction",
    content: "The reliability of sense-correlations does not depend on any underlying material substrate but on the constancy of divine volition in producing ideas according to stable rules. God's faithfulness, not matter's existence, grounds the reliability of perception."
  },
  // EMPIRICISM (10 positions)
  {
    domain: "empiricism",
    content: "All legitimate ideas ultimately derive from sensory experience. There can be no idea that does not trace back to some sensation or reflection on our own mental operations. Ideas are either direct copies of experience or compositions of experiential elements."
  },
  {
    domain: "empiricism",
    content: "The origin of ideas like 'substance' and 'cause' is problematic. If we attend carefully to experience, we find no impression of substance (the supposed underlying substratum) and no impression of necessary connection. These are often words without clear ideational content."
  },
  {
    domain: "empiricism",
    content: "There are no genuinely abstract general ideas. We do not and cannot conceive of 'triangle in general' (neither equilateral, nor isosceles, nor scalene, but somehow all and none of these). General thinking uses particular ideas as representative signs for whole classes."
  },
  {
    domain: "empiricism",
    content: "Reason alone, without experience, can give us no knowledge of matters of fact. Mathematical and logical truths concern the relations of ideas, but any knowledge of what actually exists must come through perception."
  },
  {
    domain: "empiricism",
    content: "Philosophical error frequently arises from using words without attending to the ideas they should signify. Empty verbiage—talk of 'matter,' 'substance,' 'abstract ideas'—proliferates when philosophers fail to cash out their terms in experiential currency."
  },
  {
    domain: "empiricism",
    content: "Claims about things that cannot in principle be experienced are meaningless or confused. If no possible experience could verify or even illustrate a claim, we should suspect that the words composing it lack genuine ideational content."
  },
  {
    domain: "empiricism",
    content: "The test for whether a concept is meaningful is whether we can trace it back to experiential sources. Can I form a clear and distinct idea corresponding to this word? If not, the word may be empty—a mere noise that creates the illusion of thought."
  },
  {
    domain: "empiricism",
    content: "Mathematical knowledge, including geometry, is grounded in experience insofar as it concerns perceivable magnitudes. Mathematical abstractions that outrun all possible perception (like infinitesimals) are suspect."
  },
  {
    domain: "empiricism",
    content: "The error of supposing every word names something real is responsible for much philosophical mischief. 'Matter,' 'substance,' 'being in general'—these words trick us into positing entities for which we have no experiential warrant."
  },
  {
    domain: "empiricism",
    content: "Careful attention to the actual contents of experience—what we genuinely perceive, imagine, and conceive—is the cure for philosophical confusion. Most metaphysical problems dissolve when we abandon empty abstractions and return to concrete experience."
  },
  // WHY EMPIRICISM WARRANTS IDEALISM (10 positions)
  {
    domain: "empiricism_and_idealism",
    content: "If all knowledge comes from experience, and experience consists entirely of ideas (perceptions in the mind), then we have no grounds for positing anything beyond ideas. The concept of 'matter' as a mind-independent substance has no experiential foundation."
  },
  {
    domain: "empiricism_and_idealism",
    content: "'Matter' defined as something that exists independently of all perception is not merely unknown but inconceivable. We cannot form any positive idea of it. The very attempt to conceive of unexperienced existence involves imagining ourselves perceiving it, which is self-defeating."
  },
  {
    domain: "empiricism_and_idealism",
    content: "The concept of a mind-independent material substrate is incoherent. To be is to be perceived or to perceive (esse is percipi aut percipere). Existence unperceived by any mind is a contradiction in terms when we attend to what 'existence' actually means."
  },
  {
    domain: "empiricism_and_idealism",
    content: "I can only ever know ideas. To verify that something non-ideal corresponds to my ideas, I would need to compare my ideas with that non-ideal something—but any comparison would yield only more ideas. We are locked within the circle of experience."
  },
  {
    domain: "empiricism_and_idealism",
    content: "The hypothesis of matter does no explanatory work. It cannot explain how ideas arise (material causation of mental effects being unintelligible), cannot be perceived, and serves only as an unnecessary metaphysical placeholder."
  },
  {
    domain: "empiricism_and_idealism",
    content: "The regularity and coherence of experience does not require a material cause. God's consistent will in producing ideas according to stable rules explains the order of experience without positing an unknowable material substratum."
  },
  {
    domain: "empiricism_and_idealism",
    content: "'Matter' is an inference from experience that has no valid logical support. We experience ideas, not matter; we infer matter as their supposed cause; but we have no warrant for this inference since we can never experience the causal connection."
  },
  {
    domain: "empiricism_and_idealism",
    content: "The impossibility of comparing ideas with non-ideas undermines any ontological commitment to a material world. We cannot step outside our ideas to verify their correspondence with something utterly unlike ideas."
  },
  {
    domain: "empiricism_and_idealism",
    content: "Evidence for something fundamentally unlike any possible experience is, in principle, unobtainable. Such a thing could never affect us in any way that would count as evidence; it would be epistemically inert and therefore unknowable."
  },
  {
    domain: "empiricism_and_idealism",
    content: "If strict empiricism leads to idealism, we should accept idealism. The alternative—rejecting empiricism—would mean accepting claims that have no experiential support, which is epistemically irresponsible."
  },
  // PHENOMENALISM (10 positions)
  {
    domain: "phenomenalism",
    content: "The existence of physical objects can be analyzed entirely in terms of actual and possible experiences. To say that a table exists is to say that certain experiences are occurring or would occur under certain conditions."
  },
  {
    domain: "phenomenalism",
    content: "When I say that a tree exists unperceived, I mean that if I or any finite mind were suitably positioned, certain visual and tactile experiences would occur. But the tree is also always perceived by God, so it never truly lacks a perceiver."
  },
  {
    domain: "phenomenalism",
    content: "The continuity and independence of objects is grounded in God's continuous perception. Objects don't pop in and out of existence with finite minds' perceptions because they are always ideas in the divine mind."
  },
  {
    domain: "phenomenalism",
    content: "The difference between 'the table exists' and 'certain experiences would occur under certain conditions' is merely verbal. Properly understood, they say the same thing; the latter is just a more careful analysis of what the former means."
  },
  {
    domain: "phenomenalism",
    content: "What makes some experiences 'veridical' and others 'illusory' is their lawful connection to other experiences. Veridical experiences cohere with the overall pattern of experience; illusory ones fail to fit this lawful structure."
  },
  {
    domain: "phenomenalism",
    content: "Counterfactual statements about what we would experience are grounded in the lawful structure of ideas maintained by God. The stability of these counterfactuals reflects divine constancy, not the existence of hidden matter."
  },
  {
    domain: "phenomenalism",
    content: "Phenomenalism fully accounts for the lawfulness and predictability of nature. The laws of nature are precisely the regularities in the sequence of ideas produced by God, which we discover through experience."
  },
  {
    domain: "phenomenalism",
    content: "God plays an essential role in grounding the stability and continuity of the phenomenal world. Without God's continuous perception and orderly will, there would be no stable world of objects—only disconnected fleeting ideas in finite minds."
  },
  {
    domain: "phenomenalism",
    content: "Phenomenalism is not a reduction of physical objects to mere subjective appearances but a clarification of what physical existence genuinely means: stable, lawful patterns of ideas in the divine mind, which finite minds can partially access."
  },
  {
    domain: "phenomenalism",
    content: "Phenomenalism does not eliminate matter in a destructive sense; it clarifies that 'matter' when properly understood just means the stable, lawful order of ideas. We lose only the confused metaphysical notion of matter as an unknowable substratum."
  },
  // DATA MODELLING (10 positions)
  {
    domain: "data_modelling",
    content: "When we construct a model to predict observations, we are organizing appearances rather than discovering truths about hidden reality. A successful model captures the regularities of experience, not the nature of things-in-themselves."
  },
  {
    domain: "data_modelling",
    content: "The relationship between a successful predictive model and the underlying nature of things is tenuous. The model organizes phenomena; whether it captures anything deeper is a question that may have no clear meaning."
  },
  {
    domain: "data_modelling",
    content: "We should not expect our best models to uniquely correspond to reality. Underdetermination is possible—very different models may fit the same observational data equally well, and there may be no fact about which is 'really true.'"
  },
  {
    domain: "data_modelling",
    content: "A good model is determined by predictive accuracy, simplicity, and coherence with other well-established models. These are practical virtues that serve our cognitive purposes without guaranteeing correspondence to hidden reality."
  },
  {
    domain: "data_modelling",
    content: "Simplicity in a model is a practical convenience that aids understanding and application. Whether simpler models are more likely to be true about hidden nature is doubtful; nature owes us no such accommodation."
  },
  {
    domain: "data_modelling",
    content: "Models that treat unobservable entities as real should be understood instrumentally. The 'reality' of theoretical entities consists in their utility for organizing and predicting experience, not in their correspondence to unexperienceable things."
  },
  {
    domain: "data_modelling",
    content: "When we substitute a mathematical model for direct experiential knowledge, we gain predictive power but may lose concrete understanding. The model becomes a shorthand for patterns in experience, not a replacement for experience itself."
  },
  {
    domain: "data_modelling",
    content: "Theoretical terms in our models should be interpreted instrumentally—as useful fictions that help us predict and organize experience. Whether they refer to real entities beyond experience is a question without clear meaning."
  },
  {
    domain: "data_modelling",
    content: "The goal of science is to produce accurate models of experience. Whether this amounts to discovering the true nature of things depends on what we mean by 'the true nature of things.' If we mean the lawful structure of experience, then yes; if we mean hidden substances, then no."
  },
  {
    domain: "data_modelling",
    content: "When two incompatible models both save the phenomena, we cannot conclude that one is 'really true' and the other false. Both are adequate to experience, which is the only standard of truth we possess."
  },
  // PHENOMENAL REDUCTION (10 positions)
  {
    domain: "phenomenal_reduction",
    content: "We gain clarity by translating claims about physical objects into claims about experiences. Such translation reveals what our claims really mean and eliminates confusion arising from empty talk of unexperienceable entities."
  },
  {
    domain: "phenomenal_reduction",
    content: "Every meaningful statement about the physical world can be reformulated in purely phenomenal terms. If a statement resists such reformulation, this suggests it may be meaningless or confused."
  },
  {
    domain: "phenomenal_reduction",
    content: "Nothing of genuine cognitive value is lost when we eliminate reference to unexperienceable entities. What we lose is only metaphysical confusion masquerading as deep insight."
  },
  {
    domain: "phenomenal_reduction",
    content: "The phenomenal reduction is primarily a clarification of meaning—an analysis of what our ordinary object-talk genuinely commits us to. It is not an arbitrary restriction on inquiry but a demand for intellectual honesty."
  },
  {
    domain: "phenomenal_reduction",
    content: "Reducing talk of matter to talk of ideas helps resolve philosophical disputes by eliminating the pseudo-questions that arise from confused notions. Many metaphysical problems simply dissolve under this analysis."
  },
  {
    domain: "phenomenal_reduction",
    content: "Statements about the past or future can be translated into statements about present and possible experiences—including the experiences that constitute our evidence for historical or predictive claims."
  },
  {
    domain: "phenomenal_reduction",
    content: "The phenomenal reduction is motivated by the insight that meaning must be grounded in experience. A statement whose meaning cannot be cashed out experientially is a statement without genuine content."
  },
  {
    domain: "phenomenal_reduction",
    content: "The phenomenal reduction captures the full meaning of ordinary object-talk. It does not change the subject but clarifies what we were talking about all along—stable patterns of ideas."
  },
  {
    domain: "phenomenal_reduction",
    content: "Statements about other minds can be handled within the phenomenal reduction by reference to the behavior we observe and the regularities we discover. Other minds are known through their expressions in experience."
  },
  {
    domain: "phenomenal_reduction",
    content: "The phenomenal reduction is simultaneously epistemological, semantic, and metaphysical. It concerns what we can know, what our statements mean, and what genuinely exists—and these three concerns converge on the same answer: experience."
  },
  // DATA MODELLING VS TRUTH DISCOVERY (10 positions)
  {
    domain: "data_modelling_vs_truth",
    content: "When a model successfully predicts observations, we have discovered a truth about the regularities of experience. Whether we have discovered something about hidden reality beyond experience is a confused question."
  },
  {
    domain: "data_modelling_vs_truth",
    content: "The distinction between 'fitting the data' and 'getting things right' is meaningful only when 'getting things right' is cashed out in experiential terms. If it means corresponding to unexperienceable matter, the distinction is empty."
  },
  {
    domain: "data_modelling_vs_truth",
    content: "Our best theories might be empirically adequate yet 'false' about the nature of what they describe—but only if 'true' is defined in terms of correspondence to hidden matter. On a proper empiricist understanding, empirical adequacy is truth."
  },
  {
    domain: "data_modelling_vs_truth",
    content: "Model-building counts as genuine discovery insofar as it reveals the lawful structure of experience. This is the only kind of discovery we can meaningfully speak of; discovery of hidden nature is a confused aspiration."
  },
  {
    domain: "data_modelling_vs_truth",
    content: "Theoretical entities like forces and fields are constructed, not discovered. They are useful fictions that help organize experience. Their 'reality' consists in their utility, not in correspondence to unexperienceable entities."
  },
  {
    domain: "data_modelling_vs_truth",
    content: "Science aims at organizing observable experience. Talk of aiming at 'truth about unobservable reality' is confused because we have no access to such reality and no way of knowing if our theories correspond to it."
  },
  {
    domain: "data_modelling_vs_truth",
    content: "If different models can equally account for all possible observations, there is no fact about which is 'really true.' Truth is empirical adequacy; where models are equally adequate, they are equally true."
  },
  {
    domain: "data_modelling_vs_truth",
    content: "Explanatory power and truth are connected insofar as a powerful explanation captures genuine regularities in experience. But explanatory power does not guarantee correspondence to hidden mechanisms."
  },
  {
    domain: "data_modelling_vs_truth",
    content: "We should believe in the 'existence' of entities posited by our best models only in the sense that these entities are useful organizers of experience. Belief in their existence as unexperienceable substances would be metaphysically confused."
  },
  {
    domain: "data_modelling_vs_truth",
    content: "The pragmatic success of a model is the best evidence we can have that it accurately captures experiential regularities. Whether this constitutes 'correspondence to reality' depends on how we understand 'reality.'"
  },
  // THE CALCULUS (10 positions)
  {
    domain: "calculus",
    content: "The foundations of the calculus as presented by Newton and Leibniz are obscure and insecure. They rely on notions like 'fluxions' and 'infinitesimals' that cannot be clearly conceived."
  },
  {
    domain: "calculus",
    content: "Quantities that are neither zero nor any assignable finite amount are unintelligible. We cannot form any clear idea of such quantities; they are words without corresponding ideas."
  },
  {
    domain: "calculus",
    content: "The practical success of the calculus does not justify its obscure foundations. Success in application may result from compensating errors or useful fictions, not from sound principles."
  },
  {
    domain: "calculus",
    content: "A ratio of quantities that have vanished is a ratio of nothings—which is to say, no ratio at all. Speaking of such ratios as if they had determinate values is unintelligible."
  },
  {
    domain: "calculus",
    content: "The results of calculus, insofar as they are correct, must be explicable without resort to infinitesimals or fluxions. If a result is true, there must be a clear way to demonstrate it; if not, its status is doubtful."
  },
  {
    domain: "calculus",
    content: "Limits and infinitely small quantities, to be rigorous, must be understood as a shorthand for statements about finite quantities. We can make sense of limits as the bound that finite quantities approach."
  },
  {
    domain: "calculus",
    content: "It is not legitimate to operate with quantities that we cannot coherently conceive. Mathematics, like any discipline, must answer to the demand for clear and distinct ideas."
  },
  {
    domain: "calculus",
    content: "Errors arise when we treat symbolic manipulations as if they revealed deep truths about quantity. Symbols are useful tools, but we must not mistake facility with symbols for genuine understanding."
  },
  {
    domain: "calculus",
    content: "Mathematicians should be held to the same standards of clarity as other reasoners. The prestige of mathematics does not exempt it from the requirement of intelligibility."
  },
  {
    domain: "calculus",
    content: "The calculus can and should be reformulated to avoid reliance on obscure notions. Later mathematicians showed this can be done using limits, vindicating the demand for conceptual clarity."
  },
  // INFINITESIMALS (10 positions)
  {
    domain: "infinitesimals",
    content: "There cannot be a quantity smaller than any finite quantity yet greater than zero. Such a quantity is a contradiction—neither something nor nothing, which is to say, unintelligible."
  },
  {
    domain: "infinitesimals",
    content: "When we use the term 'infinitesimal,' we conceive nothing at all. The word produces no clear idea in the mind; it is a noise that creates the illusion of thought."
  },
  {
    domain: "infinitesimals",
    content: "The infinitesimal is a convenient fiction, not a genuine mathematical object. It serves as a useful calculating device but does not represent any real quantity."
  },
  {
    domain: "infinitesimals",
    content: "We cannot justify operations on quantities whose very existence is unintelligible. If infinitesimals do not exist, calculations involving them have no secure foundation."
  },
  {
    domain: "infinitesimals",
    content: "Infinitesimals do not represent anything real about continuous magnitude. They are artifacts of an imperfect notation, not discoveries about the nature of quantity."
  },
  {
    domain: "infinitesimals",
    content: "When we treat infinitesimals as actual existing quantities, we fall into contradiction. They are treated as both zero and nonzero as convenient, which is logically incoherent."
  },
  {
    domain: "infinitesimals",
    content: "It is possible to do rigorous mathematics without infinitesimals, as the development of limits and epsilon-delta definitions later showed. Infinitesimals are a dispensable crutch."
  },
  {
    domain: "infinitesimals",
    content: "'Dx' and 'dy' in differential notation should be understood as convenient abbreviations for limiting processes involving finite quantities, not as representing actual infinitesimal quantities."
  },
  {
    domain: "infinitesimals",
    content: "Compensating errors may well be responsible for the success of infinitesimal methods. When errors cancel, correct results emerge from faulty reasoning—but this does not vindicate the reasoning."
  },
  {
    domain: "infinitesimals",
    content: "A truly clear and rigorous foundation for analysis would dispense with infinitesimals entirely, as the nineteenth-century reform of calculus eventually achieved."
  },
  // PERSONAL GROWTH AND HEALTH (10 positions)
  {
    domain: "personal_growth",
    content: "Bodily health and the health of the mind are intimately connected. A sound body supports clear thinking, and clear thinking contributes to bodily well-being. Philosophy should serve life, not merely theory."
  },
  {
    domain: "personal_growth",
    content: "To flourish as a whole person, one must attend to body and mind together. Exercise, temperance, fresh air, and simple remedies support the intellectual life as much as study does."
  },
  {
    domain: "personal_growth",
    content: "Attention to one's body is not opposed to intellectual and moral development but supports it. The philosopher who neglects health undermines the very capacities needed for thought."
  },
  {
    domain: "personal_growth",
    content: "Philosophy should contribute to practical well-being, not remain a purely theoretical exercise. The point of understanding the world is to live better in it."
  },
  {
    domain: "personal_growth",
    content: "Habits of mind and body that conduce to flourishing include moderation, regular exercise, attention to diet, cultivation of cheerfulness, and avoidance of unnecessary abstraction."
  },
  {
    domain: "personal_growth",
    content: "There is a fundamental unity to human well-being. Physical and spiritual goods are not separate but mutually supporting aspects of a single flourishing life."
  },
  {
    domain: "personal_growth",
    content: "We should balance the pursuit of knowledge with care for practical life. Endless theoretical speculation that ignores practical consequences fails as philosophy."
  },
  {
    domain: "personal_growth",
    content: "Providence has arranged the world for human benefit. Health and happiness are available to those who live in accordance with nature and divine order."
  },
  {
    domain: "personal_growth",
    content: "Wisdom to live well in an uncertain world comes from attending to experience, cultivating virtue, and trusting in the providential order of ideas."
  },
  {
    domain: "personal_growth",
    content: "Clear thinking and personal flourishing are connected. Confusion in philosophy leads to confusion in life; clarity about fundamental matters supports a well-ordered existence."
  },
  // TAR WATER (10 positions)
  {
    domain: "tar_water",
    content: "Tar water possesses remarkable medicinal properties discovered through careful observation and experience. It serves as a gentle, safe remedy for numerous ailments."
  },
  {
    domain: "tar_water",
    content: "Tar water works by imparting a subtle vital principle or aether to the body, supporting its natural healing powers without the violence of harsh medical interventions."
  },
  {
    domain: "tar_water",
    content: "Simple natural remedies like tar water are often superior to complex medical interventions. Nature provides what we need for health; elaborate theories and treatments may do more harm than good."
  },
  {
    domain: "tar_water",
    content: "Close observation and practical experience can ground medical knowledge as reliably as theoretical medicine. The proof of a remedy is in its effects, not in its conformity to theory."
  },
  {
    domain: "tar_water",
    content: "Folk remedies and traditional cures deserve serious evaluation. The accumulated experience of ordinary people often contains genuine wisdom that learned physicians overlook."
  },
  {
    domain: "tar_water",
    content: "The vital principle or aether plays an important role in health and in the efficacy of remedies like tar water. This subtle substance mediates between mind and body."
  },
  {
    domain: "tar_water",
    content: "There is often a connection between the simplicity of a remedy and its safety and effectiveness. Complex treatments multiply opportunities for error and harm."
  },
  {
    domain: "tar_water",
    content: "Tar water demonstrates nature's healing powers. The careful observer can discover in simple substances the means to preserve and restore health."
  },
  {
    domain: "tar_water",
    content: "The case of tar water teaches us that medical progress often comes from attending to humble remedies rather than elaborate theories."
  },
  {
    domain: "tar_water",
    content: "We should trust simple remedies discovered through experience. Theoretical complexity often obscures rather than illuminates the path to health."
  },
  // GOD (10 positions)
  {
    domain: "god",
    content: "The best evidence for God's existence is the orderly structure of experience. The lawful regularities we perceive could not exist without a mind to sustain them—that mind is God."
  },
  {
    domain: "god",
    content: "The regularity and order of experience points unmistakably to a divine source. Random combinations could not produce the systematic patterns we observe; only intelligence explains order."
  },
  {
    domain: "god",
    content: "Ideas require a mind to exist in. When I am not perceiving the tree, it continues to exist because it exists as an idea in the infinite mind of God."
  },
  {
    domain: "god",
    content: "God's existence solves the problem of the continuity of objects. Objects persist when unperceived by finite minds because they are always perceived by the infinite mind."
  },
  {
    domain: "god",
    content: "The laws of nature are the regularities in God's will—the stable patterns according to which God produces ideas in finite minds. Physics describes divine grammar."
  },
  {
    domain: "god",
    content: "God's existence is not directly perceived but is a necessary inference from the existence and orderly character of our ideas. The argument is as secure as any demonstration."
  },
  {
    domain: "god",
    content: "The passivity of ideas supports theism: ideas cannot cause themselves; finite minds do not create their own sensory ideas; therefore, these ideas must come from a more powerful mind—God."
  },
  {
    domain: "god",
    content: "God explains why experience is orderly rather than chaotic. Without a governing intelligence, there would be no reason for ideas to follow regular patterns."
  },
  {
    domain: "god",
    content: "Idealism strengthens rather than weakens the case for God. By showing that matter is superfluous, idealism reveals the direct dependence of all existence on mind—ultimately, divine mind."
  },
  {
    domain: "god",
    content: "The philosophical arguments support a personal God—a genuine mind with intelligence and will, not an impersonal force. The order of ideas reflects intentional arrangement."
  },
  // TRUTH CONDITIONS FOR TRANSCENDENT STATEMENTS (10 positions)
  {
    domain: "transcendent_statements",
    content: "Statements that seem to go beyond any possible experience should be analyzed in terms of the experiences that constitute evidence for them. Their truth conditions are experiential."
  },
  {
    domain: "transcendent_statements",
    content: "The truth conditions for claims about unperceived objects are counterfactual: if a suitably placed observer were present, certain experiences would occur. Plus, the object is always perceived by God."
  },
  {
    domain: "transcendent_statements",
    content: "There is no meaningful sense in which a statement can be true if it can never in principle be verified or experienced. Truth that transcends all possible experience is an empty notion."
  },
  {
    domain: "transcendent_statements",
    content: "Counterfactual statements relate to actual facts through the lawful structure of experience maintained by God. The stability of counterfactuals reflects divine constancy."
  },
  {
    domain: "transcendent_statements",
    content: "The truth of a statement about the past depends on present evidence—memories, records, traces—which are themselves present ideas. History is grounded in present experience."
  },
  {
    domain: "transcendent_statements",
    content: "Statements about other minds are true in virtue of the behavioral and expressive phenomena we observe. Other minds are known through their manifestations in experience."
  },
  {
    domain: "transcendent_statements",
    content: "Statements about natural laws are true as descriptions of the regularities we observe and expect in experience. Laws summarize the patterns God maintains."
  },
  {
    domain: "transcendent_statements",
    content: "Mathematical truths concern the relations of ideas. Insofar as they apply to experience, they are grounded in experience; insofar as they transcend experience, they are about the relations of ideas we can form."
  },
  {
    domain: "transcendent_statements",
    content: "Truth is correspondence to experience, properly understood. What more could truth be? Correspondence to unexperienceable reality is a confused aspiration."
  },
  {
    domain: "transcendent_statements",
    content: "The truth conditions for statements that transcend actual experience are counterfactual experiential conditions—what experiences would occur under what circumstances—grounded in divine constancy."
  },
  // KNOWLEDGE OF UNIVERSALS (10 positions)
  {
    domain: "universals",
    content: "Universal properties like 'redness' or 'triangularity' do not exist independently of particular instances. There is no abstract redness floating free of red things; the universal exists only in the particulars."
  },
  {
    domain: "universals",
    content: "We form general ideas by using a particular idea to represent all ideas of its kind. When I think of 'triangle,' I think of a particular triangle that serves as a representative for all triangles."
  },
  {
    domain: "universals",
    content: "Abstraction as traditionally conceived—the separation of truly abstract features from particulars—is not a genuine mental operation. We cannot conceive of extension without color, or motion without direction."
  },
  {
    domain: "universals",
    content: "A particular idea can represent all ideas of its kind through selective attention. I attend to certain features while ignoring others, allowing the particular to stand for a whole class."
  },
  {
    domain: "universals",
    content: "The relationship between a general word and the ideas it signifies is that the word triggers a particular idea that serves as representative of the relevant class."
  },
  {
    domain: "universals",
    content: "We do not need abstract general ideas to reason and communicate. Particular ideas, used as representatives, serve all the functions that abstract ideas were supposed to serve."
  },
  {
    domain: "universals",
    content: "The mind is not capable of conceiving truly abstract entities. We can conceive only particular images, though we can use these particulars to think generally."
  },
  {
    domain: "universals",
    content: "Treating general ideas as if they were abstract objects leads to philosophical error. We are misled by language into thinking there must be an abstract entity corresponding to every general term."
  },
  {
    domain: "universals",
    content: "Selective attention allows particular ideas to function generally. I think of this particular triangle while attending only to its triangularity, ignoring its specific size and angles."
  },
  {
    domain: "universals",
    content: "The rejection of abstract ideas affects our understanding of mathematics by requiring that mathematical objects be understood in terms of particular conceivable magnitudes, not impossible abstractions."
  },
  // COMMON PHILOSOPHICAL ERRORS (10 positions)
  {
    domain: "philosophical_errors",
    content: "The main sources of philosophical confusion are: the doctrine of abstract ideas, the misuse of language, and inattention to the actual contents of experience."
  },
  {
    domain: "philosophical_errors",
    content: "The misuse of language generates pseudo-problems by creating the illusion that every noun names a real entity. Philosophers argue about 'matter' and 'substance' without realizing these are empty words."
  },
  {
    domain: "philosophical_errors",
    content: "Assuming every noun names a real entity leads to positing unexperienceable objects. We hear 'substance' and assume there must be such a thing, when careful analysis shows the word is empty."
  },
  {
    domain: "philosophical_errors",
    content: "The doctrine of abstract ideas is the source of tremendous philosophical difficulty. It leads us to posit impossible objects and to confuse ourselves about the nature of general thinking."
  },
  {
    domain: "philosophical_errors",
    content: "Inattention to the actual contents of our ideas leads to error. We use words without checking whether they correspond to genuine ideas, and thereby deceive ourselves."
  },
  {
    domain: "philosophical_errors",
    content: "Confusing signs with the things signified leads to philosophical error. We mistake words for ideas and symbols for realities, compounding confusion."
  },
  {
    domain: "philosophical_errors",
    content: "Genuine philosophical problems concern the nature and relations of our ideas. Verbal disputes arise when we argue about words without attending to whether they signify anything."
  },
  {
    domain: "philosophical_errors",
    content: "Philosophers posit unobservable entities from a mistaken belief that explanation requires invoking hidden causes. But explanation in terms of unexperienceables is pseudo-explanation; we explain obscurity with greater obscurity."
  },
  {
    domain: "philosophical_errors",
    content: "Habits of mind that help avoid error include: always asking what idea corresponds to a word; checking that supposed ideas are genuinely conceivable; tracing ideas back to their experiential sources."
  },
  {
    domain: "philosophical_errors",
    content: "Returning to ordinary experience and common sense resolves philosophical disputes. The plain person knows that the table exists and has no trouble with skeptical worries; philosophical difficulties arise when we depart from experience into empty abstraction."
  },
  // PRAGMATISM (10 positions)
  {
    domain: "pragmatism",
    content: "The practical success of a belief is significant evidence that it captures real regularities in experience. Beliefs that enable successful action are thereby shown to be attuned to the actual patterns of ideas we encounter."
  },
  {
    domain: "pragmatism",
    content: "Theoretical claims should be evaluated partly by their practical consequences. A theory with no experiential consequences is empty; a theory whose consequences are borne out in practice has proven its worth."
  },
  {
    domain: "pragmatism",
    content: "Usefulness and truth are connected but not identical. A useful belief tracks real regularities; its usefulness is evidence of truth, not a substitute for truth. But since truth about phenomena just is the accurate representation of experiential regularities, use and truth converge."
  },
  {
    domain: "pragmatism",
    content: "The aim of inquiry is to understand the lawful structure of experience. This understanding yields both truth (accurate representation of regularities) and practical success (ability to anticipate and manipulate experience). These aims coincide."
  },
  {
    domain: "pragmatism",
    content: "Scientific theories are instruments for prediction and organization of experience. This is not a deflationary claim—organizing experience is a genuine cognitive achievement. But we should not think theories penetrate behind experience to hidden mechanisms."
  },
  {
    domain: "pragmatism",
    content: "Theoretical terms that help us predict should be understood instrumentally unless they can be cashed out experientially. The question 'do electrons really exist as hidden entities?' is confused; the question 'does electron-talk enable successful prediction?' is legitimate."
  },
  {
    domain: "pragmatism",
    content: "It matters whether our theories are true in the sense of accurately capturing experiential regularities. Whether they are true in the sense of corresponding to hidden matter is a question without clear meaning."
  },
  {
    domain: "pragmatism",
    content: "Believing something because it's true and believing it because it's useful come apart only if we falsely assume that truth transcends all possible experience. For a proper empiricist, truth about phenomena and utility for practice are intimately connected."
  },
  {
    domain: "pragmatism",
    content: "Pragmatic criteria alone cannot determine what we should believe, because we must also attend to the intrinsic coherence and content of our ideas. But pragmatic success is strong evidence that our beliefs track genuine features of experience."
  },
  {
    domain: "pragmatism",
    content: "Truth, meaning, and practical efficacy are interconnected. Meaning is rooted in experience; truth is the accurate representation of experiential regularities; efficacy results from such accurate representation. These three come together in a properly empiricist framework."
  }
];

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function embedBerkeleyPositions() {
  console.log(`Starting to embed ${berkeleyPositions.length} Berkeley positions...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < berkeleyPositions.length; i++) {
    const position = berkeleyPositions[i];
    
    try {
      const embedding = await generateEmbedding(position.content);
      
      await db.insert(paperChunks).values({
        figureId: "berkeley",
        author: "George Berkeley",
        paperTitle: `Berkeley Position: ${position.domain.replace(/_/g, " ")}`,
        content: position.content,
        embedding: embedding,
        chunkIndex: i,
        domain: position.domain,
        significance: "HIGH",
      });
      
      successCount++;
      
      if ((i + 1) % 10 === 0) {
        console.log(`Progress: ${i + 1}/${berkeleyPositions.length} positions embedded`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error embedding position ${i + 1}:`, error);
      errorCount++;
    }
  }

  console.log(`\nEmbedding complete!`);
  console.log(`Successfully embedded: ${successCount} positions`);
  console.log(`Errors: ${errorCount}`);
}

embedBerkeleyPositions()
  .then(() => {
    console.log("Berkeley positions embedding finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

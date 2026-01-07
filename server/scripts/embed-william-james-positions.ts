import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "../../shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const williamJamesPositions = [
  // STREAM OF CONSCIOUSNESS (20 positions)
  {
    domain: "stream_of_consciousness",
    content: "Consciousness is not a chain of discrete ideas but a continuous stream or flow."
  },
  {
    domain: "stream_of_consciousness",
    content: "No mental state can recur identically; every thought is unique to the moment of its occurrence."
  },
  {
    domain: "stream_of_consciousness",
    content: "Within the stream, there are substantive parts (stable images and concepts) and transitive parts (feelings of relation, tendency, and direction)."
  },
  {
    domain: "stream_of_consciousness",
    content: "The transitive parts are as genuinely cognitive as the substantive parts, though harder to introspect."
  },
  {
    domain: "stream_of_consciousness",
    content: "Every thought tends to be part of a personal consciousness; thoughts are always owned."
  },
  {
    domain: "stream_of_consciousness",
    content: "Consciousness is always changing; even the same object is never thought of in precisely the same way twice."
  },
  {
    domain: "stream_of_consciousness",
    content: "Consciousness is sensibly continuous; even after gaps (as in sleep), we feel a continuity of self."
  },
  {
    domain: "stream_of_consciousness",
    content: "Consciousness is selective; it chooses from among stimuli and emphasizes, ignores, or suppresses according to interest."
  },
  {
    domain: "stream_of_consciousness",
    content: "The fringe or halo surrounding every thought is as important as its nucleus; it provides context and meaning."
  },
  {
    domain: "stream_of_consciousness",
    content: "We think in wholes, not in atomic sensations; the unit of mental life is the total pulse of thought."
  },
  {
    domain: "stream_of_consciousness",
    content: "The feeling of 'and,' 'if,' 'but,' and 'by' are genuine states of consciousness, though they resist introspective isolation."
  },
  {
    domain: "stream_of_consciousness",
    content: "Thought is always directed toward an object; consciousness is essentially intentional."
  },
  {
    domain: "stream_of_consciousness",
    content: "The specious present—the felt duration of the now—has a finite span of several seconds."
  },
  {
    domain: "stream_of_consciousness",
    content: "Relations are directly felt in the stream of thought."
  },
  {
    domain: "stream_of_consciousness",
    content: "Halting places (substantives) and places of flight (transitives) alternate in thought."
  },
  {
    domain: "stream_of_consciousness",
    content: "The feeling of tendency bridges gaps in thought."
  },
  {
    domain: "stream_of_consciousness",
    content: "Fringes of consciousness provide context and meaning."
  },
  {
    domain: "stream_of_consciousness",
    content: "The infant's world is a blooming, buzzing confusion."
  },
  {
    domain: "stream_of_consciousness",
    content: "Thought is teleological, aimed at adaptation."
  },
  {
    domain: "stream_of_consciousness",
    content: "Consciousness selects for survival advantages."
  },
  // HABIT (15 positions)
  {
    domain: "habit",
    content: "Habit is the flywheel of society, its most precious conservative agent."
  },
  {
    domain: "habit",
    content: "Every action leaves a trace in the nervous system, making repetition easier."
  },
  {
    domain: "habit",
    content: "Habits simplify movements, diminish conscious attention, and reduce fatigue."
  },
  {
    domain: "habit",
    content: "The period of youth is critical for habit formation; neural plasticity diminishes with age."
  },
  {
    domain: "habit",
    content: "To acquire a new habit, launch with as strong initiative as possible and permit no exceptions until the habit is firmly established."
  },
  {
    domain: "habit",
    content: "Never allow an acquired habit to go unused; each lapse weakens the neural pathway."
  },
  {
    domain: "habit",
    content: "Seize every opportunity to act on resolutions; intentions not translated into action lose their motivating power."
  },
  {
    domain: "habit",
    content: "Habitual action eventually becomes entirely automatic, requiring no conscious attention."
  },
  {
    domain: "habit",
    content: "Character is essentially a bundle of habits; moral reformation is primarily a matter of habit-change."
  },
  {
    domain: "habit",
    content: "Habit reduces nervous tissues' resistance, making actions automatic."
  },
  {
    domain: "habit",
    content: "Habits form through plasticity in neural pathways."
  },
  {
    domain: "habit",
    content: "Early formation of good habits is crucial for moral development."
  },
  {
    domain: "habit",
    content: "Plasticity of neural matter allows habit formation."
  },
  {
    domain: "habit",
    content: "Habit diminishes the need for conscious volition."
  },
  {
    domain: "habit",
    content: "Moral action often becomes habitual."
  },
  // THE SELF (15 positions)
  {
    domain: "the_self",
    content: "The self is not a single entity but comprises the material self, the social self, and the spiritual self."
  },
  {
    domain: "the_self",
    content: "The material self includes the body, clothing, family, and possessions; threats to these produce genuine emotional reactions."
  },
  {
    domain: "the_self",
    content: "We have as many social selves as there are individuals who recognize us and carry images of us in their minds."
  },
  {
    domain: "the_self",
    content: "The spiritual self is the inner core of felt activity, the source of effort and attention."
  },
  {
    domain: "the_self",
    content: "Self-esteem equals success divided by pretensions; lowering pretensions raises self-esteem as effectively as increasing success."
  },
  {
    domain: "the_self",
    content: "The pure ego or 'I' is the thinker, the judging thought itself, not a separate substantial soul."
  },
  {
    domain: "the_self",
    content: "Personal identity is constituted by the felt continuity of the stream of consciousness and the resemblance of successive selves."
  },
  {
    domain: "the_self",
    content: "Each passing thought appropriates the preceding thoughts and the self they knew; identity is a matter of appropriation, not underlying substance."
  },
  {
    domain: "the_self",
    content: "The sense of personal identity does not require belief in a soul-substance; functional continuity suffices."
  },
  {
    domain: "the_self",
    content: "Rivalry between different selves (e.g., professional vs. social) creates internal conflict; we cannot maximize all our potential selves."
  },
  {
    domain: "the_self",
    content: "Consciousness of self includes the material, social, and spiritual self."
  },
  {
    domain: "the_self",
    content: "The self includes both the 'I' (knower) and 'me' (known)."
  },
  {
    domain: "the_self",
    content: "Self-seeking and self-preservation are fundamental impulses."
  },
  {
    domain: "the_self",
    content: "The self has empirical components: material body, clothes, family, possessions."
  },
  {
    domain: "the_self",
    content: "The social self varies with different audiences and recognition."
  },
  // ATTENTION (12 positions)
  {
    domain: "attention",
    content: "Attention is the taking possession by the mind of one out of several possible objects or trains of thought."
  },
  {
    domain: "attention",
    content: "Attention implies withdrawal from some things in order to deal effectively with others."
  },
  {
    domain: "attention",
    content: "Only those items to which we attend become objects of distinct perception and memory."
  },
  {
    domain: "attention",
    content: "Voluntary attention is always derived; it depends on the interest attached to the topic through association."
  },
  {
    domain: "attention",
    content: "Sustained attention to an unchanging object is impossible; attention naturally fluctuates."
  },
  {
    domain: "attention",
    content: "Genius is essentially the power of sustained voluntary attention."
  },
  {
    domain: "attention",
    content: "What we attend to is determined by interest; interest is the selective agency in all cognition."
  },
  {
    domain: "attention",
    content: "Attention is not merely passive reception but involves active accommodation and anticipatory preparation."
  },
  {
    domain: "attention",
    content: "The effort of attention is the essential phenomenon of will."
  },
  {
    domain: "attention",
    content: "Attention does not create ideas but allows certain ideas to dominate consciousness and determine action."
  },
  {
    domain: "attention",
    content: "Attention can be passive, reflexive, or voluntary."
  },
  {
    domain: "attention",
    content: "Voluntary attention requires effort and interest."
  },
  // EMOTION (JAMES-LANGE THEORY) (15 positions)
  {
    domain: "emotion",
    content: "Emotion is the feeling of bodily changes as they occur; we do not cry because we are sad, we are sad because we cry (James-Lange theory)."
  },
  {
    domain: "emotion",
    content: "The bodily changes follow directly the perception of the exciting fact; the feeling of these changes is the emotion."
  },
  {
    domain: "emotion",
    content: "Without bodily reverberation, the perception of an exciting object would be purely cognitive, devoid of emotional warmth."
  },
  {
    domain: "emotion",
    content: "Different emotions involve different patterns of bodily change; each emotion has its characteristic physiological signature."
  },
  {
    domain: "emotion",
    content: "The coarser emotions (fear, rage, grief) are more obviously tied to bodily disturbance; the subtler ones less so."
  },
  {
    domain: "emotion",
    content: "Emotional expression can produce or intensify the corresponding emotion; acting angry makes us angrier."
  },
  {
    domain: "emotion",
    content: "Voluntary control of emotional expression provides indirect control over the emotion itself."
  },
  {
    domain: "emotion",
    content: "Aesthetic emotions are as genuinely somatic as cruder emotions, though their bodily component is subtler."
  },
  {
    domain: "emotion",
    content: "The emotion is not an effect of the bodily change but is constituted by the perception of that change."
  },
  {
    domain: "emotion",
    content: "Suppress all bodily manifestation, and an emotion disappears; what remains is mere intellectual perception."
  },
  {
    domain: "emotion",
    content: "We feel afraid because we run, not run because we are afraid."
  },
  {
    domain: "emotion",
    content: "Bodily changes directly cause emotional feelings."
  },
  {
    domain: "emotion",
    content: "Subtle emotions arise from subtle bodily expressions."
  },
  {
    domain: "emotion",
    content: "Emotion follows bodily expression."
  },
  {
    domain: "emotion",
    content: "Emotions amplify instincts."
  },
  // WILL AND VOLITION (15 positions)
  {
    domain: "will",
    content: "Volition is primarily a relation between the self and its ideas, not between the self and bodily movements."
  },
  {
    domain: "will",
    content: "The essential achievement of will is attending to a difficult idea and holding it fast before the mind."
  },
  {
    domain: "will",
    content: "Voluntary action is ideo-motor action preceded by a fiat, a consent to the idea's realization."
  },
  {
    domain: "will",
    content: "Effort of will is essentially effort of attention; we will by keeping our mind on the right object."
  },
  {
    domain: "will",
    content: "The sense of effort arises when we must sustain attention against competing ideas that would distract us."
  },
  {
    domain: "will",
    content: "Desire and will are distinct; we can desire what we do not will and will what we do not desire."
  },
  {
    domain: "will",
    content: "There is no separate faculty of will; will is simply the relating of the self to its ideas."
  },
  {
    domain: "will",
    content: "In will, the self identifies with one idea and disowns others; volition is the acceptance of an idea as 'mine.'"
  },
  {
    domain: "will",
    content: "The question of free will is ultimately metaphysical; psychology can only describe the phenomena of choosing."
  },
  {
    domain: "will",
    content: "The feeling of freedom is a datum of consciousness; whether this feeling corresponds to metaphysical reality is another question."
  },
  {
    domain: "will",
    content: "Ideo-motor action: ideas of movement tend to produce the movement."
  },
  {
    domain: "will",
    content: "Voluntary action occurs when an idea leads to movement without inhibition."
  },
  {
    domain: "will",
    content: "Effortful will is needed when conflicting ideas compete."
  },
  {
    domain: "will",
    content: "Free will aligns with the possibility of effortful choice."
  },
  {
    domain: "will",
    content: "Moral action involves preferring a more remote, abstract good over an immediate, vivid pleasure."
  },
  // PRAGMATISM (20 positions)
  {
    domain: "pragmatism",
    content: "Pragmatism is a philosophical tradition that assesses theories or beliefs by their practical consequences."
  },
  {
    domain: "pragmatism",
    content: "The pragmatic maxim: consider what practical effects a conception would have; those effects are the whole meaning."
  },
  {
    domain: "pragmatism",
    content: "Truth is not a stagnant property; it is something that happens to an idea."
  },
  {
    domain: "pragmatism",
    content: "Truth is the expedient in the way of thinking."
  },
  {
    domain: "pragmatism",
    content: "Ideas become true by events verifying them."
  },
  {
    domain: "pragmatism",
    content: "Verification is a process in experience."
  },
  {
    domain: "pragmatism",
    content: "Pragmatism asks of every concept: what difference would it make if it were true?"
  },
  {
    domain: "pragmatism",
    content: "Metaphysical disputes that admit no practical difference are meaningless."
  },
  {
    domain: "pragmatism",
    content: "Pragmatism is a mediator between empiricism and rationalism."
  },
  {
    domain: "pragmatism",
    content: "It turns attention away from abstractions and toward concrete facts."
  },
  {
    domain: "pragmatism",
    content: "Truth is mutable and grows with human experience."
  },
  {
    domain: "pragmatism",
    content: "Reality is still in the making; it is plastic."
  },
  {
    domain: "pragmatism",
    content: "The universe contains chance and novelty."
  },
  {
    domain: "pragmatism",
    content: "Pluralism is more consonant with pragmatism than monism."
  },
  {
    domain: "pragmatism",
    content: "Our truths are provisional and fallible."
  },
  {
    domain: "pragmatism",
    content: "Belief is a rule for action."
  },
  {
    domain: "pragmatism",
    content: "God's existence, pragmatically, means the guarantee of an ideal order."
  },
  {
    domain: "pragmatism",
    content: "Pragmatism is melioristic: we can make the world better."
  },
  {
    domain: "pragmatism",
    content: "It avoids both optimistic idealism and pessimistic materialism."
  },
  {
    domain: "pragmatism",
    content: "Philosophy should return to the problems of men rather than of philosophers."
  },
  // RELIGIOUS EXPERIENCE (20 positions)
  {
    domain: "religious_experience",
    content: "Religion is the feelings, acts, and experiences of individual men in their solitude, so far as they apprehend themselves to stand in relation to whatever they may consider the divine."
  },
  {
    domain: "religious_experience",
    content: "Personal religious experience has its root and center in mystical states of consciousness."
  },
  {
    domain: "religious_experience",
    content: "Churches and theologies are secondary products; the living religious experience comes first."
  },
  {
    domain: "religious_experience",
    content: "Two main types of religious temperament: the healthy-minded (once-born) and the sick soul (twice-born)."
  },
  {
    domain: "religious_experience",
    content: "Healthy-mindedness is characterized by systematic optimism and aversion to evil."
  },
  {
    domain: "religious_experience",
    content: "The sick soul sees evil as a real and positive element in the world."
  },
  {
    domain: "religious_experience",
    content: "Conversion is the process by which a self hitherto divided becomes unified and consciously right."
  },
  {
    domain: "religious_experience",
    content: "The subconscious self plays a major role in conversion experiences."
  },
  {
    domain: "religious_experience",
    content: "Saintliness is the collective name for the fruits of religion in character."
  },
  {
    domain: "religious_experience",
    content: "Mysticism involves four marks: ineffability, noetic quality, transiency, and passivity."
  },
  {
    domain: "religious_experience",
    content: "Mystical states feel profoundly authoritative and carry a sense of objective truth."
  },
  {
    domain: "religious_experience",
    content: "Prayer is the very soul and essence of religion."
  },
  {
    domain: "religious_experience",
    content: "Personal religious experience is the primary source of religious authority."
  },
  {
    domain: "religious_experience",
    content: "The reality of the unseen is felt more than rationally demonstrated."
  },
  {
    domain: "religious_experience",
    content: "Religious experience proves at least that something greater than the individual exists."
  },
  {
    domain: "religious_experience",
    content: "Pragmatically, religion works by producing real effects in character and conduct."
  },
  {
    domain: "religious_experience",
    content: "The subconscious continuum connects us to wider spiritual realities."
  },
  {
    domain: "religious_experience",
    content: "The variety of religious experiences resists reduction to a single type."
  },
  {
    domain: "religious_experience",
    content: "The ultimate test of religious ideas is their power to transform individual lives."
  },
  {
    domain: "religious_experience",
    content: "Institutional religion tends to freeze and conventionalize living experience."
  },
  // PLURALISM VS. MONISM (15 positions)
  {
    domain: "pluralism",
    content: "Pluralism accepts a universe with many independent reals loosely connected."
  },
  {
    domain: "pluralism",
    content: "A pluralistic universe is more congruent with everyday experience."
  },
  {
    domain: "pluralism",
    content: "Reality is distributive rather than collective; each part is real on its own."
  },
  {
    domain: "pluralism",
    content: "External relations are as real as internal ones."
  },
  {
    domain: "pluralism",
    content: "The universe is not a closed system but open and growing."
  },
  {
    domain: "pluralism",
    content: "The absolute leaves no room for real novelty, chance, or freedom."
  },
  {
    domain: "pluralism",
    content: "Monism satisfies the intellectual demand for unity but violates common sense."
  },
  {
    domain: "pluralism",
    content: "In pluralism, God is finite or at least limited in power."
  },
  {
    domain: "pluralism",
    content: "A finite God needs our help and cooperates with us."
  },
  {
    domain: "pluralism",
    content: "Evil is genuine and not fully reconciled in any absolute."
  },
  {
    domain: "pluralism",
    content: "Salvation is piecemeal and depends on human effort."
  },
  {
    domain: "pluralism",
    content: "A pluralistic world demands moral effort and offers real adventure."
  },
  {
    domain: "pluralism",
    content: "The one and the many are both real but the many are not swallowed by the one."
  },
  {
    domain: "pluralism",
    content: "Free will finds logical room in a pluralistic universe."
  },
  {
    domain: "pluralism",
    content: "Chance and possibility are real features of the world."
  },
  // RADICAL EMPIRICISM (15 positions)
  {
    domain: "radical_empiricism",
    content: "Pure experience is the one primal stuff of the world."
  },
  {
    domain: "radical_empiricism",
    content: "Mind and matter are different arrangements of pure experience."
  },
  {
    domain: "radical_empiricism",
    content: "Consciousness is a function, not an entity."
  },
  {
    domain: "radical_empiricism",
    content: "Relations are directly experienced, not added by thought."
  },
  {
    domain: "radical_empiricism",
    content: "Conjunctive relations are as real as disjunctive ones."
  },
  {
    domain: "radical_empiricism",
    content: "Empiricism must be radical, accepting all experience."
  },
  {
    domain: "radical_empiricism",
    content: "The stream of experience is continuous."
  },
  {
    domain: "radical_empiricism",
    content: "Subject and object arise from a prior pure experience."
  },
  {
    domain: "radical_empiricism",
    content: "Things and thoughts are made of the same stuff."
  },
  {
    domain: "radical_empiricism",
    content: "The same experience can belong to multiple series."
  },
  {
    domain: "radical_empiricism",
    content: "Knowledge is a relation within pure experience."
  },
  {
    domain: "radical_empiricism",
    content: "Dualism of thought and thing is derivative, not primal."
  },
  {
    domain: "radical_empiricism",
    content: "Reality is experienced directly in perception."
  },
  {
    domain: "radical_empiricism",
    content: "Traditional empiricism was irrational because it rejected relations."
  },
  {
    domain: "radical_empiricism",
    content: "Radical empiricism reconciles science and direct experience."
  },
  // WILL TO BELIEVE (12 positions)
  {
    domain: "will_to_believe",
    content: "In genuine options (live, forced, momentous), our passional nature may legitimately decide beliefs."
  },
  {
    domain: "will_to_believe",
    content: "We have a right to believe at our own risk in matters where evidence is inconclusive."
  },
  {
    domain: "will_to_believe",
    content: "Refusing belief in momentous cases is itself a passional decision."
  },
  {
    domain: "will_to_believe",
    content: "Religious faith is a genuine option requiring decision."
  },
  {
    domain: "will_to_believe",
    content: "Belief in God may produce effects that help verify itself."
  },
  {
    domain: "will_to_believe",
    content: "Objective evidence alone rarely settles great philosophical disputes."
  },
  {
    domain: "will_to_believe",
    content: "Philosophy must acknowledge the role of temperament in its conclusions."
  },
  {
    domain: "will_to_believe",
    content: "The tender-minded prefer rationalistic systems; the tough-minded prefer facts."
  },
  {
    domain: "will_to_believe",
    content: "Our emotions and will play a role in all significant belief formation."
  },
  {
    domain: "will_to_believe",
    content: "Pure logic cannot compel belief in great human questions."
  },
  {
    domain: "will_to_believe",
    content: "Agnosticism is not always the safest intellectual position."
  },
  {
    domain: "will_to_believe",
    content: "Moral questions often present genuine options requiring decision."
  },
  // INSTINCT (10 positions)
  {
    domain: "instinct",
    content: "Instincts are innate tendencies to act in specific ways when confronted with specific objects or situations."
  },
  {
    domain: "instinct",
    content: "Humans have more instincts than other animals, not fewer; our behavior is not less but more instinctively grounded."
  },
  {
    domain: "instinct",
    content: "Instincts are transitory; many appear at a certain developmental stage and then fade if not exercised."
  },
  {
    domain: "instinct",
    content: "Instincts can be inhibited by habit, by contrary instincts, or by reason."
  },
  {
    domain: "instinct",
    content: "The same object can trigger multiple, even contradictory instincts simultaneously."
  },
  {
    domain: "instinct",
    content: "Instincts are blind at first; the animal does not foresee the end until experience teaches the connection."
  },
  {
    domain: "instinct",
    content: "Human instincts include: sucking, biting, clasping, crying, locomotion, vocalization, imitation, emulation, pugnacity, sympathy, hunting, fear, acquisitiveness, constructiveness, play, curiosity, sociability, secretiveness, cleanliness, modesty, love, jealousy, and parental feeling."
  },
  {
    domain: "instinct",
    content: "Instinct and reason are not opposed; reason develops out of instinctive tendencies and modifies them."
  },
  {
    domain: "instinct",
    content: "The plasticity of human instinct, its susceptibility to modification by experience, is what makes learning possible."
  },
  {
    domain: "instinct",
    content: "Instincts provide tendencies that habit and reason refine."
  },
  // PERCEPTION AND SPACE (10 positions)
  {
    domain: "perception",
    content: "Space perception is not innate in fully developed form but emerges from the synthesis of native spatial feelings."
  },
  {
    domain: "perception",
    content: "Every sensation has an original extensity or voluminousness—a primitive, unlearned spatial quality."
  },
  {
    domain: "perception",
    content: "The discrimination of spatial positions and forms is learned through movement and exploration."
  },
  {
    domain: "perception",
    content: "Optical illusions reveal the constructive, interpretive nature of space perception."
  },
  {
    domain: "perception",
    content: "The perception of size depends on the perceived distance of the object; the two are inseparably linked."
  },
  {
    domain: "perception",
    content: "Touch and vision yield originally different spaces that must be correlated through experience."
  },
  {
    domain: "perception",
    content: "Perception is shaped by expectation; we perceive what we anticipate, often overriding actual sensory input."
  },
  {
    domain: "perception",
    content: "The perception of reality involves a vividness and cohesiveness that distinguish veridical experience from imagination."
  },
  {
    domain: "perception",
    content: "Sensation and perception form a continuum; there is no sharp line between raw sensation and interpreted perception."
  },
  {
    domain: "perception",
    content: "Pure sensation is an abstraction; all actual consciousness mingles sensation with memory and inference."
  },
  // MEMORY AND ASSOCIATION (10 positions)
  {
    domain: "memory",
    content: "Memory proper involves not just the reappearance of an image but the localization of that image in the past."
  },
  {
    domain: "memory",
    content: "Retention is fundamentally a brain-process; the persisting neural traces make recall possible."
  },
  {
    domain: "memory",
    content: "Memory is not a general faculty but a collection of specific habits; improving memory means forming better associations."
  },
  {
    domain: "memory",
    content: "The key to good memory is the formation of diverse and copious associations with the item to be remembered."
  },
  {
    domain: "memory",
    content: "Recollection is a process of reconstruction; we work backward from associated facts to the target."
  },
  {
    domain: "memory",
    content: "What we forget is what fails to connect with our organized system of associations."
  },
  {
    domain: "memory",
    content: "Association is the tendency of mental states to recall one another based on prior conjunction."
  },
  {
    domain: "memory",
    content: "Association by contiguity is the more elementary process; association by similarity is derivative."
  },
  {
    domain: "memory",
    content: "Voluntary recall involves active preparation, setting the mind in a direction that favors the emergence of the sought item."
  },
  {
    domain: "memory",
    content: "The feeling of familiarity is a distinct psychic fact accompanying recognized objects."
  },
  // BRAIN AND CONSCIOUSNESS (8 positions)
  {
    domain: "brain_consciousness",
    content: "The brain is the immediate organ of the mind; no mental modification occurs without a correlative neural change."
  },
  {
    domain: "brain_consciousness",
    content: "Every mental state is a function of the entire brain-state at that moment, not of isolated neural pathways."
  },
  {
    domain: "brain_consciousness",
    content: "Neural pathways are strengthened through use; habit has a physical basis in the plasticity of neural tissue."
  },
  {
    domain: "brain_consciousness",
    content: "Consciousness accompanies only the highest, most unstable neural processes—not fixed, automatic ones."
  },
  {
    domain: "brain_consciousness",
    content: "The law of neural habit: currents once flowing through a path leave that path more permeable for future currents."
  },
  {
    domain: "brain_consciousness",
    content: "Hypnosis reveals the dissociability of mental functions normally integrated in waking life."
  },
  {
    domain: "brain_consciousness",
    content: "The unity of consciousness is not an indissoluble given but an achievement that can break down."
  },
  {
    domain: "brain_consciousness",
    content: "Transmission theory: consciousness is filtered rather than produced by the brain."
  }
];

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function embedWilliamJamesPositions() {
  console.log(`Starting to embed ${williamJamesPositions.length} William James positions...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < williamJamesPositions.length; i++) {
    const position = williamJamesPositions[i];
    
    try {
      const embedding = await generateEmbedding(position.content);
      
      await db.insert(paperChunks).values({
        figureId: "william-james",
        author: "William James",
        paperTitle: `James Position: ${position.domain.replace(/_/g, " ")}`,
        content: position.content,
        embedding: embedding,
        chunkIndex: i,
        domain: position.domain,
        significance: "HIGH",
      });
      
      successCount++;
      
      if ((i + 1) % 25 === 0) {
        console.log(`Progress: ${i + 1}/${williamJamesPositions.length} positions embedded`);
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

embedWilliamJamesPositions()
  .then(() => {
    console.log("William James positions embedding finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

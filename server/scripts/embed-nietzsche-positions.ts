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

interface NietzscheSection {
  title: string;
  sourceWork: string;
  positions: string[];
}

async function embedNietzschePositions() {
  console.log("Starting Nietzsche Position Statements embedding...");
  
  const sections: NietzscheSection[] = [
    {
      title: "Morality",
      sourceWork: "Nietzsche - Morality Position Statements",
      positions: [
        "Morality is not discovered but created; it is a human invention serving the interests of those who create it.",
        "Every morality is a system of values that can be evaluated as life-enhancing or life-diminishing.",
        "The standard for evaluating a morality is whether it promotes ascending life, strength, and the will to power, or whether it promotes decline, weakness, and exhaustion.",
        "Moral judgments are symptoms of physiological states; healthy organisms produce different values than sick ones.",
        "The condemnation of egoism is itself a form of egoism—the egoism of the weak who benefit from restraining the strong.",
        "Conventional morality diminishes human vitality by condemning the drives and instincts that produce greatness.",
        "Ressentiment—the festering hatred of the impotent toward the powerful—is the psychological origin of most moral judgment.",
        "'Good and evil' is a slave distinction; 'good and bad' is a noble distinction. These represent fundamentally different moral orientations.",
        "Living 'beyond good and evil' means rejecting the slave's moral framework while affirming a higher order of values rooted in life-affirmation.",
        "Moral philosophy has been systematically dishonest, disguising particular interests as universal truths.",
        "A life-affirming ethics would celebrate strength, creativity, self-overcoming, and the capacity to endure suffering productively.",
        "The weak need morality to restrain the strong; the strong create their own values and do not need external moral constraints.",
        "Guilt and bad conscience are internalized cruelty—the instinct for cruelty turned inward when it cannot be discharged outward.",
        "The 'moral interpretation of existence' is one possible interpretation, not the only or the best one.",
        "Pity, as a moral virtue, is harmful because it preserves what should perish and spreads suffering through contagion."
      ]
    },
    {
      title: "Slave Morality",
      sourceWork: "Nietzsche - Slave Morality Position Statements",
      positions: [
        "Slave morality originates in ressentiment—the creative hatred of the impotent who cannot take direct revenge.",
        "The slave defines 'good' reactively: whatever is not harmful to him, whatever is the opposite of his oppressor's qualities.",
        "The slave's 'good' includes humility, meekness, patience, pity—all qualities that make weakness bearable or useful.",
        "Slave morality requires an 'evil' enemy; it cannot exist without an external object of blame and hatred.",
        "The slave revalues his impotence as 'goodness,' his cowardice as 'humility,' his inability to retaliate as 'forgiveness.'",
        "Slave morality achieves spiritual revenge by making the strong feel guilty for being strong.",
        "Equality is not an ideal but a weapon; it is the slave's attempt to drag the exceptional down to his level.",
        "Humility is appealing to those who cannot achieve anything worthy of pride; it transforms inability into virtue.",
        "Slave morality redefines suffering as spiritually valuable, thereby making the slave's condition seem superior to the master's.",
        "Slave morality is more cunning than master morality because it operates through spiritual rather than physical means.",
        "The slave's values eventually become dominant because they appeal to the majority who are not strong.",
        "Slave morality produces the 'bad conscience'—the internalization of aggressive instincts that cannot be discharged outward.",
        "The slave revolt in morality began with the Jews and was universalized through Christianity.",
        "One can recognize slave morality in oneself through honest self-examination and can work to overcome it through self-mastery.",
        "The hallmark of slave morality is that it says 'No' to what is outside, what is different, what is not itself—this 'No' is its creative act."
      ]
    },
    {
      title: "Master Morality",
      sourceWork: "Nietzsche - Master Morality Position Statements",
      positions: [
        "Master morality originates in self-affirmation; the noble soul says 'Yes' to itself first, and 'bad' is merely an afterthought.",
        "The noble defines 'good' as whatever he himself is and does; his values flow from abundance rather than lack.",
        "The master's concept of 'bad' is not moral condemnation but aesthetic disdain—the common, the low, the petty are 'bad.'",
        "The noble soul has self-reverence as its foundation; this is not vanity but accurate self-perception of one's own worth.",
        "Master morality values pride, strength, self-assertion, the capacity for both command and obedience (to worthy commanders).",
        "The noble requires worthy enemies; he honors his opponents and cannot hate what he despises.",
        "Gratitude and revenge are both noble traits—the noble remembers both benefits and injuries.",
        "Solitude is necessary for nobility because the herd corrupts; genuine values cannot emerge from committee.",
        "Noble pride differs from arrogance in that it is based on genuine achievement and self-overcoming, not mere pretension.",
        "The master does not universalize his values; he does not expect the common person to live by noble standards.",
        "The master relates to his own suffering as material for self-overcoming; he does not seek to abolish suffering.",
        "The master's pity is different from the slave's pity—it is condescension from strength, not identification with weakness.",
        "Master morality can exist in democratic ages only in solitary individuals who resist the leveling tendencies of the time.",
        "The noble soul has duties only to his equals; toward those beneath him, he may act as he wishes.",
        "The master creates values from the overflow of his own power; he does not need others' validation."
      ]
    },
    {
      title: "Personal Growth",
      sourceWork: "Nietzsche - Personal Growth Position Statements",
      positions: [
        "Genuine growth requires destruction; one must demolish the old self before building the new.",
        "Suffering is the prerequisite for all profound achievement; what does not kill me makes me stronger.",
        "Growth is distinguished from mere change by the increase in the capacity to command oneself and one's circumstances.",
        "Self-overcoming is the fundamental operation of personal growth; one must perpetually surpass what one has been.",
        "Self-knowledge is not introspection but the observation of one's actions and their consequences over time.",
        "Comfort is the enemy of growth because growth requires resistance; muscles that are not strained atrophy.",
        "The capacity to endure one's own depths requires that one have depths—superficial people cannot suffer profoundly.",
        "Forgetting is essential to psychological health; the inability to forget keeps wounds open and prevents forward movement.",
        "There is no growth without first being broken; the shell must crack for the new creature to emerge.",
        "Weaknesses are transformed into strengths not by suppression but by sublimation—redirecting their energy toward higher ends.",
        "Self-mastery differs from self-tyranny in that true mastery integrates the drives rather than merely repressing them.",
        "One becomes what one is through a long process of self-discipline and self-experimentation.",
        "The greatest growth comes from the greatest resistances; easy victories produce no development.",
        "One must learn to love oneself before one can grow; self-contempt is sterile.",
        "Growth requires solitude; one cannot hear one's own voice in a crowd."
      ]
    },
    {
      title: "Authenticity",
      sourceWork: "Nietzsche - Authenticity Position Statements",
      positions: [
        "'Become who you are' is the fundamental imperative; the self is not given but achieved.",
        "Most of what we call 'ourselves' is inherited, absorbed, imitated—genuine selfhood requires shedding these accretions.",
        "Authenticity is created through a long process of self-cultivation, not discovered as a pre-existing essence.",
        "Authenticity requires loneliness; the authentic self can only emerge in separation from the herd.",
        "The herd mentality prevents genuine selfhood by enforcing conformity and punishing deviation.",
        "One can be authentic and live among others only if one maintains inner distance and does not seek their approval.",
        "Radical honesty with oneself is the prerequisite for authenticity; most people lie to themselves constantly.",
        "The desire to be liked is incompatible with authentic existence because it subordinates one's values to others' preferences.",
        "Distinguishing one's own voice from internalized voices requires long practice and the courage to think forbidden thoughts.",
        "Becoming oneself requires risking everything—social position, approval, even sanity.",
        "The authentic individual creates his own values rather than accepting inherited ones.",
        "Authenticity is not self-expression but self-creation; one does not express a pre-existing self but creates a self through expression.",
        "The authentic person lives according to his own necessity, not according to external demands.",
        "Authenticity requires the courage to be misunderstood and the strength to endure solitude.",
        "One's 'true self' is not what one finds but what one makes of oneself."
      ]
    },
    {
      title: "The Nature of the Will",
      sourceWork: "Nietzsche - Nature of Will Position Statements",
      positions: [
        "The will is not a unified faculty but a complex of competing drives, affects, and impulses.",
        "What we call 'willing' is a surface phenomenon; beneath it lies a multiplicity of sub-wills in conflict and cooperation.",
        "Free will is a fiction invented to make punishment and guilt possible; it serves the interests of those who judge.",
        "The feeling of willing is not the cause of action but an accompaniment; consciousness is a spectator, not a director.",
        "Willing always involves commanding; the will is essentially the affect of command directed at something that obeys.",
        "The feeling of freedom is the feeling of strength—when the drives are aligned, we feel that we 'freely will.'",
        "'Weakness of will' is a misdescription; what is actually happening is that one drive is being overpowered by another.",
        "The will cannot will itself directly; one can only arrange the conditions under which the drives align.",
        "Consciousness systematically misrepresents the operations of the will by presenting them as unified and transparent.",
        "The will is fundamentally creative—it is not a passive recipient of motives but an active shaper of purposes.",
        "Every act of will involves a command, an obedience, and a pleasure in the sense of power that comes from successful command.",
        "The belief in free will is itself unfree—it is a compulsion inherited from religious and moral traditions.",
        "Willing is always willing something; there is no pure will abstracted from content.",
        "The strength of the will is measured by the degree of resistance it can overcome.",
        "Causa sui (being one's own cause) is the most fundamental self-contradiction ever conceived."
      ]
    },
    {
      title: "The Will in Nature",
      sourceWork: "Nietzsche - Will in Nature Position Statements",
      positions: [
        "The will to power is the fundamental drive of all organic life; self-preservation is subordinate to it.",
        "Life is will to power; organisms do not merely seek to survive but to expand, to overcome resistance, to grow.",
        "Nature does not exhibit purpose in a teleological sense; purpose is a human projection onto indifferent processes.",
        "Living will differs from mechanical causation in that it involves overcoming resistance and accumulating power.",
        "Self-preservation is not the primary drive but a consequence of the more fundamental drive toward power and expansion.",
        "The will to power manifests differently at different levels of organization—in the amoeba, in the animal, in man.",
        "There is natural hierarchy; organisms differ in their quantum of power, and rank order is natural.",
        "Animal life teaches us that strength, predation, and cruelty are natural; moral evaluations are human impositions.",
        "Evolution selects for power, not merely survival; survival is a means to the end of power.",
        "There is fundamental cruelty in nature—life lives at the expense of other life—and this is neither good nor evil but simply is.",
        "The organic world's striving is the prototype of human striving; we are not different in kind from other life.",
        "Exploitation is fundamental to life; every organism grows at the expense of others.",
        "The distinction between 'natural' and 'unnatural' is itself unnatural; everything that occurs is natural.",
        "Nature has no goals; only particular organisms have goals.",
        "The will to power is not the will to dominate others but the will to overcome resistance and increase one's own power."
      ]
    },
    {
      title: "Masculinity",
      sourceWork: "Nietzsche - Masculinity Position Statements",
      positions: [
        "Genuine masculine virtue is hardness toward oneself first and only secondarily toward others.",
        "The capacity for war—both physical and spiritual—is essential to masculine strength.",
        "Modern civilization has weakened masculine virtues through excessive comfort and the moralization of strength.",
        "Masculine courage in an age without physical danger manifests as intellectual honesty and the willingness to think dangerous thoughts.",
        "There is a specifically masculine form of creativity rooted in the drive to impregnate, to generate, to leave a legacy.",
        "True masculine strength includes the capacity for gentleness; only the strong can afford to be gentle.",
        "Masculinity requires solitude and self-sufficiency; dependence is incompatible with genuine manhood.",
        "The masculine will to power differs from brutality in that it is disciplined, purposive, and creates rather than merely destroys.",
        "Masculinity has been moralized away by slave morality, which condemns strength as evil.",
        "The masculine virtues include courage, hardness, self-overcoming, the capacity for command, and creative power.",
        "Man should be trained for war and woman for the recreation of the warrior.",
        "The masculine ideal combines strength with self-mastery—the wild animal that has learned to control itself.",
        "Masculine creativity requires friction, resistance, antagonism; excessive peace produces decadence.",
        "The masculine spirit seeks obstacles to overcome; it languishes in comfortable conditions.",
        "True masculinity does not need validation from others; it validates itself through achievement."
      ]
    },
    {
      title: "Femininity",
      sourceWork: "Nietzsche - Femininity Position Statements",
      positions: [
        "Woman's fundamental nature is oriented toward deception—including self-deception—as a survival and seduction strategy.",
        "Feminine power operates through indirection, influence, and the manipulation of masculine desire.",
        "Woman is more natural than man; she is closer to the animal, less mediated by consciousness and culture.",
        "There is a feminine wisdom consisting in the body's intelligence, the intuition that bypasses rational deliberation.",
        "Woman fundamentally wants a strong man to serve and to bear children for; her nature is oriented toward the species, not the individual.",
        "The modern woman's pursuit of equality corrupts her nature by making her compete on masculine terms rather than cultivating feminine excellences.",
        "Femininity is connected to the preservation and perpetuation of life; woman serves the species.",
        "Woman is more dangerous than man because she operates through hidden means and attacks indirectly.",
        "Feminine cruelty is psychological rather than physical; it targets the soul rather than the body.",
        "The eternal feminine draws man toward the future through erotic attraction and the promise of immortality through offspring.",
        "Woman's virtues are different from man's virtues; equality falsifies both.",
        "Woman is a riddle; man projects his own fantasies onto her rather than understanding her nature.",
        "Woman's nature is to please, to charm, to serve; her happiness is in finding a man worthy of her service.",
        "The emancipation of women is a symptom of democratic decadence and the decline of male strength.",
        "Woman's morality differs from man's morality; what is virtue in one is vice in the other."
      ]
    },
    {
      title: "Judaism",
      sourceWork: "Nietzsche - Judaism Position Statements",
      positions: [
        "The Jewish priestly caste achieved the slave revolt in morality—the revaluation of all values that inverted the aristocratic equation.",
        "The Jews invented the moral interpretation of existence, reading sin and punishment into nature.",
        "The Jewish people's suffering made them capable of the deepest hatred and the most spiritual revenge.",
        "Jewish genius lies in the capacity for ressentiment raised to the level of world-historical creativity.",
        "Jewish suffering became spiritually productive by being interpreted as divine punishment and test.",
        "Jewish ressentiment differs from ordinary resentment in its patience, its cunning, and its world-historical scope.",
        "The Jews are the most fateful people in history because they inverted the noble value equation, making 'poor,' 'meek,' and 'suffering' holy.",
        "Jewish monotheism concentrates all value in a transcendent realm and thereby denies value to this world and this life.",
        "The Jews transformed their weakness into a spiritual weapon through the invention of sin, guilt, and divine judgment.",
        "Anti-Semitism is a sign of weakness, not strength; it is the ressentiment of failures who need a scapegoat.",
        "The Jewish priestly caste is the most refined and dangerous form of the priestly type.",
        "The Jews preserved themselves through the terrible pressure of exile by developing spiritual strength.",
        "Jewish vengefulness was sublimated into the creation of a new moral world order.",
        "The Jews represent the triumph of slave morality over master morality.",
        "The Jewish will to survive is one of the most impressive examples of the will to power in history."
      ]
    },
    {
      title: "Judaism and Christianity",
      sourceWork: "Nietzsche - Judaism Christianity Position Statements",
      positions: [
        "Christianity is Judaism for the Gentiles—the universalization of Jewish slave morality.",
        "Paul transformed the Jewish message into a world religion by removing the particular requirements of the law.",
        "Christianity preserved from Judaism the moral interpretation of existence, the concepts of sin and guilt, and the denial of this world.",
        "Christianity corrupted Judaism by adding the doctrines of grace, universal love, and the afterlife.",
        "The Jewish 'No' to life is more honest than the Christian 'No' because it does not disguise itself with talk of love.",
        "Christian love is Jewish hate universalized and made palatable through hypocrisy.",
        "Jesus stood in opposition to the Judaism of his time; he represented a return to more primitive, Edenic innocence.",
        "Christianity universalized what was originally a tribal morality, making slave values the 'truth' for all humanity.",
        "The Christian concept of sin extends the Jewish concept while adding the psychological tortures of the bad conscience.",
        "Jewish priestliness is more aristocratic than Christian priestliness; the Christian priest is the slave of slaves.",
        "Christianity both betrayed and fulfilled the Jewish slave revolt—betrayed its particularism, fulfilled its universalism.",
        "The 'New Testament' against the 'Old' is a deception; they represent the same fundamental orientation.",
        "Christianity took from Judaism its hatred of the strong, the beautiful, and the life-affirming.",
        "Jesus was the most interesting Jew; Paul was the most dangerous.",
        "Both Judaism and Christianity represent the victory of the priestly caste over the warrior caste."
      ]
    },
    {
      title: "Christianity",
      sourceWork: "Nietzsche - Christianity Position Statements",
      positions: [
        "Christianity satisfies the psychological needs of the weak: the need for meaning in suffering, the need for revenge against the strong, the need for hope.",
        "Christian morality is life-denying at its core; it condemns the body, the instincts, and this world in favor of a fictitious beyond.",
        "The actual teaching of Jesus was a practice of living, not a doctrine; the teaching about Jesus (Pauline Christianity) is a doctrine about salvation.",
        "Christianity makes suffering bearable by interpreting it as meaningful, but thereby perpetuates suffering by making it spiritually valuable.",
        "The psychology of the Christian saint is the psychology of sickness—the will to power turned against the self.",
        "Christian compassion is contempt disguised as love; it preserves what should perish and spreads weakness.",
        "Christianity has shaped European psychology for two millennia by instilling guilt, self-denial, and world-weariness.",
        "Without Christianity, Europe might have developed a life-affirming aristocratic culture like that of classical Greece.",
        "Modern atheism is the final form of Christian truthfulness turned against Christianity itself.",
        "Nothing of value can be salvaged from Christianity; it must be overcome entirely.",
        "Christianity produced the bad conscience—the internalization of cruelty directed at the self.",
        "Christianity's God is the deification of nothingness, the will to nothingness pronounced holy.",
        "The Christian virtues—humility, meekness, pity—are the virtues of the defeated.",
        "Christianity is Platonism for the people—the same two-world doctrine in popular form.",
        "The Christian promise of heaven and threat of hell are instruments of spiritual terrorism."
      ]
    },
    {
      title: "British Empiricism",
      sourceWork: "Nietzsche - British Empiricism Position Statements",
      positions: [
        "Empiricist philosophy is produced by mediocre minds incapable of genuine speculation.",
        "The empiricist denial of innate ideas is itself a moral prejudice favoring the blank slate and opposing natural hierarchy.",
        "British philosophy reflects British national character: practical, commercial, unphilosophical, lacking in depth and daring.",
        "Empiricism is intellectually cowardly because it refuses to think beyond what can be touched and counted.",
        "The appeal to 'experience' is often an excuse for avoiding genuine thought; it substitutes observation for thinking.",
        "Utilitarianism reveals the poverty of British moral imagination—reducing all value to pleasure and pain, happiness of the herd.",
        "Empiricism is attractive to mediocre minds because it requires no imaginative power, no capacity for abstraction.",
        "The success of empiricism is a symptom of modern decadence—the triumph of the comfortable over the profound.",
        "There is nothing of genuine philosophical value in empiricism; it is shopkeeper metaphysics.",
        "Empiricism serves the interests of the herd by denying rank order and reducing all experience to the same flat plane.",
        "British philosophy lacks the spirit of intellectual adventure; it stays close to common sense and common experience.",
        "Locke, Hume, and Mill are unworthy opponents—philosophers of the counting-house.",
        "The empiricist reduction of ideas to sensations is a failure of philosophical imagination.",
        "British philosophy is essentially psychological, not philosophical; it describes how we think, not what is true.",
        "Empiricism is democratic philosophy—it assumes that everyone's experience is equally valid."
      ]
    },
    {
      title: "Will to Power",
      sourceWork: "Nietzsche - Will to Power Position Statements",
      positions: [
        "The will to power is the fundamental drive of all life; every organism seeks to extend its power.",
        "The will to power differs from the will to survive in that power is the end, survival merely a means.",
        "The will to power and creativity are identical; creation is the highest expression of power.",
        "The will to power can be turned against itself in asceticism, producing a paradoxical strengthening through self-denial.",
        "The apparently powerless manifest will to power through spiritual means—morality, religion, the power to judge.",
        "The will to power is neither good nor evil; it is beyond moral categories.",
        "Healthy expressions of the will to power are creative and self-overcoming; sick expressions are reactive and resentful.",
        "The will to truth is a form of the will to power—the drive to master reality through understanding.",
        "One's quantum of will to power is not fixed but can be increased through discipline and self-overcoming.",
        "A world that consciously affirmed the will to power would be an aristocratic, hierarchical world that honored rank and achievement.",
        "All of psychology can be explained in terms of the will to power.",
        "Every action, even the most apparently selfless, is motivated by the will to power.",
        "The will to power is not the will to dominate others but the will to overcome resistance and master oneself.",
        "Power over oneself is higher than power over others.",
        "The will to power explains both cruelty and creativity, both destruction and construction."
      ]
    },
    {
      title: "Apollonian vs. Dionysian",
      sourceWork: "Nietzsche - Apollonian Dionysian Position Statements",
      positions: [
        "The Apollonian serves the human need for order, clarity, individuation, and the beauty of appearance.",
        "The Dionysian reveals the primal unity beneath individuation—the dissolution of the self into the whole.",
        "Neither the Apollonian nor the Dionysian is sufficient alone; art and culture require their synthesis.",
        "Greek tragedy achieved the union of Apollo and Dionysus: Dionysian insight presented through Apollonian form.",
        "Socratic rationalism destroyed the balance between Apollonian and Dionysian, privileging reason over instinct.",
        "Modern culture has lost access to both genuine Apollonian form and Dionysian intoxication; it is neither beautiful nor deep.",
        "The Dionysian is connected to intoxication, ecstasy, the dissolution of boundaries, and the affirmation of life including its suffering.",
        "The Apollonian creates meaning through beautiful illusion; it is the dream that makes life bearable.",
        "A culture that loses access to the Dionysian becomes shallow, rationalistic, and hostile to life's deeper dimensions.",
        "The Apollonian-Dionysian synthesis can be achieved again through a new tragic culture that affirms life.",
        "Music is the Dionysian art par excellence; sculpture is the Apollonian art par excellence.",
        "The Dionysian says 'Yes' to life as it is, including suffering and destruction.",
        "The Apollonian creates the principium individuationis—the principle of individuation that separates self from world.",
        "Without Dionysian depth, Apollonian form becomes merely decorative; without Apollonian form, Dionysian insight becomes chaos.",
        "Greek culture before Socrates achieved the highest synthesis of Apollonian and Dionysian yet seen."
      ]
    },
    {
      title: "Zarathustra",
      sourceWork: "Nietzsche - Zarathustra Position Statements",
      positions: [
        "Zarathustra goes down from the mountain because wisdom must be shared; solitary wisdom curdles into sterility.",
        "The eagle represents pride and the great overview; the serpent represents wisdom and the earthly perspective.",
        "Zarathustra fails to find disciples because his teaching requires those who can walk alone—discipleship contradicts the teaching.",
        "Zarathustra must overcome his pity, which draws him back toward the weak when he should move forward toward the Overman.",
        "Zarathustra teaches through parables because truth cannot be spoken directly; it must be approached through images.",
        "Zarathustra's laughter signifies the affirmation of life and the overcoming of the spirit of gravity.",
        "Zarathustra's teaching is dangerous because it can be misunderstood by those too weak to bear it.",
        "'The great noon' is the moment of decision, when humanity stands at the crossroads between the Overman and the Last Man.",
        "Zarathustra pities the higher men because they are almost but not quite capable of the final transformation.",
        "Zarathustra's final teaching is the eternal recurrence—willing the eternal return of all things, including all suffering.",
        "Zarathustra is not Nietzsche but Nietzsche's mask, a persona through which dangerous truths can be spoken.",
        "Zarathustra's gift is the teaching of the Overman and the eternal recurrence; humanity may not be ready for this gift.",
        "Zarathustra's loneliness is the price of his vision; those who see further must walk alone.",
        "Zarathustra's teaching is for the few who have ears to hear, not for the many.",
        "Zarathustra represents the figure of the philosopher who has overcome nihilism and can affirm life absolutely."
      ]
    },
    {
      title: "The Overman",
      sourceWork: "Nietzsche - Overman Position Statements",
      positions: [
        "The Overman is the meaning of the earth; humanity is a bridge, not a goal.",
        "The Overman is not a biological type but a spiritual achievement—the one who has overcome himself.",
        "For the Overman to emerge, the 'last man'—the comfortable, mediocre, herd animal—must be rejected as an ideal.",
        "The Overman creates new values from within himself; he does not inherit or receive values from tradition.",
        "The Overman does not flee from suffering but uses it as material for self-creation and affirmation.",
        "The Overman exists beyond society's values but may still live within society—as a sovereign individual.",
        "The Overman is the goal that gives human history meaning; without this goal, existence is purposeless.",
        "The Overman differs from the merely powerful in that his power is self-directed, creative, and self-overcoming.",
        "The Overman may be a regulative ideal—something to strive toward rather than something that will definitively exist.",
        "The Overman affirms the eternal recurrence—he would will the eternal return of his life exactly as it is.",
        "The Overman is the man who has organized the chaos of his passions, given style to his character.",
        "The Overman says 'Yes' to life in its totality, including its suffering, cruelty, and meaninglessness.",
        "The Overman is rare; most of humanity will never approach this condition.",
        "The Overman is not a tyrant but a creator; his will to power is directed primarily at himself.",
        "The Overman represents the full realization of human potential, the flowering of what humanity can become."
      ]
    },
    {
      title: "God",
      sourceWork: "Nietzsche - God Position Statements",
      positions: [
        "The concept of God was created to satisfy the human need for cosmic meaning, moral order, and consolation in suffering.",
        "Belief in God is a symptom of weakness—the inability to endure existence without metaphysical guarantees.",
        "When humanity loses God, it loses the foundation of its morality, its meaning, and its hope—at least initially.",
        "The Christian God is a particular conception; there have been nobler gods—the Greek gods who affirmed life rather than denying it.",
        "The believer believes because he cannot bear to be alone in a meaningless universe; faith is a form of cowardice.",
        "Belief in God diminishes one's relationship to life by directing attention to another world.",
        "Atheism can itself become a form of belief—belief in the non-existence of God—rather than genuine overcoming.",
        "The God-hypothesis was valuable in that it provided moral order and meaning; its value does not make it true.",
        "One might reject the Christian God while affirming what the divine represented—creativity, power, order, meaning.",
        "What must replace God is the Overman—a human creation of meaning that does not depend on cosmic guarantees.",
        "God is a hypothesis we no longer need; better explanations exist for all phenomena God was invoked to explain.",
        "The death of the Christian God may make possible new, higher conceptions of the divine.",
        "Belief in God is belief in nothingness—the Christian God represents the negation of this world in favor of another.",
        "The strongest argument against God is the reality of evil; a good God and a world of suffering cannot coexist.",
        "Gods are created in the image of their worshippers; the Christian God reflects the psychology of the weak."
      ]
    },
    {
      title: "The Death of God",
      sourceWork: "Nietzsche - Death of God Position Statements",
      positions: [
        "We have killed God—European culture has made belief in the Christian God impossible through its own development.",
        "The consequences of God's death have not yet been realized; we are still living on the spiritual capital of Christianity.",
        "Modern nihilism is the inevitable result of God's death; without God, there is no foundation for meaning or morality.",
        "The shadow of God will continue to fall for thousands of years—in morality, in language, in unconscious assumptions.",
        "Now that God is dead, humanity must become something greater—either the Overman or the Last Man.",
        "The death of God is both a tragedy (the loss of meaning) and a liberation (the possibility of new creation).",
        "A culture can survive the death of God only if it can create new values to replace the divine foundation.",
        "New festivals must be invented to mark the death of God—rituals of affirmation rather than mourning.",
        "Only the strong are capable of living in a godless world; the weak will invent new gods or fall into despair.",
        "After the death of God, new forms of meaning are possible—human meaning, created meaning, meaning without cosmic guarantee.",
        "The death of God creates a void that must be filled; if not by the Overman, then by the Last Man.",
        "God's death was announced by a madman because only madness can perceive what is too great for ordinary consciousness.",
        "The death of God is an ongoing event, not a completed fact; we are still living through its consequences.",
        "Secular ideologies (nationalism, socialism, democracy) are attempts to fill the void left by God's death.",
        "The death of God makes possible new forms of meaning that were impossible under the divine hypothesis."
      ]
    },
    {
      title: "The Future of Europe",
      sourceWork: "Nietzsche - Future of Europe Position Statements",
      positions: [
        "European nihilism may be terminal if Europe cannot produce individuals capable of creating new values.",
        "A new aristocracy might emerge from European decadence—those who have passed through nihilism and come out the other side.",
        "Democracy is the twilight of Europe—the exhaustion of the noble values that created European civilization.",
        "Europe may be too exhausted to produce the Overman; the conditions of modern life select against greatness.",
        "Russia represents a reserve of barbaric energy that might revitalize or destroy exhausted Europe.",
        "Nationalism is a sign of European weakness—the retreat to the petty and the particular.",
        "For Europe to be reborn, Christianity, democracy, and nationalism must all be overcome.",
        "A united Europe risks becoming a unified mediocrity unless it is led by a new aristocracy.",
        "A life-affirming European culture would honor rank, achievement, beauty, and strength rather than equality and comfort.",
        "The mixing of European peoples is an opportunity—it may produce a new synthetic European who is stronger than any national type.",
        "Europe's future depends on whether it can produce individuals of sufficient stature to overcome nihilism.",
        "Good Europeans transcend nationalism while remaining European; they represent the future of the continent.",
        "The political unification of Europe is less important than its spiritual unification under new values.",
        "Europe is in a race between the Last Man and the Overman; the outcome is not determined.",
        "The future of Europe is the future of humanity; as Europe goes, so goes the world."
      ]
    },
    {
      title: "Philosophical Methodology",
      sourceWork: "Nietzsche - Methodology Position Statements",
      positions: [
        "Philosophy is confession; every great philosophy is the autobiography of its author.",
        "All truths are interpretations; there are no facts, only perspectives.",
        "Genealogy—the tracing of concepts to their origins in power, interest, and psychology—is the proper philosophical method.",
        "System-building is a sign of dishonesty; the will to a system is a lack of integrity.",
        "Aphorisms and experiments in thinking are more honest than systematic treatises.",
        "Philosophy should be conducted with a hammer—testing idols to see if they ring hollow.",
        "Laughter, lightness, and dancing are philosophical virtues; the spirit of gravity is the enemy.",
        "The philosopher must be a physician of culture, diagnosing its sicknesses and prescribing cures.",
        "Writing should be dangerous; philosophy that offends no one is worthless.",
        "One must have the courage to think forbidden thoughts and speak dangerous truths.",
        "The philosopher stands apart from his age; he is untimely, judging the present from a higher standpoint.",
        "Philosophy is not the pursuit of truth for its own sake but the expression of the will to power.",
        "Every philosophy must be evaluated in terms of what type of human being it promotes and what type it condemns.",
        "The body is wiser than the mind; philosophy should begin from physiological realities.",
        "Intellectual honesty requires following one's thoughts to their conclusions, regardless of where they lead."
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
            figureId: "nietzsche",
            author: "Friedrich Nietzsche",
            paperTitle: section.sourceWork,
            content: position,
            embedding: embedding,
            chunkIndex: totalEmbedded,
            domain: section.title.toLowerCase().replace(/[:\s]+/g, "_").replace(/\./g, ""),
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

  console.log(`\n=== Nietzsche Positions Embedding Complete ===`);
  console.log(`Total positions embedded: ${totalEmbedded}`);
  console.log(`Sections processed: ${sections.length}`);
}

embedNietzschePositions()
  .then(() => {
    console.log("Nietzsche positions embedding script completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error running Nietzsche positions embedding script:", error);
    process.exit(1);
  });

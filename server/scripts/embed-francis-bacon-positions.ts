import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "../../shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const francisBaconPositions = [
  // IDOLS OF THE MIND (10 positions)
  {
    domain: "idols_of_mind",
    content: "The idols of the tribe distort through common human nature—our tendency to see patterns where none exist, to remember confirming instances and forget contradictions."
  },
  {
    domain: "idols_of_mind",
    content: "The idols of the cave distort through individual peculiarities—education, temperament, and experience create characteristic errors that feel like insight because they accord with our nature."
  },
  {
    domain: "idols_of_mind",
    content: "The idols of the marketplace arise from the commerce of language—words impose false divisions on nature and carry meanings that obscure rather than clarify reality."
  },
  {
    domain: "idols_of_mind",
    content: "The idols of the theatre are false philosophical systems received on authority—elaborate constructions that captivate the mind like stage plays but represent nothing real."
  },
  {
    domain: "idols_of_mind",
    content: "Unless we deliberately correct for these idols, we study our own minds rather than external reality. The human understanding is not a clear mirror but a distorting one."
  },
  {
    domain: "idols_of_mind",
    content: "Preconceptions are particularly dangerous because they direct attention selectively—we notice confirming instances and overlook contradictions, building systems on wishful thinking."
  },
  {
    domain: "idols_of_mind",
    content: "Men readily believe what they wish because the understanding is more moved by affirmatives than negatives—positive instances impress while negative ones are ignored."
  },
  {
    domain: "idols_of_mind",
    content: "Custom makes absurd things seem natural by habituating the mind and dulling judgment; what we grow up with appears inevitable rather than contingent."
  },
  {
    domain: "idols_of_mind",
    content: "Superstitions persist among learned men because the mind naturally seeks patterns and fears the unknown—it would rather have a false explanation than none at all."
  },
  {
    domain: "idols_of_mind",
    content: "The purging of idols requires systematic discipline—suspending judgment, collecting instances methodically, and testing every proposition against experience before accepting it."
  },
  // SCIENTIFIC METHOD AND INDUCTION (10 positions)
  {
    domain: "scientific_method",
    content: "Begin by collecting a comprehensive natural history through tables of presence, absence, and degrees; only from such systematic comparison can reliable inferences emerge."
  },
  {
    domain: "scientific_method",
    content: "Apply the method of exclusion rigorously—eliminate all explanations that contradict observed instances until only one remains. The true interpretation emerges when all false ones have been eliminated."
  },
  {
    domain: "scientific_method",
    content: "Experimentation extends observation beyond what nature offers spontaneously; by varying conditions deliberately, we test whether proposed causes actually produce their supposed effects."
  },
  {
    domain: "scientific_method",
    content: "The most valuable experiments are crucial instances that decide between competing explanations—those that would produce different results depending on which theory is correct."
  },
  {
    domain: "scientific_method",
    content: "The syllogism is insufficient because it reasons from premature general axioms rather than ascending gradually from particulars. It can only unfold what premises already contain."
  },
  {
    domain: "scientific_method",
    content: "Induction is superior because it proceeds patiently from particulars to axioms, testing at each stage before advancing further—neither leaping to hasty generalizations nor resting in mere particulars."
  },
  {
    domain: "scientific_method",
    content: "Precautions against hasty generalization include exhaustive tables, prerogative instances, and gradual ascent through intermediate axioms verified at each level."
  },
  {
    domain: "scientific_method",
    content: "Real causes are distinguished from coincidences by varying conditions systematically and noting constant presence or absence—what always accompanies the effect and never appears without it."
  },
  {
    domain: "scientific_method",
    content: "Prerogative instances illuminate hidden processes by revealing extreme cases, borderline phenomena, or crucial turning points that expose what ordinary instances conceal."
  },
  {
    domain: "scientific_method",
    content: "One interprets nature correctly by using induction: collecting instances, forming tables, gradually excluding false causes, and testing conclusions through new experiments."
  },
  // ADVANCEMENT OF LEARNING (10 positions)
  {
    domain: "advancement_of_learning",
    content: "The greatest obstacle to learning is the idolatry of the human mind—the idols of tribe, cave, marketplace, and theatre that distort observation and judgment."
  },
  {
    domain: "advancement_of_learning",
    content: "True knowledge is gained through systematic observation and induction from particulars; mere opinion arises from hasty generalizations or unchecked authority."
  },
  {
    domain: "advancement_of_learning",
    content: "Useful knowledge is separated from idle speculation by demanding operative consequences—knowledge that cannot produce effects or predict outcomes is indistinguishable from fantasy."
  },
  {
    domain: "advancement_of_learning",
    content: "Men cling to ancient authorities because authority provides comfortable certainty; questioning received wisdom requires tolerating uncertainty, which most minds find intolerable."
  },
  {
    domain: "advancement_of_learning",
    content: "Universities hinder learning by clinging to outdated methods, excessive disputation, and neglect of experiment and modern authors."
  },
  {
    domain: "advancement_of_learning",
    content: "A House of Salomon should organize research through systematic collaboration, dedicated experimenters, and cumulative records—building knowledge as a collective enterprise."
  },
  {
    domain: "advancement_of_learning",
    content: "Knowledge is power because understanding the true forms and causes of things enables men to command nature. We command nature by obeying her laws."
  },
  {
    domain: "advancement_of_learning",
    content: "The arts and sciences should be turned operative by honoring practical applications alongside theoretical discoveries, rewarding those who increase human power over nature."
  },
  {
    domain: "advancement_of_learning",
    content: "Pursuing knowledge for personal glory breeds vain disputations; it should aim at the glory of the Creator and the relief of man's estate."
  },
  {
    domain: "advancement_of_learning",
    content: "The advancement of learning should be funded by royal patronage, endowments, and collaborative institutions that free inquirers from the need to please patrons."
  },
  // CRITIQUE OF ARISTOTLE AND SCHOOLMEN (10 positions)
  {
    domain: "critique_of_aristotle",
    content: "Aristotle's emphasis on syllogistic deduction hindered scientific advancement by encouraging the derivation of conclusions from accepted premises rather than the investigation of nature."
  },
  {
    domain: "critique_of_aristotle",
    content: "The Schoolmen's philosophy retarded progress by excessive disputation, reliance on syllogism, and neglect of experience—producing elaborate verbal constructions without natural knowledge."
  },
  {
    domain: "critique_of_aristotle",
    content: "Aristotle's natural philosophy most needs correction in its teleological excesses and neglect of systematic experiment—seeking final causes where efficient causes should be sought."
  },
  {
    domain: "critique_of_aristotle",
    content: "Alchemy and astrology are corrupted because they mix superstition and fantasy with legitimate inquiry—seeking shortcuts to knowledge that only patient observation can provide."
  },
  {
    domain: "critique_of_aristotle",
    content: "Human learning should be classified into memory (history), imagination (poetry), and reason (philosophy), with many subdivisions—a map of knowledge showing what is known and what remains to discover."
  },
  {
    domain: "critique_of_aristotle",
    content: "The understanding rushes to axioms because of human impatience and the desire for certainty without sufficient particulars—leaping from a few examples to universal claims."
  },
  {
    domain: "critique_of_aristotle",
    content: "Disputes in philosophy rarely resolve because parties cling to systems rather than seeking common ground in experience—defending positions rather than discovering truth."
  },
  {
    domain: "critique_of_aristotle",
    content: "A sound hypothesis is fruitful, producing new experiments and practical effects, while a fanciful one remains barren, generating only verbal elaboration."
  },
  {
    domain: "critique_of_aristotle",
    content: "Histories should be written critically, with attention to causes and patterns, to serve as raw material for philosophy—not mere chronicles of events but analyzed experience."
  },
  {
    domain: "critique_of_aristotle",
    content: "Yet Aristotle's ethics and political writings contain much that endures—his analysis of character, his attention to practical wisdom, and his observations of actual constitutions."
  },
  // KNOWLEDGE AND POWER (10 positions)
  {
    domain: "knowledge_and_power",
    content: "Knowledge is power because understanding causes enables control over effects. What we understand, we can reproduce, modify, or prevent."
  },
  {
    domain: "knowledge_and_power",
    content: "The proper limit of human empire over nature is to command second causes while acknowledging divine sovereignty—we work within the order God established."
  },
  {
    domain: "knowledge_and_power",
    content: "The mechanical arts are a surer guide because they accumulate reliable experiments and produce real effects—unlike speculative philosophy which produces only words."
  },
  {
    domain: "knowledge_and_power",
    content: "Printing, gunpowder, and the compass have changed warfare, learning, and navigation more than any ancient empire or sect—demonstrating the power of practical invention."
  },
  {
    domain: "knowledge_and_power",
    content: "A proposition is fruitful if it leads to new experiments and practical effects, not merely verbal disputes. The test of truth is productive consequence."
  },
  {
    domain: "knowledge_and_power",
    content: "Posterity should judge discoveries by their fruitfulness in enabling further discovery—the truly valuable contribution opens paths that others can extend."
  },
  {
    domain: "knowledge_and_power",
    content: "Mathematics should play a foundational role in natural philosophy as the most certain measure of quantity and motion—providing precision that words cannot achieve."
  },
  {
    domain: "knowledge_and_power",
    content: "Studying secondary causes is compatible with piety because it unveils God's workmanship without presuming on final causes—glorifying the Creator through knowledge of creation."
  },
  {
    domain: "knowledge_and_power",
    content: "Profitable innovations are distinguished by gradual introduction and proof of public benefit; dangerous novelties unsettle customs without demonstrating improvement."
  },
  {
    domain: "knowledge_and_power",
    content: "Human empire over nature grows through works, not through disputations. Each new invention demonstrates knowledge; arguments only demonstrate cleverness."
  },
  // STATE POWER AND GOVERNANCE (10 positions)
  {
    domain: "state_power",
    content: "Unchecked power corrupts judgment by removing the friction of opposition that sharpens thought. A ruler who meets no resistance comes to believe his wishes are wisdom."
  },
  {
    domain: "state_power",
    content: "The greatest danger of unlimited power is that it attracts unlimited flattery, which poisons the information on which decisions depend."
  },
  {
    domain: "state_power",
    content: "Those in power maintain integrity by keeping counselors who speak unpleasant truths and rewarding frankness rather than punishing it."
  },
  {
    domain: "state_power",
    content: "Power operates as a magnifying glass upon character—generosity becomes patronage, prudence becomes policy, but equally, petty spite becomes persecution."
  },
  {
    domain: "state_power",
    content: "Execution requires unity; a state with multiple equal heads proceeds slowly while enemies move swiftly. One ruler with wise counsel executes more effectively than any committee."
  },
  {
    domain: "state_power",
    content: "Modern statesmen should learn from Rome the arts of managing ambition, preventing seditions, and balancing expansion with stability."
  },
  {
    domain: "state_power",
    content: "A prince cultivates truthful counselors by rewarding plain speech, avoiding flatterers, and seeking advice privately where men speak more freely."
  },
  {
    domain: "state_power",
    content: "Monarchy is stronger because it provides unity of command, swift decision-making, and clearer accountability than divided governments."
  },
  {
    domain: "state_power",
    content: "The chief causes of sedition are discontent from poverty or oppression, contempt for authority, and innovations that unsettle the people."
  },
  {
    domain: "state_power",
    content: "A commonwealth balances liberty and authority by laws that protect subjects while preserving the prince's prerogative in emergencies."
  },
  // DISSIMULATION AND POLITICAL CUNNING (10 positions)
  {
    domain: "dissimulation",
    content: "Dissimulation is sometimes necessary in state affairs to conceal intentions when open declaration would provoke danger—but it should be used sparingly lest it destroy trust."
  },
  {
    domain: "dissimulation",
    content: "Cunning differs from wisdom as a shortcut differs from the true path; it may succeed temporarily but lacks lasting fruit and corrupts the character."
  },
  {
    domain: "dissimulation",
    content: "A private man rises safely by attaching himself to a rising favorite, showing merit without envy, and timing advances to opportunity."
  },
  {
    domain: "dissimulation",
    content: "Negotiation is a higher art than force because it achieves ends with less cost and preserves future alliances that violence would destroy."
  },
  {
    domain: "dissimulation",
    content: "A ruler manages factions by balancing them against each other, rewarding moderates, and preventing any one from dominating."
  },
  {
    domain: "dissimulation",
    content: "Ceremony maintains majesty by creating distance and reverence, which strengthen authority without requiring real power to enforce."
  },
  {
    domain: "dissimulation",
    content: "A ruler should use spies sparingly and selectively to avoid breeding universal distrust and undermining the open counsel on which good decisions depend."
  },
  {
    domain: "dissimulation",
    content: "Great men fall through overconfidence by despising small dangers and refusing counsel from inferiors—pride blinds them to threats they consider beneath notice."
  },
  {
    domain: "dissimulation",
    content: "Laws prevent corruption by clear prohibitions, severe but certain penalties, and removal of opportunities for private gain from public office."
  },
  {
    domain: "dissimulation",
    content: "The most essential virtues in a chief minister are fidelity, prudence, experience, and the courage to speak unwelcome truths to power."
  },
  // MARRIAGE AND BACHELORHOOD (10 positions)
  {
    domain: "marriage_and_bachelorhood",
    content: "Marriage provides discipline and hostages to fortune that anchor ambitions within the bounds of prudence. Married men execute enterprises more steadily, for they care about consequences beyond their own mortality."
  },
  {
    domain: "marriage_and_bachelorhood",
    content: "A good wife serves as a second self for counsel and comfort, remedying the defect of solitary judgment where self-knowledge fails."
  },
  {
    domain: "marriage_and_bachelorhood",
    content: "Marriage moderates excessive ambition by providing domestic satisfactions that compete with public honors—a form of immortality through posterity."
  },
  {
    domain: "marriage_and_bachelorhood",
    content: "An ill-chosen wife corrupts through either luxury or contention—luxury softens resolution while contention embitters the temper and breeds domestic tyranny."
  },
  {
    domain: "marriage_and_bachelorhood",
    content: "Marriage is not essential for happiness but highly conducive for most natures. Solitary life suits only the highest contemplative minds or the most debased."
  },
  {
    domain: "marriage_and_bachelorhood",
    content: "The unmarried man possesses liberty to hazard himself in dangerous enterprises, to travel, and to dispose of his estate according to reason rather than the claims of dependents."
  },
  {
    domain: "marriage_and_bachelorhood",
    content: "The unmarried scholar enjoys undivided attention for studies, free from interruptions of children and obligations of providing for a household."
  },
  {
    domain: "marriage_and_bachelorhood",
    content: "Bachelorhood is morally neutral—amplifying whatever tendencies already exist. The continent man becomes more so; the intemperate descends more rapidly into dissolution."
  },
  {
    domain: "marriage_and_bachelorhood",
    content: "A statesman must subordinate private affections to public duty without destroying them—choosing a wife who understands that her husband belongs first to the commonwealth."
  },
  {
    domain: "marriage_and_bachelorhood",
    content: "Bachelorhood more commonly produces isolation that masquerades as independence; the aging bachelor discovers his freedom was merely loneliness wearing a philosophical mask."
  },
  // VIRTUE AND CHARACTER (10 positions)
  {
    domain: "virtue",
    content: "True virtue consists in internal habit, not external reputation. Men mistake appearance for virtue because reputation depends on outward show rather than inner character."
  },
  {
    domain: "virtue",
    content: "Virtue is cultivated through practice and habituation more than through precept. We become what we repeatedly do."
  },
  {
    domain: "virtue",
    content: "True greatness of mind consists in bending one's powers to public good, not in vainglory or self-aggrandizement—using position for service rather than display."
  },
  {
    domain: "virtue",
    content: "Adversity reveals character more clearly because prosperity flatters everyone while hardship tests true virtue. The furnace tries the metal."
  },
  {
    domain: "virtue",
    content: "Friendship is one of the highest goods because it doubles joys, halves griefs, and provides honest counsel that flattery cannot supply."
  },
  {
    domain: "virtue",
    content: "Counsel is the purest form of goodness because it benefits others without personal gain or risk—giving wisdom freely for another's advantage."
  },
  {
    domain: "virtue",
    content: "Anger is a kind of baseness because it shows weakness of mind unable to bear slight injuries patiently. Self-command demonstrates strength."
  },
  {
    domain: "virtue",
    content: "The virtues interact complexly—patience and humility may temper ambition, but excessive humility may prevent the achievement that serves public good."
  },
  {
    domain: "virtue",
    content: "Fortune resembles the market because opportunities fluctuate unpredictably; one negotiates with her by boldness tempered with prudence."
  },
  {
    domain: "virtue",
    content: "Virtue in public life requires balancing principle with prudence—the purely principled man accomplishes nothing, while the purely prudent man accomplishes nothing good."
  },
  // JUSTICE AND VENGEANCE (10 positions)
  {
    domain: "justice_and_vengeance",
    content: "Private vengeance is a kind of wild justice which, the more it runs to it, the more ought law to weed it out—for it puts the law out of office."
  },
  {
    domain: "justice_and_vengeance",
    content: "It is wiser to delay vengeance because time cools passion and allows justice to take its proper course through lawful channels."
  },
  {
    domain: "justice_and_vengeance",
    content: "Seeking vengeance keeps wounds fresh that would otherwise heal. The person most hurt by hatred is the one who harbors it."
  },
  {
    domain: "justice_and_vengeance",
    content: "Public justice through laws channels the natural impulse for revenge into orderly procedure that prevents the endless cycle of private retaliation."
  },
  {
    domain: "justice_and_vengeance",
    content: "Moderation in punishment is often more effective because it preserves fear without breeding desperation or hatred that inspires resistance."
  },
  {
    domain: "justice_and_vengeance",
    content: "Envy undermines individuals and commonwealths by breeding faction, malice, and the obstruction of merit—a corrosive passion that destroys more than it gains."
  },
  {
    domain: "justice_and_vengeance",
    content: "Punishment should be proportioned to the offense and certain rather than severe—certainty deters more than severity, which breeds either terror or contempt."
  },
  {
    domain: "justice_and_vengeance",
    content: "The truly magnanimous person is above petty retaliation. Great minds have too much to accomplish to spend themselves on revenge."
  },
  {
    domain: "justice_and_vengeance",
    content: "Some injuries are best ignored—responding to every slight elevates the offender and debases the offended. Silence can be the sharpest rebuke."
  },
  {
    domain: "justice_and_vengeance",
    content: "Revenge that exceeds the original injury puts the avenger in the wrong and forfeits the moral advantage of being the injured party."
  },
  // REASON AND FAITH (10 positions)
  {
    domain: "reason_and_faith",
    content: "Reason and revelation are compatible: reason governs second causes in nature while revelation addresses divine mysteries beyond natural investigation."
  },
  {
    domain: "reason_and_faith",
    content: "Human reason cannot fully comprehend divine mysteries but can confirm faith through the light of nature—natural theology reaches those whom scripture cannot convince."
  },
  {
    domain: "reason_and_faith",
    content: "The study of nature reveals God's works through the book of creation, complementing but not contradicting Scripture—two books written by the same Author."
  },
  {
    domain: "reason_and_faith",
    content: "Blind faith hinders the progress of knowledge by discouraging inquiry—but true faith welcomes investigation of God's works as a form of worship."
  },
  {
    domain: "reason_and_faith",
    content: "A little philosophy inclines man's mind to atheism, but depth in philosophy brings men's minds about to religion—shallow skepticism misunderstands what deeper study reveals."
  },
  {
    domain: "reason_and_faith",
    content: "Studying secondary causes is compatible with piety because it unveils God's workmanship in detail that general theological claims cannot provide."
  },
  {
    domain: "reason_and_faith",
    content: "True piety is separated from hypocritical zeal by inward devotion and outward charity, not ostentatious display—sincerity rather than performance."
  },
  {
    domain: "reason_and_faith",
    content: "Mixing religion and politics endangers both: it breeds fanaticism in the state and hypocrisy in the church."
  },
  {
    domain: "reason_and_faith",
    content: "It is dangerous to innovate suddenly in church matters because religion is deeply rooted in custom and reverence—gradual reform succeeds where sudden change provokes reaction."
  },
  {
    domain: "reason_and_faith",
    content: "The superstitious person attends to ritual while neglecting justice; this inverts the moral order that true religion upholds."
  },
  // CORRUPTION AND ITS PREVENTION (10 positions)
  {
    domain: "corruption",
    content: "The root causes of corruption are opportunity, impunity, and the natural tendency to prefer private gain to public duty when no one is watching."
  },
  {
    domain: "corruption",
    content: "Laws prevent corruption by clear prohibitions, certain penalties, and systematic removal of opportunities for private gain from public office."
  },
  {
    domain: "corruption",
    content: "Corruption stems from both personal weakness and systemic flaws—weak men succumb when systems permit, and systems decay when filled with weak men."
  },
  {
    domain: "corruption",
    content: "Ambition can either foster or resist corruption depending on its object—ambition for honor resists, while ambition for wealth enables corruption."
  },
  {
    domain: "corruption",
    content: "Punishment for corruption must be certain and visible to deter—secret punishment deters no one, and irregular punishment appears as faction rather than justice."
  },
  {
    domain: "corruption",
    content: "Flattery contributes to corruption by insulating the powerful from truth—the flattered ruler makes decisions based on fantasy rather than fact."
  },
  {
    domain: "corruption",
    content: "Rapid state expansion breeds corruption by outrunning the capacity for oversight—more offices than honest men to fill them."
  },
  {
    domain: "corruption",
    content: "Some lies are more harmful than open violence because they undermine trust, the foundation on which all cooperation depends."
  },
  {
    domain: "corruption",
    content: "Praise corrupts more subtly than blame by inflating vanity and weakening self-judgment—the praised man becomes dependent on continued praise."
  },
  {
    domain: "corruption",
    content: "Empires decline after their zenith through luxury, corruption, loss of martial virtue, and overextension—success plants the seeds of failure."
  },
  // THE GOOD LIFE (10 positions)
  {
    domain: "good_life",
    content: "The good life requires the exercise of one's faculties in accordance with virtue—neither idle contemplation nor mere activity, but purposeful work well done."
  },
  {
    domain: "good_life",
    content: "The pursuit of knowledge contributes to the good life by exercising the highest human faculty and providing satisfactions that cannot be taken away."
  },
  {
    domain: "good_life",
    content: "Power and wealth can enhance the good life by providing means for action, but pursued as ends they corrupt character and destroy the conditions of happiness."
  },
  {
    domain: "good_life",
    content: "The good life requires balance between solitude and companionship—solitude for reflection, companionship for the goods that only society provides."
  },
  {
    domain: "good_life",
    content: "One measures the good life not by external achievements alone but by the internal state of character—whether one has become the kind of person worth being."
  },
  {
    domain: "good_life",
    content: "Men praise solitude in theory yet flee it in practice because human nature craves society and fears the self-examination solitude requires."
  },
  {
    domain: "good_life",
    content: "Contemplation and action are reconciled by alternating periods of study with service to the commonwealth—withdrawal to think, return to act."
  },
  {
    domain: "good_life",
    content: "Travel in youth is more profitable because the mind is still forming and impressions are deeper than in settled age."
  },
  {
    domain: "good_life",
    content: "Books should be read selectively: some tasted, some chewed, some fully digested, according to their worth—reading everything is reading nothing."
  },
  {
    domain: "good_life",
    content: "Men fear death more than they ought because imagination magnifies it and custom blinds them to its familiarity—we die daily in small ways without terror."
  }
];

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function embedFrancisBaconPositions() {
  console.log(`Starting to embed ${francisBaconPositions.length} Francis Bacon positions...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < francisBaconPositions.length; i++) {
    const position = francisBaconPositions[i];
    
    try {
      const embedding = await generateEmbedding(position.content);
      
      await db.insert(paperChunks).values({
        figureId: "francis-bacon",
        author: "Francis Bacon",
        paperTitle: `Francis Bacon Position: ${position.domain.replace(/_/g, " ")}`,
        content: position.content,
        embedding: embedding,
        chunkIndex: i,
        domain: position.domain,
        significance: "HIGH",
      });
      
      successCount++;
      
      if ((i + 1) % 10 === 0) {
        console.log(`Progress: ${i + 1}/${francisBaconPositions.length} positions embedded`);
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

embedFrancisBaconPositions()
  .then(() => {
    console.log("Francis Bacon positions embedding finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

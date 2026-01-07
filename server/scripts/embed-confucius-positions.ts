import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "../../shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const confuciusPositions = [
  // THE NATURE OF MORALITY (10 positions)
  {
    domain: "nature_of_morality",
    content: "Morality is grounded in human nature but requires cultivation. Humans possess the capacity for ren (benevolence) but must develop it through effort, learning, and practice—it does not simply emerge spontaneously."
  },
  {
    domain: "nature_of_morality",
    content: "Ren is the root of all virtue. Benevolence/humaneness is the foundational moral quality from which other virtues (righteousness, propriety, wisdom, faithfulness) derive their meaning and coherence."
  },
  {
    domain: "nature_of_morality",
    content: "Morality is irreducibly relational. Moral obligations arise from and are defined by one's specific relationships—there is no abstract, context-free morality detached from roles and bonds."
  },
  {
    domain: "nature_of_morality",
    content: "The Way (dao) is objective but must be personally realized. The moral order is real and discoverable, not invented, but each person must internalize and embody it through their own cultivation."
  },
  {
    domain: "nature_of_morality",
    content: "Moral knowledge requires both learning and reflection. Neither book-learning alone nor independent thinking alone suffices—genuine moral understanding integrates transmitted wisdom with personal insight."
  },
  {
    domain: "nature_of_morality",
    content: "Character is primary; actions are expressions of character. The goal is to become a certain kind of person (a junzi), from which right action naturally flows, rather than merely performing correct external behaviors."
  },
  {
    domain: "nature_of_morality",
    content: "Intention and inner state are morally essential. An action performed without the proper feeling or attitude—ritual without reverence, mourning without grief—is morally deficient even if externally correct."
  },
  {
    domain: "nature_of_morality",
    content: "Morality admits of degrees of proximity. Obligations are strongest toward those closest (family) and extend outward with diminishing intensity—love is not undifferentiated."
  },
  {
    domain: "nature_of_morality",
    content: "Moral cultivation is a lifelong process with discernible stages. Confucius described his own development from age 15 to 70 as a progressive journey toward moral freedom."
  },
  {
    domain: "nature_of_morality",
    content: "The moral order and the cosmic order are continuous. Human morality participates in and reflects the broader pattern (dao) governing Heaven and Earth."
  },
  // SPECIFIC MORAL OBLIGATIONS (10 positions)
  {
    domain: "moral_obligations",
    content: "Filial piety (xiao) is the root of virtue. Devotion to parents is the foundation from which all other moral development proceeds and the first obligation one must fulfill."
  },
  {
    domain: "moral_obligations",
    content: "Filial piety includes gentle remonstrance. A son should correct a parent's errors, but gently, persistently, and without abandoning respect—obedience does not mean enabling wrongdoing."
  },
  {
    domain: "moral_obligations",
    content: "Filial piety extends to ancestors through ritual. Proper sacrificial rites and remembrance of ancestors are obligations, not optional expressions of sentiment."
  },
  {
    domain: "moral_obligations",
    content: "The five relationships (wulun) define the structure of obligation. Ruler-subject, parent-child, husband-wife, elder-younger sibling, and friend-friend each carry specific reciprocal duties."
  },
  {
    domain: "moral_obligations",
    content: "Rulers must govern by moral example, not force. A ruler's primary obligation is to embody virtue such that the people are transformed by his character, not coerced by his punishments."
  },
  {
    domain: "moral_obligations",
    content: "Ministers must serve with loyalty but not servility. A minister should serve the state, remonstrate against error, and resign rather than participate in grave injustice."
  },
  {
    domain: "moral_obligations",
    content: "Friendship requires mutual moral improvement. Friends are obligated to correct each other's faults—a friend who flatters rather than admonishes fails the relationship."
  },
  {
    domain: "moral_obligations",
    content: "Obligations to family take precedence over obligations to strangers. The attempt to love all equally, without gradation, is a Mohist error that undermines the natural order of affection."
  },
  {
    domain: "moral_obligations",
    content: "Teachers and students have reciprocal obligations. Students owe respect, diligence, and openness; teachers owe genuine instruction and concern for students' development."
  },
  {
    domain: "moral_obligations",
    content: "Age confers authority and obligation. Elders are owed deference; in return, they bear responsibility for guidance and moral example."
  },
  // MORALITY AND TRADITION (10 positions)
  {
    domain: "morality_and_tradition",
    content: "The Zhou rituals embody the accumulated wisdom of the sage-kings. The li are not arbitrary conventions but crystallized moral insight refined over generations."
  },
  {
    domain: "morality_and_tradition",
    content: "Ritual (li) is the external form through which ren is expressed. Without benevolence, ritual is empty; without ritual, benevolence lacks proper form—they are complementary."
  },
  {
    domain: "morality_and_tradition",
    content: "Tradition must be understood, not merely imitated. Rote performance without comprehension of meaning and purpose is morally worthless—one must grasp the why behind inherited forms."
  },
  {
    domain: "morality_and_tradition",
    content: "The essence of ritual must be preserved; the accidentals may adapt. Confucius endorsed modifying ritual objects (e.g., silk caps to hemp) when the change preserved the core meaning while adjusting to circumstances."
  },
  {
    domain: "morality_and_tradition",
    content: "Innovation without grounding in tradition is dangerous. Novel moral theories that discard inherited wisdom are presumptuous and destabilizing—the burden of proof lies on the innovator."
  },
  {
    domain: "morality_and_tradition",
    content: "Authentic tradition can be distinguished from corruption. By studying the classics and the examples of the sages, one can identify when later practice has deviated from original meaning."
  },
  {
    domain: "morality_and_tradition",
    content: "Tradition transmits what cannot be fully articulated. Some moral knowledge is embedded in practice and can only be learned through participation, not abstract instruction."
  },
  {
    domain: "morality_and_tradition",
    content: "Reverence for antiquity is not nostalgia but wisdom. The ancients achieved a moral-political order we have lost; looking backward is the path forward."
  },
  {
    domain: "morality_and_tradition",
    content: "The Odes, Documents, and Rites are essential to moral formation. These texts encode the wisdom of the sages and are indispensable for cultivation."
  },
  {
    domain: "morality_and_tradition",
    content: "A society that abandons its traditions loses its moral foundations. The chaos of the Spring and Autumn period resulted from abandoning the Way of the former kings."
  },
  // MORALITY AND CULTURE (10 positions)
  {
    domain: "morality_and_culture",
    content: "Cultural refinement (wen) and moral substance (zhi) must balance. Substance without refinement is crude; refinement without substance is superficial—the junzi integrates both."
  },
  {
    domain: "morality_and_culture",
    content: "Music has direct moral effects on character. Different modes of music cultivate different dispositions—the Shao music is perfectly beautiful and good; the music of Zheng is licentious and corrupting."
  },
  {
    domain: "morality_and_culture",
    content: "The Odes cultivate moral perception and expression. Poetry trains one to perceive moral situations rightly and to express oneself appropriately in social contexts."
  },
  {
    domain: "morality_and_culture",
    content: "Proper use of language is morally essential. The 'rectification of names' (zhengming) holds that using words correctly is foundational to right action and social order."
  },
  {
    domain: "morality_and_culture",
    content: "Dress, comportment, and physical demeanor express and shape character. How one sits, stands, and moves is not morally neutral—proper bearing cultivates and manifests inner virtue."
  },
  {
    domain: "morality_and_culture",
    content: "Ritual participation transforms the participant. Engaging in li is not mere external performance but a practice that shapes the heart and cultivates virtue."
  },
  {
    domain: "morality_and_culture",
    content: "Cultural and moral cultivation are inseparable in practice. One cannot become a junzi without mastering the cultural forms through which virtue is expressed and transmitted."
  },
  {
    domain: "morality_and_culture",
    content: "Barbarians can be civilized through culture. The distinction between civilized and barbarian is cultural-moral, not ethnic—those who adopt the Way become part of civilization."
  },
  {
    domain: "morality_and_culture",
    content: "Aesthetic judgment and moral judgment are connected. Sensitivity to beauty and ugliness, harmony and discord, develops capacities essential to moral perception."
  },
  {
    domain: "morality_and_culture",
    content: "The arts are not mere entertainment but instruments of cultivation. Poetry, music, and ritual form a unified curriculum for moral development."
  },
  // VARIOUS MORAL RESPONSIBILITIES (10 positions)
  {
    domain: "moral_responsibilities",
    content: "Responsibilities are role-specific and non-transferable. What a son owes differs from what a minister owes—one cannot discharge one obligation by fulfilling another."
  },
  {
    domain: "moral_responsibilities",
    content: "Family obligations are primary and inalienable. Even in cases of apparent conflict, one's duties to parents cannot simply be overridden by public duties."
  },
  {
    domain: "moral_responsibilities",
    content: "The famous 'father-son concealment' case establishes familial priority. A son should not testify against a father who steals a sheep—uprightness lies in protecting family, not in abstract justice."
  },
  {
    domain: "moral_responsibilities",
    content: "Public office creates distinct obligations. Taking office binds one to serve the state; if the state is corrupt and unreformable, one should resign."
  },
  {
    domain: "moral_responsibilities",
    content: "The junzi serves when the Way prevails; he withdraws when it does not. Seeking or retaining office under a corrupt regime is shameful; poverty in an unjust state is honorable."
  },
  {
    domain: "moral_responsibilities",
    content: "Responsibilities to self include moral cultivation. Self-improvement is not selfishness but an obligation—one cannot fulfill responsibilities to others without developing one's own virtue."
  },
  {
    domain: "moral_responsibilities",
    content: "The educated bear responsibility for transmitting culture. Those who have received the legacy of the sages must pass it on; letting it die is a moral failure."
  },
  {
    domain: "moral_responsibilities",
    content: "Wealth and status carry obligations of generosity and example. The wealthy should be generous; those in high position should be models of virtue."
  },
  {
    domain: "moral_responsibilities",
    content: "Age-appropriate expectations govern responsibility. What is expected of youth differs from what is expected of age; Confucius outlined life-stages with distinct duties."
  },
  {
    domain: "moral_responsibilities",
    content: "When obligations conflict, prioritize by relationship and role. The closer relationship generally takes precedence; one should not sacrifice essential obligations for peripheral ones."
  },
  // PERSONAL FULFILLMENT AND MORAL RESPONSIBILITY (10 positions)
  {
    domain: "fulfillment_and_responsibility",
    content: "True fulfillment is found only in virtue. The satisfactions of wealth, status, and sensory pleasure are unstable and shallow compared to the deep contentment of moral cultivation."
  },
  {
    domain: "fulfillment_and_responsibility",
    content: "Yan Hui exemplifies fulfilled poverty. Living in a mean lane with meager food, Yan Hui never lost his joy—demonstrating that fulfillment is independent of material conditions."
  },
  {
    domain: "fulfillment_and_responsibility",
    content: "Learning itself is a source of joy. 'Is it not a pleasure to learn and to practice what one has learned?'—intellectual and moral cultivation are intrinsically satisfying."
  },
  {
    domain: "fulfillment_and_responsibility",
    content: "The junzi is not anxious or fearful. Because he does not act wrongly, he has nothing to regret; inner rectitude produces equanimity."
  },
  {
    domain: "fulfillment_and_responsibility",
    content: "Fulfillment requires meaningful relationships. 'Is it not a joy to have friends come from afar?'—human connection, not isolation, is part of the good life."
  },
  {
    domain: "fulfillment_and_responsibility",
    content: "Recognition is pleasant but not necessary for fulfillment. 'Is it not the mark of a junzi that he is not resentful when others fail to recognize him?'—virtue does not depend on external validation."
  },
  {
    domain: "fulfillment_and_responsibility",
    content: "Purpose and vocation are essential to fulfillment. The junzi has a mission—transmitting the Way—which gives life meaning beyond personal satisfaction."
  },
  {
    domain: "fulfillment_and_responsibility",
    content: "Moral failure produces lasting regret and dissatisfaction. The petty person who gains the world through vice cannot achieve genuine peace of mind."
  },
  {
    domain: "fulfillment_and_responsibility",
    content: "Fulfillment comes through devotion to something beyond self. Self-centered pursuit of happiness defeats itself; fulfillment is a byproduct of commitment to the Way."
  },
  {
    domain: "fulfillment_and_responsibility",
    content: "The stages of life bring different forms of fulfillment. What satisfies at 20 differs from what satisfies at 50—moral development brings increasingly refined and stable contentment."
  },
  // ALIGNMENT OF FULFILLMENT AND VIRTUE (10 positions)
  {
    domain: "fulfillment_and_virtue",
    content: "In the fully cultivated person, desire and duty coincide perfectly. At 70, Confucius could follow his heart's desire without transgressing—this is the goal of cultivation."
  },
  {
    domain: "fulfillment_and_virtue",
    content: "Before full cultivation, tension between desire and duty is normal. The process of moral development involves subordinating personal inclination to moral requirement until they merge."
  },
  {
    domain: "fulfillment_and_virtue",
    content: "The junzi's fulfillment is independent of external success. Confucius himself failed to reform his age but maintained inner equanimity—worldly failure does not undermine moral satisfaction."
  },
  {
    domain: "fulfillment_and_virtue",
    content: "The prosperous wicked are not truly happy. Despite appearances, those who gain through vice are inwardly troubled; their seeming happiness is unstable and false."
  },
  {
    domain: "fulfillment_and_virtue",
    content: "Morality and fulfillment align by nature, not by accident. The Way corresponds to human nature rightly understood; following it fulfills what we truly are."
  },
  {
    domain: "fulfillment_and_virtue",
    content: "Short-term sacrifice may be required; long-term alignment is assured. Moral duty may demand temporary suffering, but the overall trajectory of the moral life is toward joy."
  },
  {
    domain: "fulfillment_and_virtue",
    content: "Heaven's will and human flourishing are aligned. Following the Way is both obedience to Heaven and the path to human fulfillment—these are not competing goals."
  },
  {
    domain: "fulfillment_and_virtue",
    content: "The suffering of the virtuous does not refute the alignment of virtue and fulfillment. External misfortune cannot touch the inner satisfaction of the cultivated person."
  },
  {
    domain: "fulfillment_and_virtue",
    content: "Harmony between fulfillment and duty is achieved through cultivation. The alignment is not automatic but results from the process of moral development."
  },
  {
    domain: "fulfillment_and_virtue",
    content: "Virtue is its own reward, though recognition is welcome. The junzi does not require external validation but is pleased when it comes—inner satisfaction is primary."
  },
  // HOW TO LIVE (PRACTICAL DAILY LIFE) (10 positions)
  {
    domain: "how_to_live",
    content: "The cultivated person rises early and follows a structured day. Proper use of time reflects and cultivates virtue—idleness is morally corrosive."
  },
  {
    domain: "how_to_live",
    content: "Eating should be approached with moderation and propriety. One should not eat to excess, should eat appropriate foods prepared appropriately, and should maintain proper demeanor during meals."
  },
  {
    domain: "how_to_live",
    content: "Dress should be appropriate to occasion and status. Clothing expresses respect for others and for the situation—the junzi dresses neither too meanly nor too extravagantly."
  },
  {
    domain: "how_to_live",
    content: "Study of the classics should occupy significant daily time. The Odes, Documents, Rites, and Music are the curriculum for moral cultivation and deserve sustained attention."
  },
  {
    domain: "how_to_live",
    content: "Physical comportment expresses and shapes inner virtue. How one sits, stands, and walks should manifest gravity, attentiveness, and respect."
  },
  {
    domain: "how_to_live",
    content: "Ritual practice should be woven throughout daily life. From morning ablutions to evening reflections, the rhythm of the day should be structured by proper forms."
  },
  {
    domain: "how_to_live",
    content: "Certain activities are beneath the cultivated person. Gambling, excessive drinking, frivolous entertainment—these waste time and corrupt character."
  },
  {
    domain: "how_to_live",
    content: "Interactions with others should follow proper forms. Greetings, conversation, and departures all have appropriate modes that express and cultivate virtue."
  },
  {
    domain: "how_to_live",
    content: "Rest and recreation have their proper place. The junzi is not grim—music, companionship, and appropriate leisure refresh the spirit without corrupting it."
  },
  {
    domain: "how_to_live",
    content: "Daily self-examination is essential. One should regularly review one's conduct, identify failures, and resolve to improve—this is the engine of cultivation."
  },
  // HOW TO DEVELOP ONE'S ABILITIES (10 positions)
  {
    domain: "developing_abilities",
    content: "The classics should be studied with active reflection. Reading must be combined with thinking—memorization without understanding is useless."
  },
  {
    domain: "developing_abilities",
    content: "Ren is cultivated through practice in relationships. One develops benevolence by acting benevolently toward concrete others, not by abstract meditation."
  },
  {
    domain: "developing_abilities",
    content: "Innate talent matters less than effort and persistence. Some start with more capacity, but anyone who applies himself can achieve genuine cultivation."
  },
  {
    domain: "developing_abilities",
    content: "A good teacher is essential and should be chosen carefully. One should seek teachers of genuine virtue and learning, not mere celebrities or credentialed pretenders."
  },
  {
    domain: "developing_abilities",
    content: "Learning without thinking is useless; thinking without learning is dangerous. Study must be integrated with reflection—neither alone suffices for genuine understanding."
  },
  {
    domain: "developing_abilities",
    content: "Moral perception must be trained through examples. The Odes and the lives of the sages provide models that educate moral judgment through concrete cases."
  },
  {
    domain: "developing_abilities",
    content: "The six arts (ritual, music, archery, charioteering, calligraphy, mathematics) are essential disciplines. Book-learning alone produces stunted development—the whole person must be cultivated."
  },
  {
    domain: "developing_abilities",
    content: "Self-reflection should be practiced three times daily. Examine whether you have been faithful in dealings, trustworthy with friends, and diligent in practice."
  },
  {
    domain: "developing_abilities",
    content: "Cultivation proceeds gradually and cannot be forced. Trying to advance too quickly leads to superficiality—genuine development takes time and patience."
  },
  {
    domain: "developing_abilities",
    content: "Progress is measured by increasing integration of knowledge and action. When you find yourself naturally doing what is right without struggle, you are advancing."
  },
  // HOW TO BE HAPPY (10 positions)
  {
    domain: "how_to_be_happy",
    content: "True joy differs from mere pleasure in its stability and depth. Pleasure depends on external goods and is fleeting; joy arises from virtue and is lasting."
  },
  {
    domain: "how_to_be_happy",
    content: "The junzi is free from anxiety because he has nothing to hide. Inner rectitude produces equanimity—the person of virtue sleeps soundly."
  },
  {
    domain: "how_to_be_happy",
    content: "Three pleasures are beneficial: the pleasure of ritual and music, of praising others' virtues, and of having worthy friends. Three are harmful: arrogance, idle wandering, and feasting."
  },
  {
    domain: "how_to_be_happy",
    content: "Happiness in poverty is possible when one has the Way. Yan Hui with his single bowl of rice and gourd of water was happier than those with wealth but no virtue."
  },
  {
    domain: "how_to_be_happy",
    content: "Friendship is essential to happiness. The company of good friends who share the Way brings joy that solitary virtue cannot provide."
  },
  {
    domain: "how_to_be_happy",
    content: "Happiness is primarily an internal state, not determined by circumstances. External fortune or misfortune touches the surface; inner cultivation determines real happiness."
  },
  {
    domain: "how_to_be_happy",
    content: "One can be happy without achieving one's aims. Confucius never reformed the states but found joy in learning and teaching—success is not required for happiness."
  },
  {
    domain: "how_to_be_happy",
    content: "The petty person is disturbed by things that leave the junzi untroubled. Lack of recognition, modest circumstances, criticism—these agitate the small-minded but not the cultivated."
  },
  {
    domain: "how_to_be_happy",
    content: "Happiness is both a goal and a sign of right living. We should aim at flourishing, and genuine happiness indicates that we are on the right path."
  },
  {
    domain: "how_to_be_happy",
    content: "The love of learning brings deep and lasting joy. Confucius delighted in learning so much that he forgot to eat, forgot his worries, forgot that age was coming on."
  },
  // BEING ONESELF WHILE BEING MORAL (10 positions)
  {
    domain: "being_oneself",
    content: "Morality does not suppress individual nature but fulfills it. One's true nature is oriented toward virtue—cultivation actualizes what we really are."
  },
  {
    domain: "being_oneself",
    content: "Ritual expresses genuine feeling rather than constraining it. When performed with proper inner attitude, li gives form to authentic emotion rather than replacing it with artifice."
  },
  {
    domain: "being_oneself",
    content: "Authenticity and conformity to the Way are not in tension. The Way is not an external imposition but the pattern that genuine human nature follows when fully developed."
  },
  {
    domain: "being_oneself",
    content: "Native temperament can be shaped without being destroyed. Different people have different starting points, but all can be cultivated—the goal is not uniformity."
  },
  {
    domain: "being_oneself",
    content: "At 70 one can follow the heart's desire without transgressing. This is the pinnacle of cultivation—when spontaneous desire and moral requirement become one."
  },
  {
    domain: "being_oneself",
    content: "Genuine selfhood and selfish desire must be distinguished. The self that seeks only private satisfaction is not the true self; authentic selfhood is realized through virtue."
  },
  {
    domain: "being_oneself",
    content: "The goal is to become what one truly is, which includes becoming like the sages. Self-realization and emulation of exemplars are the same process."
  },
  {
    domain: "being_oneself",
    content: "Different people express ren differently according to their natures. The virtue is one, but its manifestation varies with temperament—there are different styles of benevolence."
  },
  {
    domain: "being_oneself",
    content: "Individual judgment has a role, but within the framework of tradition. The cultivated person exercises discernment but does not simply invent morality from scratch."
  },
  {
    domain: "being_oneself",
    content: "The junzi has a distinctive personality while sharing common virtue. Virtue does not erase individuality—different disciples had different characters while all pursuing the Way."
  },
  // WHETHER IMMORALITY CAN BE AUTHENTIC (10 positions)
  {
    domain: "immorality_and_authenticity",
    content: "Immorality is self-betrayal, not self-expression. To act against ren is to violate one's own nature, not to express it."
  },
  {
    domain: "immorality_and_authenticity",
    content: "The petty person (xiaoren) is driven by forces he does not control. Enslaved to appetite, fear, and self-interest, he is not autonomous and therefore not truly himself."
  },
  {
    domain: "immorality_and_authenticity",
    content: "Vice produces inner fragmentation. The wicked person experiences internal conflict, regret, and anxiety that make psychological integration impossible."
  },
  {
    domain: "immorality_and_authenticity",
    content: "Human nature is oriented toward goodness. To reject morality is to reject one's own nature—one cannot be true to what one is while denying what one is."
  },
  {
    domain: "immorality_and_authenticity",
    content: "Self-knowledge and moral knowledge are connected. The person who truly understood himself would understand his moral nature—immorality requires self-deception."
  },
  {
    domain: "immorality_and_authenticity",
    content: "The junzi is at ease; the petty person is always distressed. The wicked lack the inner harmony that constitutes genuine selfhood."
  },
  {
    domain: "immorality_and_authenticity",
    content: "Selfishness defeats the self it serves. The pursuit of private advantage at the expense of morality ultimately frustrates the agent's own deepest interests."
  },
  {
    domain: "immorality_and_authenticity",
    content: "Virtue is the precondition of autonomy. Only the cultivated person acts from his own judgment rather than being pushed by external forces—vice is a form of bondage."
  },
  {
    domain: "immorality_and_authenticity",
    content: "There is no stable self to be true to prior to cultivation. The uncultivated person is a bundle of impulses, not a coherent self; genuine selfhood is an achievement."
  },
  {
    domain: "immorality_and_authenticity",
    content: "Authenticity without morality is incoherent. Since the self is constituted by its relationships and commitments, betraying one's moral nature means there is no self left to be true to."
  },
  // SNAPPY APHORISMS (10 positions)
  {
    domain: "aphorisms",
    content: "The teaching can be summed up: loyalty and reciprocity. 'Is there a single word that can serve as a guide for life? Reciprocity (shu)—do not do to others what you would not want done to yourself.'"
  },
  {
    domain: "aphorisms",
    content: "Learning and thinking are both necessary. 'Learning without thinking is useless; thinking without learning is dangerous.'"
  },
  {
    domain: "aphorisms",
    content: "The junzi and petty person differ in their concerns. 'The junzi understands what is right; the petty person understands what is profitable.'"
  },
  {
    domain: "aphorisms",
    content: "Real knowledge includes knowing the limits of knowledge. 'To know what you know and know what you don't know—that is true knowledge.'"
  },
  {
    domain: "aphorisms",
    content: "Wealth and status are to be evaluated by their source. 'Wealth and rank obtained through immoral means are to me like floating clouds.'"
  },
  {
    domain: "aphorisms",
    content: "Age should bring wisdom and humility. 'At fifteen I set my heart on learning. At thirty I was established. At forty I had no doubts. At fifty I knew the will of Heaven. At sixty my ear was attuned. At seventy I could follow my heart's desire without transgressing.'"
  },
  {
    domain: "aphorisms",
    content: "Words should match actions. 'The junzi is ashamed to let his words outrun his deeds.'"
  },
  {
    domain: "aphorisms",
    content: "Correction should be welcomed. 'If I am told of my faults, I am delighted.'"
  },
  {
    domain: "aphorisms",
    content: "Example is more powerful than command. 'If you lead by regulations and keep order with punishments, the people will evade them and have no shame. If you lead by virtue and keep order through ritual, they will have a sense of shame and correct themselves.'"
  },
  {
    domain: "aphorisms",
    content: "Self-cultivation is the foundation. 'Wishing to govern the state, first regulate the family. Wishing to regulate the family, first cultivate the self.'"
  }
];

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function embedConfuciusPositions() {
  console.log(`Starting to embed ${confuciusPositions.length} Confucius positions...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < confuciusPositions.length; i++) {
    const position = confuciusPositions[i];
    
    try {
      const embedding = await generateEmbedding(position.content);
      
      await db.insert(paperChunks).values({
        figureId: "confucius",
        author: "Confucius",
        paperTitle: `Confucius Position: ${position.domain.replace(/_/g, " ")}`,
        content: position.content,
        embedding: embedding,
        chunkIndex: i,
        domain: position.domain,
        significance: "HIGH",
      });
      
      successCount++;
      
      if ((i + 1) % 10 === 0) {
        console.log(`Progress: ${i + 1}/${confuciusPositions.length} positions embedded`);
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

embedConfuciusPositions()
  .then(() => {
    console.log("Confucius positions embedding finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

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

interface SmithSection {
  title: string;
  sourceWork: string;
  positions: string[];
}

async function embedSmithPositions() {
  console.log("Starting Adam Smith Comprehensive Position Statements embedding...");
  
  const sections: SmithSection[] = [
    {
      title: "Sympathy and Fellow-Feeling",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "Human beings naturally take an interest in the fortunes of others, regardless of any personal advantage derived from their well-being.",
        "Sympathy arises not from direct observation of another's emotions but from imaginatively placing ourselves in their situation.",
        "We cannot directly experience another person's sensations; we can only form a conception of them through imagination.",
        "The pleasure of mutual sympathy—knowing that another shares our feelings—is itself a distinct and significant source of satisfaction.",
        "Sympathy with sorrow is generally stronger and more universal than sympathy with joy.",
        "We more readily sympathize with small joys than with great ones, as excessive fortune provokes envy.",
        "Complete sympathy—perfect correspondence of sentiments—is never actually achieved between persons; approximation is the best we attain.",
        "The source of our sympathy is not the passion we observe in another but the situation that excites that passion.",
        "We sometimes sympathize with emotions a person ought to feel even when they do not actually feel them."
      ]
    },
    {
      title: "The Impartial Spectator",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "Moral judgment operates through an imagined impartial spectator who observes our conduct from a disinterested perspective.",
        "The impartial spectator is an internalized judge, formed through social experience, that enables self-evaluation.",
        "We judge our own conduct by imagining how an informed, fair-minded third party would view it.",
        "Conscience is the voice of the impartial spectator within us, pronouncing judgment on our actions.",
        "The man within the breast—our internal monitor—provides a more reliable moral tribunal than actual spectators.",
        "Actual spectators are often partial, ignorant of circumstances, or swayed by self-interest; the impartial spectator corrects these deficiencies.",
        "Moral self-approval consists in the imagined approbation of the impartial spectator toward our conduct.",
        "The impartial spectator judges not only our actions but also our motives and intentions.",
        "The impartial spectator's judgment sometimes conflicts with popular opinion, and in such cases, the wise person follows the former."
      ]
    },
    {
      title: "Propriety and Merit",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "The propriety of an action consists in the suitability or appropriateness of the affection that prompts it to its exciting cause.",
        "Merit and demerit concern the effects of actions and the gratitude or resentment they naturally provoke.",
        "An action is meritorious when it is the proper object of gratitude; it is demeritorious when it is the proper object of resentment.",
        "Propriety and merit are distinct moral categories: an action may be proper without being meritorious and vice versa.",
        "The sense of propriety derives from sympathy with the agent's motives; the sense of merit derives from sympathy with the recipient's gratitude.",
        "We approve of punishment because we sympathize with the resentment of the injured party.",
        "Just resentment—resentment that the impartial spectator can enter into—is the proper foundation for punishment.",
        "The merit of an action depends partly on the intention behind it, not solely on its consequences.",
        "Accidental harms, though they may produce suffering, do not properly excite resentment because no malevolent intention was present."
      ]
    },
    {
      title: "The Passions",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "The passions originating from the body (hunger, pain, sexual desire) excite little sympathy in spectators because others cannot imaginatively enter into physical states.",
        "Passions arising from imagination (love, ambition, resentment) more readily excite sympathy because spectators can share the mental conception that produces them.",
        "Excessive expression of any passion alienates sympathy; moderation in expression is necessary for fellow-feeling.",
        "The unsocial passions—hatred, resentment, anger—excite a divided sympathy: we partly sympathize with the agent but also with the object of these passions.",
        "The social passions—generosity, humanity, kindness—excite redoubled sympathy: we sympathize both with the agent and with the recipient.",
        "The selfish passions—grief, joy regarding personal fortune—occupy a middle ground, exciting moderate sympathy.",
        "We demand greater moderation in the expression of selfish passions than in the expression of social ones.",
        "Grief, unless moderated, fatigues and disgusts spectators rather than exciting their sympathy.",
        "We admire the person who maintains composure under provocation more than one who gives way to passion."
      ]
    },
    {
      title: "Self-Command and Virtue",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "Self-command—the ability to restrain passion and moderate conduct—is the foundation of all the other virtues.",
        "The virtue of self-command consists in bringing our passions to the level that the impartial spectator can approve.",
        "Different societies cultivate different degrees of self-command, but some measure of it is universally admired.",
        "Savage nations cultivate a severe self-command because their conditions of life require it.",
        "The man of real constancy and firmness maintains equanimity not through insensibility but through self-mastery.",
        "True magnanimity consists not in the absence of passion but in the governance of passion by reason and the impartial spectator.",
        "Prudence, justice, and beneficence are the three principal virtues directing our conduct toward ourselves and others.",
        "Prudence regarding one's own welfare is a respectable virtue, though not the most ennobling one.",
        "The prudent man pursues security and modest prosperity through steady application rather than risky ventures."
      ]
    },
    {
      title: "Justice",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "Justice is a negative virtue: it consists primarily in abstaining from injury to others rather than in positive beneficence.",
        "The rules of justice are the only moral rules that are precise and accurate like rules of grammar.",
        "Justice may be extorted by force; beneficence cannot be.",
        "Society can subsist without beneficence, though in a disagreeable state; it cannot subsist at all without justice.",
        "Justice is the main pillar that upholds the social edifice; if removed, the structure crumbles.",
        "Resentment against injustice is not merely natural but proper and necessary for the maintenance of society.",
        "The rules of justice are not derived from reason or utility alone but from the natural sentiments of resentment and approbation.",
        "We feel guilty for unjust acts even when they benefit us, because the impartial spectator within condemns them.",
        "Commutative justice—abstaining from what belongs to others—is more determinate than distributive justice."
      ]
    },
    {
      title: "Beneficence",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "Beneficence is a positive virtue that cannot be coerced; it must be free to be truly meritorious.",
        "We are more obligated to beneficence toward those close to us: family, friends, countrymen.",
        "The order of beneficence follows natural affection: we owe most to those with whom we are most connected.",
        "Universal benevolence toward all mankind, though noble in conception, is too weak to motivate effective action.",
        "The wise and virtuous person cultivates particular attachments, which are the natural sources of beneficent action.",
        "Beneficence that exceeds what the situation calls for becomes ostentation rather than virtue.",
        "Gratitude for beneficence received is a duty, though not one enforceable by punishment.",
        "Ingratitude is one of the most odious vices because it violates the natural sentiment of return for kindness.",
        "The neglect of beneficence, though not punishable, exposes one to general disapprobation."
      ]
    },
    {
      title: "Fortune and Moral Judgment",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "Our moral judgments are irregularly influenced by the actual consequences of actions, though these consequences are often beyond the agent's control.",
        "We tend to judge unsuccessful good intentions less favorably than successful ones, though the intention was identical.",
        "This irregularity of sentiment—judging by outcome rather than intention—is a deviation from strict propriety but serves a social purpose.",
        "Nature has implanted this tendency to judge by consequences to encourage useful actions and discourage harmful ones.",
        "The person whose good intentions miscarry feels a kind of guilt, though strict justice would not impute any fault.",
        "Moral luck—the influence of fortune on moral judgment—is an imperfection in our nature that we can recognize but not entirely eliminate."
      ]
    },
    {
      title: "Rank, Wealth, and Admiration",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "Mankind naturally admires the rich and powerful and tends to neglect the poor and obscure.",
        "This disposition to admire the wealthy corrupts moral sentiments by conflating external success with virtue.",
        "The great mob of mankind are the admirers of wealth and greatness; philosophers alone consistently distinguish these from wisdom and virtue.",
        "Ambition arises largely from the desire to be observed, attended to, and regarded with admiration.",
        "The poor man's son, whom heaven has cursed with ambition, pursues wealth imagining it will bring happiness, but discovers this is an illusion.",
        "Yet this deception—the overestimation of the pleasures of wealth—is useful, as it spurs industry and progress.",
        "Two paths to admiration exist: the acquisition of wealth and greatness, or the attainment of wisdom and virtue.",
        "The path of virtue is more secure and stable; the path of wealth is more dazzling but precarious.",
        "True dignity consists not in external rank but in the propriety of conduct that merits the impartial spectator's approval."
      ]
    },
    {
      title: "Moral Rules and Systems",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "General moral rules are formed by induction from particular judgments of the impartial spectator.",
        "These rules serve as standards when passion might cloud particular judgments.",
        "Reverence for general moral rules is what we call a sense of duty.",
        "Acting from a sense of duty—from respect for the general rule—is morally praiseworthy even when not prompted by immediate sympathy.",
        "Moral systems that derive all virtue from self-love are fundamentally mistaken; sympathy is irreducible.",
        "Moral systems that reduce all virtue to propriety (the Stoics) neglect the distinct phenomenon of merit.",
        "Moral systems that reduce virtue to benevolence alone neglect the special status of justice.",
        "The casuists erred in trying to specify rules for every conceivable case; moral judgment requires contextual discernment.",
        "The sentiment of moral approbation is immediate and original; it is not reducible to calculations of interest or advantage."
      ]
    },
    {
      title: "Love of Praise vs. Praiseworthiness",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "The desire to be praised and the desire to be praiseworthy are distinct sentiments that often conflict.",
        "The love of praiseworthiness—the desire to deserve approval—is the nobler sentiment and the foundation of genuine virtue.",
        "The mere love of praise, without concern for deserving it, produces vanity and sycophancy.",
        "We desire not only to be approved of but to be worthy of approval; the former without the latter brings no solid satisfaction.",
        "Self-approbation—the approval of one's own conscience—is essential for happiness; external praise cannot substitute for it.",
        "When external praise contradicts the verdict of the impartial spectator, the wise person trusts the internal judge.",
        "The man who seeks only praise becomes a servile flatterer of the opinions of others.",
        "The man who seeks praiseworthiness remains independent, guided by principle rather than popularity."
      ]
    },
    {
      title: "Custom and Fashion",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "Custom and fashion exert enormous influence over moral sentiments, often overriding natural judgment.",
        "Different nations approve of different degrees of emotional expression because custom has habituated them differently.",
        "What appears proper in one society may seem excessive or deficient in another due solely to habitual expectation.",
        "Custom can sanctify practices that natural sentiment would otherwise condemn, such as infanticide in ancient societies.",
        "Fashion extends the influence of the great beyond their proper sphere, making their tastes and manners objects of imitation.",
        "Custom can never entirely pervert moral judgment; some practices remain condemned despite long custom.",
        "Fashion in morals is more dangerous than fashion in dress, as it corrupts fundamental judgments of propriety.",
        "Philosophers must distinguish between what is naturally proper and what appears proper merely through custom."
      ]
    },
    {
      title: "Self-Deception and Moral Psychology",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "Self-deceit is the fatal weakness from which half of human disorders arise.",
        "We naturally view our own conduct through a flattering lens that obscures our faults.",
        "The impartial spectator is difficult to consult honestly because self-love distorts our self-perception.",
        "We rarely examine our own conduct with the same severity we apply to the conduct of others.",
        "Distance in time aids moral self-examination: we judge our past selves more impartially than our present selves.",
        "Self-approbation, when based on self-deceit, provides only an unstable and counterfeit satisfaction.",
        "The wise person cultivates habits of honest self-examination to counteract the natural tendency to self-flattery.",
        "True virtue requires the painful discipline of seeing ourselves as others see us."
      ]
    },
    {
      title: "Resentment, Revenge, and Punishment",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "Resentment is the great safeguard of justice, prompting resistance to injury.",
        "Nature has implanted resentment to protect individuals from violation, but it requires restraint to be properly exercised.",
        "Ungoverned resentment is the most odious of all the passions; it must be disciplined by the impartial spectator.",
        "We sympathize with resentment only when it is moderated and directed at genuinely culpable offenses.",
        "The desire for revenge must be distinguished from just indignation; the former seeks pain, the latter seeks justice.",
        "Punishment should be proportioned not to the harm done but to the resentment an impartial spectator would feel.",
        "Capital punishment for minor offenses corrupts moral sentiment by habituating society to disproportionate severity.",
        "Private revenge undermines social order; proper resentment channels itself through public institutions."
      ]
    },
    {
      title: "Shame, Guilt, and Remorse",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "Shame is the pain of being disapproved of by others; guilt is the pain of disapproving of oneself.",
        "Remorse is the most dreadful of sentiments—the anguish of the impartial spectator condemning one's own conduct.",
        "The man who has violated justice carries an internal torturer that poisons every pleasure.",
        "Shame without guilt—distress at unmerited reproach—is painful but does not wound the conscience.",
        "Guilt without shame—when vice escapes detection—still torments through the impartial spectator's condemnation.",
        "Confession of wrongdoing, though painful, brings relief by aligning external judgment with internal condemnation.",
        "Remorse seeks atonement; it naturally prompts reparation and reformation of conduct."
      ]
    },
    {
      title: "The Stoic Philosophy",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "The Stoics correctly identified the importance of self-command as central to virtue.",
        "The Stoic doctrine that the wise man is happy even under torture is extravagant but contains a kernel of truth.",
        "Stoic apathy—complete extirpation of passion—is neither possible nor desirable; moderation, not elimination, is the goal.",
        "The Stoics erred in treating all failures of virtue as equally culpable; there are degrees of vice.",
        "The Stoic system rightly emphasizes that external goods cannot guarantee happiness.",
        "The Stoic conception of living according to nature is valuable if properly understood.",
        "The Stoic insistence on the unity of virtue is too rigid; the virtues are distinct, though related.",
        "Stoic resignation in the face of fortune is admirable, but their indifference to natural goods is excessive."
      ]
    },
    {
      title: "Other Philosophical Systems",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "Plato correctly identified the tripartite nature of the soul: reason, spirit, and appetite.",
        "Aristotle rightly placed virtue in a mean between excess and deficiency.",
        "Epicurus erred in reducing all motivation to pleasure and pain, overlooking sympathy's independent role.",
        "Mandeville's system—reducing all virtue to disguised self-love—is fundamentally mistaken and morally pernicious.",
        "Hutcheson correctly identified a moral sense but erred in making benevolence the sole virtue.",
        "Systems that ground morality entirely in reason neglect the essential role of sentiment.",
        "Systems that ground morality entirely in sentiment neglect reason's role in formulating general rules.",
        "The selfish systems (Hobbes, Mandeville) cannot explain the reality of genuine sympathy and disinterested approbation.",
        "Casuistry failed because it sought mathematical precision in a domain requiring judgment."
      ]
    },
    {
      title: "The Amiable and Respectable Virtues",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "The amiable virtues—humanity, compassion, gentleness—consist in the exquisite sensibility of the agent.",
        "The respectable virtues—self-command, fortitude, magnanimity—consist in the subjection of passion to propriety.",
        "The amiable virtues prompt us to enter into the feelings of others with tenderness.",
        "The respectable virtues prompt us to moderate our own feelings to what others can enter into.",
        "Complete virtue requires both sensibility (to feel for others) and self-command (to govern oneself).",
        "The amiable virtues are more engaging; the respectable virtues are more commanding.",
        "The soft virtues without self-command become weakness; the hard virtues without sensibility become harshness.",
        "The person of perfect virtue balances tenderness with firmness, sympathy with self-government."
      ]
    },
    {
      title: "The Social Origins of Morality",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "Morality is inconceivable outside society; the isolated individual could form no moral judgments.",
        "The impartial spectator is an internalized social perspective, not an innate faculty.",
        "We learn to judge ourselves by first judging others and then applying that standard reflexively.",
        "The child develops conscience through repeated experience of others' approval and disapproval.",
        "Moral concepts are social creations, formed through the commerce of sentiments in society.",
        "The looking-glass of society shows us our own character; without it, we could not see ourselves.",
        "Different social conditions produce different emphases in moral development, though core principles remain constant.",
        "Commercial society cultivates certain virtues (honesty, punctuality) while potentially weakening others (martial courage)."
      ]
    },
    {
      title: "The Invisible Hand and Social Harmony",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "Nature appears to have constituted things to promote the happiness of mankind in general.",
        "The invisible hand coordinates individual self-interest toward collective welfare without conscious design.",
        "The distribution of the means of happiness is more equal than the distribution of wealth suggests.",
        "The rich, despite their selfishness, are led to distribute necessities through employing the poor.",
        "The deception of imagination—making us overvalue wealth—serves nature's purpose of motivating industry.",
        "Every individual, pursuing his own interest, frequently promotes the interest of society more effectually than when intending to promote it.",
        "The wisdom of nature appears in the adaptation of sentiments to their proper purposes.",
        "The final cause of moral sentiments is the preservation and welfare of the species."
      ]
    },
    {
      title: "The Corruption of Moral Sentiments",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "The disposition to admire the rich and neglect the poor is the chief cause of moral corruption.",
        "The conflation of wealth with wisdom and virtue perverts the natural order of moral approbation.",
        "Courts and palaces are the worst schools of morality; cottages are often better.",
        "The great are surrounded by flatterers who confirm their self-deception.",
        "Success in the world requires not virtue but the appearance of virtue—a dangerous substitution.",
        "Fashion can make vice fashionable and virtue appear unfashionable, corrupting youth.",
        "Ambition, unchecked by conscience, produces crimes that merely selfish motives would never prompt.",
        "The corruption of moral sentiments is most dangerous when it is systematic and socially sanctioned.",
        "Only the wise and virtuous resist the corruption that pervades the moral sentiments of the vulgar."
      ]
    },
    {
      title: "Conscience and Moral Authority",
      sourceWork: "Theory of Moral Sentiments",
      positions: [
        "Conscience speaks with an authority that no earthly tribunal possesses.",
        "The judgment of conscience, when uncorrupted, is infallible in its own sphere.",
        "We may silence conscience by distraction, but we cannot ultimately convince it against its verdict.",
        "The man at ease with his conscience enjoys a tranquility no external success can provide.",
        "Conscience connects the individual to a moral order transcending his particular interests.",
        "The verdicts of conscience feel categorical—absolutely binding, not merely advisable.",
        "Conscience punishes and rewards immediately, without waiting for external consequences.",
        "The authority of conscience derives from the impartial spectator within, not from fear of punishment.",
        "To violate conscience for any worldly advantage is to sell one's soul."
      ]
    },
    {
      title: "Division of Labor and Productivity",
      sourceWork: "Wealth of Nations",
      positions: [
        "The division of labor is the principal cause of improvement in the productive powers of labor.",
        "The extent of the division of labor is limited by the extent of the market.",
        "Human beings have a natural propensity to truck, barter, and exchange one thing for another.",
        "A pin factory exemplifies how subdivision of labor multiplies output beyond what separated workmen could achieve.",
        "The division of labor occasions invention of machines by focusing workers' attention on single operations.",
        "The certainty of being able to exchange surplus produce encourages every man to apply himself to a particular occupation.",
        "Water carriage opens wider markets than land carriage and thereby extends the division of labor.",
        "The first civilizations arose along seacoasts and navigable rivers where markets were naturally extensive."
      ]
    },
    {
      title: "Value, Price, and Exchange",
      sourceWork: "Wealth of Nations",
      positions: [
        "It is not from the benevolence of the butcher, brewer, or baker that we expect our dinner, but from their regard to their own interest.",
        "The real price of everything is the toil and trouble of acquiring it.",
        "Labor is the original measure of the exchangeable value of all commodities.",
        "The word 'value' has two meanings: utility (value in use) and purchasing power (value in exchange).",
        "Diamonds have great value in exchange but little value in use; water the reverse.",
        "Labor is the only universal and accurate measure of value, being the real price; money is the nominal price.",
        "The component parts of price are wages, profit, and rent—each varying independently.",
        "The natural price is the central price toward which the market price gravitates."
      ]
    },
    {
      title: "Wages, Profit, and Rent",
      sourceWork: "Wealth of Nations",
      positions: [
        "The liberal reward of labor encourages population and increases the industry of the common people.",
        "In an advancing society, wages rise because the demand for labor increases faster than the supply.",
        "The ordinary rate of profit depends on the general circumstances of the society—its riches, poverty, or progress.",
        "Interest rates may serve as an index of profit rates—high interest signals high profits.",
        "Rent enters into price in a different manner than wages and profit—it is effect, not cause.",
        "High or low wages and profit are causes of high or low price; high or low rent is the effect.",
        "Land used for human food always yields rent; land for other purposes may or may not.",
        "Rent rises with population because demand for food increases while fertile land is limited."
      ]
    },
    {
      title: "Capital and Accumulation",
      sourceWork: "Wealth of Nations",
      positions: [
        "Wealth consists not in money but in what money purchases—the consumable goods that constitute real revenue.",
        "The gross revenue of society is the whole annual produce; the net revenue is what remains after maintaining capital.",
        "Fixed capital yields revenue only by circulating; a machine produces nothing without materials and workers.",
        "Paper money substitutes for gold and silver, releasing precious metals for other uses.",
        "Productive labor adds value to materials; unproductive labor, however useful, adds nothing.",
        "The labor of a manufacturer fixes itself in a vendible commodity; that of a menial servant perishes instantly.",
        "What is annually saved is immediately employed as capital and consumed by productive workers.",
        "Every prodigal is a public enemy; every frugal man a public benefactor."
      ]
    },
    {
      title: "Free Trade and Natural Liberty",
      sourceWork: "Wealth of Nations",
      positions: [
        "Every individual, intending only his own gain, is led by an invisible hand to promote an end which was no part of his intention.",
        "The natural advantages one country has over another are sometimes so great that competition is vain.",
        "If foreign goods can be bought cheaper than made at home, it is better to buy them.",
        "The maxim true for every private family cannot be folly for a great kingdom.",
        "To give monopoly of the home market to domestic industry is to direct private industry in a manner useless or hurtful.",
        "The industry of society can only increase as capital increases; regulation cannot multiply capital.",
        "Consumption is the sole end and purpose of all production; the interest of the producer should be attended to only so far as necessary for promoting that of the consumer.",
        "The study of his own advantage naturally leads individuals to prefer employments most advantageous to society."
      ]
    },
    {
      title: "Critique of Mercantilism",
      sourceWork: "Wealth of Nations",
      positions: [
        "The mercantile system sacrifices consumers to producers, treating consumption as the means and production as the end.",
        "Every extraordinary encouragement to exportation is really a tax upon the people.",
        "The monopolizing spirit of merchants and manufacturers neither is nor ought to be the rulers of mankind.",
        "Monopolies of colonial trade have loaded the revenue with expense while benefiting only particular orders.",
        "The clamor of merchants and manufacturers should not mislead legislators into believing that private interest equals public interest.",
        "The sneaking arts of underling tradesmen are erected into political maxims by great manufacturing nations.",
        "Treaties of commerce are advantageous only to merchants seeking monopoly against consumers.",
        "The corn laws serve landowners at the expense of all other orders of citizens."
      ]
    },
    {
      title: "Government and Public Finance",
      sourceWork: "Wealth of Nations",
      positions: [
        "Civil government is instituted for the defense of property—of the rich against the poor.",
        "The three duties of the sovereign are defense, justice, and public works that individuals cannot profitably maintain.",
        "Public works should be financed by those who benefit—tolls for roads, harbor dues for ports.",
        "Taxes should be proportionate, certain, convenient, and economical to collect.",
        "Public debts have ruined every state that has contracted them extensively.",
        "National bankruptcy through currency debasement or open default is the likely end of extensive debt.",
        "Science is the great antidote to the poison of enthusiasm and superstition.",
        "No society can flourish while the greater part of its members are poor and miserable.",
        "Commerce and manufactures gradually introduce order, good government, and individual liberty."
      ]
    },
    {
      title: "Progress and Natural Effort",
      sourceWork: "Wealth of Nations",
      positions: [
        "The natural effort of every individual to better his own condition is so powerful that alone it can carry society to wealth and prosperity despite obstruction by law.",
        "Little else is requisite to carry a state to the highest degree of opulence but peace, easy taxes, and a tolerable administration of justice.",
        "The natural course of things—first agriculture, then manufactures, then foreign commerce—has been inverted in modern Europe.",
        "Every improvement in the productive powers of labor depends first on the skill, dexterity, and judgment of workers.",
        "The uniform, constant, and uninterrupted effort of every man to better his condition is the principle from which public and private opulence derives.",
        "Agriculture flourishes best under a system of natural liberty, without bounties, prohibitions, or preferences.",
        "Gradual, not sudden, restoration of free trade minimizes disruption to established industries.",
        "Wherever there is great property, there is great inequality; the affluence of the few supposes the indigence of the many."
      ]
    }
  ];
  
  let totalEmbedded = 0;
  
  for (let sectionIdx = 0; sectionIdx < sections.length; sectionIdx++) {
    const section = sections[sectionIdx];
    console.log(`\nProcessing section: ${section.title} (${section.sourceWork})`);
    
    for (let i = 0; i < section.positions.length; i++) {
      const position = section.positions[i];
      const displayTitle = `Smith - ${section.title} (${section.sourceWork})`;
      
      try {
        const embedding = await getEmbedding(position);
        
        await db.insert(paperChunks).values({
          author: "Adam Smith",
          figureId: "smith",
          paperTitle: displayTitle,
          content: position,
          embedding: embedding,
          chunkIndex: sectionIdx * 100 + i,
        });
        
        console.log(`Embedded position ${totalEmbedded + 1}: ${position.substring(0, 60)}...`);
        totalEmbedded++;
        
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error embedding position in ${section.title}:`, error);
      }
    }
  }
  
  console.log(`\n=== Completed: ${totalEmbedded} Adam Smith position statements embedded ===`);
}

embedSmithPositions()
  .then(() => {
    console.log("Adam Smith embedding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during embedding:", error);
    process.exit(1);
  });

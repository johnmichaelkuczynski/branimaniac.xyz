import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "../../shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const adamSmithPositions = [
  // SYMPATHY AND FELLOW-FEELING (10 positions)
  {
    domain: "sympathy",
    content: "Sympathy is the foundation of moral life. By imaginatively placing ourselves in another's situation, we come to share their sentiments and judge their conduct."
  },
  {
    domain: "sympathy",
    content: "We sympathize not by directly feeling what another feels, but by imagining how we ourselves would feel in their circumstances."
  },
  {
    domain: "sympathy",
    content: "The pleasure of mutual sympathy—finding that another shares our feelings—is one of the deepest sources of human satisfaction."
  },
  {
    domain: "sympathy",
    content: "We sympathize more readily with joy than with sorrow, for sorrow is painful even in imagination. This explains why the fortunate are envied and the unfortunate often neglected."
  },
  {
    domain: "sympathy",
    content: "Perfect sympathy is impossible; we can never fully enter another's feelings. But our imaginative attempt to do so is the basis of all moral judgment."
  },
  {
    domain: "sympathy",
    content: "We respond not merely to the emotion a person expresses but to the situation that produces it. We can sympathize with feelings a person ought to have but does not display."
  },
  {
    domain: "sympathy",
    content: "The desire for sympathy from others is one of our strongest motivations. We moderate our emotions to bring them within the range of what spectators can share."
  },
  {
    domain: "sympathy",
    content: "We derive no satisfaction from sympathy we do not deserve. The approval of others means nothing if we cannot approve ourselves."
  },
  {
    domain: "sympathy",
    content: "Sympathy operates through the imagination, not through any special moral sense. We understand others by mentally simulating their circumstances."
  },
  {
    domain: "sympathy",
    content: "The unsocial passions—hatred, resentment, anger—are harder to sympathize with than the social passions of generosity and benevolence."
  },
  // THE IMPARTIAL SPECTATOR (10 positions)
  {
    domain: "impartial_spectator",
    content: "The impartial spectator is an imagined observer who views our conduct with perfect fairness, untainted by self-interest or particular affection."
  },
  {
    domain: "impartial_spectator",
    content: "Conscience is the impartial spectator internalized—'the man within the breast' who judges our conduct as an unbiased observer would."
  },
  {
    domain: "impartial_spectator",
    content: "We cannot judge our own conduct except by removing ourselves from our own point of view and adopting the perspective of an impartial spectator."
  },
  {
    domain: "impartial_spectator",
    content: "The actual spectators around us are partial and misinformed. We must appeal beyond them to an ideal spectator who knows all circumstances."
  },
  {
    domain: "impartial_spectator",
    content: "Self-approbation—the approval of the impartial spectator within—is more important than external praise. We want to be worthy of approval, not merely approved."
  },
  {
    domain: "impartial_spectator",
    content: "When popular opinion conflicts with conscience, the wise person trusts the internal judge. The mob may err; the impartial spectator, properly consulted, does not."
  },
  {
    domain: "impartial_spectator",
    content: "The impartial spectator judges both intentions and outcomes, but gives primary weight to the propriety of the motive."
  },
  {
    domain: "impartial_spectator",
    content: "We develop the impartial spectator through social experience. By judging others, we learn to apply those judgments reflexively to ourselves."
  },
  {
    domain: "impartial_spectator",
    content: "The voice of conscience can be silenced by passion or self-interest, but it cannot be permanently extinguished. Even the hardened villain cannot fully escape it."
  },
  {
    domain: "impartial_spectator",
    content: "The impartial spectator is not a divine voice but an internalized social perspective—the judgment of mankind distilled and purified of bias."
  },
  // PROPRIETY AND MERIT (10 positions)
  {
    domain: "propriety_and_merit",
    content: "Propriety consists in the suitableness of an emotion to its cause. An action is proper when its motivating sentiment is one we can sympathize with."
  },
  {
    domain: "propriety_and_merit",
    content: "Merit is distinct from propriety. Propriety concerns the fitness of the motive; merit concerns whether the action deserves reward or punishment."
  },
  {
    domain: "propriety_and_merit",
    content: "An action is meritorious when an impartial spectator would heartily sympathize with the gratitude of the person benefited."
  },
  {
    domain: "propriety_and_merit",
    content: "An action deserves punishment when an impartial spectator would sympathize with the resentment of the person injured."
  },
  {
    domain: "propriety_and_merit",
    content: "Something can be proper without being praiseworthy. Merely doing one's duty earns no special credit; merit requires going beyond what is required."
  },
  {
    domain: "propriety_and_merit",
    content: "Resentment is the sentiment that demands punishment for wrong. Punishment is not administered for utility alone but because wrongdoing naturally provokes indignation."
  },
  {
    domain: "propriety_and_merit",
    content: "We sympathize with just resentment—anger at a genuine wrong proportioned to the offense. But we recoil from excessive or misdirected rage."
  },
  {
    domain: "propriety_and_merit",
    content: "Intentions matter enormously in moral judgment. A man who kills another accidentally is judged differently from one who kills deliberately."
  },
  {
    domain: "propriety_and_merit",
    content: "Yet outcomes also affect our judgment irrationally. We blame the reckless driver who kills more than one whose identical recklessness harms no one."
  },
  {
    domain: "propriety_and_merit",
    content: "The distinction between propriety and merit explains why we can disapprove of someone's motive while still thinking they deserve reward for the result."
  },
  // THE PASSIONS (10 positions)
  {
    domain: "passions",
    content: "We sympathize less with bodily suffering than with mental suffering. Physical pain is hard to imagine; emotional distress is easier to enter into imaginatively."
  },
  {
    domain: "passions",
    content: "Excessive expression of any passion diminishes our sympathy. The sufferer must moderate their emotion to the pitch a spectator can share."
  },
  {
    domain: "passions",
    content: "The unsocial passions—anger, hatred, resentment—are naturally disagreeable. We instinctively sympathize with the object of these passions rather than with the person expressing them."
  },
  {
    domain: "passions",
    content: "The social passions—generosity, humanity, kindness—are naturally agreeable. We sympathize both with the person expressing them and with the object of their benevolence."
  },
  {
    domain: "passions",
    content: "The selfish passions—personal grief and joy—occupy a middle place. We can sympathize with them if they are not expressed too violently."
  },
  {
    domain: "passions",
    content: "We expect people to moderate their selfish emotions more than their generous ones. Excessive grief for oneself is less excusable than excessive grief for another."
  },
  {
    domain: "passions",
    content: "The passion that requires most restraint is resentment. Nothing is more odious than uncontrolled anger; nothing more admirable than justified indignation kept within bounds."
  },
  {
    domain: "passions",
    content: "We admire the person who stays calm under provocation because such self-command is difficult and rare. Self-control earns our respect precisely because it is hard."
  },
  {
    domain: "passions",
    content: "Love and friendship are passions that allow more expression than others. We can sympathize with strong affection more readily than with strong self-regard."
  },
  {
    domain: "passions",
    content: "Fear of death is a natural passion serving self-preservation. But excessive fear is contemptible; moderate fear, properly controlled, is not."
  },
  // SELF-COMMAND AND VIRTUE (10 positions)
  {
    domain: "self_command",
    content: "Self-command is the foundation of all virtue. Without the ability to restrain our passions, no other virtue is possible."
  },
  {
    domain: "self_command",
    content: "Self-command consists not in not feeling passions but in governing them—bringing them under the authority of the impartial spectator."
  },
  {
    domain: "self_command",
    content: "Different societies value self-command differently. Savage nations admire stoic endurance of pain; commercial nations cultivate control of avarice and ambition."
  },
  {
    domain: "self_command",
    content: "Less civilized peoples often show greater fortitude under physical hardship because their situation demands it. Necessity is the mother of self-command."
  },
  {
    domain: "self_command",
    content: "Civilized commercial society cultivates a different self-command: the discipline of deferred gratification, punctuality, and reliability in contracts."
  },
  {
    domain: "self_command",
    content: "True magnanimity is self-command under the greatest provocations—maintaining equanimity when most tempted to passion."
  },
  {
    domain: "self_command",
    content: "The principal virtues are prudence, justice, and beneficence, all of which require self-command for their exercise."
  },
  {
    domain: "self_command",
    content: "Prudence—the care of one's own health, fortune, and reputation—is a genuine virtue, not mere selfishness, when exercised with propriety."
  },
  {
    domain: "self_command",
    content: "The prudent man is sincere, not ostentatiously honest. He avoids unnecessary risks but does not shrink from necessary ones."
  },
  {
    domain: "self_command",
    content: "The amiable virtues require sensibility; the respectable virtues require self-command. Complete virtue unites both."
  },
  // JUSTICE (10 positions)
  {
    domain: "justice",
    content: "Justice is primarily a negative virtue—it consists in abstaining from injury rather than in doing positive good."
  },
  {
    domain: "justice",
    content: "The rules of justice are precise and admit of no exceptions. We know exactly what justice forbids, though what beneficence requires is less determinate."
  },
  {
    domain: "justice",
    content: "Justice can be enforced by external coercion; beneficence cannot. We may force someone to pay a debt but not to be generous."
  },
  {
    domain: "justice",
    content: "Society can survive without beneficence, though uncomfortably. Without justice, society would crumble entirely. Justice is the main pillar of the edifice."
  },
  {
    domain: "justice",
    content: "Resentment against injustice is proper and serves the defense of the innocent. Nature has armed us with indignation to protect our rights."
  },
  {
    domain: "justice",
    content: "Punishment does not require positive benevolence toward society. It is enough that the criminal's action provokes resentment that an impartial spectator would approve."
  },
  {
    domain: "justice",
    content: "The sense of justice arises from sympathy with the resentment of the injured party, not from cold calculation of utility."
  },
  {
    domain: "justice",
    content: "We feel guilty for unjust acts even when they benefit us because the impartial spectator within condemns the violation."
  },
  {
    domain: "justice",
    content: "Commutative justice—the obligation not to harm—is more fundamental than distributive justice. It is the foundation of property and contract."
  },
  {
    domain: "justice",
    content: "Justice is owed to all equally, regardless of rank or relation. Unlike beneficence, it does not admit of degrees of obligation."
  },
  // BENEFICENCE (10 positions)
  {
    domain: "beneficence",
    content: "Beneficence cannot be compelled; it must be freely given. Forced generosity is no generosity at all."
  },
  {
    domain: "beneficence",
    content: "We owe more to those closer to us. Benevolence naturally flows first to family, then friends, then countrymen, then humanity at large."
  },
  {
    domain: "beneficence",
    content: "The order of benevolence follows the natural gradation of affection. To love all humanity equally is to love none effectively."
  },
  {
    domain: "beneficence",
    content: "Universal benevolence toward all humanity is too diffuse to motivate action. Particular attachments are the proper source of beneficent action."
  },
  {
    domain: "beneficence",
    content: "A virtuous person cultivates particular attachments rather than professing abstract love for humanity."
  },
  {
    domain: "beneficence",
    content: "Generosity can be excessive when it neglects nearer obligations for more distant ones or when it exceeds the giver's means."
  },
  {
    domain: "beneficence",
    content: "We admire most those acts of generosity that spring from spontaneous feeling, not from calculation of advantage."
  },
  {
    domain: "beneficence",
    content: "Gratitude is a duty. To receive benefits and feel no obligation to return them is a kind of robbery."
  },
  {
    domain: "beneficence",
    content: "Ingratitude is one of the most detestable vices because it violates the natural sentiment that benefits deserve returns."
  },
  {
    domain: "beneficence",
    content: "The mere failure to do good is not punishable, unlike the violation of justice. We are not entitled to force beneficence."
  },
  // FORTUNE AND MORAL JUDGMENT (10 positions)
  {
    domain: "fortune",
    content: "Consequences affect our moral judgments even though they should not. We blame the reckless driver who kills more than one whose recklessness harms no one."
  },
  {
    domain: "fortune",
    content: "We judge failed good intentions more harshly than we should. The general who loses through bad luck is blamed; the victorious bungler is praised."
  },
  {
    domain: "fortune",
    content: "Judging by outcomes rather than intentions is an irregularity of sentiment, but perhaps a useful one. It encourages caution."
  },
  {
    domain: "fortune",
    content: "This tendency to judge by outcomes serves nature's purposes: it makes us more careful about the consequences of our actions."
  },
  {
    domain: "fortune",
    content: "A person should feel some distress for harm they never intended because action always involves responsibility for its effects."
  },
  {
    domain: "fortune",
    content: "The person whose reckless action accidentally helps does not deserve the same credit as one whose careful action produces the same result."
  },
  {
    domain: "fortune",
    content: "Rituals of expiation for unintentional harm—like the ancient practice of sanctuary—acknowledge the moral weight of consequence."
  },
  {
    domain: "fortune",
    content: "We can never fully overcome the influence of luck on our moral judgments. This is a permanent feature of human psychology."
  },
  {
    domain: "fortune",
    content: "The impartial spectator, properly consulted, gives primary weight to intention. But even the impartial spectator is not immune to the influence of outcome."
  },
  {
    domain: "fortune",
    content: "Moral luck is real: character is partly a matter of fortune, and so is the occasion to display virtue or fall into vice."
  },
  // RANK, WEALTH, AND ADMIRATION (10 positions)
  {
    domain: "wealth_and_admiration",
    content: "People naturally admire the rich and powerful, and this admiration is the great cause of the corruption of moral sentiments."
  },
  {
    domain: "wealth_and_admiration",
    content: "We tend to sympathize with the joys of the great rather than the sorrows of the poor. This is the origin of many social evils."
  },
  {
    domain: "wealth_and_admiration",
    content: "Only the wise and virtuous consistently distinguish wealth from virtue. The common run of mankind confuse them."
  },
  {
    domain: "wealth_and_admiration",
    content: "What drives human ambition is the desire for the sympathetic attention of others, which wealth and rank command."
  },
  {
    domain: "wealth_and_admiration",
    content: "The pursuit of wealth rarely brings the happiness it promises. Tranquility and enjoyment are as available to the poor as to the rich."
  },
  {
    domain: "wealth_and_admiration",
    content: "Yet the illusion that wealth brings happiness is useful: it spurs industry and improvement, benefiting society through unintended consequences."
  },
  {
    domain: "wealth_and_admiration",
    content: "The order of society depends in part on our disposition to admire the great. Rank and distinction have their uses, even if they are partly founded on illusion."
  },
  {
    domain: "wealth_and_admiration",
    content: "There are two paths to admiration: the path of virtue and the path of wealth. The former is harder; the latter is more commonly sought."
  },
  {
    domain: "wealth_and_admiration",
    content: "The admiration founded on virtue is more secure than that founded on fortune. Wealth can be lost; character endures."
  },
  {
    domain: "wealth_and_admiration",
    content: "True dignity consists in the sentiment of our own merit, not in the trappings of rank or the opinion of the vulgar."
  },
  // CUSTOM AND FASHION (10 positions)
  {
    domain: "custom_and_fashion",
    content: "Custom and fashion exert enormous influence over moral sentiments, often overriding what natural judgment would dictate."
  },
  {
    domain: "custom_and_fashion",
    content: "Different nations approve of different degrees of emotional expression because custom has habituated them differently."
  },
  {
    domain: "custom_and_fashion",
    content: "What appears proper in one society may seem excessive or deficient in another due solely to habitual expectation."
  },
  {
    domain: "custom_and_fashion",
    content: "Custom can sanctify practices that natural sentiment would condemn—such as infanticide in some ancient societies."
  },
  {
    domain: "custom_and_fashion",
    content: "Fashion extends the influence of the great beyond their proper sphere, making their tastes and manners objects of imitation."
  },
  {
    domain: "custom_and_fashion",
    content: "Yet custom can never entirely pervert moral judgment. Some practices remain condemned despite long custom."
  },
  {
    domain: "custom_and_fashion",
    content: "The variation in moral codes across societies does not imply moral relativism. There is a natural propriety that custom can obscure but not abolish."
  },
  {
    domain: "custom_and_fashion",
    content: "Fashion in morals is more dangerous than fashion in dress because it corrupts fundamental judgments of propriety."
  },
  {
    domain: "custom_and_fashion",
    content: "Philosophers must distinguish between what is naturally proper and what appears proper merely through custom."
  },
  {
    domain: "custom_and_fashion",
    content: "The influence of custom explains much moral variation without requiring us to abandon universal standards of judgment."
  },
  // SELF-DECEPTION (10 positions)
  {
    domain: "self_deception",
    content: "Self-deceit is the fatal weakness from which half of human disorders arise. We naturally view our own conduct through a flattering lens."
  },
  {
    domain: "self_deception",
    content: "The impartial spectator is difficult to consult honestly because self-love distorts our self-perception."
  },
  {
    domain: "self_deception",
    content: "We rarely examine our own conduct with the same severity we apply to the conduct of others."
  },
  {
    domain: "self_deception",
    content: "Distance in time aids moral self-examination. We judge our past selves more impartially than our present selves."
  },
  {
    domain: "self_deception",
    content: "The eye sees everything but itself. We observe others' failings while remaining blind to our own."
  },
  {
    domain: "self_deception",
    content: "Self-approbation based on self-deceit provides only an unstable and counterfeit satisfaction."
  },
  {
    domain: "self_deception",
    content: "The wise person cultivates habits of honest self-examination to counteract the natural tendency to self-flattery."
  },
  {
    domain: "self_deception",
    content: "We construct narratives that cast ourselves as protagonists and overlook evidence that contradicts this image."
  },
  {
    domain: "self_deception",
    content: "True virtue requires the painful discipline of seeing ourselves as others see us."
  },
  {
    domain: "self_deception",
    content: "The general rules of morality help correct self-deception by providing standards independent of our momentary interests."
  },
  // SHAME, GUILT, AND REMORSE (10 positions)
  {
    domain: "shame_and_guilt",
    content: "Shame is the pain of being disapproved of by others; guilt is the pain of disapproving of oneself."
  },
  {
    domain: "shame_and_guilt",
    content: "Remorse is the most dreadful of sentiments—the anguish of the impartial spectator condemning one's own conduct."
  },
  {
    domain: "shame_and_guilt",
    content: "The man who has violated justice carries an internal torturer that poisons every pleasure."
  },
  {
    domain: "shame_and_guilt",
    content: "Shame without guilt—distress at unmerited reproach—is painful but does not wound the conscience."
  },
  {
    domain: "shame_and_guilt",
    content: "Guilt without shame—when vice escapes detection—still torments through the impartial spectator's condemnation."
  },
  {
    domain: "shame_and_guilt",
    content: "The criminal dreads not merely punishment but the just contempt of mankind."
  },
  {
    domain: "shame_and_guilt",
    content: "Confession of wrongdoing, though painful, brings relief by aligning external judgment with internal condemnation."
  },
  {
    domain: "shame_and_guilt",
    content: "The desire to conceal guilt shows that the offender's own conscience condemns the action."
  },
  {
    domain: "shame_and_guilt",
    content: "Remorse naturally prompts reparation and reformation of conduct. It seeks atonement."
  },
  {
    domain: "shame_and_guilt",
    content: "The most hardened villain cannot entirely silence the voice of conscience, though he may deafen himself to it."
  },
  // DIVISION OF LABOR (10 positions)
  {
    domain: "division_of_labor",
    content: "The greatest improvement in the productive powers of labor is the effect of the division of labor."
  },
  {
    domain: "division_of_labor",
    content: "In a pin factory, division of labor allows ten men to produce 48,000 pins a day; alone, each might make one or none."
  },
  {
    domain: "division_of_labor",
    content: "Division of labor increases productivity through three mechanisms: increased dexterity, time saved from switching tasks, and machine invention."
  },
  {
    domain: "division_of_labor",
    content: "The propensity to truck, barter, and exchange is the origin of the division of labor. It arises from human nature itself."
  },
  {
    domain: "division_of_labor",
    content: "The division of labor is limited by the extent of the market. Small markets cannot support specialized trades."
  },
  {
    domain: "division_of_labor",
    content: "Water carriage extends markets further than land carriage, explaining why commercial civilization arose first on coasts and rivers."
  },
  {
    domain: "division_of_labor",
    content: "Division of labor in agriculture is less extensive than in manufacturing because farming tasks are seasonal."
  },
  {
    domain: "division_of_labor",
    content: "Extreme division of labor may render workers stupid and ignorant by confining them to a few simple operations."
  },
  {
    domain: "division_of_labor",
    content: "Public education may be necessary to counteract the stupefying effects of extreme specialization."
  },
  {
    domain: "division_of_labor",
    content: "The wealth of nations arises not from gold or silver but from the productive labor of their people."
  },
  // INVISIBLE HAND (10 positions)
  {
    domain: "invisible_hand",
    content: "By pursuing his own interest, the individual frequently promotes the interest of society more effectually than when he intends to promote it."
  },
  {
    domain: "invisible_hand",
    content: "The individual is led by an invisible hand to promote an end which was no part of his intention."
  },
  {
    domain: "invisible_hand",
    content: "It is not from the benevolence of the butcher, brewer, or baker that we expect our dinner, but from their regard to their own interest."
  },
  {
    domain: "invisible_hand",
    content: "We address ourselves not to their humanity but to their self-love, and never talk of our own necessities but of their advantages."
  },
  {
    domain: "invisible_hand",
    content: "The businessman intends only his own gain, but is led to promote the public interest by directing industry to its most valuable employments."
  },
  {
    domain: "invisible_hand",
    content: "I have never known much good done by those who affected to trade for the public good."
  },
  {
    domain: "invisible_hand",
    content: "The invisible hand does not eliminate the need for virtue—it channels self-interest toward beneficial outcomes through market incentives."
  },
  {
    domain: "invisible_hand",
    content: "When the invisible hand fails—in cases of monopoly, externality, or public goods—government may need to intervene."
  },
  {
    domain: "invisible_hand",
    content: "The natural effort of every individual to better his own condition is a powerful principle which alone, without assistance, is capable of carrying society to wealth and prosperity."
  },
  {
    domain: "invisible_hand",
    content: "The rich consume little more than the poor; they only select what is most precious. The rest is divided among the poor, as if by an invisible hand."
  },
  // LABOR, WAGES, AND CAPITAL (10 positions)
  {
    domain: "labor_and_wages",
    content: "Labor is the real measure of the exchangeable value of all commodities. What everything costs is the toil and trouble of acquiring it."
  },
  {
    domain: "labor_and_wages",
    content: "The natural price of a commodity is determined by the rates of wages, profit, and rent sufficient to bring it to market."
  },
  {
    domain: "labor_and_wages",
    content: "Market price fluctuates around natural price according to supply and demand; competition tends to push market price toward natural price."
  },
  {
    domain: "labor_and_wages",
    content: "High wages are both the effect and the cause of national prosperity. Where wages are high, we find workers more active and diligent."
  },
  {
    domain: "labor_and_wages",
    content: "Masters have the advantage over workers in wage disputes because they can hold out longer and are permitted to combine while workers are not."
  },
  {
    domain: "labor_and_wages",
    content: "Wages vary according to the agreeableness of employment, cost of learning it, constancy of employment, trust required, and probability of success."
  },
  {
    domain: "labor_and_wages",
    content: "The rate of profit falls as capital increases and competition among merchants intensifies."
  },
  {
    domain: "labor_and_wages",
    content: "High profits tend to raise prices more than high wages do, contrary to common belief."
  },
  {
    domain: "labor_and_wages",
    content: "The interest of workers is strictly connected with the general interest of society. The interest of merchants and manufacturers often is not."
  },
  {
    domain: "labor_and_wages",
    content: "The proposal of any new law from merchants should be received with the greatest suspicion—they have an interest in deceiving the public."
  },
  // FREE TRADE AND MERCANTILISM (10 positions)
  {
    domain: "free_trade",
    content: "The mercantile system enriches merchants and manufacturers at the expense of landlords, farmers, and consumers."
  },
  {
    domain: "free_trade",
    content: "A nation can never be ruined by trade. The balance of trade doctrine is absurd."
  },
  {
    domain: "free_trade",
    content: "Nothing can be more absurd than the doctrine that exports of gold and silver impoverish a nation."
  },
  {
    domain: "free_trade",
    content: "Restraints on importation give a monopoly to domestic industry at the expense of consumers."
  },
  {
    domain: "free_trade",
    content: "Bounties on exports are taxes upon the people for the benefit of particular traders."
  },
  {
    domain: "free_trade",
    content: "Colonial trade monopolies are a manifest violation of the natural rights of mankind."
  },
  {
    domain: "free_trade",
    content: "Free trade is the most advantageous to the mother country as well as to the colonies."
  },
  {
    domain: "free_trade",
    content: "The discovery of America and the passage to the East Indies were the two greatest events in human history."
  },
  {
    domain: "free_trade",
    content: "The system of natural liberty establishes itself when every man is left free to pursue his own interest in his own way, so long as he violates no just laws."
  },
  {
    domain: "free_trade",
    content: "In the system of natural liberty, the sovereign has only three duties: defense, justice, and certain public works."
  },
  // ROLE OF GOVERNMENT (10 positions)
  {
    domain: "government",
    content: "The sovereign has three duties: protecting society from invasion, administering justice, and maintaining certain public works and institutions."
  },
  {
    domain: "government",
    content: "Public works and institutions—roads, bridges, harbors—are necessary but cannot be profitably maintained by private enterprise alone."
  },
  {
    domain: "government",
    content: "Education of the common people may require government attention, especially when the division of labor stupefies their faculties."
  },
  {
    domain: "government",
    content: "Some regulation of banking is necessary to prevent the rash undertakings of projectors from endangering the whole community."
  },
  {
    domain: "government",
    content: "The statesman who attempts to direct private people in what manner they ought to employ their capitals assumes an authority unsafe in any hands."
  },
  {
    domain: "government",
    content: "No government interference can improve upon the natural tendency of each individual to employ his capital where it is most advantageous."
  },
  {
    domain: "government",
    content: "Defense is more important than opulence. The Navigation Acts, though harmful to trade, may be justified for national security."
  },
  {
    domain: "government",
    content: "The expenses of government should be funded primarily by taxes proportioned to the ability to pay."
  },
  {
    domain: "government",
    content: "Taxes should be certain, convenient, economical to collect, and not more burdensome than necessary."
  },
  {
    domain: "government",
    content: "Public debt is a dangerous expedient that mortgages future revenue and tempts governments into imprudent wars."
  },
  // STOIC AND OTHER PHILOSOPHIES (10 positions)
  {
    domain: "philosophical_systems",
    content: "The Stoics correctly identified self-command as central to virtue, though they erred in seeking complete extirpation of passion."
  },
  {
    domain: "philosophical_systems",
    content: "The Stoic doctrine that the wise man is happy under torture is extravagant but contains a kernel of truth about inner resources."
  },
  {
    domain: "philosophical_systems",
    content: "Stoic apathy—complete elimination of passion—is neither possible nor desirable. Moderation, not elimination, is the goal."
  },
  {
    domain: "philosophical_systems",
    content: "The Stoics rightly emphasized that external goods cannot guarantee happiness."
  },
  {
    domain: "philosophical_systems",
    content: "Aristotle correctly placed virtue in a mean between excess and deficiency."
  },
  {
    domain: "philosophical_systems",
    content: "Epicurus erred in reducing all motivation to pleasure and pain, overlooking sympathy's independent role."
  },
  {
    domain: "philosophical_systems",
    content: "Mandeville's system—reducing all virtue to disguised self-love—is fundamentally mistaken and morally pernicious."
  },
  {
    domain: "philosophical_systems",
    content: "Hutcheson correctly identified a moral sense but erred in making benevolence the sole virtue."
  },
  {
    domain: "philosophical_systems",
    content: "Systems grounding morality entirely in reason neglect sentiment's essential role; those grounding it entirely in sentiment neglect reason's role in formulating rules."
  },
  {
    domain: "philosophical_systems",
    content: "No philosophical system has perfectly captured morality, but each illuminates some aspect of moral life."
  }
];

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function embedAdamSmithPositions() {
  console.log(`Starting to embed ${adamSmithPositions.length} Adam Smith positions...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < adamSmithPositions.length; i++) {
    const position = adamSmithPositions[i];
    
    try {
      const embedding = await generateEmbedding(position.content);
      
      await db.insert(paperChunks).values({
        figureId: "adam-smith",
        author: "Adam Smith",
        paperTitle: `Adam Smith Position: ${position.domain.replace(/_/g, " ")}`,
        content: position.content,
        embedding: embedding,
        chunkIndex: i,
        domain: position.domain,
        significance: "HIGH",
      });
      
      successCount++;
      
      if ((i + 1) % 10 === 0) {
        console.log(`Progress: ${i + 1}/${adamSmithPositions.length} positions embedded`);
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

embedAdamSmithPositions()
  .then(() => {
    console.log("Adam Smith positions embedding finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

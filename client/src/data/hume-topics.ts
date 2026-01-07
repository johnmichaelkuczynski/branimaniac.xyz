export interface TopicQuestion {
  topic: string;
  description: string;
  questions: string[];
}

export const humeTopics: TopicQuestion[] = [
  {
    topic: "Theoretical Knowledge",
    description: "The nature of theoretical knowledge, its sources, and whether it can ever be certain or is always provisional.",
    questions: [
      "What constitutes theoretical knowledge, and how do we acquire it?",
      "Is theoretical knowledge distinct from practical knowledge, and if so, in what ways?",
      "Can theoretical knowledge ever be certain, or is it always provisional?",
      "To what extent is theoretical knowledge derived from sensory experience rather than innate ideas?",
      "Can theoretical knowledge provide us with certainty about matters beyond our immediate impressions?",
      "How do relations of ideas contribute to theoretical knowledge as opposed to matters of fact?",
      "Is all theoretical knowledge ultimately reducible to impressions and ideas?",
      "What role does custom or habit play in forming theoretical beliefs?",
      "What can we actually claim to know about the world beyond our immediate impressions, and how do we justify that claim?",
      "Is there any form of knowledge about matters of fact that achieves genuine certainty, or must all such knowledge remain probabilistic?",
      "When I claim to know something about the external world, what exactly am I claiming?"
    ]
  },
  {
    topic: "Causal Knowledge",
    description: "How we come to know causal relationships, whether necessary connections exist, and the role of constant conjunction.",
    questions: [
      "How do we come to know causal relationships between events?",
      "What evidence supports the existence of necessary connections in causation?",
      "Are causal ties observable, or do they arise from something else in our minds?",
      "Why do we believe that a cause must necessarily produce its effect?",
      "Is there any way to demonstrate a real power or connection between cause and effect?",
      "How does constant conjunction lead us to infer causal relationships?",
      "Can we have causal knowledge of events we have never observed?",
      "Does our idea of causation come from external objects or from internal mental operations?",
      "Do we ever perceive causation itself, or only sequences of events that we habitually associate?",
      "If I've observed A followed by B a thousand times, what exactly do I know that I didn't know after observing it once?",
      "Is there any difference between a genuine causal connection and a mere constant conjunction that we happen never to observe violated?"
    ]
  },
  {
    topic: "Inferential Knowledge",
    description: "How inferential knowledge differs from perception, what justifies induction, and whether it can be reliable.",
    questions: [
      "How does inferential knowledge differ from direct perception?",
      "What justifies inferences from past experiences to future events?",
      "Can inferential knowledge be reliable without absolute certainty?",
      "What makes inductive inference reasonable, given that the future may not resemble the past?",
      "How does the principle of uniformity of nature arise in our minds?",
      "Is inferential knowledge from experience ever demonstrative or only probable?",
      "Why do we trust memory and testimony in forming inferential knowledge?",
      "Can inferential knowledge extend beyond the bounds of our actual experience?",
      "What licenses me to move from observed cases to unobserved cases?",
      "When I reason from past experience to future expectation, am I performing a genuine inference or merely obeying a habit of mind?",
      "Can demonstrative reasoning ever yield knowledge about matters of fact, or is it confined to relations of ideas?"
    ]
  },
  {
    topic: "Analytic Knowledge",
    description: "What makes a truth analytic, whether analytic truths are independent of experience, and their contribution to understanding.",
    questions: [
      "What makes a truth analytic, and how do we recognize it?",
      "Are analytic truths independent of experience, or do they depend on language?",
      "How does analytic knowledge contribute to our understanding of the world?",
      "How do we distinguish analytic truths from those that require experience?",
      "Are analytic truths known through the mere comparison of ideas?",
      "Do analytic truths tell us anything about the actual existence of objects?",
      "Is mathematical knowledge purely analytic, and if so, how?",
      "Can analytic knowledge be revised or overturned by new discoveries?",
      "Is our knowledge of mathematical and logical truths genuinely different in kind from our knowledge of empirical matters, or merely in degree of firmness?",
      "When I know that a triangle has three sides, what exactly is the object of my knowledge—an idea in my mind, a relation among ideas, or something else?",
      "Can we err about relations of ideas, and if so, how?"
    ]
  },
  {
    topic: "Non-Analytic Knowledge",
    description: "The forms and sources of non-analytic knowledge, its reliability compared to analytic truths.",
    questions: [
      "What forms does non-analytic knowledge take, and how is it obtained?",
      "Is non-analytic knowledge always empirical, or are there other sources?",
      "How reliable is non-analytic knowledge compared to analytic truths?",
      "What are the primary sources of non-analytic or synthetic knowledge?",
      "How certain can non-analytic knowledge ever be?",
      "Does non-analytic knowledge depend entirely on causal reasoning?",
      "Can non-analytic knowledge reveal necessary truths about the world?",
      "Why is non-analytic knowledge limited to matters of fact rather than relations of ideas?",
      "What grounds our confidence in synthetic claims about the world when they cannot be derived from the meaning of terms alone?",
      "Is all our knowledge of matters of fact ultimately reducible to memory and habit, or is there some other source?",
      "How do we distinguish genuine knowledge of contingent truths from mere confident belief?"
    ]
  },
  {
    topic: "Knowledge of Self",
    description: "How we gain knowledge of ourselves, whether introspection is reliable, and the limits of self-knowledge.",
    questions: [
      "How can we gain genuine knowledge of our own selves?",
      "Is self-knowledge based on introspection, or something more?",
      "What limits, if any, exist in knowing one's own mind?",
      "When we introspect, what exactly do we perceive as the self?",
      "Is knowledge of our own mind more certain than knowledge of external objects?",
      "How do we distinguish our own perceptions from those attributed to others?",
      "Can we have direct knowledge of our enduring self?",
      "What role do passions and sentiments play in self-knowledge?",
      "What do I actually apprehend when I turn my attention inward—is it a self, or only a succession of perceptions?",
      "If I cannot find a stable self in introspection, how do I know that the perceptions I survey are mine?",
      "Can I be mistaken about my own current mental states, and if so, what does this imply about self-knowledge?"
    ]
  },
  {
    topic: "The Nature of the Self",
    description: "Whether the self is unified or fragmented, whether it persists over time, and the bundle theory.",
    questions: [
      "What is the true nature of the self?",
      "Is the self a unified entity, or something more fragmented?",
      "Does the self persist over time, and if so, how?",
      "Is the self nothing more than a bundle or collection of perceptions?",
      "How do successive perceptions come to feel connected into a single self?",
      "Does personal identity depend on memory, substance, or something else?",
      "Why do we mistakenly suppose the self to be a simple, identical entity?",
      "Can the self exist independently of a continual flux of perceptions?",
      "What binds the bundle of perceptions into a single person persisting through time?",
      "If personal identity is a fiction constructed by imagination, is it a useful fiction or a harmful one?",
      "When I say 'I' will exist tomorrow, what makes that claim true or false?"
    ]
  },
  {
    topic: "The Nature of Emotion",
    description: "The fundamental nature of emotions, how they arise, and whether they operate independently of reason.",
    questions: [
      "What is the fundamental nature of human emotions?",
      "How do emotions arise and influence our behavior?",
      "Are emotions rational, or do they operate independently of reason?",
      "Are emotions calm passions, violent passions, or something distinct?",
      "How do emotions differ from reason in directing human action?",
      "Do emotions arise directly from impressions of pleasure and pain?",
      "Can emotions be true or false in the same way beliefs can?",
      "What determines the strength and direction of our emotions?",
      "Are passions simply impressions of a distinctive kind, or do they have some additional structure?",
      "What is the relationship between a passion and the beliefs that occasion it—can reason ever produce a passion, or only direct one already present?",
      "When I feel anger or love, am I perceiving something, desiring something, or doing something else entirely?"
    ]
  },
  {
    topic: "Unconscious Mental Activity",
    description: "Whether unconscious mental activity exists, how it affects conscious thought, and whether we can become aware of it.",
    questions: [
      "Does unconscious mental activity exist, and if so, what is its nature?",
      "How does unconscious mentality affect our conscious thoughts and actions?",
      "Can we ever become aware of unconscious processes?",
      "Can mental processes occur without our being conscious of them?",
      "Are there ideas or impressions that influence us without entering awareness?",
      "How might habits and customs operate below the level of conscious thought?",
      "Do associations of ideas sometimes happen without deliberate reflection?",
      "Is there evidence for mental activity that precedes or escapes conscious notice?",
      "Can there be impressions or ideas that influence conduct without entering conscious awareness?",
      "When custom or habit operates on the mind, must I be aware of this operation, or can it work silently?",
      "If the imagination performs operations beneath the threshold of awareness, does this threaten the authority of introspection?"
    ]
  },
  {
    topic: "Psychological Projection",
    description: "What projection is, how it aids or hinders knowledge acquisition, and how it distorts perception.",
    questions: [
      "What is psychological projection, and how does it work in the mind?",
      "How does projection aid or hinder the acquisition of true knowledge?",
      "In what ways does projection distort our perceptions of reality?",
      "Why do we attribute our own feelings or qualities to external objects?",
      "How does projection affect our beliefs about other people's motives?",
      "Can projection lead us to false causal inferences about the world?",
      "In what ways does sympathy involve a kind of projection onto others?",
      "Does projection prevent us from achieving an impartial view of reality?",
      "When I attribute power or necessity to causes, am I reading into nature something that originates in my own mind?",
      "How much of what we take for features of the external world is actually a projection of internal sentiments?",
      "If we systematically project mental features onto external objects, can we ever disentangle what is truly 'out there' from what we have imposed?"
    ]
  },
  {
    topic: "Rationalization",
    description: "Why people engage in rationalization, its impact on decision-making, and whether it can lead to genuine insights.",
    questions: [
      "What is rationalization, and why do people engage in it?",
      "How does rationalization impact decision-making and self-understanding?",
      "Can rationalization ever lead to genuine insights, or is it always deceptive?",
      "How do people invent reasons to justify actions driven by passion?",
      "Why does the mind seek post-hoc explanations for its behavior?",
      "Can rationalization ever align with genuine causal understanding?",
      "What role does self-love play in rationalizing our faults?",
      "How does rationalization distort moral judgment and self-deception?",
      "Do we typically discover our reasons for belief and action, or do we fabricate them after the fact?",
      "When a man explains why he holds a belief, how confident should we be that his stated reasons are his actual reasons?",
      "Is the mind capable of deceiving itself about its own motives, and if so, by what mechanism?"
    ]
  },
  {
    topic: "Inborn Instincts",
    description: "What instincts humans are born with, whether they can be modified, and how they interact with reason.",
    questions: [
      "What instincts are humans born with, and how do they shape us?",
      "Are these inborn instincts fixed, or can they be modified by experience?",
      "How do instincts interact with reason in human behavior?",
      "Which instincts seem universal to all humans regardless of culture?",
      "How do natural instincts like self-preservation and benevolence operate?",
      "Are instincts stronger than reason in motivating action?",
      "Do infants display instincts before education shapes their minds?",
      "How do instincts provide the foundation for social and moral sentiments?",
      "What principles of human nature are so fundamental that they operate prior to all experience and learning?",
      "Is sympathy an original instinct, or is it derived from some more basic principle?",
      "How much of what we call reason is actually instinct dressed in argumentative clothing?"
    ]
  },
  {
    topic: "Human Freedom",
    description: "The nature of human freedom, whether we are truly free, and what factors determine freedom.",
    questions: [
      "What is the true nature of human freedom, if it exists at all?",
      "Are humans truly free in their actions, or is freedom an illusion?",
      "What factors determine whether we have freedom or not?",
      "In what sense, if any, can human actions be called free?",
      "Does liberty consist in acting according to our desires?",
      "Is the feeling of freedom compatible with necessity?",
      "Why do we experience a sense of liberty in our choices?",
      "Can true freedom exist if all actions are determined by prior causes?",
      "When I deliberate and choose, am I doing something that could have gone otherwise, or am I simply unaware of the causes determining my choice?",
      "What does it mean to act freely if all actions arise from motives and motives arise from character and circumstance?",
      "Is the feeling of freedom evidence of actual freedom, or merely evidence that we are ignorant of our own determination?"
    ]
  },
  {
    topic: "Determinism",
    description: "Whether determinism accurately describes the universe, how it applies to human actions, and its compatibility with responsibility.",
    questions: [
      "What is determinism, and does it accurately describe the universe?",
      "How does determinism apply to human actions and events?",
      "Is determinism compatible with moral responsibility?",
      "Is every event, including human actions, necessarily determined by prior causes?",
      "Does the principle of causation apply uniformly to mind and matter?",
      "How can we reconcile determinism with the apparent contingency of events?",
      "Is determinism a necessary truth or merely a strong presumption?",
      "What evidence from experience supports universal determinism?",
      "If every event has a cause, and causes necessitate their effects, can anything happen other than what does happen?",
      "Is necessity something in objects themselves, or only a determination of the mind to pass from cause to effect?",
      "Does the regularity of human action establish that humans are as determined as billiard balls?"
    ]
  },
  {
    topic: "Determinism and Freedom",
    description: "The relationship between determinism and freedom, compatibilism, and implications for ethics.",
    questions: [
      "How does determinism relate to the concept of human freedom?",
      "If determinism is true, can freedom still exist in some form?",
      "What implications does the relationship between determinism and freedom have for ethics?",
      "Can determinism and moral freedom coexist in any meaningful way?",
      "If all actions are necessitated, does that undermine responsibility?",
      "Is the compatibilist view of liberty as absence of constraint adequate?",
      "How should we define freedom if determinism is true?",
      "Does the debate between liberty and necessity rest on a verbal dispute?",
      "Is there any coherent notion of freedom that survives the recognition that all actions are caused?",
      "If liberty means only the absence of external constraint, is this liberty worth wanting?",
      "Can we hold men responsible for actions that flow necessarily from their characters, given that they did not choose their characters?"
    ]
  },
  {
    topic: "Historiography",
    description: "The proper method for writing history, avoiding bias, and the role of evidence in historical narratives.",
    questions: [
      "What is the proper method for writing and interpreting history?",
      "How can historians avoid bias in their accounts?",
      "What role does evidence play in constructing historical narratives?",
      "How can historians establish probability in narratives of past events?",
      "What makes one historical account more credible than another?",
      "Should historians aim for impartiality, and is it achievable?",
      "How do causes and effects operate in historical explanation?",
      "What role do human passions play in shaping historical events?",
      "What distinguishes genuine historical knowledge from mere chronicle or antiquarian accumulation?",
      "Can we discern general principles of human nature from the study of history, or only particular facts?",
      "How should the historian weigh testimony, and what makes some witnesses more credible than others?"
    ]
  },
  {
    topic: "Religion",
    description: "The basis for religious belief, whether religion provides genuine knowledge, and how to evaluate miracles.",
    questions: [
      "What is the basis for religious belief, if any?",
      "Does religion provide genuine knowledge about the world?",
      "How should we evaluate claims of divine revelation or miracles?",
      "What is the true origin of religious belief in human nature?",
      "Can arguments from design prove the existence of a deity?",
      "Do miracles violate the uniform course of nature, and can they be believed?",
      "Is religious morality derived from reason or from sentiment?",
      "Why does polytheism often precede monotheism in human societies?",
      "Can the existence of God be established by argument, and if so, what kind of argument—demonstrative or probable?",
      "If we judge the cause from the effect, what features can we legitimately ascribe to the author of nature?",
      "Is religious belief grounded in reason, in passion, or in something else entirely?"
    ]
  },
  {
    topic: "History of Religion",
    description: "How religion has evolved throughout history, what drives changes in belief, and patterns across cultures.",
    questions: [
      "How has religion evolved throughout human history?",
      "What factors have driven changes in religious practices and beliefs over time?",
      "Are there universal patterns in the development of religions across cultures?",
      "What psychological needs drive the historical development of religion?",
      "How do fear and hope contribute to changes in religious belief?",
      "Why do religious doctrines become more refined or corrupted over time?",
      "Are there common patterns in the rise and decline of religious systems?",
      "How does religion interact with civil authority throughout history?",
      "Did religion originate in rational reflection on nature or in fear and ignorance?",
      "Why do human societies oscillate between polytheism and monotheism, and what drives these transitions?",
      "Is there progress in religious understanding, or only variation?"
    ]
  },
  {
    topic: "Morality",
    description: "The foundation of morality, how we distinguish right from wrong, and whether morality is innate or learned.",
    questions: [
      "What is the foundation of morality?",
      "How do we distinguish right from wrong?",
      "Is morality innate, or learned through society and experience?",
      "Is morality based on reason or on sentiment?",
      "How do moral distinctions arise from feelings of approval and disapproval?",
      "Can morality be reduced to self-interest or utility?",
      "Are moral judgments universal or relative to cultures?",
      "What role does sympathy play in moral evaluation?",
      "When I call an action virtuous, am I describing a feature of the action or expressing my own sentiment of approbation?",
      "What makes some sentiments authoritative for moral judgment while others are dismissed as prejudice?",
      "If morality is grounded in sentiment, can there be genuine moral error, or only differences in feeling?"
    ]
  },
  {
    topic: "Aesthetics",
    description: "What constitutes beauty, whether aesthetic judgment is subjective or objective, and the role of emotion in aesthetics.",
    questions: [
      "What constitutes beauty, and how do we perceive it?",
      "Is aesthetic judgment subjective, or are there objective standards?",
      "How do emotions and reason interplay in aesthetic experiences?",
      "Does beauty reside in the object or in the mind of the beholder?",
      "How does the standard of taste emerge from human sentiment?",
      "Can aesthetic judgments claim any objectivity?",
      "Why do some forms and qualities universally please?",
      "How do utility and fitness contribute to perceptions of beauty?",
      "What is the relationship between beauty and the pleasure we take in beautiful objects—is beauty the cause of pleasure or constituted by it?",
      "Can taste be cultivated, and if so, what does a well-cultivated taste perceive that an uncultivated taste misses?",
      "Is there a standard of taste that transcends individual preference, or is beauty truly in the eye of the beholder?"
    ]
  }
];

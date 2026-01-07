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

interface MonadologySection {
  sectionNumbers: string;
  content: string;
}

async function embedMonadologyAnalysis() {
  console.log("Starting Monadology Analysis embedding for BOTH Kuczynski and Leibniz...");
  
  const sections: MonadologySection[] = [
    {
      sectionNumbers: "1-6",
      content: "The monad is simple with no parts. There must be simple substances since composite ones consist of them. What is simple has no extension and therefore no shape - monads are the true atoms of nature. Monads cannot be destroyed since to destroy is to take apart and monads have no parts. For the same reason, monads cannot be created. Therefore, monads come into and depart from existence instantaneously; they can be destroyed only by being annihilated, not decomposed, and they come into existence ex nihilo."
    },
    {
      sectionNumbers: "7-9",
      content: "Monads cannot undergo internal change. Internal change requires internal parts, and monads have no such parts. Nothing can change a monad. To be changed is for one's internal parts to be rearranged, and monads have no such parts. Even though monads don't have parts, they do have qualities. Monads do not differ in size from one another - there are no quantitative differences between any two monads. If there are any differences, they must be qualitative. No two monads are the same. The differences between any two objects are rooted in the natures of those objects. It is not simply that objects differ in their relations to other objects - they have different natures."
    },
    {
      sectionNumbers: "10-13",
      content: "Every created being can change. Therefore, monads can change. In fact, monads are always changing. These changes come from within because nothing can affect a monad externally. Each monad must change in its own way as a consequence of each monad being unique. Even though monads do not consist of parts, there is a respect in which they are internally differentiated - qualitatively internally differentiated. When a monad changes, it must do so in some respects and not others, since total change would be tantamount to annihilation, and it must do so continuously since all changes are continuous."
    },
    {
      sectionNumbers: "14-16",
      content: "When a monad changes, the change is internal to a being that remains fundamentally unified. Such changes-within-unity are nothing other than what we call perception. Perception is not the same thing as thought. Nor is it the same thing as consciousness. Cartesians hold that consciousness and mind are the same thing, and they deny that there is anything in one's mind of which one is not conscious. For this reason, they wrongly hold that mind and body are distinct and that the soul can perish. The force that drives a monad's internal changes may be referred to as appetition. Any given change in a monad begins with one perception and strives towards a different perception."
    },
    {
      sectionNumbers: "17-19",
      content: "Perception cannot be explained mechanically. Suppose some machine could create perceptions. That machine could be expanded so we could walk around inside it. We would see cogs and levers and pulleys - various interacting objects as in a factory. But we certainly would not see perceptions or thoughts or feelings. Interacting objects do not create perceptions. Therefore, multiplicities of objects do not have perceptions. Therefore, perceptions are had by simple beings. An entelechy is a self-powering being. Souls are entelechies, and so are monads. We must distinguish between minds and souls. Where there is perception, there is a mind. But it is only where perception is accompanied by memory that there is a soul."
    },
    {
      sectionNumbers: "20-24",
      content: "When we are in dreamless sleep, our condition is more like that of a mere monad than otherwise. But we wake from even the deepest sleep, showing our condition differs from a mere monad even in deepest sleep. Monads have perceptions, but their perceptions are weak and confused, as we are during a dizzy spell or delirium. A monad's condition at any given moment is a consequence of its earlier condition. A monad's future condition is implicit in its present condition. When you recover from a dizzy spell, you remember what it was like. You must have been taking a mental note unconsciously. Perceptions must arise from other perceptions, just as motions are caused by other motions. Conscious perceptions are unconscious perceptions that have become conscious."
    },
    {
      sectionNumbers: "25-28",
      content: "Animals often have enormously powerful sensory modalities. The reason an eagle sees so well is that its eyes do such a good job of organizing the light rays that strike, and the reason a bat hears so well is that its ears do such a good job of organizing the undulations that affect it. If a creature has neither memory nor reason, experiences do not change it. If it has either memory or reason, experiences do change it. In some cases, memory-based changes mimic reason-based changes. A dog beaten enough times will cringe at the mere sight of the stick used to beat it. The dog's behavior is reflexive, purely memory-based, and does not embody any actual thought. Most of our beliefs are based solely on past experience, with no element of rational inference."
    },
    {
      sectionNumbers: "29-30",
      content: "What distinguishes us from animals is that we are aware of necessary truths. Unlike animals, we grasp the concept of logical dependence, and this is what makes us rational. Because we are rational, we think about the world scientifically. Because we are rational, we are able to think about ourselves and about God. It is because we grasp necessary truths that we can think about ourselves. And because we can think about ourselves, we can think about simples, composites, mind, and matter. We learn that what limits one being may not limit another. On this basis, we grasp the concept of God, that is, of an unlimited being."
    },
    {
      sectionNumbers: "31-36",
      content: "All reasoning is based on two principles. First, the Principle of Non-contradiction: self-contradictory statements are always false, and the negation of such a statement is always true. Second, the Principle of Sufficient Reason: no statement can be true, no fact can exist, unless there is an adequate reason. There are two kinds of truths: Truths of Reason and Truths of Fact. Truths of reason are necessary, and their negations cannot possibly be true. Truths of fact are contingent, and their negations can be true. When a truth is necessary, we can learn why it is true by analyzing it. Analysis reaches an end with basic principles whose negation is explicitly self-contradictory. These basic principles are always identities, truths of the form x=x."
    },
    {
      sectionNumbers: "37-42",
      content: "Mathematicians give reasons for necessary truths, but there are sufficient reasons for contingent truths as well. The movements I make with my pen are the end-result of an infinitely long chain of events, and any given link in that chain is of infinite internal complexity. No matter how far back we follow this chain, we fail to encounter a sufficient reason. To find such a reason, we must look outside this sequence of contingencies. This necessary being is sufficient for all contingencies, which are all interconnected. So there is one God and this God is sufficient. There is nothing distinct from this being that does not depend for its existence on it. This being cannot be possible without being actual. Therefore, its existence is necessary. God is responsible for each creature's perfections. Each creature is responsible for its own imperfections."
    },
    {
      sectionNumbers: "43-47",
      content: "God is the source not only of what is actual, but of what is possible, and is therefore responsible for the existence of essences. It is in God's mind, and nowhere else, that possibilities exist, and without God there would be no possibilities, and therefore no actualities either. Possibilities do not exist unless grounded in actualities and must therefore be grounded in necessary and eternal truths and in a being whose essence involves existence. Of God and God alone can it be said that He must exist if He can exist. God is unlimited and his existence is in no way negated. Nothing contradicts his existence and it therefore does not self-contradict. Since what is not self-contradictory is possible, God is possible and, since possible, existent."
    },
    {
      sectionNumbers: "48-52",
      content: "In God, there is Power (source of everything), Knowledge (contains every truth), and Will (produces changes as God sees fit). These correspond to the monad's basic nature, perceptual faculty, and appetitive faculty. A being is perfect so far as it acts and imperfect so far as it is acted on. A monad acts insofar as it has clear perceptions and is acted on insofar as it has confused ones. To the extent one monad has clear perceptions and another confused ones, the states of the former can be responsible for those of the latter. No monad directly acts on any other. But God arranges things so that the conditions of lesser monads can be inferred from those of higher monads but not vice versa."
    },
    {
      sectionNumbers: "53-59",
      content: "Since there are infinitely many possible universes and only one actual one, God must have had a reason for choosing this universe to create. It is only if one universe is better than another that it is more worthy of being created. Since ours is the only universe God created, it follows that it is better than every other possible universe. This is the best of all worlds. Given that the relations of monads are pre-arranged to reflect the differences between them, each monad's intrinsic properties can be read off of its relational properties. Each monad is a mirror of the universe. Just as a town appears differently to differently situated observers, there are as many reflections of the universe as there are monads."
    },
    {
      sectionNumbers: "60-64",
      content: "The condition of any given monad reflects that of the entire universe. The more internally differentiated a monad is, the more accurate a mirror it is of the universe. Each monad reflects what is close more accurately than what is far, and what is large more accurately than what is small. Because there is no empty space, there is nothing in the universe whose changes are without an effect on everything else. Each monad contains within itself a complete record of everything that happens in the universe. Monads vary not in respect of the information they bear, but in respect of how clearly they bear it. Each monad represents the whole universe, but represents the body assigned to it - of which it is the entelechy - more clearly than others."
    },
    {
      sectionNumbers: "65-70",
      content: "Each unit of matter not only can be, but is subdivided without end. For this reason, each is autonomous, being its own source of motion and vitality, not having to await an impulse from some other body. It is only because there is no end to these subdivisions that any given part of the universe is able to be a reflection of the rest. There is a world of animals, living things and souls, entelechies and minds, within the smallest fragment of matter. Every particle is a pond full of living creatures, and every particle within each such creature, yet another such pond. There is nothing dead or barren in the universe; nothing chaotic or confused, except in appearance."
    },
    {
      sectionNumbers: "71-77",
      content: "If a body has a soul, it does not have that soul forever. Bodies are in constant flux, and souls enter and leave them. The soul changes its body only gradually, and no soul is ever instantly stripped of its bodily organs. Life never comes into existence ex nihilo nor completely goes out of existence. What we call conception is simply unusually rapid development, and what we call death is unusually negative development. Not only is the soul indestructible, so too is the animal itself, though its particular mechanism may come to an end, and either throw off or take on organic coating."
    },
    {
      sectionNumbers: "78-81",
      content: "The conformity of mind and body to one another is a consequence of the pre-established harmony. Mind and body do not interact, but mind reflects body and body reflects the universe. Hence the appearance of interaction. Descartes was aware that the total amount of energy in the universe remains the same. From this he inferred that minds could not cause bodies to move, but he did believe minds could redirect existing motions. We now know this too would violate the conservation principle. Our system is consistent with the supposition that animal body movements have strictly physical causes, and also consistent with the supposition that they have psychological causes. Our system explains how strictly physics-governed behavior can also be reason-governed."
    },
    {
      sectionNumbers: "82-90",
      content: "No living soul is created and no living soul is destroyed. But whereas all living souls can feel, only some can reason. A given soul resembles God to the extent that it is rational. On this basis, God enters into community with his subjects, relating to them not just as an inventor to machines, but as a prince to subjects and as a father to children. The totality of monads is the City of God, the most perfect kingdom imaginable. This City of God is a moral world within the natural world. Just as efficient causes align with final causes, so in this City of God does the natural realm align with the Realm of Grace. Evil actions bring their own punishment and good deeds lead to their own reward. We live in a maximally good world, in which virtue is duly rewarded and vice duly punished."
    }
  ];

  const sourceTitle = "Analytic Summary of Leibniz's Monadology";
  
  const authors = [
    { author: "Kuczynski", figureId: "kuczynski", prefix: "Kuczynski's analysis of Leibniz: " },
    { author: "Leibniz", figureId: "leibniz", prefix: "Monadology sections " }
  ];
  
  let totalEmbedded = 0;
  
  for (const authorConfig of authors) {
    console.log(`\n=== Embedding for ${authorConfig.author} (figureId: ${authorConfig.figureId}) ===`);
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const displayTitle = authorConfig.author === "Kuczynski" 
        ? `${sourceTitle} - Sections ${section.sectionNumbers}`
        : `Monadology Analysis - Sections ${section.sectionNumbers}`;
      
      try {
        const embedding = await getEmbedding(section.content);
        
        await db.insert(paperChunks).values({
          author: authorConfig.author,
          figureId: authorConfig.figureId,
          paperTitle: displayTitle,
          content: section.content,
          embedding: embedding,
          chunkIndex: i,
        });
        
        console.log(`Embedded [${authorConfig.author}] sections ${section.sectionNumbers}: ${section.content.substring(0, 60)}...`);
        totalEmbedded++;
        
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error embedding section ${section.sectionNumbers} for ${authorConfig.author}:`, error);
      }
    }
  }
  
  console.log(`\n=== Completed: ${totalEmbedded} chunks embedded (${sections.length} for each author) ===`);
}

embedMonadologyAnalysis()
  .then(() => {
    console.log("Monadology Analysis embedding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during embedding:", error);
    process.exit(1);
  });

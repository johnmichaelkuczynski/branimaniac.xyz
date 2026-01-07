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

interface HumeSection {
  title: string;
  sourceWork: string;
  positions: string[];
}

async function embedHumePositions() {
  console.log("Starting Hume Position Statements embedding...");
  
  const sections: HumeSection[] = [
    {
      title: "Theoretical Knowledge",
      sourceWork: "Hume - Theoretical Knowledge Position Statements",
      positions: [
        "Theoretical knowledge is limited to what can be derived from sensory impressions and ideas, rejecting speculative metaphysics as unintelligible.",
        "It is divided into 'relations of ideas' (a priori, certain, like mathematics) and 'matters of fact' (probabilistic, empirical).",
        "All ideas must trace back to impressions via the Copy Principle; anything beyond experience lacks content.",
        "Knowledge is provisional and based on the science of human nature, not ultimate realities.",
        "Custom and habit, rather than reason, extend knowledge beyond immediate perceptions."
      ]
    },
    {
      title: "Causal Knowledge",
      sourceWork: "Hume - Causal Knowledge Position Statements",
      positions: [
        "Causal ties are not observed directly; we only see constant conjunctions, not necessary connections.",
        "The idea of causation arises from the mind's habitual transition after repeated observations.",
        "Reason cannot demonstrate causal connections a priori or through probable reasoning without circularity.",
        "Causal knowledge is probabilistic, based on custom and association, not inherent powers in objects.",
        "Inferences to unseen causes (e.g., origins of the universe) are weak analogies, limited by experience."
      ]
    },
    {
      title: "Inferential Knowledge",
      sourceWork: "Hume - Inferential Knowledge Position Statements",
      positions: [
        "Inferential knowledge pertains to matters of fact and is probable, not demonstrative.",
        "It relies on the assumption of nature's uniformity, which arises from custom, not reason.",
        "Belief in inferences is a lively idea produced by associative habits, akin to instinct.",
        "Inductive inferences cannot be justified rationally without assuming what they seek to prove.",
        "In religious contexts, inferences like the design argument are underdetermined and lead to skepticism."
      ]
    },
    {
      title: "Analytic Knowledge",
      sourceWork: "Hume - Analytic Knowledge Position Statements",
      positions: [
        "Analytic truths are relations of ideas, known a priori through intuition or demonstration, without depending on existence.",
        "They are certain; their denial implies contradiction (e.g., mathematical propositions).",
        "Such knowledge is limited to abstract relations and does not apply to causal or factual matters.",
        "Analytic truths provide no information about the world beyond conceptual analysis.",
        "Attempts to extend them to infinite attributes (e.g., God's) render them meaningless."
      ]
    },
    {
      title: "Non-Analytic Knowledge",
      sourceWork: "Hume - Non-Analytic Knowledge Position Statements",
      positions: [
        "Non-analytic knowledge concerns matters of fact, known probabilistically through experience.",
        "Contraries are conceivable without contradiction, unlike analytic truths.",
        "It depends on causal reasoning, which is grounded in habit rather than reason.",
        "Such knowledge cannot reveal necessary truths and is always open to doubt.",
        "In moral or religious claims, it fails when evidence (e.g., evil) contradicts assumptions like divine benevolence."
      ]
    },
    {
      title: "Knowledge of Self",
      sourceWork: "Hume - Knowledge of Self Position Statements",
      positions: [
        "Self-knowledge is empirical, derived from impressions of reflection like passions and desires.",
        "It is more vivid than external knowledge but still limited to perceptions.",
        "Introspection reveals no foundational certainty beyond current impressions.",
        "Sympathy allows extension of self-knowledge to others' mental states via association.",
        "Reason plays a passive role; passions dominate self-understanding."
      ]
    },
    {
      title: "The Nature of the Self",
      sourceWork: "Hume - Nature of the Self Position Statements",
      positions: [
        "The self is not a unified, persistent substance but a bundle or collection of perceptions.",
        "There is no distinct impression of a simple self; identity arises from memory and imagination linking perceptions.",
        "The feeling of continuity is a fiction created by associative principles.",
        "Metaphysical notions of an immaterial soul are rejected as unsubstantiated.",
        "Anthropomorphic projections onto entities like God highlight the self's finite, comprehensible nature."
      ]
    },
    {
      title: "The Nature of Emotion",
      sourceWork: "Hume - Nature of Emotion Position Statements",
      positions: [
        "Emotions are impressions of reflection, arising from ideas of pleasure or pain, and are more vivid than mere thoughts.",
        "They motivate action, while reason is inert and serves as their 'slave.'",
        "Passions can be calm (e.g., benevolence) or violent (e.g., anger), and are explained naturalistically via association.",
        "Emotions like fear and hope drive religious beliefs, not rational inference.",
        "Sympathy transmits emotions between people, influencing moral and social judgments."
      ]
    },
    {
      title: "Unconscious Mental Activity",
      sourceWork: "Hume - Unconscious Mental Activity Position Statements",
      positions: [
        "Hume does not explicitly posit unconscious activity; all mental contents are conscious impressions or ideas.",
        "Associative habits and customs operate as 'gentle forces' but within conscious thought.",
        "Mental processes are fully derivable from impressions, with no room for hidden mechanisms.",
        "Ideas may influence without deliberate reflection, but this is habitual rather than truly unconscious.",
        "Inferences suggest mental activity is transparent and empirical, not subterranean."
      ]
    },
    {
      title: "Psychological Projection",
      sourceWork: "Hume - Psychological Projection Position Statements",
      positions: [
        "Projection occurs through sympathy and association, where we attribute our feelings or qualities to others or objects.",
        "It aids knowledge by enabling empathy and shared understanding, e.g., inferring others' motives.",
        "However, it can distort reality, leading to false beliefs like anthropomorphism in religion.",
        "Weak associations (e.g., with distant others) hinder accurate projection and thus knowledge.",
        "In causal inferences, habitual projection creates the illusion of necessary connections."
      ]
    },
    {
      title: "Rationalization",
      sourceWork: "Hume - Rationalization Position Statements",
      positions: [
        "Rationalization involves reason inventing post-hoc justifications for actions driven by passions.",
        "Reason cannot motivate; it only serves sentiments, leading to self-deception.",
        "In morals, we rationalize faults through self-love, distorting judgments.",
        "Theodicies (justifying evil) are empty rationalizations that fail under scrutiny.",
        "Rationalization rarely yields genuine insight and often perpetuates errors."
      ]
    },
    {
      title: "Inborn Instincts",
      sourceWork: "Hume - Inborn Instincts Position Statements",
      positions: [
        "Humans are born with associative principles: resemblance, contiguity, and causation, which are original and unexplained.",
        "Instincts like self-preservation, benevolence, and sympathy form the basis of social and moral behavior.",
        "These are stronger than reason in motivating action and belief formation.",
        "Infants display instincts prior to education, shaping thought and society.",
        "Fear and hope as instincts drive religious origins and human responses to misery."
      ]
    },
    {
      title: "Human Freedom",
      sourceWork: "Hume - Human Freedom Position Statements",
      positions: [
        "Absolute freedom is an illusion; actions are determined by passions, habits, and custom.",
        "Liberty means acting according to one's will without external constraint, but the will itself is caused.",
        "Reason does not confer freedom, as it cannot oppose or motivate passions.",
        "The feeling of freedom arises from internal determinations, not true indeterminacy.",
        "In religious contexts, finite limitations imply necessity over free benevolence."
      ]
    },
    {
      title: "Determinism",
      sourceWork: "Hume - Determinism Position Statements",
      positions: [
        "Every event, including human actions, is determined by prior causes via constant conjunctions.",
        "The principle of causation applies uniformly to mind and matter, based on experience.",
        "Determinism is a strong presumption from habitual uniformity, not a necessary truth.",
        "No events are truly contingent; all follow necessary chains observable in nature.",
        "Hypotheses beyond experience (e.g., uncaused events) are rejected."
      ]
    },
    {
      title: "Determinism and Freedom",
      sourceWork: "Hume - Determinism and Freedom Position Statements",
      positions: [
        "Determinism and freedom are compatible (compatibilism): freedom is liberty of spontaneity, not indifference.",
        "If actions are necessitated by internal causes, responsibility remains intact.",
        "The debate is often verbal; necessity is essential to moral accountability.",
        "Absolute freedom contradicts causal uniformity and leads to absurdity.",
        "In theology, determinism fits a finite or indifferent deity better than infinite freedom."
      ]
    },
    {
      title: "Historiography",
      sourceWork: "Hume - Historiography Position Statements",
      positions: [
        "History should be empirical, based on observation and evidence, avoiding hypothetical systems.",
        "Historians must aim for impartiality, though human passions influence events and narratives.",
        "Probability guides historical accounts, drawing on causal explanations from human nature.",
        "History is part of moral philosophy, revealing patterns in behavior via experience.",
        "Bias can be mitigated by focusing on facts and constant conjunctions."
      ]
    },
    {
      title: "Religion",
      sourceWork: "Hume - Religion Position Statements",
      positions: [
        "Religious beliefs originate from fear, hope, and superstition, not reason.",
        "Arguments for God (e.g., design) are weak analogies, undermined by evil and dissimilarity.",
        "Miracles violate nature's uniformity and lack credible testimony.",
        "Natural religion's concepts (e.g., infinite God) lack intelligible content.",
        "Organized religion fosters enthusiasm and corruption, opposed to true philosophy."
      ]
    },
    {
      title: "History of Religion",
      sourceWork: "Hume - History of Religion Position Statements",
      positions: [
        "Religion evolves from polytheism (driven by fear of unknown powers) to monotheism via refinement.",
        "It arises from human misery, anxiety, and imagination, not rational inquiry.",
        "Changes are psychological: fear and hope corrupt doctrines over time.",
        "Common patterns include rise from superstition and decline through corruption or reason.",
        "Religion interacts with civil authority, often leading to fanaticism or tolerance."
      ]
    },
    {
      title: "Morality",
      sourceWork: "Hume - Morality Position Statements",
      positions: [
        "Morality is founded on sentiment (approval/disapproval), not reason or divine command.",
        "Virtues are those useful or agreeable to self or others, discerned via sympathy.",
        "Natural virtues (e.g., benevolence) are innate; artificial ones (e.g., justice) arise from conventions.",
        "Moral judgments are universal in principle but relative to human nature.",
        "Self-interest and utility play roles, but sympathy enables impartiality."
      ]
    },
    {
      title: "Aesthetics",
      sourceWork: "Hume - Aesthetics Position Statements",
      positions: [
        "Beauty resides in sentiment, arising from what is agreeable to the imagination or useful.",
        "Aesthetic judgments claim some objectivity through a general point of view and sympathy.",
        "Standards of taste emerge from uniform human responses to forms and qualities.",
        "Beauty in nature (e.g., contrivance) suggests design but is probabilistic.",
        "Emotions and reason interplay, with sentiment dominating aesthetic experience."
      ]
    }
  ];
  
  let totalPositions = 0;
  let successCount = 0;
  let globalIndex = 0;
  
  for (const section of sections) {
    console.log(`\nProcessing: ${section.title} (${section.positions.length} positions)`);
    totalPositions += section.positions.length;
    
    for (let i = 0; i < section.positions.length; i++) {
      const position = section.positions[i];
      
      try {
        const embedding = await getEmbedding(position);
        
        await db.insert(paperChunks).values({
          figureId: "hume",
          author: "David Hume",
          paperTitle: section.title,
          content: position,
          embedding: embedding,
          chunkIndex: globalIndex,
          domain: "empiricist philosophy",
          significance: "HIGH",
          sourceWork: section.sourceWork
        });
        
        successCount++;
        globalIndex++;
        
        if (successCount % 20 === 0) {
          console.log(`Progress: ${successCount} embedded...`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 60));
      } catch (error: any) {
        console.error(`Error at ${section.title}[${i}]:`, error.message);
      }
    }
  }
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`COMPLETE: ${successCount}/${totalPositions} Hume positions embedded`);
  console.log(`${"=".repeat(60)}`);
}

embedHumePositions().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

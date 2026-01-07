import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "../../shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const descartesPositions = [
  { domain: "methodic_doubt", content: "All beliefs based on the senses are potentially false; systematic doubt is necessary to find certainty." },
  { domain: "methodic_doubt", content: "Doubt must extend to mathematics because of the evil-demon hypothesis—an all-powerful deceiver could make even 2+2=4 seem true when it is false." },
  { domain: "methodic_doubt", content: "One should suspend assent to any proposition that can be doubted. Doubt is a methodological tool, not a permanent philosophical position." },
  { domain: "methodic_doubt", content: "The senses have sometimes deceived me, and it is prudent never to trust entirely those who have once deceived us." },
  { domain: "cogito", content: "Cogito ergo sum—I think, therefore I am. Thinking cannot occur without a thinker; doubt itself proves the existence of the doubter." },
  { domain: "cogito", content: "The Cogito is self-evident once considered; it is known by intuition, not deduction. It establishes the first indubitable truth." },
  { domain: "cogito", content: "Even if an evil demon is deceiving me about everything, the very act of being deceived proves I must exist." },
  { domain: "cogito", content: "I am, I exist—this is certain. But for how long? For as long as I am thinking; for perhaps if I ceased to think, I would cease to exist." },
  { domain: "mind", content: "The mind is a thinking substance; its essence is thought alone. The mind is indivisible." },
  { domain: "mind", content: "The mind is known more clearly than the body; I can doubt the body exists but cannot doubt that I think." },
  { domain: "mind", content: "The mind does not require spatial extension; thought is its sole essential property." },
  { domain: "mind_body", content: "The mind and body are distinct substances; the mind can exist without the body." },
  { domain: "mind_body", content: "Bodies are divisible; minds are not. Clear and distinct conception of each shows they are separable." },
  { domain: "mind_body", content: "The self is essentially mental, not corporeal. I am not this body; I am a thinking thing." },
  { domain: "mind_body", content: "Mind and body interact through the pineal gland, though their natures are entirely different." },
  { domain: "matter", content: "Extension is the defining property of matter; bodies are characterized by size, shape, and motion." },
  { domain: "matter", content: "Sensible qualities—color, taste, smell, sound—are not essential to bodies; they are produced in our minds." },
  { domain: "matter", content: "Matter is infinitely divisible; there is no smallest particle. Geometry fully captures the nature of bodies." },
  { domain: "matter", content: "The physical world is a plenum; there is no void. Extension and matter are the same thing." },
  { domain: "god", content: "The idea of a perfect being must have a cause at least as perfect as the idea itself. Only God could be that cause." },
  { domain: "god", content: "A finite being cannot originate the idea of infinity; that idea must come from an infinite source." },
  { domain: "god", content: "God's existence is knowable by reason alone; God must exist to guarantee the truth of clear and distinct perceptions." },
  { domain: "god", content: "God is no deceiver; His perfection excludes the will to deceive. This guarantees that what I clearly and distinctly perceive is true." },
  { domain: "truth", content: "Whatever is clearly and distinctly perceived is true. This truth rule is intuitive, not inferred." },
  { domain: "truth", content: "The truth rule depends on God's non-deceptiveness; without God, even clear perceptions might be false." },
  { domain: "truth", content: "Error arises only when judgment exceeds perception—when we affirm what we do not clearly perceive." },
  { domain: "error", content: "Error does not arise from God but from human misuse of will. The intellect is finite but not deceptive." },
  { domain: "error", content: "Will is infinite and can affirm beyond what the intellect perceives. Error is avoidable through careful judgment." },
  { domain: "error", content: "Human imperfection does not imply divine deception; we err by judging hastily, not because God misleads us." },
  { domain: "will", content: "Will is unlimited relative to intellect; error is produced by willing without proper intellectual clarity." },
  { domain: "will", content: "Freedom consists in rationally guided will, not indifference. Perfect freedom belongs to God; humans approximate it." },
  { domain: "will", content: "Judgment should be withheld until clarity is achieved; this is the path to avoiding error." },
  { domain: "innate_ideas", content: "Some ideas are born with us—the idea of God, mathematical ideas, and the basic concepts of thought and existence." },
  { domain: "innate_ideas", content: "The idea of God is innate; it could not arise from experience or be invented by a finite mind." },
  { domain: "innate_ideas", content: "Ideas of extension, substance, duration, and similar concepts are innate, not derived from the senses." },
  { domain: "method", content: "Never accept anything as true which I do not clearly know to be such. Accept only what presents itself so clearly that I have no occasion to doubt it." },
  { domain: "method", content: "Divide each difficulty into as many parts as possible for its adequate solution." },
  { domain: "method", content: "Conduct thoughts in order, beginning with the simplest objects, ascending little by little to knowledge of the most complex." },
  { domain: "method", content: "Make enumerations so complete and reviews so general that I might be assured that nothing is omitted." },
  { domain: "physics", content: "The laws of nature are established by God and follow from His immutability. Motion is conserved; nothing is lost." },
  { domain: "physics", content: "All physical phenomena can be explained mechanically through matter in motion. No occult qualities are needed." },
  { domain: "physics", content: "Animals are automata—complex machines without souls or genuine feeling. Only humans have minds." },
  { domain: "mathematics", content: "Mathematics provides the model for certain knowledge; its clarity and distinctness show the path to truth." },
  { domain: "mathematics", content: "Analytic geometry unites algebra and geometry; curves can be represented by equations and vice versa." },
  { domain: "mathematics", content: "Mathematical truths are known by intuition and deduction from self-evident principles." },
  { domain: "cartesian_circle", content: "Clear and distinct perceptions require God's existence to be trustworthy; yet God's existence is proven by clear perceptions. But this is not vicious—the Cogito is self-justifying." },
  { domain: "cartesian_circle", content: "Present clear and distinct perceptions need no divine guarantee; memory of past clear perceptions requires God's reliability." }
];

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function embedDescartesPositions() {
  console.log(`Starting to embed ${descartesPositions.length} Descartes positions...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < descartesPositions.length; i++) {
    const position = descartesPositions[i];
    
    try {
      const embedding = await generateEmbedding(position.content);
      
      await db.insert(paperChunks).values({
        figureId: "descartes",
        author: "René Descartes",
        paperTitle: `Descartes Position: ${position.domain.replace(/_/g, " ")}`,
        content: position.content,
        embedding: embedding,
        chunkIndex: i,
        domain: position.domain,
        significance: "HIGH",
      });
      
      successCount++;
      
      if ((i + 1) % 10 === 0) {
        console.log(`Progress: ${i + 1}/${descartesPositions.length} positions embedded`);
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

embedDescartesPositions()
  .then(() => {
    console.log("Descartes positions embedding finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

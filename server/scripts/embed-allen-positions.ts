import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "../../shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const allenPositions = [
  { domain: "thought_power", content: "As a man thinketh in his heart, so is he. Man is literally what he thinks, his character being the complete sum of all his thoughts." },
  { domain: "thought_power", content: "Mind is the master-weaver, both of the inner garment of character, and the outer garment of circumstance." },
  { domain: "thought_power", content: "Man is made or unmade by himself; in the armoury of thought he forges the weapons by which he destroys himself, or fashions the tools with which he builds for himself heavenly mansions of joy and strength and peace." },
  { domain: "thought_power", content: "Every thought-seed sown or allowed to fall into the mind, and to take root there, produces its own, blossoming sooner or later into act, and bearing its own fruitage of opportunity and circumstance." },
  { domain: "thought_power", content: "A man's mind may be likened to a garden, which may be intelligently cultivated or allowed to run wild; but whether cultivated or neglected, it must, and will, bring forth." },
  { domain: "thought_power", content: "Thought and character are one, and as character can only manifest and discover itself through environment and circumstance, the outer conditions of a person's life will always be found to be harmoniously related to his inner state." },
  { domain: "thought_power", content: "Man is the master of thought, the moulder of character, and the maker and shaper of condition, environment, and destiny." },
  { domain: "circumstance", content: "Circumstance does not make the man; it reveals him to himself. Men do not attract that which they want, but that which they are." },
  { domain: "circumstance", content: "Man is not the creature of circumstances; circumstances are creatures of men. We are free agents, and man is more powerful than matter." },
  { domain: "circumstance", content: "The outer world of circumstance shapes itself to the inner world of thought, and both pleasant and unpleasant external conditions are factors which make for the ultimate good of the individual." },
  { domain: "circumstance", content: "Good thoughts and actions can never produce bad results; bad thoughts and actions can never produce good results. This is but saying that nothing can come from corn but corn, nothing from nettles but nettles." },
  { domain: "circumstance", content: "Man is buffeted by circumstances so long as he believes himself to be the creature of outside conditions, but when he realizes that he may command the hidden soil and seeds of his being, he becomes the rightful master of himself." },
  { domain: "circumstance", content: "The soul attracts that which it secretly harbours; that which it loves, and also that which it fears. It reaches the height of its cherished aspirations; it falls to the level of its unchastened desires." },
  { domain: "self_mastery", content: "Self-control is strength. Right thought is mastery. Calmness is power." },
  { domain: "self_mastery", content: "The more tranquil a man becomes, the greater is his success, his influence, his power for good. Calmness of mind is one of the beautiful jewels of wisdom." },
  { domain: "self_mastery", content: "He who has conquered doubt and fear has conquered failure. His every thought is allied with power, and all difficulties are bravely met and wisely overcome." },
  { domain: "self_mastery", content: "A man only begins to be a man when he ceases to whine and revile, and commences to search for the hidden justice which regulates his life." },
  { domain: "self_mastery", content: "Suffering is always the effect of wrong thought in some direction. It is an indication that the individual is out of harmony with himself, with the Law of his being." },
  { domain: "self_mastery", content: "A man can only rise, conquer, and achieve by lifting up his thoughts. He can only remain weak, and abject, and miserable by refusing to lift up his thoughts." },
  { domain: "prosperity", content: "Men do not attract that which they want, but that which they are. A man's weakest thoughts about himself are those which he allows to think about him." },
  { domain: "prosperity", content: "There is no way to prosperity; prosperity is the way—when we walk rightly upon the path of righteous thinking." },
  { domain: "prosperity", content: "The law of prosperity is as definite as the law of gravitation. Poverty flows from greed and fear; prosperity from generosity and trust." },
  { domain: "prosperity", content: "To think lovingly, wisely, and unselfishly is to find the key to prosperity. Selfish acquisition is the way of loss." },
  { domain: "prosperity", content: "All that a man achieves and all that he fails to achieve is the direct result of his own thoughts." },
  { domain: "serenity", content: "Keep your hand firmly upon the helm of thought. In the bark of your soul reclines the commanding Master; He does but sleep: wake Him." },
  { domain: "serenity", content: "The serene man controls circumstances; the confused man is controlled by them. Only the calm mind can solve problems." },
  { domain: "serenity", content: "Tempest-tossed souls, wherever ye may be, under whatsoever conditions ye may live, know this—in the ocean of life the isles of Blessedness are smiling, and the sunny shore of your ideal awaits your coming." },
  { domain: "serenity", content: "That exquisite poise of character which we call serenity is the last lesson of culture, it is the flowering of life, the fruitage of the soul." },
  { domain: "serenity", content: "The calm man, having learned how to govern himself, knows how to adapt himself to others; and they, in turn, reverence his spiritual strength, and feel that they can learn of him and rely upon him." },
  { domain: "purpose", content: "Until thought is linked with purpose there is no intelligent accomplishment. With the majority the bark of thought is allowed to drift upon the ocean of life." },
  { domain: "purpose", content: "He who cherishes a beautiful vision, a lofty ideal in his heart, will one day realize it. Columbus cherished a vision of another world, and he discovered it." },
  { domain: "purpose", content: "The dreamers are the saviours of the world. As the visible world is sustained by the invisible, so men, through all their trials and sins and sordid vocations, are nourished by the beautiful visions of their solitary dreamers." },
  { domain: "purpose", content: "To put away aimlessness and weakness, and to begin to think with purpose, is to enter the ranks of those strong ones who only recognize failure as one of the pathways to attainment." },
  { domain: "health", content: "The body is the servant of the mind. It obeys the operations of the mind, whether they be deliberately chosen or automatically expressed." },
  { domain: "health", content: "Disease and health, like circumstances, are rooted in thought. Sickly thoughts will express themselves through a sickly body." },
  { domain: "health", content: "Strong, pure, and happy thoughts build up the body in vigour and grace. The body is a delicate and plastic instrument, which responds readily to the thoughts by which it is impressed." },
  { domain: "health", content: "Clean thoughts make clean habits. The so-called saint who does not wash his body is not a saint." },
  { domain: "vision", content: "Dream lofty dreams, and as you dream, so shall you become. Your Vision is the promise of what you shall one day be; your Ideal is the prophecy of what you shall at last unveil." },
  { domain: "vision", content: "The greatest achievement was at first and for a time a dream. The oak sleeps in the acorn; the bird waits in the egg." },
  { domain: "vision", content: "In all human affairs there are efforts, and there are results, and the strength of the effort is the measure of the result. Chance is not." },
  { domain: "peace", content: "The way of peace is the way of truth. To walk in it is to live the life of the spirit and so know life eternal." },
  { domain: "peace", content: "Perfect love casts out fear. To love is to have no fear. When love is come, fear is gone." },
  { domain: "peace", content: "Self is the sole obstruction to the boundless realization of Truth. The way of Truth lies through the death of self." },
  { domain: "achievement", content: "All that a man achieves and all that he fails to achieve is the direct result of his own thoughts." },
  { domain: "achievement", content: "A strong man cannot help a weaker unless that weaker is willing to be helped, and even then the weak man must become strong of himself." },
  { domain: "achievement", content: "He who would accomplish little must sacrifice little; he who would achieve much must sacrifice much; he who would attain highly must sacrifice greatly." }
];

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function embedAllenPositions() {
  console.log(`Starting to embed ${allenPositions.length} Allen positions...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < allenPositions.length; i++) {
    const position = allenPositions[i];
    
    try {
      const embedding = await generateEmbedding(position.content);
      
      await db.insert(paperChunks).values({
        figureId: "allen",
        author: "James Allen",
        paperTitle: `Allen Position: ${position.domain.replace(/_/g, " ")}`,
        content: position.content,
        embedding: embedding,
        chunkIndex: i,
        domain: position.domain,
        significance: "HIGH",
      });
      
      successCount++;
      
      if ((i + 1) % 10 === 0) {
        console.log(`Progress: ${i + 1}/${allenPositions.length} positions embedded`);
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

embedAllenPositions()
  .then(() => {
    console.log("Allen positions embedding finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

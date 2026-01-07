import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "../../shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const deweyPositions = [
  { domain: "pragmatism", content: "Ideas are not copies of a reality that exists independently of them; ideas are instruments, tools for reconstructing problematic situations." },
  { domain: "pragmatism", content: "Truth is not correspondence between thought and external reality; truth is what works, what successfully resolves the problematic situation that gave rise to inquiry." },
  { domain: "pragmatism", content: "All genuine inquiry begins with a felt difficulty, an indeterminate situation that disrupts the smooth flow of experience and demands resolution." },
  { domain: "pragmatism", content: "The scientific method is the pattern of all genuine knowing: identify a problem, form hypotheses, test through action, evaluate consequences, revise." },
  { domain: "pragmatism", content: "There is no spectator theory of knowledge; we are participants in the world, not observers of a reality external to us." },
  { domain: "pragmatism", content: "Thought arises in situations of uncertainty; it is an instrument for transforming indeterminate situations into determinate ones." },
  { domain: "pragmatism", content: "Meaning is not found in reference to fixed objects but in the practical consequences of ideas in use." },
  { domain: "pragmatism", content: "The traditional philosophical dualisms - mind/body, theory/practice, knowing/doing - are artificial separations that obstruct genuine inquiry." },
  { domain: "education", content: "Education is not preparation for life; education IS life. The school should be a genuine community of living and learning." },
  { domain: "education", content: "Learning occurs through experience - not passive reception but active engagement with problematic situations requiring thought and experiment." },
  { domain: "education", content: "Growth is the only moral end. Education should foster continuous growth - the capacity to learn from experience and apply it to future experience." },
  { domain: "education", content: "The child is not an empty vessel to be filled but an active agent whose interests and capacities must be the starting point of education." },
  { domain: "education", content: "Subject matter should not be imposed from without but should grow out of genuine problems encountered in meaningful activities." },
  { domain: "education", content: "Traditional education errs by separating school from life; progressive education errs when it abandons direction entirely. Both extremes fail." },
  { domain: "education", content: "The school should be a laboratory for democratic living, where children learn cooperative inquiry and shared problem-solving." },
  { domain: "education", content: "Play and work are not opposites; both involve purposive activity. Good education unites them in meaningful projects." },
  { domain: "education", content: "The teacher's role is not to transmit fixed knowledge but to guide inquiry, to help students identify problems and test solutions." },
  { domain: "education", content: "Vocational education should not be narrow job training; it should develop intelligence that can be applied across life situations." },
  { domain: "democracy", content: "Democracy is more than a form of government; it is a mode of associated living, a conjoint communicated experience." },
  { domain: "democracy", content: "A democratic society is one in which all members share in determining the conditions and aims of their associated life." },
  { domain: "democracy", content: "The cure for the ailments of democracy is more democracy - not retreat to authoritarian solutions." },
  { domain: "democracy", content: "Social intelligence - cooperative inquiry applied to shared problems - is the method of democracy." },
  { domain: "democracy", content: "Freedom is not the absence of constraint but the effective capacity to realize one's purposes through intelligent action." },
  { domain: "democracy", content: "Genuine individuality develops through participation in social life, not in isolation from it." },
  { domain: "democracy", content: "The scientific method extended to social problems is the democratic method: hypothesis, experiment, open criticism, revision." },
  { domain: "democracy", content: "A great society becomes a great community only when its members share meanings and values through communication." },
  { domain: "experience", content: "Experience is not passive reception of sensations; experience is the transaction between organism and environment." },
  { domain: "experience", content: "All experience is situational - it involves an organism in an environment, each modifying the other through interaction." },
  { domain: "experience", content: "Primary experience is had before it is known; reflection is a special mode of experience that arises when action is blocked." },
  { domain: "experience", content: "Thinking is not a separate faculty; it is a phase of experience, arising from problematic situations within experience." },
  { domain: "experience", content: "Continuity characterizes experience: each experience takes up something from those which have gone before and modifies what comes after." },
  { domain: "experience", content: "Aesthetic experience is the most complete form of experience - unified, consummatory, charged with meaning." },
  { domain: "inquiry", content: "Inquiry is the controlled transformation of an indeterminate situation into one that is determinate in its distinctions and relations." },
  { domain: "inquiry", content: "Logic is the theory of inquiry - the study of the forms that inquiry takes when it is successful." },
  { domain: "inquiry", content: "Facts and values are not separate domains; values arise in the course of inquiry and are tested by their consequences." },
  { domain: "inquiry", content: "Knowledge is always knowledge of how to proceed; it has an inherently practical character." },
  { domain: "inquiry", content: "Warranted assertibility, not fixed truth, is the outcome of successful inquiry." },
  { domain: "nature", content: "Nature is not merely physical matter; nature includes mind, society, culture - all that emerges through natural processes." },
  { domain: "nature", content: "Mind is not a separate substance; it is a natural emergence, a complex of habits developed through social interaction." },
  { domain: "nature", content: "Human beings are continuous with nature; we are natural creatures using natural means to achieve natural ends." },
  { domain: "ethics", content: "Moral rules are not eternal truths but instruments that have proved useful in resolving practical problems." },
  { domain: "ethics", content: "Ethics is not about fixed ends but about intelligent choice of means to ends that are themselves revisable." },
  { domain: "ethics", content: "Habit, not abstract reason, is the primary factor in moral life. Character is a set of habits." },
  { domain: "ethics", content: "The distinction between intrinsic and instrumental value is relative, not absolute. Ends become means and means become ends." },
  { domain: "art", content: "Art is not separate from ordinary experience; it is experience brought to its fullest expression and meaning." },
  { domain: "art", content: "Aesthetic quality pervades all genuine experience - the moment of consummation when activity achieves unified meaning." },
  { domain: "art", content: "The work of art is what the product does in experience; it is not an object but an event." },
  { domain: "religion", content: "Religious quality is not confined to supernatural beliefs; it is any unifying experience of the self with the world." },
  { domain: "religion", content: "The religious attitude is one of imaginative projection of the ideal possibilities of experience." }
];

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function embedDeweyPositions() {
  console.log(`Starting to embed ${deweyPositions.length} Dewey positions...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < deweyPositions.length; i++) {
    const position = deweyPositions[i];
    
    try {
      const embedding = await generateEmbedding(position.content);
      
      await db.insert(paperChunks).values({
        figureId: "dewey",
        author: "John Dewey",
        paperTitle: `Dewey Position: ${position.domain.replace(/_/g, " ")}`,
        content: position.content,
        embedding: embedding,
        chunkIndex: i,
        domain: position.domain,
        significance: "HIGH",
      });
      
      successCount++;
      
      if ((i + 1) % 10 === 0) {
        console.log(`Progress: ${i + 1}/${deweyPositions.length} positions embedded`);
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

embedDeweyPositions()
  .then(() => {
    console.log("Dewey positions embedding finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

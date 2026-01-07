import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "../../shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const millPositions = [
  { domain: "induction", content: "All inference is fundamentally from particulars to particulars; general propositions are merely registers of such inferences already made and short formulae for making more." },
  { domain: "induction", content: "The foundation of all rules of induction is the uniformity of nature—the assumption that what happens once will, under sufficient similarity of circumstances, happen again." },
  { domain: "induction", content: "Induction is the process by which we conclude that what is true of certain individuals of a class is true of the whole class, or that what is true at certain times will be true under similar circumstances at all times." },
  { domain: "induction", content: "The uniformity of nature is itself an induction, but it is the most fundamental induction upon which all other inductions depend." },
  { domain: "induction", content: "The warrant for inductive inference is not the number of confirming instances alone but the variety of circumstances under which those instances have been observed." },
  { domain: "induction", content: "A single instance may suffice for a complete induction when the circumstances are such that one well-observed case eliminates all reasonable alternative explanations." },
  { domain: "empiricism", content: "All knowledge originates in experience; there is nothing in the intellect that was not first in the senses, including the intellect's knowledge of itself." },
  { domain: "empiricism", content: "Experience is the ultimate source of all our knowledge, including our knowledge of mental operations and logical relations." },
  { domain: "empiricism", content: "The mind at birth is not furnished with innate ideas but is shaped entirely by the experiences it subsequently undergoes." },
  { domain: "empiricism", content: "Every science, including logic and mathematics, rests ultimately on facts ascertained by observation and experiment." },
  { domain: "empiricism", content: "What we know of causation we know entirely from experience; we have no insight into why causes produce their effects." },
  { domain: "empiricism", content: "The test of all truth is experience—not the individual's fleeting impressions but the accumulated and verified experience of mankind." },
  { domain: "logic", content: "Logic is the science of the operations of the understanding in the pursuit of truth; it is the theory of correct reasoning." },
  { domain: "logic", content: "The syllogism does not prove the conclusion from the premises but merely registers an inference already drawn from particulars." },
  { domain: "logic", content: "All reasoning is from particulars to particulars; general propositions are intermediate steps that abbreviate and systematize such reasoning." },
  { domain: "logic", content: "Causation is invariable, unconditional sequence; a cause is the sum total of the conditions positive and negative taken together." },
  { domain: "utilitarianism", content: "The Greatest Happiness Principle holds that actions are right in proportion as they tend to promote happiness, wrong as they tend to produce the reverse of happiness." },
  { domain: "utilitarianism", content: "Happiness is intended pleasure and the absence of pain; unhappiness is pain and the privation of pleasure." },
  { domain: "utilitarianism", content: "It is better to be Socrates dissatisfied than a fool satisfied. Higher pleasures are qualitatively superior to lower ones." },
  { domain: "utilitarianism", content: "Pleasures differ in quality as well as quantity. Competent judges who have experienced both invariably prefer intellectual and moral pleasures over merely bodily ones." },
  { domain: "utilitarianism", content: "The utilitarian standard is not the agent's own greatest happiness but the greatest amount of happiness altogether." },
  { domain: "utilitarianism", content: "Virtue may be desired disinterestedly as part of happiness; through association, virtue becomes inseparable from happiness." },
  { domain: "liberty", content: "The only purpose for which power can rightfully be exercised over any member of a civilized community, against his will, is to prevent harm to others." },
  { domain: "liberty", content: "Over himself, over his own body and mind, the individual is sovereign." },
  { domain: "liberty", content: "The liberty of the individual must be thus far limited: he must not make himself a nuisance to other people." },
  { domain: "liberty", content: "There is a sphere of action in which society has only an indirect interest—the sphere of self-regarding conduct." },
  { domain: "liberty", content: "If all mankind minus one were of one opinion, and only one person were of the contrary opinion, mankind would be no more justified in silencing that one person than he would be justified in silencing mankind." },
  { domain: "liberty", content: "The peculiar evil of silencing the expression of an opinion is that it is robbing the human race—posterity as well as the existing generation—of the opportunity to exchange error for truth." },
  { domain: "liberty", content: "Complete liberty of contradicting and disproving our opinion is the very condition which justifies us in assuming its truth for purposes of action." },
  { domain: "liberty", content: "The tyranny of the majority is among the evils against which society requires to be on its guard." },
  { domain: "liberty", content: "Eccentricity has always abounded when and where strength of character has abounded; and the amount of eccentricity in a society has been proportional to the amount of genius, mental vigor, and moral courage it contained." },
  { domain: "political_economy", content: "The laws of production are real laws of nature; the distribution of wealth is a matter of human institution." },
  { domain: "political_economy", content: "Laissez-faire should be the general practice; departure from it is always a probable evil unless required by some great good." },
  { domain: "political_economy", content: "The stationary state of capital and population is not necessarily a state of stagnation; it may be the beginning of the best era of human progress." },
  { domain: "political_economy", content: "Workers' cooperative associations offer the best hope for improving the condition of the laboring classes." },
  { domain: "womens_rights", content: "The legal subordination of one sex to the other is wrong in itself, and one of the chief hindrances to human improvement." },
  { domain: "womens_rights", content: "The principle which regulates the existing social relations between the two sexes—the legal subordination of one sex to the other—ought to be replaced by a principle of perfect equality." },
  { domain: "womens_rights", content: "What is now called the nature of women is an eminently artificial thing—the result of forced repression in some directions, unnatural stimulation in others." },
  { domain: "rationalism", content: "There are no truths cognizable by the mind's inward light that are not derived from experience, whether of the external world or of internal consciousness." },
  { domain: "rationalism", content: "The intuitionists erroneously attribute to direct apprehension what is actually the result of association and inference so habitual as to seem immediate." },
  { domain: "rationalism", content: "What rationalists call necessary truths are in fact generalizations from experience so uniform that we cannot imagine their falsity—but this inability is psychological, not logical." },
  { domain: "rationalism", content: "That we cannot conceive a thing is no proof that it cannot exist; inconceivability is a fact about our minds, not about reality." },
  { domain: "methods", content: "The Method of Agreement: If two or more instances of a phenomenon have only one circumstance in common, that circumstance is the cause or effect of the phenomenon." },
  { domain: "methods", content: "The Method of Difference: If an instance in which the phenomenon occurs, and an instance in which it does not occur, have every circumstance in common save one, that one is the cause or effect of the phenomenon." },
  { domain: "methods", content: "The Joint Method of Agreement and Difference: Combines both methods for stronger causal inference." },
  { domain: "methods", content: "The Method of Residues: Subduct from any phenomenon such part as is known to be the effect of certain antecedents, and the residue is the effect of the remaining antecedents." },
  { domain: "methods", content: "The Method of Concomitant Variations: Whatever phenomenon varies in any manner whenever another phenomenon varies in some particular manner, is either a cause or an effect of that phenomenon." }
];

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function embedMillPositions() {
  console.log(`Starting to embed ${millPositions.length} Mill positions...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < millPositions.length; i++) {
    const position = millPositions[i];
    
    try {
      const embedding = await generateEmbedding(position.content);
      
      await db.insert(paperChunks).values({
        figureId: "mill",
        author: "John Stuart Mill",
        paperTitle: `Mill Position: ${position.domain.replace(/_/g, " ")}`,
        content: position.content,
        embedding: embedding,
        chunkIndex: i,
        domain: position.domain,
        significance: "HIGH",
      });
      
      successCount++;
      
      if ((i + 1) % 10 === 0) {
        console.log(`Progress: ${i + 1}/${millPositions.length} positions embedded`);
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

embedMillPositions()
  .then(() => {
    console.log("Mill positions embedding finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

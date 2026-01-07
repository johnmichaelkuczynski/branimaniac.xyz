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

interface FreudSection {
  title: string;
  sourceWork: string;
  positions: string[];
}

async function embedFreudMechanisms() {
  console.log("Starting Freud Specific Mechanisms Position Statements embedding...");
  
  const sections: FreudSection[] = [
    {
      title: "Fetishism: The Precise Mechanism",
      sourceWork: "Freud - Fetishism Position Statements",
      positions: [
        "The fetish is a substitute for the mother's penis—the penis the little boy once believed in and does not want to give up.",
        "The boy's discovery that the mother lacks a penis is experienced as a catastrophic threat to his own organ.",
        "Fetishism employs disavowal (Verleugnung), not repression: the boy simultaneously knows the mother has no penis and refuses to accept this knowledge.",
        "The fetish object is typically the last thing seen before the traumatic sight of the female genitals—the shoe, the undergarment, the fur.",
        "The fetish is both a memorial to castration and a token of triumph over the threat of castration.",
        "The fetish allows the boy to retain belief in the maternal phallus while also acknowledging (in another part of the mind) its absence.",
        "Fetishism involves a splitting of the ego: two incompatible attitudes persist side by side without influencing each other.",
        "The shine on the nose (Glanz auf der Nase) case demonstrates how a fetish can derive from a forgotten phrase preserved through linguistic transformation.",
        "The choice of fetish is not arbitrary but determined by the last impression received before the traumatic discovery.",
        "Fur and velvet fix the sight of pubic hair, which should have been followed by the longed-for sight of the female member.",
        "The foot or shoe owes its preference as a fetish to the circumstance that the boy peered at the woman's genitals from below, from her legs up.",
        "Pieces of underclothing crystallize the moment of undressing, the last moment at which the woman could still be regarded as phallic.",
        "The fetishist can tolerate the anatomical reality in some dissociated part of his mind while his sexual life depends on denying it.",
        "The fetish saves the fetishist from becoming homosexual by endowing women with the characteristic that makes them tolerable as sexual objects.",
        "Without the fetish, the fetishist could not achieve sexual satisfaction with women because their lack of a penis makes them unacceptable.",
        "The horror of castration sets up a memorial to itself by creating the fetish-substitute.",
        "Disavowal is always supplemented by an acknowledgment; two contrary attitudes always persist.",
        "In later life, the fetishist enjoys an advantage: the fetish is easily accessible, obtainable, and the sexual satisfaction connected with it comfortable.",
        "The fetish remains a token of triumph over the threat of castration and a protection against it.",
        "Cutting off the hair and the act of blinding are symbolic substitutes for castration, and the fear of them derives from castration anxiety."
      ]
    },
    {
      title: "Disavowal Versus Repression",
      sourceWork: "Freud - Disavowal vs Repression Position Statements",
      positions: [
        "Disavowal (Verleugnung) concerns external reality—specifically, the perception of the mother's lack of penis.",
        "Repression (Verdrängung) concerns internal instinctual demands and their ideational representatives.",
        "In disavowal, the perception is registered but its significance is refused; in repression, the ideational content is pushed out of consciousness.",
        "Disavowal results in the splitting of the ego; repression results in the return of the repressed through symptoms.",
        "Neurosis is the result of repression; fetishism and psychosis involve disavowal.",
        "The psychotic disavows reality and replaces it with delusion; the fetishist disavows a specific perception while otherwise maintaining reality-testing.",
        "Disavowal permits two contradictory beliefs to coexist without mutual influence.",
        "The splitting produced by disavowal is not the same as neurotic dissociation; it is a permanent structural division in the ego.",
        "The ego's defensive achievement in disavowal comes at the price of a rift in itself that will never heal.",
        "Repression defends against instinct; disavowal defends against perception."
      ]
    },
    {
      title: "Castration Complex: Detailed Mechanism",
      sourceWork: "Freud - Castration Complex Position Statements",
      positions: [
        "The castration complex is the nucleus of all neuroses.",
        "The boy's castration anxiety is activated by the sight of female genitals, which confirm the threat he may have previously dismissed.",
        "Threats of castration, often delivered in response to masturbation, become retroactively significant after the sight of female genitals.",
        "The castration complex in boys takes the form of castration anxiety; in girls, it takes the form of penis envy.",
        "The boy enters the Oedipus complex through the castration complex; he renounces the mother to preserve his penis.",
        "The girl enters the Oedipus complex through the castration complex; she turns to the father in hope of obtaining the missing penis.",
        "Castration anxiety is not fear of a realistic danger but fear tied to the loss of an erotogenic zone.",
        "The boy phantasizes that the girl once had a penis and lost it through castration—a theory that preserves the universality of the penis.",
        "The sight of the female genitals may produce horror, contempt, or triumph, but always relates to the castration complex.",
        "The phallic phase is the period during which the child knows only one genital organ—the male one—and the castration complex develops.",
        "The mother is imagined as phallic before the traumatic discovery; afterward, the boy must either disavow, accept, or compromise.",
        "The father becomes the agent of castration even when mothers or nurses made the original threats.",
        "Fear of being eaten by the father is a regressive transformation of castration anxiety.",
        "Blinding, tooth extraction, decapitation, and hair-cutting in myths and dreams are symbolic equivalents of castration.",
        "The castration complex is phylogenetically inherited; threats merely activate a predisposition."
      ]
    },
    {
      title: "Perversions: Specific Mechanisms",
      sourceWork: "Freud - Perversions Position Statements",
      positions: [
        "Perversions are the negative of neuroses: what is repressed in neurosis is enacted in perversion.",
        "The pervert does directly what the neurotic accomplishes through symptom-formation.",
        "Perversions represent fixations at or regressions to component instincts that precede genital primacy.",
        "Sadism is the aggressive component of the sexual instinct become independent and exaggerated.",
        "Masochism is sadism turned against the self through reversal and turning round.",
        "Primary masochism is the death instinct remaining within the organism, bound with libido; secondary masochism is externalized aggression re-internalized.",
        "Voyeurism (scopophilia) is an active perversion; exhibitionism is its passive counterpart.",
        "Voyeurism is the eroticization of looking; its sublimation becomes intellectual curiosity.",
        "Exhibitionism always contains the unconscious wish to see the other's genitals in return.",
        "The three forms of masochism are erotogenic, feminine, and moral masochism.",
        "Moral masochism represents unconscious guilt seeking punishment; the superego becomes the sadistic agent.",
        "The polymorphous perversity of the child demonstrates that perversions are not degenerations but developmental arrests or regressions.",
        "Perverse sexuality becomes pathological when it excludes genital primacy, becomes fixed, and serves as the exclusive means of satisfaction.",
        "The component instincts—oral, anal, scopophilic, sadistic—normally become subordinated to genital primacy; in perversion, they dominate.",
        "Homosexuality is not a single condition but comprises multiple etiologies, including narcissistic object choice, fixation on the mother, and identification with her.",
        "In one common homosexual etiology, the boy identifies with the mother and takes himself as a love object, seeking young men to love as his mother loved him.",
        "The homosexual has not abandoned the mother; he identifies with her and seeks objects that represent his childhood self.",
        "Fetishism is the model perversion because it most clearly illustrates both the defensive function and the substitute-formation."
      ]
    },
    {
      title: "The Splitting of the Ego",
      sourceWork: "Freud - Splitting of the Ego Position Statements",
      positions: [
        "The ego, faced with an incompatible demand from reality and instinct, can split itself rather than choose.",
        "One part of the ego acknowledges reality; another part disavows it—both persist without synthesis.",
        "The split in the ego does not heal; it increases over time.",
        "The formation of a fetish is achieved through a process that recalls the halting of memory in traumatic amnesia.",
        "The boy's interest comes to a halt midway; the last impression before the uncanny traumatic one is retained as a fetish.",
        "The splitting of the ego is the price paid for the otherwise successful defense.",
        "Both the disavowal and the acknowledgment enter into the formation of the fetish.",
        "The split ego is not two full egos but one ego with a fault line running through it.",
        "The ego may employ splitting as a regular defensive process beyond fetishism—in psychosis, in certain character formations.",
        "The synthetic function of the ego fails in the face of certain developmental challenges; splitting is the result."
      ]
    },
    {
      title: "Anxiety: Precise Formulations",
      sourceWork: "Freud - Anxiety Position Statements",
      positions: [
        "Anxiety is the ego's response to danger; it signals the presence of a threatening situation.",
        "Realistic anxiety is fear of an external danger; neurotic anxiety is fear of an internal instinctual demand.",
        "The prototype of all anxiety is the birth trauma—the infant's first experience of overwhelming stimulation.",
        "Castration anxiety is the specific form of anxiety that dominates the phallic phase.",
        "Fear of loss of love is the girl's equivalent of the boy's castration anxiety.",
        "The sequence of danger situations: birth, loss of the object, loss of the object's love, castration, superego condemnation.",
        "Anxiety is transformed libido; when libido cannot be discharged, it becomes anxiety.",
        "Later formulation: anxiety is not transformed libido but a signal produced by the ego to mobilize repression.",
        "Signal anxiety is a small dose of unpleasure used by the ego to prevent a larger unpleasure.",
        "Phobias represent anxiety displaced from an internal danger (the instinct) to an external one (the phobic object).",
        "Little Hans's horse phobia displaced castration anxiety (from the father) onto an external avoidable object.",
        "The symptom is formed to avoid the anxiety-situation; the anxiety signals the danger.",
        "Free-floating anxiety indicates that repression has failed; the ego is overwhelmed by undischarged instinctual tension.",
        "The repetition of anxiety dreams contradicts the wish-fulfillment theory but serves the compulsion to repeat and the need to master trauma."
      ]
    },
    {
      title: "Defense Mechanisms: Specific Operations",
      sourceWork: "Freud - Defense Mechanisms Position Statements",
      positions: [
        "Repression proper excludes ideational representatives of instinct from consciousness.",
        "Primal repression is the initial exclusion of instinctual representatives that have never been conscious.",
        "After-pressure (Nachdrängung) is the ongoing effort required to maintain repression.",
        "Repression operates on the ideational representative, not on the affect; the affect may be transformed, displaced, or converted.",
        "Reaction formation transforms an impulse into its opposite: sadism into excessive gentleness, anal eroticism into orderliness.",
        "Isolation separates an idea from its affect; the obsessional remembers the traumatic event but feels nothing.",
        "Undoing attempts to annul an action or thought by performing a contrary action—magical thinking in motor form.",
        "Regression retreats from a later to an earlier libidinal position when the later position encounters obstacles.",
        "Projection attributes to another person impulses or qualities that the subject cannot accept in himself.",
        "Introjection incorporates external objects or their qualities into the ego.",
        "Identification with the aggressor adopts the attributes of the threatening figure to master anxiety.",
        "Turning against the self redirects aggression from an external object to oneself—the mechanism of depression.",
        "Reversal into the opposite transforms sadism into masochism, voyeurism into exhibitionism.",
        "Sublimation deflects instinctual energy toward non-sexual, socially valued aims without repression.",
        "Denial (Verneinung) allows repressed content to become conscious in negated form: 'It is not my mother.'",
        "Rationalization provides pseudo-logical explanations for behavior whose true motives remain unconscious."
      ]
    },
    {
      title: "Symptom Formation: Detailed Mechanisms",
      sourceWork: "Freud - Symptom Formation Position Statements",
      positions: [
        "The symptom is a compromise between the repressed wish and the repressing force.",
        "Every symptom simultaneously expresses the forbidden impulse and the defense against it.",
        "Symptoms are overdetermined—they serve multiple unconscious purposes and derive from multiple sources.",
        "Hysterical conversion transforms psychical conflict into bodily symptoms; the symptom symbolizes the repressed.",
        "The hysterical symptom often represents both sides of a sexual act—the patient plays both roles.",
        "Anna O.'s paralyzed arm symbolized both the forbidden wish and the punishment for it.",
        "Obsessional symptoms employ displacement: the idea is conscious but the affect is displaced to a trivial substitute.",
        "The obsessional's ceremonial is a private religion; the symptom represents both temptation and expiation.",
        "Phobic symptoms bind anxiety to a specific external object that can be avoided.",
        "The choice of neurosis—hysteria, obsessional neurosis, paranoia—depends on fixation points and regression depths.",
        "Hysteria involves regression to the genital and phallic phases; obsessional neurosis to the anal-sadistic phase.",
        "The return of the repressed is the eruption of unconscious content through the barrier of repression in distorted form.",
        "Symptoms are memory-symbols; they commemorate traumatic experiences or forbidden wishes.",
        "The gain from illness (primary and secondary) makes symptoms resistant to cure.",
        "Primary gain is the intrapsychic advantage; secondary gain is the external advantage (attention, avoidance of responsibility)."
      ]
    },
    {
      title: "Transference: Precise Formulations",
      sourceWork: "Freud - Transference Position Statements",
      positions: [
        "Transference is the displacement of feelings and attitudes from past figures—especially parents—onto the analyst.",
        "Transference is not an artifact of analysis; it is a universal phenomenon that analysis merely makes visible.",
        "Positive transference includes affectionate and erotic feelings; negative transference includes hostile feelings.",
        "The transference neurosis replaces the original neurosis; the patient's conflicts are now lived out in relation to the analyst.",
        "Transference is both the greatest obstacle and the most powerful therapeutic instrument.",
        "Resistance often manifests through transference—the patient acts out rather than remembers.",
        "The transference must be resolved, not gratified; gratification perpetuates rather than cures.",
        "The analyst becomes a screen upon which the patient projects figures from his internal world.",
        "Counter-transference is the analyst's unconscious reaction to the patient's transference.",
        "Unanalyzed counter-transference distorts the analyst's perception and response; ongoing self-analysis is required.",
        "Transference love is genuine love but is provoked by the analytic situation and serves resistance.",
        "The patient who falls in love with the analyst is repeating an infantile pattern rather than generating new feeling.",
        "Negative therapeutic reaction is improvement followed by worsening, driven by unconscious guilt and masochism.",
        "Working through is the repeated confrontation with resistances that allows insight to produce lasting change."
      ]
    },
    {
      title: "Dreams: Specific Mechanisms",
      sourceWork: "Freud - Dreams Position Statements",
      positions: [
        "The dream is the guardian of sleep; it permits the discharge of wishes that would otherwise wake the sleeper.",
        "The manifest content is the dream as remembered; the latent content is the unconscious thoughts behind it.",
        "The dream-work transforms latent into manifest through condensation, displacement, considerations of representability, and secondary revision.",
        "Condensation combines multiple latent elements into a single manifest element; every dream element is overdetermined.",
        "Displacement shifts psychical intensity from significant to trivial elements, disguising the true wish.",
        "Considerations of representability translate abstract thoughts into concrete visual images.",
        "Secondary revision imposes narrative coherence on the irrational products of the other mechanisms.",
        "The day's residue provides the material onto which unconscious infantile wishes attach.",
        "Every dream is a wish-fulfillment, though punishment dreams fulfill the wish of the superego.",
        "Dreams of the death of loved ones fulfill infantile death wishes that have been repressed.",
        "The navel of the dream is the point at which interpretation must stop—the connection to the unknown.",
        "Typical dreams (falling, flying, nakedness, examination) derive from universal human experiences and conflicts.",
        "The dream symbol is a constant relationship between a manifest element and its latent meaning.",
        "Symbols represent primarily the body, parents, birth, death, and sexuality.",
        "All elongated objects represent the male organ; all hollow objects represent the female.",
        "The dream employs archaic modes of thought that persist in the unconscious.",
        "Dreams of infantile scenes may be constructions rather than memories—screen memories in dream form."
      ]
    },
    {
      title: "The Oedipus Complex: Complete Formulation",
      sourceWork: "Freud - Oedipus Complex Position Statements",
      positions: [
        "The Oedipus complex is the nucleus of every neurosis.",
        "The boy desires exclusive possession of the mother and wishes to eliminate the rival father.",
        "The complex is resolved through castration anxiety: the boy renounces the mother to save his penis.",
        "The dissolution of the Oedipus complex creates the superego through identification with the father.",
        "The girl's Oedipus complex begins with the discovery that she lacks a penis and blames the mother.",
        "The girl turns to the father hoping to receive from him the penis the mother failed to provide.",
        "The wish for a penis is transformed into the wish for a child, especially a male child.",
        "The girl's Oedipus complex is not destroyed by castration anxiety but lingers, slowly fading or remaining partially unresolved.",
        "The negative Oedipus complex involves desire for the same-sex parent and rivalry with the opposite-sex parent.",
        "The complete Oedipus complex is fourfold: positive and negative forms for both parents.",
        "Pre-Oedipal attachment to the mother is especially intense and formative in girls.",
        "The mother is the first seducer; her care of the infant's body produces erotic sensations.",
        "The Oedipus complex is not merely discovered but constructed through the intersection of desire and prohibition.",
        "Phylogenetic inheritance transmits the Oedipus complex; it recapitulates the primal crime of father-murder.",
        "The totemic meal commemorates the murder and incorporation of the primal father by the brother clan.",
        "Totem and Taboo traces the origin of religion, morality, and social organization to the Oedipal situation."
      ]
    },
    {
      title: "The Death Instinct and Beyond the Pleasure Principle",
      sourceWork: "Freud - Death Instinct Position Statements",
      positions: [
        "Beyond the pleasure principle lies the compulsion to repeat, which serves the death instinct.",
        "The death instinct (Thanatos) seeks to return living matter to an inorganic state.",
        "The life instinct (Eros) seeks to bind, unite, and preserve life.",
        "The two fundamental instincts are locked in perpetual conflict within every organism.",
        "Sadism is the death instinct deflected outward onto external objects.",
        "Masochism is the death instinct remaining within, bound with libido.",
        "The compulsion to repeat overrides the pleasure principle; patients repeat painful experiences.",
        "Traumatic neurosis demonstrates the compulsion to repeat experiences that were never pleasurable.",
        "The repetition compulsion is more primitive than the pleasure principle; it serves the instincts themselves.",
        "Children's repetitive play represents an attempt to master overwhelming experiences through active repetition.",
        "The fort-da game transforms passivity into activity: the child controls the mother's disappearance symbolically.",
        "The conservative nature of instinct is the tendency to restore an earlier state of things.",
        "If the goal of life is death, organisms seek to die in their own way—the detour to death.",
        "Civilization requires the renunciation and sublimation of both sexual and aggressive instincts.",
        "Aggression is the chief obstacle to civilization; guilt is civilization's method of controlling aggression.",
        "The superego turns aggression against the self, producing the sense of guilt that torments civilized humanity."
      ]
    }
  ];

  let totalEmbedded = 0;
  const batchSize = 5;

  for (const section of sections) {
    console.log(`\nProcessing section: ${section.title}`);
    
    for (let i = 0; i < section.positions.length; i += batchSize) {
      const batch = section.positions.slice(i, i + batchSize);
      
      for (const position of batch) {
        try {
          const embedding = await getEmbedding(position);
          
          await db.insert(paperChunks).values({
            figureId: "freud",
            author: "Sigmund Freud",
            paperTitle: section.sourceWork,
            content: position,
            embedding: embedding,
            chunkIndex: totalEmbedded,
            domain: section.title.toLowerCase().replace(/[:\s]+/g, "_"),
            sourceWork: section.sourceWork,
            significance: "HIGH"
          });
          
          totalEmbedded++;
          console.log(`Embedded position ${totalEmbedded}: ${position.substring(0, 50)}...`);
        } catch (error) {
          console.error(`Error embedding position: ${position.substring(0, 50)}...`, error);
        }
      }
      
      if (i + batchSize < section.positions.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  console.log(`\n=== Freud Mechanisms Embedding Complete ===`);
  console.log(`Total positions embedded: ${totalEmbedded}`);
  console.log(`Sections processed: ${sections.length}`);
}

embedFreudMechanisms()
  .then(() => {
    console.log("Freud mechanisms embedding script completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error running Freud mechanisms embedding script:", error);
    process.exit(1);
  });

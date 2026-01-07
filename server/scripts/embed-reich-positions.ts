import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "../../shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const reichPositions = [
  // CHARACTER ANALYSIS (20 positions)
  {
    domain: "character_analysis",
    content: "Character is a defensive armor against anxiety and impulses."
  },
  {
    domain: "character_analysis",
    content: "Resistances manifest in character attitudes, not just content."
  },
  {
    domain: "character_analysis",
    content: "Analyze character before interpreting unconscious material."
  },
  {
    domain: "character_analysis",
    content: "Muscular armor parallels psychic armor."
  },
  {
    domain: "character_analysis",
    content: "Chronic muscular tensions block emotional expression."
  },
  {
    domain: "character_analysis",
    content: "Character types include hysterical, compulsive, and phallic-narcissistic."
  },
  {
    domain: "character_analysis",
    content: "Dissolving armor restores emotional mobility."
  },
  {
    domain: "character_analysis",
    content: "Positive transference hides negative character resistances."
  },
  {
    domain: "character_analysis",
    content: "Character analysis reveals the function of symptoms."
  },
  {
    domain: "character_analysis",
    content: "Healthy character allows free flow of energy and emotions."
  },
  {
    domain: "character_analysis",
    content: "Character armor functions as a chronic frozen resistance."
  },
  {
    domain: "character_analysis",
    content: "Interpretation must always address the how before the why."
  },
  {
    domain: "character_analysis",
    content: "Somatic attitudes reveal character more reliably than verbal content."
  },
  {
    domain: "character_analysis",
    content: "Segmental arrangement of armor follows developmental chronology."
  },
  {
    domain: "character_analysis",
    content: "Negative character traits protect against positive transference dissolution."
  },
  {
    domain: "character_analysis",
    content: "Armor reduction increases anxiety tolerance and energy flow."
  },
  {
    domain: "character_analysis",
    content: "Patient's boredom or politeness often masks deepest resistance."
  },
  {
    domain: "character_analysis",
    content: "Genital character emerges only after complete armor removal."
  },
  {
    domain: "character_analysis",
    content: "The 'red thread' of character resistance must be followed consistently throughout treatment."
  },
  {
    domain: "character_analysis",
    content: "Therapeutic breakthrough occurs when armor dissolution permits genuine affective contact."
  },
  // ORGASM FUNCTION (20 positions)
  {
    domain: "orgasm_function",
    content: "Full orgastic potency is essential for psychological health."
  },
  {
    domain: "orgasm_function",
    content: "Orgasm involves complete involuntary discharge of sexual excitation."
  },
  {
    domain: "orgasm_function",
    content: "Orgastic impotence causes stasis of libido and neurosis."
  },
  {
    domain: "orgasm_function",
    content: "Libido is measurable biological energy."
  },
  {
    domain: "orgasm_function",
    content: "Pleasure anxiety blocks orgastic potency."
  },
  {
    domain: "orgasm_function",
    content: "Neuroses result from dammed-up sexual energy."
  },
  {
    domain: "orgasm_function",
    content: "Orgasm regulates vegetative energy balance."
  },
  {
    domain: "orgasm_function",
    content: "Moralistic repression prevents orgastic satisfaction."
  },
  {
    domain: "orgasm_function",
    content: "Healthy sexuality requires freedom from guilt and fear."
  },
  {
    domain: "orgasm_function",
    content: "Orgastic potency enables natural self-regulation."
  },
  {
    domain: "orgasm_function",
    content: "The orgasm formula is tension-charge-discharge-relaxation."
  },
  {
    domain: "orgasm_function",
    content: "Involuntary convulsions distinguish true orgasm from mere discharge."
  },
  {
    domain: "orgasm_function",
    content: "Stasis neurosis arises universally from orgastic impotence."
  },
  {
    domain: "orgasm_function",
    content: "Pleasure function expands; anxiety function contracts the organism."
  },
  {
    domain: "orgasm_function",
    content: "Capacity for surrender determines depth of orgastic experience."
  },
  {
    domain: "orgasm_function",
    content: "Full orgasm dissolves residual muscular and character armor."
  },
  {
    domain: "orgasm_function",
    content: "Orgastic potency is the capacity for complete surrender."
  },
  {
    domain: "orgasm_function",
    content: "Partial gratification maintains chronic excitation stasis."
  },
  {
    domain: "orgasm_function",
    content: "Blocked orgastic potency leads to secondary perverse drives."
  },
  {
    domain: "orgasm_function",
    content: "Capacity for love depends on orgastic potency."
  },
  // MUSCULAR ARMORING (15 positions)
  {
    domain: "muscular_armoring",
    content: "Armor exists simultaneously in psychic and somatic realms."
  },
  {
    domain: "muscular_armoring",
    content: "Systematic dissolution of armor proceeds segment by segment."
  },
  {
    domain: "muscular_armoring",
    content: "The ocular segment includes forehead, eyes, and cheekbones and its armoring produces contactlessness."
  },
  {
    domain: "muscular_armoring",
    content: "The oral segment encompasses lips, chin, and throat and suppresses crying and biting impulses."
  },
  {
    domain: "muscular_armoring",
    content: "The diaphragmatic block is the central obstacle to full respiratory and orgastic function."
  },
  {
    domain: "muscular_armoring",
    content: "The pelvic segment contains the deepest anxiety and its dissolution releases full orgastic function."
  },
  {
    domain: "muscular_armoring",
    content: "Premature attack on deep armor produces overwhelming anxiety without resolution."
  },
  {
    domain: "muscular_armoring",
    content: "Chronic armoring consumes biological energy that would otherwise be available for life."
  },
  {
    domain: "muscular_armoring",
    content: "The difference between spastic and flaccid armor reflects different defensive strategies."
  },
  {
    domain: "muscular_armoring",
    content: "Ocular armoring is the earliest and produces the most severe pathology."
  },
  {
    domain: "muscular_armoring",
    content: "Armoring of the diaphragm produces the characteristic split between chest and abdomen."
  },
  {
    domain: "muscular_armoring",
    content: "Retracted pelvis is nearly universal in armored individuals."
  },
  {
    domain: "muscular_armoring",
    content: "Complete dissolution of armor restores full bioenergetic mobility and orgastic potency."
  },
  {
    domain: "muscular_armoring",
    content: "Each segment of armor corresponds to specific developmental stages and conflicts."
  },
  {
    domain: "muscular_armoring",
    content: "The cervical segment blocks impulses to cry out and armors against reaching with the head."
  },
  // MASS PSYCHOLOGY OF FASCISM (15 positions)
  {
    domain: "fascism",
    content: "Fascism appeals to repressed sexual urges in the masses."
  },
  {
    domain: "fascism",
    content: "Authoritarian family structure breeds fascist character."
  },
  {
    domain: "fascism",
    content: "Sexual repression creates mystical and irrational thinking."
  },
  {
    domain: "fascism",
    content: "Fascism exploits middle-class fears and moralism."
  },
  {
    domain: "fascism",
    content: "Masses support fascism due to character structure, not just economics."
  },
  {
    domain: "fascism",
    content: "Religious mysticism reinforces fascist ideology."
  },
  {
    domain: "fascism",
    content: "Work-democracy opposes authoritarian hierarchies."
  },
  {
    domain: "fascism",
    content: "Emotional plague drives irrational political movements."
  },
  {
    domain: "fascism",
    content: "Fascism is the organized political expression of the average character."
  },
  {
    domain: "fascism",
    content: "Sexual guilt feelings bind masses to authoritarian leaders."
  },
  {
    domain: "fascism",
    content: "Irrational enthusiasm for dictators stems from orgastic longing."
  },
  {
    domain: "fascism",
    content: "Family is the first cell of the fascist state."
  },
  {
    domain: "fascism",
    content: "Political freedom requires prior sexual freedom."
  },
  {
    domain: "fascism",
    content: "Characterological armoring makes masses incapable of freedom."
  },
  {
    domain: "fascism",
    content: "The swastika symbol unconsciously represents intertwined human bodies in sexual embrace."
  },
  // SEXUAL REVOLUTION (15 positions)
  {
    domain: "sexual_revolution",
    content: "Compulsory marriage suppresses natural sexuality."
  },
  {
    domain: "sexual_revolution",
    content: "Sexual liberation leads to self-regulating society."
  },
  {
    domain: "sexual_revolution",
    content: "Adolescent sexuality must be affirmed, not repressed."
  },
  {
    domain: "sexual_revolution",
    content: "Patriarchal family perpetuates authoritarianism."
  },
  {
    domain: "sexual_revolution",
    content: "Free love relationships replace possessive marriage."
  },
  {
    domain: "sexual_revolution",
    content: "Economic independence enables sexual freedom."
  },
  {
    domain: "sexual_revolution",
    content: "Moralism distorts healthy genitality."
  },
  {
    domain: "sexual_revolution",
    content: "Children's sexual curiosity is natural and healthy."
  },
  {
    domain: "sexual_revolution",
    content: "Revolution fails without sexual reform."
  },
  {
    domain: "sexual_revolution",
    content: "Self-regulation replaces external moral compulsion."
  },
  {
    domain: "sexual_revolution",
    content: "Sexual repression is the chief mechanism of social control."
  },
  {
    domain: "sexual_revolution",
    content: "Natural genitality is self-regulating and non-destructive."
  },
  {
    domain: "sexual_revolution",
    content: "Youth sexuality must be guided affirmatively, not suppressed."
  },
  {
    domain: "sexual_revolution",
    content: "Genital rights are fundamental human rights."
  },
  {
    domain: "sexual_revolution",
    content: "The double standard permits male sexuality while punishing female sexuality."
  },
  // EMOTIONAL PLAGUE (15 positions)
  {
    domain: "emotional_plague",
    content: "The emotional plague is the chronic tendency of armored humanity to suppress life in others."
  },
  {
    domain: "emotional_plague",
    content: "Plague behavior differs from ordinary neurosis in its organized, socially destructive character."
  },
  {
    domain: "emotional_plague",
    content: "The plague individual cannot tolerate aliveness in others because it provokes their own blocked longing."
  },
  {
    domain: "emotional_plague",
    content: "Gossip, slander, and defamation are everyday manifestations of the emotional plague."
  },
  {
    domain: "emotional_plague",
    content: "The plague operates under the guise of morality, decency, and concern for others' welfare."
  },
  {
    domain: "emotional_plague",
    content: "Plague attacks always target life-affirmative functions—love, work, knowledge, natural sexuality."
  },
  {
    domain: "emotional_plague",
    content: "The plague spreads contagiously through social institutions that codify and enforce suppression."
  },
  {
    domain: "emotional_plague",
    content: "Political movements of all orientations become vehicles for plague when led by plague characters."
  },
  {
    domain: "emotional_plague",
    content: "The murder of Christ is the prototype of plague action—organized destruction of living truth."
  },
  {
    domain: "emotional_plague",
    content: "The plague individual experiences life-affirmation in others as personal attack."
  },
  {
    domain: "emotional_plague",
    content: "Plague reactions are involuntary—the plague character cannot help attacking life."
  },
  {
    domain: "emotional_plague",
    content: "Institutions—schools, churches, governments—become plague carriers when staffed by plague individuals."
  },
  {
    domain: "emotional_plague",
    content: "The plague thrives on anonymity—unsigned complaints, secret denunciations, bureaucratic procedures."
  },
  {
    domain: "emotional_plague",
    content: "Plague attacks intensify when life-affirmative work begins to succeed."
  },
  {
    domain: "emotional_plague",
    content: "Only widespread dissolution of armoring can end the emotional plague as a social phenomenon."
  },
  // ORGONE ENERGY (15 positions)
  {
    domain: "orgone_energy",
    content: "Orgone energy underlies both matter and emotion."
  },
  {
    domain: "orgone_energy",
    content: "Bions are vesicles that form spontaneously from disintegrating organic and inorganic matter."
  },
  {
    domain: "orgone_energy",
    content: "The orgone accumulator concentrates atmospheric orgone energy."
  },
  {
    domain: "orgone_energy",
    content: "Orgone energy is the primordial creative force."
  },
  {
    domain: "orgone_energy",
    content: "The blue color of bions indicates orgone energy charge."
  },
  {
    domain: "orgone_energy",
    content: "Bion cultures kill bacteria and cancer cells through orgonotic radiation."
  },
  {
    domain: "orgone_energy",
    content: "SAPA bions emit a radiation that produces conjunctivitis and skin reddening."
  },
  {
    domain: "orgone_energy",
    content: "Orgone energy pulsates with the rhythm of expansion and contraction."
  },
  {
    domain: "orgone_energy",
    content: "The blue coloration of the atmosphere, ocean, and blood derives from orgone energy."
  },
  {
    domain: "orgone_energy",
    content: "Emotions are direct expressions of orgone energy movement."
  },
  {
    domain: "orgone_energy",
    content: "Living organisms are orgone energy systems."
  },
  {
    domain: "orgone_energy",
    content: "Orgone energy flows from lower to higher concentrations."
  },
  {
    domain: "orgone_energy",
    content: "The organism's orgone energy field extends beyond the body surface."
  },
  {
    domain: "orgone_energy",
    content: "Pleasurable excitation produces measurable increase in skin surface bioelectrical potential."
  },
  {
    domain: "orgone_energy",
    content: "Anxiety and unpleasure produce decrease in bioelectrical charge at the skin surface."
  },
  // CANCER BIOPATHY (10 positions)
  {
    domain: "cancer_biopathy",
    content: "Cancer results from chronic energy stasis."
  },
  {
    domain: "cancer_biopathy",
    content: "Bion vesicles disintegrate into T-bacilli in cancer."
  },
  {
    domain: "cancer_biopathy",
    content: "Orgone energy charges healthy cells."
  },
  {
    domain: "cancer_biopathy",
    content: "Emotional resignation precedes biopathy."
  },
  {
    domain: "cancer_biopathy",
    content: "Cancer patients show orgone deficiency."
  },
  {
    domain: "cancer_biopathy",
    content: "Healthy erythrocytes pulsate; cancer blood cells are rigid."
  },
  {
    domain: "cancer_biopathy",
    content: "Biopathies result from total organismic energy disturbance."
  },
  {
    domain: "cancer_biopathy",
    content: "The 'cancer attitude' involves giving up, resignation, and withdrawal from life."
  },
  {
    domain: "cancer_biopathy",
    content: "Cancer patients typically show a history of genital disturbance and sexual resignation."
  },
  {
    domain: "cancer_biopathy",
    content: "Raising orgone charge can reverse biopathic processes."
  },
  // CHILD DEVELOPMENT (15 positions)
  {
    domain: "child_development",
    content: "The newborn arrives unarmored and capable of full bioenergetic pulsation."
  },
  {
    domain: "child_development",
    content: "The first armoring occurs in the ocular segment in response to maternal anxiety."
  },
  {
    domain: "child_development",
    content: "Breastfeeding disturbances create oral armoring and later oral character."
  },
  {
    domain: "child_development",
    content: "Premature and rigid toilet training produces anal armoring and compulsive character."
  },
  {
    domain: "child_development",
    content: "The child's natural genital play must be met with acceptance, not punishment."
  },
  {
    domain: "child_development",
    content: "Chronic frustration and prohibition create armor; consistent gratification fosters self-regulation."
  },
  {
    domain: "child_development",
    content: "Authoritarian education produces armored, submissive, authority-fearing character."
  },
  {
    domain: "child_development",
    content: "Self-regulated children show spontaneity, contactfulness, and natural self-discipline."
  },
  {
    domain: "child_development",
    content: "Prevention of armoring in one generation could end the emotional plague."
  },
  {
    domain: "child_development",
    content: "Self-regulation in children requires unarmored adults who can tolerate aliveness."
  },
  {
    domain: "child_development",
    content: "Permissiveness differs from self-regulation—permissiveness lacks structure while self-regulation develops internal boundaries."
  },
  {
    domain: "child_development",
    content: "The infant's first experiences at the breast establish the prototype of all later object relations."
  },
  {
    domain: "child_development",
    content: "Fear of spoiling children masks adults' intolerance of natural childhood vitality."
  },
  {
    domain: "child_development",
    content: "Masturbation anxiety in childhood creates the prototype of all later pleasure anxiety."
  },
  {
    domain: "child_development",
    content: "Threats about masturbation produce genital armoring and castration anxiety."
  },
  // ANXIETY AND PLEASURE (10 positions)
  {
    domain: "anxiety_pleasure",
    content: "Pleasure and anxiety are functional antitheses—expansion outward versus contraction inward."
  },
  {
    domain: "anxiety_pleasure",
    content: "Anxiety is the subjective experience of sympatheticotonic contraction."
  },
  {
    domain: "anxiety_pleasure",
    content: "Pleasure is the subjective experience of parasympathetic expansion toward the world."
  },
  {
    domain: "anxiety_pleasure",
    content: "Stasis anxiety arises from dammed-up excitation when discharge pathways are blocked."
  },
  {
    domain: "anxiety_pleasure",
    content: "Pleasure anxiety is fear of the very expansion and streaming that would bring gratification."
  },
  {
    domain: "anxiety_pleasure",
    content: "The armored organism experiences its own natural excitation as dangerous and anxiety-provoking."
  },
  {
    domain: "anxiety_pleasure",
    content: "Orgasm anxiety—fear of dissolution in the orgastic convulsion—is the deepest pleasure anxiety."
  },
  {
    domain: "anxiety_pleasure",
    content: "Chronic anxiety represents frozen contraction—the organism stuck in defensive withdrawal."
  },
  {
    domain: "anxiety_pleasure",
    content: "Anxiety tolerance increases with armor dissolution."
  },
  {
    domain: "anxiety_pleasure",
    content: "Natural pulsation requires equal capacity for expansion into pleasure and contraction in appropriate fear."
  },
  // THERAPEUTIC TECHNIQUE (10 positions)
  {
    domain: "therapeutic_technique",
    content: "Character analysis addresses the form of resistance before its content."
  },
  {
    domain: "therapeutic_technique",
    content: "The first therapeutic task is to identify and make conscious the character resistance."
  },
  {
    domain: "therapeutic_technique",
    content: "The patient's manner of speaking reveals character more reliably than words."
  },
  {
    domain: "therapeutic_technique",
    content: "Vegetotherapy directly addresses muscular armor through breathing and physical interventions."
  },
  {
    domain: "therapeutic_technique",
    content: "Deep respiration mobilizes energy bound in the diaphragmatic block."
  },
  {
    domain: "therapeutic_technique",
    content: "Pressure on tense muscles may release bound affect and memory."
  },
  {
    domain: "therapeutic_technique",
    content: "Armor dissolution is indicated by streaming sensations, involuntary movements, and emotional release."
  },
  {
    domain: "therapeutic_technique",
    content: "The patient must tolerate increasing excitation without defensive rearmoring."
  },
  {
    domain: "therapeutic_technique",
    content: "Therapeutic progress is measured by increasing orgastic potency and life-affirmative functioning."
  },
  {
    domain: "therapeutic_technique",
    content: "The goal of treatment is full orgastic potency and the genital character structure."
  },
  // WORK DEMOCRACY (10 positions)
  {
    domain: "work_democracy",
    content: "Natural work arises from biological pulsation—the same energy that drives sexuality drives productivity."
  },
  {
    domain: "work_democracy",
    content: "Work-democracy is the natural organization of society based on functional tasks and rational cooperation."
  },
  {
    domain: "work_democracy",
    content: "Compulsive work substitutes achievement for genital satisfaction unavailable to the armored."
  },
  {
    domain: "work_democracy",
    content: "The genital character works out of genuine interest; the neurotic works from compulsion or guilt."
  },
  {
    domain: "work_democracy",
    content: "Creative work requires free-flowing energy unbound by excessive armoring."
  },
  {
    domain: "work_democracy",
    content: "Bureaucracy transforms natural work-democracy into mechanical, irrational administration."
  },
  {
    domain: "work_democracy",
    content: "Joy in work parallels joy in love—both require free pulsation and unarmored contact."
  },
  {
    domain: "work_democracy",
    content: "Alienated labor under capitalism mirrors alienated sexuality under compulsory morality."
  },
  {
    domain: "work_democracy",
    content: "The capacity for genuine work and the capacity for genuine love have the same energetic foundation."
  },
  {
    domain: "work_democracy",
    content: "Group work-democracy emerges spontaneously when authoritarian compulsion is removed."
  },
  // RELIGION AND MYSTICISM (10 positions)
  {
    domain: "religion_mysticism",
    content: "God concepts arise from orgonotic sensations misinterpreted through armored perception."
  },
  {
    domain: "religion_mysticism",
    content: "Mechanistic science ignores living functions; mysticism distorts natural energetic processes."
  },
  {
    domain: "religion_mysticism",
    content: "Functionalism unites opposites in common principles—overcoming mechanistic-mystical dualism."
  },
  {
    domain: "religion_mysticism",
    content: "Armoring creates the illusion of separate soul and body."
  },
  {
    domain: "religion_mysticism",
    content: "Mystical craving results from blocked orgonotic contact with self and world."
  },
  {
    domain: "religion_mysticism",
    content: "The devil symbolizes blocked, sadistic distortion of energy."
  },
  {
    domain: "religion_mysticism",
    content: "The sensation of 'grace' corresponds to moments of spontaneous armor dissolution."
  },
  {
    domain: "religion_mysticism",
    content: "Orgonotic streamings in the body create the subjective experience of the 'soul.'"
  },
  {
    domain: "religion_mysticism",
    content: "Prayer is longing for contact with cosmic energy from which armoring has separated the individual."
  },
  {
    domain: "religion_mysticism",
    content: "True religion would be rational comprehension of living functions, not mystical distortion."
  },
  // MURDER OF CHRIST (10 positions)
  {
    domain: "murder_of_christ",
    content: "Armored humans destroy life-affirming figures."
  },
  {
    domain: "murder_of_christ",
    content: "Christ embodied free-flowing life energy and natural genitality."
  },
  {
    domain: "murder_of_christ",
    content: "Emotional plague organizes systematically against life."
  },
  {
    domain: "murder_of_christ",
    content: "Masses crucify liberators out of fear of freedom."
  },
  {
    domain: "murder_of_christ",
    content: "Mysticism distorted Christ's natural message into dead dogma."
  },
  {
    domain: "murder_of_christ",
    content: "Freedom threatens armored character and provokes attack."
  },
  {
    domain: "murder_of_christ",
    content: "Betrayal stems from genital anxiety and plague character."
  },
  {
    domain: "murder_of_christ",
    content: "Resurrection symbolizes the indestructibility of life force."
  },
  {
    domain: "murder_of_christ",
    content: "Modern society repeats the murder of Christ daily—in every child."
  },
  {
    domain: "murder_of_christ",
    content: "Only self-regulation and dissolution of armoring can end the perpetual murder."
  },
  // COSMIC SUPERIMPOSITION (10 positions)
  {
    domain: "cosmic_superimposition",
    content: "Orgone energy drives galactic formation through superimposition of two energy streams."
  },
  {
    domain: "cosmic_superimposition",
    content: "Spiral galaxies result from orgonotic streaming."
  },
  {
    domain: "cosmic_superimposition",
    content: "Sexual attraction mirrors cosmic superimposition—two streams merging to create new life."
  },
  {
    domain: "cosmic_superimposition",
    content: "Hurricanes form by orgone energy spirals."
  },
  {
    domain: "cosmic_superimposition",
    content: "Armoring blocks natural superimposition (deep contact) in humans."
  },
  {
    domain: "cosmic_superimposition",
    content: "Gravitation is a secondary effect of orgone attraction."
  },
  {
    domain: "cosmic_superimposition",
    content: "Life originates from orgonotic excitation wherever superimposition occurs."
  },
  {
    domain: "cosmic_superimposition",
    content: "Universal laws govern micro and macro phenomena—cosmic and biological processes follow identical principles."
  },
  {
    domain: "cosmic_superimposition",
    content: "Unarmoring restores capacity for cosmic superposition—deep emotional contact."
  },
  {
    domain: "cosmic_superimposition",
    content: "The blue coloration of atmosphere and ocean derives from atmospheric orgone concentration."
  }
];

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function embedReichPositions() {
  console.log(`Starting to embed ${reichPositions.length} Wilhelm Reich positions...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < reichPositions.length; i++) {
    const position = reichPositions[i];
    
    try {
      const embedding = await generateEmbedding(position.content);
      
      await db.insert(paperChunks).values({
        figureId: "reich",
        author: "Wilhelm Reich",
        paperTitle: `Reich Position: ${position.domain.replace(/_/g, " ")}`,
        content: position.content,
        embedding: embedding,
        chunkIndex: i,
        domain: position.domain,
        significance: "HIGH",
      });
      
      successCount++;
      
      if ((i + 1) % 25 === 0) {
        console.log(`Progress: ${i + 1}/${reichPositions.length} positions embedded`);
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

embedReichPositions()
  .then(() => {
    console.log("Wilhelm Reich positions embedding finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

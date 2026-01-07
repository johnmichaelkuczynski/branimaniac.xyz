import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "../../shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const lebonPositions = [
  // CROWD PSYCHOLOGY (25 positions)
  {
    domain: "crowd_psychology",
    content: "Individuals in a crowd lose their conscious personality and become subject to unconscious influences."
  },
  {
    domain: "crowd_psychology",
    content: "A psychological crowd is a provisional being formed of heterogeneous elements temporarily fused."
  },
  {
    domain: "crowd_psychology",
    content: "The crowd mind is characterized by impulsiveness, irritability, and incapacity to reason."
  },
  {
    domain: "crowd_psychology",
    content: "Crowds think in images, not in logical sequences."
  },
  {
    domain: "crowd_psychology",
    content: "Crowds are credulous and easily influenced by suggestion."
  },
  {
    domain: "crowd_psychology",
    content: "The sentiments of crowds are always extreme—either enthusiastic or hostile."
  },
  {
    domain: "crowd_psychology",
    content: "Crowds are intolerant and authoritarian by nature."
  },
  {
    domain: "crowd_psychology",
    content: "The individual in a crowd descends several rungs on the ladder of civilization."
  },
  {
    domain: "crowd_psychology",
    content: "Anonymity in crowds removes the sense of responsibility."
  },
  {
    domain: "crowd_psychology",
    content: "Contagion spreads ideas and emotions through crowds with viral rapidity."
  },
  {
    domain: "crowd_psychology",
    content: "Crowds cannot distinguish between the subjective and objective."
  },
  {
    domain: "crowd_psychology",
    content: "Crowds are feminine in character—dominated by unconscious instincts."
  },
  {
    domain: "crowd_psychology",
    content: "Parliamentary assemblies exhibit all the characteristics of crowds."
  },
  {
    domain: "crowd_psychology",
    content: "Juries frequently render verdicts that each individual juror would reject."
  },
  {
    domain: "crowd_psychology",
    content: "Electoral crowds are influenced more by images and slogans than programs."
  },
  {
    domain: "crowd_psychology",
    content: "The crowd possesses a collective unconscious that operates independently of individual members' wills."
  },
  {
    domain: "crowd_psychology",
    content: "Moral constraints that govern individual behavior dissolve entirely within crowd settings."
  },
  {
    domain: "crowd_psychology",
    content: "Crowds cannot sustain attention on abstract matters for more than fleeting moments."
  },
  {
    domain: "crowd_psychology",
    content: "The sentiment of invincibility that crowds experience makes them capable of both heroism and atrocity."
  },
  {
    domain: "crowd_psychology",
    content: "Religious crowds and political crowds exhibit identical psychological mechanisms."
  },
  {
    domain: "crowd_psychology",
    content: "The transformation from individual to crowd member occurs instantaneously upon immersion."
  },
  {
    domain: "crowd_psychology",
    content: "The disappearance of conscious personality is the first step in crowd formation."
  },
  {
    domain: "crowd_psychology",
    content: "The age of crowds represents a transitional phase in civilization."
  },
  {
    domain: "crowd_psychology",
    content: "Traditions represent the synthesis of a race's accumulated experience."
  },
  {
    domain: "crowd_psychology",
    content: "Education and instruction are incapable of modifying the mental constitution of crowds."
  },
  // LEADERSHIP AND PERSUASION (15 positions)
  {
    domain: "leadership_persuasion",
    content: "The prestige of leaders is the primary source of their power over crowds."
  },
  {
    domain: "leadership_persuasion",
    content: "Affirmation, repetition, and contagion are the principal means of persuading crowds."
  },
  {
    domain: "leadership_persuasion",
    content: "Reason is incapable of combating certain words and formulas in the presence of crowds."
  },
  {
    domain: "leadership_persuasion",
    content: "The power of words is linked to the images they evoke, not their real meaning."
  },
  {
    domain: "leadership_persuasion",
    content: "Crowds demand illusions and cannot live without them."
  },
  {
    domain: "leadership_persuasion",
    content: "The hero worshipped by a crowd is a god to that crowd."
  },
  {
    domain: "leadership_persuasion",
    content: "The orator who masters imagery will always defeat the orator who relies on logic."
  },
  {
    domain: "leadership_persuasion",
    content: "Theatrical staging and dramatic presentation are essential tools for controlling crowds."
  },
  {
    domain: "leadership_persuasion",
    content: "Crowds possess no capacity for gratitude toward their leaders."
  },
  {
    domain: "leadership_persuasion",
    content: "The crowd's memory is extraordinarily short—yesterday's hero becomes today's villain without transition."
  },
  {
    domain: "leadership_persuasion",
    content: "Napoleon succeeded because he understood crowd psychology."
  },
  {
    domain: "leadership_persuasion",
    content: "Revolutionary rhetoric masks the pursuit of power."
  },
  {
    domain: "leadership_persuasion",
    content: "Mass democracy is producing demagogic leadership."
  },
  {
    domain: "leadership_persuasion",
    content: "Fascism mobilizes psychological energies that parliamentary democracy cannot harness."
  },
  {
    domain: "leadership_persuasion",
    content: "Mussolini understands crowd psychology instinctively."
  },
  // PSYCHOLOGY OF PEOPLES (20 positions)
  {
    domain: "psychology_of_peoples",
    content: "Each race possesses a psychological constitution as fixed as its anatomical constitution."
  },
  {
    domain: "psychology_of_peoples",
    content: "Character, not intelligence, determines the destiny of peoples."
  },
  {
    domain: "psychology_of_peoples",
    content: "The mental constitution of a race is as stable as its physical features."
  },
  {
    domain: "psychology_of_peoples",
    content: "Institutions are the external manifestation of the national character."
  },
  {
    domain: "psychology_of_peoples",
    content: "Peoples cannot choose their institutions; institutions derive from racial character."
  },
  {
    domain: "psychology_of_peoples",
    content: "Ideas must be transformed to fit the racial character before they can be adopted."
  },
  {
    domain: "psychology_of_peoples",
    content: "The true elements of civilization are not transferable between races."
  },
  {
    domain: "psychology_of_peoples",
    content: "Education cannot create qualities that heredity has not provided."
  },
  {
    domain: "psychology_of_peoples",
    content: "Language is one of the most certain indices of racial psychology."
  },
  {
    domain: "psychology_of_peoples",
    content: "Art reflects the soul of a people more accurately than its philosophy."
  },
  {
    domain: "psychology_of_peoples",
    content: "Religious beliefs are transformed according to racial psychology."
  },
  {
    domain: "psychology_of_peoples",
    content: "Democracy takes different forms depending on the race that adopts it."
  },
  {
    domain: "psychology_of_peoples",
    content: "The English character is fundamentally different from the Latin character."
  },
  {
    domain: "psychology_of_peoples",
    content: "Racial character is formed through centuries of common experience."
  },
  {
    domain: "psychology_of_peoples",
    content: "The decline of civilizations results from the degeneration of racial character."
  },
  {
    domain: "psychology_of_peoples",
    content: "Historical events are surface phenomena; racial character is the underlying cause."
  },
  {
    domain: "psychology_of_peoples",
    content: "Imitation of foreign institutions leads to social instability."
  },
  {
    domain: "psychology_of_peoples",
    content: "The soul of a race is the synthesis of its past."
  },
  {
    domain: "psychology_of_peoples",
    content: "National genius manifests most clearly in a people's architectural and artistic productions."
  },
  {
    domain: "psychology_of_peoples",
    content: "Racial character is revealed most clearly in moments of collective crisis."
  },
  // PSYCHOLOGY OF SOCIALISM (15 positions)
  {
    domain: "psychology_of_socialism",
    content: "Socialism is a belief, not a doctrine—it must be studied as a religion."
  },
  {
    domain: "psychology_of_socialism",
    content: "The spread of socialism results from psychological causes, not economic conditions."
  },
  {
    domain: "psychology_of_socialism",
    content: "Socialist doctrines appeal to the sentiments, not the reason."
  },
  {
    domain: "psychology_of_socialism",
    content: "Socialism promises a terrestrial paradise to replace the celestial one."
  },
  {
    domain: "psychology_of_socialism",
    content: "The hatred of superiority is a fundamental motive of socialist sentiment."
  },
  {
    domain: "psychology_of_socialism",
    content: "Socialism represents the revolt of the unsuccessful against the successful."
  },
  {
    domain: "psychology_of_socialism",
    content: "Socialist theories are scientifically untenable but psychologically powerful."
  },
  {
    domain: "psychology_of_socialism",
    content: "Collectivism would destroy individual initiative and halt progress."
  },
  {
    domain: "psychology_of_socialism",
    content: "State socialism leads inevitably to bureaucratic tyranny."
  },
  {
    domain: "psychology_of_socialism",
    content: "The socialist conception of the state is essentially authoritarian."
  },
  {
    domain: "psychology_of_socialism",
    content: "Socialist leaders are typically bourgeois intellectuals, not workers."
  },
  {
    domain: "psychology_of_socialism",
    content: "The masses are drawn to socialism by promises, not arguments."
  },
  {
    domain: "psychology_of_socialism",
    content: "Socialism represents a regression to primitive collectivism."
  },
  {
    domain: "psychology_of_socialism",
    content: "The socialist state would require unprecedented coercion to function."
  },
  {
    domain: "psychology_of_socialism",
    content: "Socialist internationalism cannot overcome the deeper forces of national psychology."
  },
  // PSYCHOLOGY OF EDUCATION (15 positions)
  {
    domain: "psychology_of_education",
    content: "The French educational system produces memorizers, not thinkers."
  },
  {
    domain: "psychology_of_education",
    content: "Education based on rote learning destroys intellectual initiative."
  },
  {
    domain: "psychology_of_education",
    content: "Examinations test memory, not intelligence or practical ability."
  },
  {
    domain: "psychology_of_education",
    content: "The classical curriculum is obsolete and harmful."
  },
  {
    domain: "psychology_of_education",
    content: "University degrees have become worthless credentials."
  },
  {
    domain: "psychology_of_education",
    content: "Education should develop judgment, not accumulate facts."
  },
  {
    domain: "psychology_of_education",
    content: "Character formation is more important than intellectual instruction."
  },
  {
    domain: "psychology_of_education",
    content: "The overproduction of graduates creates a class of discontented intellectuals."
  },
  {
    domain: "psychology_of_education",
    content: "Learning through doing is superior to learning through books."
  },
  {
    domain: "psychology_of_education",
    content: "The educational bureaucracy resists all meaningful reform."
  },
  {
    domain: "psychology_of_education",
    content: "Education should prepare students for life, not for examinations."
  },
  {
    domain: "psychology_of_education",
    content: "The lecture system promotes passivity in students."
  },
  {
    domain: "psychology_of_education",
    content: "Educational standardization destroys the individual variation upon which progress depends."
  },
  {
    domain: "psychology_of_education",
    content: "True learning occurs through apprenticeship rather than through formal instruction."
  },
  {
    domain: "psychology_of_education",
    content: "The democratization of education has lowered standards without raising ability."
  },
  // OPINIONS AND BELIEFS (15 positions)
  {
    domain: "opinions_beliefs",
    content: "Opinions and beliefs are independent of rational evidence."
  },
  {
    domain: "opinions_beliefs",
    content: "Beliefs are formed by affective and mystic factors, not logical ones."
  },
  {
    domain: "opinions_beliefs",
    content: "Rational logic has minimal influence on belief formation."
  },
  {
    domain: "opinions_beliefs",
    content: "Affective logic is driven by sentiments and unconscious needs."
  },
  {
    domain: "opinions_beliefs",
    content: "Mystic logic operates through faith and accepts no contradiction."
  },
  {
    domain: "opinions_beliefs",
    content: "Once formed, beliefs resist all contrary evidence."
  },
  {
    domain: "opinions_beliefs",
    content: "The intensity of a belief is unrelated to its truth."
  },
  {
    domain: "opinions_beliefs",
    content: "Political and religious beliefs share the same psychological structure."
  },
  {
    domain: "opinions_beliefs",
    content: "Collective beliefs are more resistant to change than individual opinions."
  },
  {
    domain: "opinions_beliefs",
    content: "The unconscious is the primary source of our convictions."
  },
  {
    domain: "opinions_beliefs",
    content: "Arguments cannot dislodge beliefs formed by non-rational means."
  },
  {
    domain: "opinions_beliefs",
    content: "Tolerance is possible only for opinions, never for beliefs."
  },
  {
    domain: "opinions_beliefs",
    content: "The decline of religious belief creates a vacuum filled by political belief."
  },
  {
    domain: "opinions_beliefs",
    content: "Beliefs operate as mental parasites that use their hosts for propagation."
  },
  {
    domain: "opinions_beliefs",
    content: "The death of old beliefs creates a dangerous psychological vacuum."
  },
  // REVOLUTIONARY PSYCHOLOGY (20 positions)
  {
    domain: "revolutionary_psychology",
    content: "The French Revolution was primarily a psychological phenomenon, not an economic one."
  },
  {
    domain: "revolutionary_psychology",
    content: "Revolutions are caused by transformations in belief, not material conditions."
  },
  {
    domain: "revolutionary_psychology",
    content: "The revolutionary mentality is characterized by simplification and absolutism."
  },
  {
    domain: "revolutionary_psychology",
    content: "The Terror resulted from the psychology of crowds in power."
  },
  {
    domain: "revolutionary_psychology",
    content: "Revolutionary assemblies exhibit all the pathologies of crowd behavior."
  },
  {
    domain: "revolutionary_psychology",
    content: "The Jacobin mentality represents a permanent psychological type."
  },
  {
    domain: "revolutionary_psychology",
    content: "Revolutionary idealism inevitably degenerates into despotism."
  },
  {
    domain: "revolutionary_psychology",
    content: "The revolutionaries destroyed more than they created."
  },
  {
    domain: "revolutionary_psychology",
    content: "Abstract principles applied rigidly lead to concrete atrocities."
  },
  {
    domain: "revolutionary_psychology",
    content: "The revolutionary crowd is merciless because it is irresponsible."
  },
  {
    domain: "revolutionary_psychology",
    content: "Revolutionary tribunals are instruments of crowd vengeance."
  },
  {
    domain: "revolutionary_psychology",
    content: "The cult of Reason was itself a form of religious mysticism."
  },
  {
    domain: "revolutionary_psychology",
    content: "Revolutionary rhetoric masks the pursuit of power."
  },
  {
    domain: "revolutionary_psychology",
    content: "Revolutionary leaders were typically driven by vanity and ambition."
  },
  {
    domain: "revolutionary_psychology",
    content: "Revolutionary governments cannot tolerate dissent."
  },
  {
    domain: "revolutionary_psychology",
    content: "The revolution devoured its own children through psychological necessity."
  },
  {
    domain: "revolutionary_psychology",
    content: "Revolutionary virtue is indistinguishable from revolutionary tyranny."
  },
  {
    domain: "revolutionary_psychology",
    content: "The monarchy fell because it had lost prestige, not because of its policies."
  },
  {
    domain: "revolutionary_psychology",
    content: "Popular sovereignty is a mystical concept, not a political reality."
  },
  {
    domain: "revolutionary_psychology",
    content: "The legacy of the Revolution was institutional instability."
  },
  // WAR PSYCHOLOGY (20 positions)
  {
    domain: "war_psychology",
    content: "The war revealed the persistence of primitive instincts beneath civilization."
  },
  {
    domain: "war_psychology",
    content: "Patriotic sentiment transforms individual behavior in wartime."
  },
  {
    domain: "war_psychology",
    content: "The war demonstrated the power of collective beliefs to motivate sacrifice."
  },
  {
    domain: "war_psychology",
    content: "Military morale depends more on psychology than on material factors."
  },
  {
    domain: "war_psychology",
    content: "The psychology of the combatant differs fundamentally from that of civilians."
  },
  {
    domain: "war_psychology",
    content: "Hatred of the enemy is a psychological necessity in wartime."
  },
  {
    domain: "war_psychology",
    content: "War propaganda must appeal to emotions, not reason."
  },
  {
    domain: "war_psychology",
    content: "National character determines military effectiveness."
  },
  {
    domain: "war_psychology",
    content: "Victory depends ultimately on the will to victory."
  },
  {
    domain: "war_psychology",
    content: "Defeatism spreads through the same mechanisms as other crowd beliefs."
  },
  {
    domain: "war_psychology",
    content: "The home front is a psychological battlefield."
  },
  {
    domain: "war_psychology",
    content: "Military leadership requires understanding of crowd psychology."
  },
  {
    domain: "war_psychology",
    content: "Fear and courage are both contagious in combat."
  },
  {
    domain: "war_psychology",
    content: "Modern warfare demands psychological mobilization of entire populations."
  },
  {
    domain: "war_psychology",
    content: "The war will produce lasting psychological transformations."
  },
  {
    domain: "war_psychology",
    content: "Mass death produces psychological consequences that will outlast the conflict by generations."
  },
  {
    domain: "war_psychology",
    content: "War neuroses reveal the limits of human psychological adaptability."
  },
  {
    domain: "war_psychology",
    content: "The soldier's psychology in the trenches differs fundamentally from anything previously studied."
  },
  {
    domain: "war_psychology",
    content: "Patriotic enthusiasm cannot be sustained indefinitely without psychological reinforcement."
  },
  {
    domain: "war_psychology",
    content: "The distinction between combatant and non-combatant has been psychologically erased."
  },
  // POST-WAR PSYCHOLOGY (15 positions)
  {
    domain: "postwar_psychology",
    content: "Post-war Europe is in a state of psychological disequilibrium."
  },
  {
    domain: "postwar_psychology",
    content: "The peace treaties have created new sources of resentment."
  },
  {
    domain: "postwar_psychology",
    content: "Economic chaos produces psychological instability."
  },
  {
    domain: "postwar_psychology",
    content: "Revolutionary movements threaten all established orders."
  },
  {
    domain: "postwar_psychology",
    content: "Bolshevism appeals to destructive psychological impulses."
  },
  {
    domain: "postwar_psychology",
    content: "Parliamentary democracy is struggling to maintain legitimacy."
  },
  {
    domain: "postwar_psychology",
    content: "The middle classes are being psychologically radicalized."
  },
  {
    domain: "postwar_psychology",
    content: "Inflation destroys the psychological basis of social trust."
  },
  {
    domain: "postwar_psychology",
    content: "Fascism represents a new psychological phenomenon."
  },
  {
    domain: "postwar_psychology",
    content: "Germany remains a psychological threat despite military defeat."
  },
  {
    domain: "postwar_psychology",
    content: "Traditional elites have lost their psychological authority."
  },
  {
    domain: "postwar_psychology",
    content: "The intellectual classes have become psychologically alienated."
  },
  {
    domain: "postwar_psychology",
    content: "The pace of change exceeds human psychological adaptability."
  },
  {
    domain: "postwar_psychology",
    content: "Civilization requires psychological stability that is now lacking."
  },
  {
    domain: "postwar_psychology",
    content: "Hyperinflation annihilates the psychological foundations of bourgeois civilization."
  },
  // MATTER AND ENERGY (10 positions)
  {
    domain: "matter_energy",
    content: "Matter is not inert but contains immense stores of energy."
  },
  {
    domain: "matter_energy",
    content: "Atoms are not indivisible but are complex structures."
  },
  {
    domain: "matter_energy",
    content: "Matter can be dissociated into its constituent energy."
  },
  {
    domain: "matter_energy",
    content: "Radioactivity demonstrates the instability of matter."
  },
  {
    domain: "matter_energy",
    content: "All matter is slowly dissociating and releasing energy."
  },
  {
    domain: "matter_energy",
    content: "Matter and energy are interconvertible."
  },
  {
    domain: "matter_energy",
    content: "Intra-atomic energy vastly exceeds chemical energy."
  },
  {
    domain: "matter_energy",
    content: "The sun's energy comes from material dissociation."
  },
  {
    domain: "matter_energy",
    content: "The energy of matter could be harnessed technologically."
  },
  {
    domain: "matter_energy",
    content: "The universe is evolving through material dissociation."
  },
  // LIFE OF TRUTHS (10 positions)
  {
    domain: "life_of_truths",
    content: "Truths have a life cycle—they are born, develop, and die."
  },
  {
    domain: "life_of_truths",
    content: "Scientific truths are provisional, not absolute."
  },
  {
    domain: "life_of_truths",
    content: "Philosophical truths reflect the psychology of their era."
  },
  {
    domain: "life_of_truths",
    content: "Religious truths satisfy emotional needs, not intellectual ones."
  },
  {
    domain: "life_of_truths",
    content: "The lifespan of a truth depends on its psychological utility."
  },
  {
    domain: "life_of_truths",
    content: "Truths that lose utility are abandoned regardless of evidence."
  },
  {
    domain: "life_of_truths",
    content: "New truths must overcome psychological resistance."
  },
  {
    domain: "life_of_truths",
    content: "The acceptance of truth depends on non-rational factors."
  },
  {
    domain: "life_of_truths",
    content: "Dying truths are defended most fanatically."
  },
  {
    domain: "life_of_truths",
    content: "Revolutionary truths eventually become conservative dogmas."
  }
];

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function embedLebonPositions() {
  console.log(`Starting to embed ${lebonPositions.length} Gustave Le Bon positions...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < lebonPositions.length; i++) {
    const position = lebonPositions[i];
    
    try {
      const embedding = await generateEmbedding(position.content);
      
      await db.insert(paperChunks).values({
        figureId: "lebon",
        author: "Gustave Le Bon",
        paperTitle: `Le Bon Position: ${position.domain.replace(/_/g, " ")}`,
        content: position.content,
        embedding: embedding,
        chunkIndex: i,
        domain: position.domain,
        significance: "HIGH",
      });
      
      successCount++;
      
      if ((i + 1) % 25 === 0) {
        console.log(`Progress: ${i + 1}/${lebonPositions.length} positions embedded`);
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

embedLebonPositions()
  .then(() => {
    console.log("Gustave Le Bon positions embedding finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

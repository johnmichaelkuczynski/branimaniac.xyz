import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "../../shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const goldmanPositions = [
  // ANARCHISM (25 positions)
  {
    domain: "anarchism",
    content: "Anarchism advocates for a social order based on voluntary cooperation without coercive authority."
  },
  {
    domain: "anarchism",
    content: "Government and laws are tools of oppression that hinder individual freedom."
  },
  {
    domain: "anarchism",
    content: "True liberty requires the abolition of all forms of hierarchical power, including the state."
  },
  {
    domain: "anarchism",
    content: "Capitalism exploits workers and perpetuates inequality through property rights enforced by the state."
  },
  {
    domain: "anarchism",
    content: "Anarchism promotes direct action over parliamentary politics."
  },
  {
    domain: "anarchism",
    content: "The state perpetuates war and exploitation for the benefit of the ruling class."
  },
  {
    domain: "anarchism",
    content: "Individual sovereignty is the foundation of a just society."
  },
  {
    domain: "anarchism",
    content: "Anarchism seeks harmony between individual desires and social needs."
  },
  {
    domain: "anarchism",
    content: "True progress comes from rebellious minorities, not conformist majorities."
  },
  {
    domain: "anarchism",
    content: "Anarchism envisions a society based on free agreements and mutual aid."
  },
  {
    domain: "anarchism",
    content: "The state and capitalism are intertwined systems of domination."
  },
  {
    domain: "anarchism",
    content: "True individualism flourishes only in a non-hierarchical society."
  },
  {
    domain: "anarchism",
    content: "Anarchism seeks the harmonization of individual liberty with social well-being."
  },
  {
    domain: "anarchism",
    content: "I believe in anarchism: the theory that government is harmful and unnecessary."
  },
  {
    domain: "anarchism",
    content: "Property is robbery when it denies others access to the means of life."
  },
  {
    domain: "anarchism",
    content: "I believe in the complete liberty of the individual."
  },
  {
    domain: "anarchism",
    content: "The state exists to protect the privileges of the ruling class."
  },
  {
    domain: "anarchism",
    content: "I believe in the general strike as a weapon of liberation."
  },
  {
    domain: "anarchism",
    content: "Direct action surpasses parliamentary methods."
  },
  {
    domain: "anarchism",
    content: "Capitalism is organized theft from the productive classes."
  },
  {
    domain: "anarchism",
    content: "The emancipation of workers must be their own act."
  },
  {
    domain: "anarchism",
    content: "Political parties corrupt revolutionary movements."
  },
  {
    domain: "anarchism",
    content: "Human nature flourishes in freedom, not under authority."
  },
  {
    domain: "anarchism",
    content: "Charity perpetuates the conditions it claims to ameliorate."
  },
  {
    domain: "anarchism",
    content: "A free society will emerge from the ashes of the old."
  },
  // INDIVIDUAL AND STATE (20 positions)
  {
    domain: "individual_state",
    content: "The individual is the fundamental unit of society, not the state."
  },
  {
    domain: "individual_state",
    content: "Civilization advances through the enlargement of individual liberties."
  },
  {
    domain: "individual_state",
    content: "Authority and government have historically hindered human progress."
  },
  {
    domain: "individual_state",
    content: "The state is an abstraction with no real organic existence."
  },
  {
    domain: "individual_state",
    content: "True liberty is positive freedom to act and create opportunities."
  },
  {
    domain: "individual_state",
    content: "Dictatorship in any form attacks civilization and individual rights."
  },
  {
    domain: "individual_state",
    content: "Society exists to serve the individual, not vice versa."
  },
  {
    domain: "individual_state",
    content: "Uniformity enforced by society harasses individuality."
  },
  {
    domain: "individual_state",
    content: "Mutual aid and cooperation, not competition, drive evolution."
  },
  {
    domain: "individual_state",
    content: "Power corrupts both rulers and the ruled."
  },
  {
    domain: "individual_state",
    content: "The state demands submission and self-sacrifice, especially in war."
  },
  {
    domain: "individual_state",
    content: "Individuality persists despite suppression by authority."
  },
  {
    domain: "individual_state",
    content: "Democracy and parliamentarism are forms of coercion."
  },
  {
    domain: "individual_state",
    content: "Fascism, Nazism, and Bolshevism equally negate individual freedom."
  },
  {
    domain: "individual_state",
    content: "Progress is a struggle against the state and traditions."
  },
  {
    domain: "individual_state",
    content: "Rebellion against authority is instinctive in humans."
  },
  {
    domain: "individual_state",
    content: "Collectivity should not demand surrender of individuality."
  },
  {
    domain: "individual_state",
    content: "History shows unity through voluntary bonds, not force."
  },
  {
    domain: "individual_state",
    content: "The individual's quest for liberty is eternal and unstoppable."
  },
  {
    domain: "individual_state",
    content: "Emancipation lies in rejecting all forms of authority and belief in it."
  },
  // MARRIAGE AND LOVE (15 positions)
  {
    domain: "marriage_love",
    content: "Marriage and love are antagonistic and have nothing in common."
  },
  {
    domain: "marriage_love",
    content: "Marriage is an economic arrangement that ensures women's dependence."
  },
  {
    domain: "marriage_love",
    content: "Love cannot thrive under the constraints of legal marriage."
  },
  {
    domain: "marriage_love",
    content: "The institution of marriage protects property, not affection."
  },
  {
    domain: "marriage_love",
    content: "Free love is the only basis for genuine companionship."
  },
  {
    domain: "marriage_love",
    content: "Marriage often reduces love to tolerance or indifference."
  },
  {
    domain: "marriage_love",
    content: "True oneness comes from love, not institutional bonds."
  },
  {
    domain: "marriage_love",
    content: "Love is a spontaneous force that cannot be legislated or insured."
  },
  {
    domain: "marriage_love",
    content: "Marriage turns love into a duty and often kills passion."
  },
  {
    domain: "marriage_love",
    content: "Legal marriage provides no protection against emotional misery."
  },
  {
    domain: "marriage_love",
    content: "Children of loveless marriages suffer lifelong damage."
  },
  {
    domain: "marriage_love",
    content: "Economic independence is the prerequisite for true love."
  },
  {
    domain: "marriage_love",
    content: "Jealousy and possessiveness poison relationships."
  },
  {
    domain: "marriage_love",
    content: "Marriage as an institution belongs to the property system."
  },
  {
    domain: "marriage_love",
    content: "Only free love can achieve genuine harmony between partners."
  },
  // WOMEN'S EMANCIPATION (15 positions)
  {
    domain: "women_emancipation",
    content: "Woman suffrage alone will not achieve true emancipation without economic independence."
  },
  {
    domain: "women_emancipation",
    content: "The traffic in women is rooted in economic necessity and social hypocrisy."
  },
  {
    domain: "women_emancipation",
    content: "Emancipation of women requires breaking free from traditional roles."
  },
  {
    domain: "women_emancipation",
    content: "Traditional marriage economically and emotionally enslaves women."
  },
  {
    domain: "women_emancipation",
    content: "The emancipation of women requires complete economic and sexual independence."
  },
  {
    domain: "women_emancipation",
    content: "Prostitution results from women's economic dependence, not moral depravity."
  },
  {
    domain: "women_emancipation",
    content: "Low wages for women workers make prostitution economically rational."
  },
  {
    domain: "women_emancipation",
    content: "Sexual double standards punish women while excusing male buyers."
  },
  {
    domain: "women_emancipation",
    content: "Women are trained from childhood to trade sexuality for security."
  },
  {
    domain: "women_emancipation",
    content: "Abolishing prostitution requires abolishing women's economic slavery."
  },
  {
    domain: "women_emancipation",
    content: "The hypocrisy of respectable society creates the vice it condemns."
  },
  {
    domain: "women_emancipation",
    content: "Women's sexual autonomy is the only answer to sexual exploitation."
  },
  {
    domain: "women_emancipation",
    content: "Ending the traffic in women requires revolutionary social transformation."
  },
  {
    domain: "women_emancipation",
    content: "Birth control and sexual freedom are essential for women's liberation."
  },
  {
    domain: "women_emancipation",
    content: "Personal love must be free from possessiveness and legal ties."
  },
  // BIRTH CONTROL (15 positions)
  {
    domain: "birth_control",
    content: "Birth control is fundamental to women's emancipation and self-ownership."
  },
  {
    domain: "birth_control",
    content: "Involuntary motherhood is a form of slavery imposed on women."
  },
  {
    domain: "birth_control",
    content: "Women must control their own bodies to achieve genuine freedom."
  },
  {
    domain: "birth_control",
    content: "Comstock laws criminalizing contraceptive information serve patriarchal control."
  },
  {
    domain: "birth_control",
    content: "Large families perpetuate poverty and economic dependence."
  },
  {
    domain: "birth_control",
    content: "The state has no legitimate authority over reproduction."
  },
  {
    domain: "birth_control",
    content: "Working-class women suffer most from lack of contraceptive access."
  },
  {
    domain: "birth_control",
    content: "Religious opposition to birth control reflects hatred of female autonomy."
  },
  {
    domain: "birth_control",
    content: "Contraception enables women to separate sexuality from reproduction."
  },
  {
    domain: "birth_control",
    content: "The criminalization of birth control information is state tyranny."
  },
  {
    domain: "birth_control",
    content: "Women's bodies are not property of church, state, or husband."
  },
  {
    domain: "birth_control",
    content: "Contraception enables love free from fear of unwanted pregnancy."
  },
  {
    domain: "birth_control",
    content: "Birth control advocacy is direct action against patriarchal law."
  },
  {
    domain: "birth_control",
    content: "Voluntary motherhood is the foundation of women's dignity."
  },
  {
    domain: "birth_control",
    content: "True morality supports conscious, chosen parenthood over compulsory breeding."
  },
  // ATHEISM (15 positions)
  {
    domain: "atheism",
    content: "Atheism is the philosophy of a concrete, real world rather than an imaginary beyond."
  },
  {
    domain: "atheism",
    content: "God is a product of human fear, ignorance, and the desire for authority."
  },
  {
    domain: "atheism",
    content: "Theism has paralyzed human thought and stunted intellectual growth."
  },
  {
    domain: "atheism",
    content: "Religion demands surrender of reason to faith and dogma."
  },
  {
    domain: "atheism",
    content: "The God idea has justified every form of tyranny and oppression."
  },
  {
    domain: "atheism",
    content: "Atheism liberates humanity to rely on its own powers and capacities."
  },
  {
    domain: "atheism",
    content: "Morality based on divine command is no morality at all."
  },
  {
    domain: "atheism",
    content: "Heaven and hell are instruments of psychological terrorism."
  },
  {
    domain: "atheism",
    content: "Religious institutions ally with the state to maintain submission."
  },
  {
    domain: "atheism",
    content: "The decline of God belief marks the ascent of human self-respect."
  },
  {
    domain: "atheism",
    content: "Atheism affirms life in the present rather than deferring to an afterlife."
  },
  {
    domain: "atheism",
    content: "The concept of sin degrades natural human impulses."
  },
  {
    domain: "atheism",
    content: "Atheism is the prerequisite for genuine ethical autonomy."
  },
  {
    domain: "atheism",
    content: "Humanity outgrows gods as it matures intellectually."
  },
  {
    domain: "atheism",
    content: "Atheism opens the path to human solidarity based on earthly concerns."
  },
  // RUSSIA AND BOLSHEVISM (15 positions)
  {
    domain: "russia_bolshevism",
    content: "The Bolshevik Revolution betrayed its initial libertarian promises."
  },
  {
    domain: "russia_bolshevism",
    content: "Bolsheviks established a centralized dictatorship rather than true socialism."
  },
  {
    domain: "russia_bolshevism",
    content: "The regime suppressed freedom of speech and persecuted anarchists."
  },
  {
    domain: "russia_bolshevism",
    content: "State capitalism replaced genuine workers' control under the Bolsheviks."
  },
  {
    domain: "russia_bolshevism",
    content: "The Cheka and secret police crushed dissent and revolutionary ideals."
  },
  {
    domain: "russia_bolshevism",
    content: "Marxist theory is cold, mechanistic, and enslaving in practice."
  },
  {
    domain: "russia_bolshevism",
    content: "The dictatorship of the proletariat became dictatorship over the proletariat."
  },
  {
    domain: "russia_bolshevism",
    content: "Kronstadt rebellion represented the final betrayal of revolutionary spirit."
  },
  {
    domain: "russia_bolshevism",
    content: "Revolutionary ethics cannot be separated from revolutionary methods."
  },
  {
    domain: "russia_bolshevism",
    content: "Centralization inevitably leads to bureaucracy and oppression."
  },
  {
    domain: "russia_bolshevism",
    content: "The Bolshevik myth deceived revolutionaries worldwide."
  },
  {
    domain: "russia_bolshevism",
    content: "True social revolution must reject all forms of authoritarianism."
  },
  {
    domain: "russia_bolshevism",
    content: "Authoritarian principles proved bankrupt in Russia."
  },
  {
    domain: "russia_bolshevism",
    content: "The experience confirmed anarchism's critique of Marxist statism."
  },
  {
    domain: "russia_bolshevism",
    content: "The Russian experience proved that state power corrupts revolutionaries."
  },
  // SPANISH REVOLUTION (15 positions)
  {
    domain: "spanish_revolution",
    content: "The Spanish Revolution was the most significant anarchist experiment in history."
  },
  {
    domain: "spanish_revolution",
    content: "Spanish workers and peasants demonstrated that anarchism works in practice."
  },
  {
    domain: "spanish_revolution",
    content: "The CNT-FAI showed that industry can function without bosses or state."
  },
  {
    domain: "spanish_revolution",
    content: "Collectivization of land proved peasants can organize without landlords."
  },
  {
    domain: "spanish_revolution",
    content: "The communists systematically betrayed and destroyed the revolution."
  },
  {
    domain: "spanish_revolution",
    content: "Soviet aid came with strings that strangled anarchist achievements."
  },
  {
    domain: "spanish_revolution",
    content: "The Barcelona May Days of 1937 marked the counter-revolution's triumph."
  },
  {
    domain: "spanish_revolution",
    content: "Women in Spain achieved unprecedented liberation during the revolution."
  },
  {
    domain: "spanish_revolution",
    content: "The Mujeres Libres represented genuine feminist anarchism in action."
  },
  {
    domain: "spanish_revolution",
    content: "Centralization of the war effort undermined revolutionary gains."
  },
  {
    domain: "spanish_revolution",
    content: "The Spanish experience refuted claims that anarchism is impractical."
  },
  {
    domain: "spanish_revolution",
    content: "Spain showed revolution must be social and economic, not merely political."
  },
  {
    domain: "spanish_revolution",
    content: "The defeat resulted from betrayal, not from anarchism's inherent flaws."
  },
  {
    domain: "spanish_revolution",
    content: "The Spanish struggle's lessons remain vital for future revolutions."
  },
  {
    domain: "spanish_revolution",
    content: "True anti-fascism requires social revolution, not mere defense of the state."
  },
  // ANTI-MILITARISM (15 positions)
  {
    domain: "anti_militarism",
    content: "Conscription is slavery imposed by the state for the benefit of capital."
  },
  {
    domain: "anti_militarism",
    content: "No government has the right to compel individuals to kill or die."
  },
  {
    domain: "anti_militarism",
    content: "The World War serves only the interests of munitions makers and bankers."
  },
  {
    domain: "anti_militarism",
    content: "Patriotic fever is manufactured to suppress class consciousness."
  },
  {
    domain: "anti_militarism",
    content: "Workers have no quarrel with workers of other nations."
  },
  {
    domain: "anti_militarism",
    content: "Anti-war resistance is a fundamental anarchist duty."
  },
  {
    domain: "anti_militarism",
    content: "War propaganda systematically lies about the conflict's causes and aims."
  },
  {
    domain: "anti_militarism",
    content: "The No-Conscription League defends individual conscience against state compulsion."
  },
  {
    domain: "anti_militarism",
    content: "War hysteria enables unprecedented suppression of free speech."
  },
  {
    domain: "anti_militarism",
    content: "International solidarity of workers can prevent future wars."
  },
  {
    domain: "anti_militarism",
    content: "Those who profit from war never fight in it."
  },
  {
    domain: "anti_militarism",
    content: "Prison for anti-war conviction is preferable to killing for capitalism."
  },
  {
    domain: "anti_militarism",
    content: "The state's war power reveals its essentially violent nature."
  },
  {
    domain: "anti_militarism",
    content: "Mass resistance to conscription can make war impossible."
  },
  {
    domain: "anti_militarism",
    content: "Patriotism is a superstition that fosters blind obedience and war."
  },
  // POLITICAL VIOLENCE (10 positions)
  {
    domain: "political_violence",
    content: "Political violence is often a response to systemic oppression rather than inherent evil."
  },
  {
    domain: "political_violence",
    content: "Political assassins are often products of intolerable conditions."
  },
  {
    domain: "political_violence",
    content: "Violence is justified in response to systemic violence."
  },
  {
    domain: "political_violence",
    content: "The assassination attempt on Frick was an act of revolutionary protest."
  },
  {
    domain: "political_violence",
    content: "State persecution strengthens rather than weakens true conviction."
  },
  {
    domain: "political_violence",
    content: "Anti-anarchist repression reveals the violence inherent in the state."
  },
  {
    domain: "political_violence",
    content: "Assassins are often desperate products of an unjust social order."
  },
  {
    domain: "political_violence",
    content: "Deportation and persecution highlight state's fear of dissent."
  },
  {
    domain: "political_violence",
    content: "Solidarity with political prisoners is a core revolutionary principle."
  },
  {
    domain: "political_violence",
    content: "Life's meaning lies in the struggle for freedom and justice."
  },
  // PRISONS (10 positions)
  {
    domain: "prisons",
    content: "Prisons do not reform but degrade individuals and society."
  },
  {
    domain: "prisons",
    content: "Prisons are institutions of revenge that brutalize rather than rehabilitate."
  },
  {
    domain: "prisons",
    content: "Prisons brutalize and should be abolished."
  },
  {
    domain: "prisons",
    content: "Prisons and state repression brutalize rather than reform."
  },
  {
    domain: "prisons",
    content: "The law exists to maintain inequality, not to dispense justice."
  },
  {
    domain: "prisons",
    content: "Harsh penalties weaken states by creating fear."
  },
  {
    domain: "prisons",
    content: "Mild punishments combined with certainty are most effective."
  },
  {
    domain: "prisons",
    content: "State persecution strengthens rather than weakens true conviction."
  },
  {
    domain: "prisons",
    content: "Political prisoners are persecuted for their ideas, not their crimes."
  },
  {
    domain: "prisons",
    content: "The prison system perpetuates the conditions that create crime."
  },
  // DRAMA AND ART (10 positions)
  {
    domain: "drama_art",
    content: "Modern drama serves as a mirror reflecting social realities and injustices."
  },
  {
    domain: "drama_art",
    content: "Drama is a powerful tool for revolutionary propaganda and awakening consciousness."
  },
  {
    domain: "drama_art",
    content: "Art should not be for art's sake but must address social and political issues."
  },
  {
    domain: "drama_art",
    content: "Henrik Ibsen exposes the hypocrisy of bourgeois marriage and societal lies."
  },
  {
    domain: "drama_art",
    content: "George Bernard Shaw uses wit to challenge capitalism, war, and moral hypocrisy."
  },
  {
    domain: "drama_art",
    content: "The modern stage must serve as a dynamite to shatter complacency."
  },
  {
    domain: "drama_art",
    content: "Art and literature must serve human emancipation."
  },
  {
    domain: "drama_art",
    content: "Modern drama and literature are vital tools for radical education."
  },
  {
    domain: "drama_art",
    content: "Theater and drama can awaken revolutionary consciousness in audiences."
  },
  {
    domain: "drama_art",
    content: "Culture and art are powerful vehicles for social transformation."
  },
  // NIETZSCHE INFLUENCE (10 positions)
  {
    domain: "nietzsche",
    content: "Nietzsche's individualism reinforces anarchism's rejection of herd mentality."
  },
  {
    domain: "nietzsche",
    content: "The Übermensch ideal supports human self-overcoming and self-creation."
  },
  {
    domain: "nietzsche",
    content: "Nietzsche's critique of slave morality parallels anarchist rejection of submission."
  },
  {
    domain: "nietzsche",
    content: "The will to power, properly understood, is creative self-assertion."
  },
  {
    domain: "nietzsche",
    content: "Nietzsche demolishes the idols of state, church, and bourgeois respectability."
  },
  {
    domain: "nietzsche",
    content: "The death of God opens space for human self-determination."
  },
  {
    domain: "nietzsche",
    content: "Nietzsche's aristocratic tendencies must be corrected by anarchist egalitarianism."
  },
  {
    domain: "nietzsche",
    content: "Intellectual courage and honesty are supreme Nietzschean virtues."
  },
  {
    domain: "nietzsche",
    content: "Nietzsche shows that morality has a history and can be changed."
  },
  {
    domain: "nietzsche",
    content: "Nietzsche provides philosophical depth to anarchism's practical program."
  }
];

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function embedGoldmanPositions() {
  console.log(`Starting to embed ${goldmanPositions.length} Emma Goldman positions...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < goldmanPositions.length; i++) {
    const position = goldmanPositions[i];
    
    try {
      const embedding = await generateEmbedding(position.content);
      
      await db.insert(paperChunks).values({
        figureId: "goldman",
        author: "Emma Goldman",
        paperTitle: `Goldman Position: ${position.domain.replace(/_/g, " ")}`,
        content: position.content,
        embedding: embedding,
        chunkIndex: i,
        domain: position.domain,
        significance: "HIGH",
      });
      
      successCount++;
      
      if ((i + 1) % 20 === 0) {
        console.log(`Progress: ${i + 1}/${goldmanPositions.length} positions embedded`);
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

embedGoldmanPositions()
  .then(() => {
    console.log("Emma Goldman positions embedding finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

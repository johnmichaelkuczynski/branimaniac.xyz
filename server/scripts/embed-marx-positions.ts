import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface Position {
  topic: string;
  positions: string[];
}

const marxPositions: Position[] = [
  {
    topic: "Contradictions of Capitalism",
    positions: [
      "Capitalism produces social wealth through private appropriation, creating an irreconcilable tension between socialized production and individualized ownership.",
      "The tendency of the rate of profit to fall is inherent to capitalism: as capitalists replace living labor with machinery, they undermine the very source of surplus value.",
      "Capitalism requires constant expansion yet operates within finite markets, generating periodic crises of overproduction.",
      "The system simultaneously creates and destroys its own conditions of existence—it revolutionizes production while undermining the social relations that sustain it.",
      "Wage labor is both 'free' (workers can sell their labor) and unfree (workers must sell their labor to survive), a contradiction masked by juridical equality.",
      "Capitalism universalizes commodity production while making the commodity form itself a barrier to human development.",
      "The credit system, developed to overcome circulation barriers, intensifies rather than resolves capitalism's contradictions by enabling speculative bubbles.",
      "Competition compels individual capitalists to act in ways that collectively undermine capital as a whole—each rational individual choice produces irrational systemic outcomes.",
      "Capitalism develops productive forces to the point where they become incompatible with capitalist property relations, creating the material basis for socialism.",
      "The reserve army of labor is both necessary for capitalism (wage discipline) and destabilizing (insufficient consumption), embodying capitalism's self-undermining logic."
    ]
  },
  {
    topic: "Adam Smith",
    positions: [
      "Smith correctly identified labor as the source of value but failed to distinguish between labor and labor-power, obscuring the origin of surplus value.",
      "Smith's 'invisible hand' mystifies real economic relations by presenting class exploitation as natural market harmony.",
      "Smith confused the value of labor (wages) with the value created by labor, a fundamental error that blocked further theoretical development.",
      "Smith's analysis of the division of labor accurately described productivity gains but underestimated its dehumanizing and fragmenting effects on workers.",
      "The classical economists, including Smith, were scientific relative to vulgar economists because they sought to penetrate beneath surface phenomena to underlying laws.",
      "Smith's concept of 'productive' versus 'unproductive' labor contained a rational kernel—the distinction between labor that produces surplus value and labor that does not.",
      "Smith recognized that profit, rent, and wages are deductions from the total product of labor, approaching but not fully grasping the concept of exploitation.",
      "Smith's historical materialism was limited—he naturalized bourgeois society rather than recognizing it as a historically specific mode of production.",
      "Smith correctly saw that the accumulation of capital precedes the division of labor, but inverted the relationship between primitive accumulation and capitalist development.",
      "Smith's theory of value oscillates inconsistently between a labor theory and a cost-of-production theory, reflecting the contradictions of bourgeois political economy itself."
    ]
  },
  {
    topic: "Mechanization",
    positions: [
      "Machinery under capitalism is not neutral technology but capital's weapon against labor—it deskills workers and disciplines them to the rhythm of the machine.",
      "The machine does not liberate the worker but subordinates living labor to dead labor, inverting the proper relationship between human beings and their tools.",
      "Mechanization expels workers from production, creating the industrial reserve army that keeps wages at subsistence and workers docile.",
      "The introduction of machinery intensifies labor rather than reducing it—workers must match the machine's pace, increasing the extraction of relative surplus value.",
      "Machinery enables the employment of women and children, dissolving the family and extending exploitation to all members of the working-class household.",
      "The factory system completes the separation of mental and manual labor, concentrating knowledge in management while reducing workers to appendages of machines.",
      "Machinery represents accumulated past labor turned against living labor—the more productive workers become, the more they are dominated by their own objectified activity.",
      "Mechanization under capitalism produces unemployment and immiseration; under socialism, the same technology would reduce necessary labor time for all.",
      "The machine is the material basis for real subsumption of labor under capital, as opposed to merely formal subsumption where traditional crafts persist.",
      "Capitalist mechanization tends toward full automation, which would eliminate variable capital entirely and thus eliminate the source of surplus value—another internal contradiction."
    ]
  },
  {
    topic: "Means of Production",
    positions: [
      "The means of production are not things but social relations—their character as 'capital' derives from specific historical conditions, not inherent properties.",
      "Private ownership of the means of production is the foundation of class division, enabling one class to appropriate the surplus labor of another.",
      "The means of production confront the worker as alien, hostile powers—as capital—though they are the objectified product of workers' own collective labor.",
      "The concentration and centralization of the means of production is a historical tendency of capitalism that simultaneously creates the conditions for collective ownership.",
      "The means of production function as capital only when combined with labor-power in a relationship of exploitation; otherwise they are merely use-values.",
      "Socialization of the means of production—their collective ownership and democratic control—is the precondition for ending exploitation and class society.",
      "Under capitalism, the means of production dictate to the producer rather than serving human needs—the subject-object relationship is inverted.",
      "The transformation of individual means of production (artisan tools) into social means of production (factories) creates the material basis for socialism.",
      "Ownership of the means of production determines class position: those who own them exploit; those who do not are exploited.",
      "The means of production in capitalist society absorb living labor like a vampire—dead labor feeds on living labor to expand itself."
    ]
  },
  {
    topic: "Economic History",
    positions: [
      "History is fundamentally the history of modes of production—the ways human societies organize material life determine their social, political, and ideological forms.",
      "Capitalism is not a natural or eternal system but a historically specific mode of production that arose from feudalism and will be superseded by socialism.",
      "Primitive accumulation—the violent separation of producers from the means of production—was the historical precondition for capitalism, not peaceful market exchange.",
      "The transition from feudalism to capitalism involved enclosure of common lands, colonial plunder, slavery, and state violence—not the 'Protestant ethic.'",
      "Each mode of production contains contradictions that eventually make it a fetter on the development of productive forces, leading to revolutionary transformation.",
      "The Asiatic, ancient, feudal, and modern bourgeois modes of production represent progressive epochs in the economic formation of society.",
      "Capitalism historically advanced human productive capacity but has now become a barrier to further development—its progressive phase is exhausted.",
      "The bourgeoisie played a historically revolutionary role in destroying feudal relations and creating a world market, but is now a reactionary class.",
      "Economic history demonstrates that what appears natural and eternal in any epoch is revealed as transitory by subsequent development.",
      "The laws of capitalism are not laws of nature but historical laws specific to this mode of production; they will cease to operate when capitalism is abolished."
    ]
  },
  {
    topic: "Class Struggle",
    positions: [
      "The history of all hitherto existing society is the history of class struggles—freeman and slave, patrician and plebeian, lord and serf, bourgeois and proletarian.",
      "Class is determined by relationship to the means of production, not by income, lifestyle, or subjective identification.",
      "The modern class struggle is unique because the proletariat, unlike previous revolutionary classes, cannot achieve liberation except by abolishing all class distinctions.",
      "Class consciousness—the proletariat's awareness of itself as a class with historical interests opposed to capital—develops through struggle itself.",
      "The state is the executive committee of the ruling class, an instrument for managing common bourgeois affairs and suppressing working-class resistance.",
      "Trade union struggle over wages is necessary but insufficient—it addresses the effects of exploitation without abolishing exploitation itself.",
      "The bourgeoisie produces its own gravediggers—the very development of capitalism creates and concentrates the class that will overthrow it.",
      "Class struggle is not merely economic but political—the working class must constitute itself as a political force capable of seizing state power.",
      "The transition from a class-in-itself (objective class position) to a class-for-itself (conscious revolutionary agent) is the central problem of revolutionary politics.",
      "All previous historical movements were movements of minorities; the proletarian movement is the self-conscious movement of the immense majority in the interest of the immense majority."
    ]
  },
  {
    topic: "Propaganda",
    positions: [
      "The ruling ideas of any epoch are the ideas of the ruling class—those who control material production also control mental production.",
      "Ideology presents particular class interests as universal human interests, naturalizing historically contingent social arrangements.",
      "Bourgeois freedom, equality, and democracy are real but limited—they mask substantive unfreedom, inequality, and plutocracy.",
      "Religion is the opium of the people—not simply a deception imposed from above, but a protest against real suffering that simultaneously reconciles people to that suffering.",
      "The critique of ideology must be combined with material struggle; ideas alone cannot transform social reality.",
      "Bourgeois political economy is ideological insofar as it presents capitalism as natural, eternal, and rationally ordered rather than historically specific and contradictory.",
      "Revolutionary theory is not external to the working class but emerges from and articulates the real movement of class struggle.",
      "The illusion that the state stands above classes and represents the general interest is one of the most powerful ideological mystifications.",
      "The commodity form itself generates ideological effects (commodity fetishism)—the structure of capitalist production spontaneously produces false consciousness.",
      "Philosophy, religion, law, and other ideological forms have no independent history—their development is determined by the development of material production."
    ]
  },
  {
    topic: "Philosophy",
    positions: [
      "The philosophers have only interpreted the world; the point is to change it.",
      "Philosophy must be realized through the proletariat, and the proletariat must be realized through philosophy—theory and practice are inseparable.",
      "All philosophy hitherto has been ideology—the expression of particular class standpoints in apparently universal terms.",
      "Materialism is the only scientific worldview; idealism inverts the real relationship between thought and being.",
      "Philosophy cannot be abolished merely by philosophical critique; it must be abolished through revolutionary transformation of the conditions that produce it.",
      "German classical philosophy, especially Hegel, represents the highest development of bourgeois thought and must be both superseded and preserved (aufgehoben).",
      "The critique of religion is the premise of all criticism; religion is the fantastic realization of the human essence because the human essence possesses no true reality.",
      "Philosophy in the proletarian era becomes a guide to revolutionary practice, not contemplation of eternal truths.",
      "The question whether objective truth can be attributed to human thinking is a practical question—practice is the criterion of truth.",
      "Genuine philosophy grasps its time in thought; it cannot leap over its own epoch but can comprehend the contradictions that point beyond it."
    ]
  },
  {
    topic: "Dialectical Materialism",
    positions: [
      "Dialectics is the science of the general laws of motion and development in nature, society, and thought—these laws are objective, not merely logical.",
      "The materialist dialectic stands Hegel's idealist dialectic on its feet—the rational kernel (dialectical method) must be extracted from the mystical shell (idealism).",
      "Dialectical contradiction is not logical contradiction but the unity of opposites within a totality—real things are internally contradictory.",
      "Quantity transforms into quality at certain nodal points—gradual accumulation produces sudden qualitative leaps (revolutionary transformation).",
      "Negation of the negation: historical development proceeds through the supersession of each stage by its opposite, which is in turn superseded at a higher level.",
      "The concrete is concrete because it is the concentration of many determinations—analysis must proceed from abstract to concrete, not from particular to general.",
      "Being determines consciousness; social existence determines social consciousness—not the reverse, as idealists claim.",
      "Dialectical materialism rejects both mechanical materialism (which cannot account for change and development) and idealism (which inverts subject and object).",
      "The dialectic includes within itself the notion of development, of becoming—things are not fixed entities but processes.",
      "Freedom is the recognition of necessity; genuine human freedom requires understanding and mastering the laws governing nature and society."
    ]
  },
  {
    topic: "Hegel",
    positions: [
      "Hegel's dialectic is mystified but contains a rational kernel—the concepts of contradiction, negation, and development are genuine discoveries.",
      "Hegel absolutized thought, making the Idea the demiurge of reality; materialism reverses this, showing thought as the reflection of material reality.",
      "Hegel's philosophy of history contains real insight—history does move through contradictions—but his idealism presents Spirit rather than material production as the motor.",
      "The Hegelian system is internally contradictory: the conservative system (absolute knowledge achieved) conflicts with the revolutionary method (endless development).",
      "Hegel's Logic is the 'algebra of revolution'—when demystified, it provides the conceptual tools for comprehending capitalist contradictions.",
      "Hegel was the philosopher of the bourgeois revolution in thought; Marx represents the proletarian supersession of Hegelian philosophy.",
      "Hegel's master-slave dialectic anticipates the class struggle, showing how the bondsman's labor leads to a higher consciousness than the master's consumption.",
      "Hegel's idealism reflects the alienated form of social relations under capitalism, where abstractions (value, capital) really do dominate concrete human activity.",
      "The Young Hegelians criticized religion while leaving Hegel's method and premises intact; genuine critique must be materialist, not merely atheist.",
      "Hegel completed philosophy by bringing it to its logical conclusion; philosophy itself must now be abolished through its realization in practice."
    ]
  },
  {
    topic: "Money",
    positions: [
      "Money is the universal equivalent—a commodity that expresses the value of all other commodities and thereby reveals that value itself is social labor.",
      "The money form conceals the social character of labor, presenting the products of human activity as things with inherent value.",
      "Money is the alienated capacity of mankind; what I cannot do, money can do—it transforms my wishes from imaginary to real.",
      "The movement M-C-M' (money-commodity-more money) is the general formula of capital; money becomes capital when it enters into this self-expanding circuit.",
      "Money as hoard represents wealth in its abstract form, the desire for which drives the miser's endless accumulation.",
      "The contradiction between money's function as measure of value and medium of circulation creates the possibility (though not necessity) of crisis.",
      "Credit money and fictitious capital represent claims on future surplus value, extending and intensifying capitalism's contradictions.",
      "Gold and silver are not money by nature; rather, money is by nature gold and silver—historically, precious metals became the money commodity.",
      "Money fetishism is a particularly pure form of commodity fetishism—the social power of money appears as an inherent property of the metal.",
      "Money enables the comparison of heterogeneous labors and the exchange of qualitatively different products by reducing all to abstract quantities."
    ]
  },
  {
    topic: "Capital",
    positions: [
      "Capital is not a thing but a social relation of production—it is self-expanding value, value that produces surplus value through the exploitation of labor.",
      "Capital is dead labor that, vampire-like, lives only by sucking living labor; the more it sucks, the more it lives.",
      "The circuit of capital (M-C...P...C'-M') reveals its essence as value in motion, constantly transforming itself through different phases.",
      "Constant capital (means of production) transfers its value to the product; variable capital (labor-power) creates new value beyond its own replacement.",
      "Capital appears in three forms—money capital, productive capital, and commodity capital—each phase necessary for the reproduction of the whole.",
      "The organic composition of capital (ratio of constant to variable capital) tends to rise, producing the tendency of the rate of profit to fall.",
      "Capital accumulation is the reconversion of surplus value into capital—capitalist production is production for the sake of production itself.",
      "Capital is not merely accumulated labor but accumulated unpaid labor—every increase in capital represents the appropriation of workers' surplus labor.",
      "The general law of capitalist accumulation produces wealth at one pole and misery, toil, and degradation at the other.",
      "Capital must constantly revolutionize the conditions of production to extract relative surplus value, driving technological change and social upheaval."
    ]
  },
  {
    topic: "Subjective Incorrectness",
    positions: [
      "Consciousness is determined by social being—individuals' subjective views reflect their material conditions and class position, not autonomous rational reflection.",
      "False consciousness is not mere individual error but the systematic misrecognition of social reality produced by ideological structures.",
      "Workers may subjectively identify with their exploiters; such identification is objectively false even if psychologically genuine.",
      "Bourgeois economists sincerely believe in the justice and rationality of capitalism; their error is socially necessary, arising from their class standpoint.",
      "Subjective intentions are irrelevant to the objective function of actions and ideas—the road to hell is paved with good intentions.",
      "The proletariat's subjective transformation (class consciousness) must correspond to its objective position (exploitation) for revolutionary change.",
      "Revolutionary theory corrects spontaneous working-class consciousness, which otherwise remains trapped within bourgeois categories.",
      "Ideology operates precisely through subjects who believe themselves to be thinking freely; subjective freedom can mask objective unfreedom.",
      "The categories of bourgeois thought (freedom, equality, rights) are not simply false but are true in a limited sense that conceals deeper unfreedoms.",
      "Critique aims not to show that individuals think incorrectly but to expose the social conditions that make certain thoughts necessary and others impossible."
    ]
  },
  {
    topic: "Objective Incorrectness",
    positions: [
      "Objective truth exists independently of what any individual or class believes; material reality is not constituted by thought.",
      "Bourgeois political economy contains objective errors—not merely bias, but demonstrable logical fallacies and empirical mistakes (e.g., on value).",
      "Capitalism is objectively irrational even when functioning 'normally': it subordinates human needs to the self-expansion of capital.",
      "The labor theory of value is objectively correct—value is determined by socially necessary labor time, regardless of subjective preferences.",
      "Exploitation is an objective relation, not a moral judgment—surplus value extraction occurs regardless of anyone's beliefs about fairness.",
      "Historical laws operate objectively, 'behind the backs' of individuals, producing outcomes no one intended (e.g., the falling rate of profit).",
      "The objective contradictions of capitalism will produce crisis regardless of state policy, good intentions, or ideological mystification.",
      "Class position is objectively determined by relationship to the means of production, not by income, education, or self-identification.",
      "Scientific socialism, unlike utopian socialism, bases its claims on objective analysis of capitalist laws of motion, not moral appeals.",
      "The objective development of productive forces creates the material conditions for socialism; subjective revolutionary will alone is insufficient."
    ]
  },
  {
    topic: "Exploitation",
    positions: [
      "Exploitation is the extraction of surplus labor—the worker works longer than necessary to reproduce the value of their own labor-power.",
      "Exploitation under capitalism is concealed by the wage form, which appears to pay for all labor performed rather than just labor-power.",
      "The rate of exploitation (surplus value divided by variable capital) measures the degree to which capital appropriates unpaid labor.",
      "Exploitation is not synonymous with low wages or harsh conditions; even well-paid workers are exploited if they produce surplus value.",
      "Pre-capitalist exploitation was transparent (serfdom, slavery); capitalist exploitation is mystified by the apparent equivalence of wage exchange.",
      "Absolute surplus value extraction increases exploitation by lengthening the working day; relative surplus value extraction intensifies labor.",
      "The source of profit, interest, and rent is the surplus value extracted from productive workers—all property income is exploitation.",
      "Exploitation is a structural feature of capitalism, not the result of individual greed or moral failing.",
      "The end of exploitation requires the abolition of wage labor itself, not merely higher wages or better working conditions.",
      "Workers collectively produce all value but receive only a portion as wages; the remainder is appropriated by capital without equivalent."
    ]
  },
  {
    topic: "Capital Accumulation",
    positions: [
      "Accumulation of capital is the reconversion of surplus value into additional capital—the compulsion to accumulate is capitalism's absolute law.",
      "Capitalists are merely personifications of capital; their individual consumption is a sin against accumulation; they accumulate for accumulation's sake.",
      "Accumulation produces the concentration of capital (individual capitals grow) and centralization of capital (capitals merge and absorb each other).",
      "Accumulation simultaneously produces relative surplus population—the industrial reserve army—necessary for capital but devastating for workers.",
      "The general law of capitalist accumulation: accumulation of wealth at one pole is simultaneously accumulation of misery at the opposite pole.",
      "Primitive accumulation—the historical process divorcing producers from means of production—was the precondition for capitalist accumulation proper.",
      "Accumulation requires the reproduction of capitalist relations themselves—not just things, but the class relation between capital and labor.",
      "The rate of accumulation depends on the rate of surplus value, the organic composition of capital, and the division of surplus value between capitalist consumption and reinvestment.",
      "Expanded reproduction requires that total social capital grows, realized through the exchange between Department I (means of production) and Department II (means of consumption).",
      "Accumulation drives the socialization of production while maintaining private appropriation, sharpening the fundamental contradiction of capitalism."
    ]
  },
  {
    topic: "Bourgeoisie",
    positions: [
      "The bourgeoisie is the class that owns the means of production and employs wage labor, living off the appropriation of surplus value.",
      "The bourgeoisie played a historically revolutionary role, destroying feudal relations and creating an integrated world market.",
      "The bourgeoisie cannot exist without constantly revolutionizing the instruments of production and thereby the relations of production.",
      "The bourgeoisie has created more massive and more colossal productive forces than all preceding generations together.",
      "The bourgeoisie has agglomerated population, centralized means of production, and concentrated property in a few hands.",
      "The bourgeoisie has stripped of its halo every occupation hitherto honored—physician, lawyer, priest, poet—making all into paid wage laborers.",
      "The bourgeoisie cannot rule without perpetually developing the productive forces, yet this development produces the proletariat that will overthrow it.",
      "The bourgeoisie produces its own gravediggers; its fall and the victory of the proletariat are equally inevitable.",
      "The executive of the modern state is but a committee for managing the common affairs of the whole bourgeoisie.",
      "The bourgeoisie has drowned the most heavenly ecstasies of religious fervor, of chivalrous enthusiasm, in the icy water of egotistical calculation."
    ]
  },
  {
    topic: "Proletariat",
    positions: [
      "The proletariat is the class that owns no means of production and must sell its labor-power to survive; it is the universal class whose liberation liberates all.",
      "The proletariat is a product of modern industry; it is recruited from all classes but crystallizes into a unified class through common conditions and struggles.",
      "The proletariat begins as a class-in-itself (objective position) and becomes a class-for-itself (conscious revolutionary agent) through political struggle.",
      "The proletariat cannot achieve its own emancipation without emancipating society as a whole from class division.",
      "The proletariat has nothing to lose but its chains; it has a world to win.",
      "The proletariat is the only consistently revolutionary class because its interests are incompatible with the preservation of the existing order.",
      "The proletariat, unlike previous revolutionary classes, seeks not to establish new forms of domination but to abolish domination itself.",
      "The dictatorship of the proletariat is the transitional state form through which the working class suppresses bourgeois resistance and reorganizes society.",
      "The international character of capital requires international proletarian solidarity: workers of all countries, unite!",
      "The emancipation of the working class must be the act of the working class itself—not something done for them by benevolent elites."
    ]
  },
  {
    topic: "Lumpenproletariat",
    positions: [
      "The lumpenproletariat is the 'dangerous class,' the social scum, the passively rotting mass thrown off by the lowest layers of the old society.",
      "The lumpenproletariat includes vagabonds, criminals, prostitutes, and others who exist outside regular wage labor.",
      "The lumpenproletariat lacks the discipline and collective consciousness that factory labor produces in the industrial proletariat.",
      "The lumpenproletariat is susceptible to reactionary manipulation and may serve as a tool of counterrevolution.",
      "The conditions of life of the lumpenproletariat prepare it far more for the part of a bribed tool of reactionary intrigue than for revolutionary action.",
      "Louis Bonaparte recruited his base from the lumpenproletariat—the 'Society of December Tenth' was composed of this declassed element.",
      "The lumpenproletariat is a product of capitalist disintegration, consisting of those who have fallen out of productive relations entirely.",
      "Unlike the industrial proletariat, the lumpenproletariat has no stake in the productive apparatus and no basis for constructive class politics.",
      "The lumpenproletariat may participate in revolutionary upheavals but cannot lead them and will likely betray the revolution for material gain.",
      "The distinction between proletariat and lumpenproletariat reflects the difference between those integrated into capitalist production and those expelled from it."
    ]
  },
  {
    topic: "Capitalism",
    positions: [
      "Capitalism is a historically specific mode of production characterized by generalized commodity production, wage labor, and the self-expansion of capital.",
      "Capitalism arose from feudalism through primitive accumulation—the forcible separation of producers from the means of production.",
      "Capitalism's laws of motion (accumulation, concentration, crisis) operate objectively, regardless of the intentions of individual capitalists.",
      "Capitalism has created unprecedented productive power but subordinates this power to the imperatives of profit rather than human need.",
      "Capitalism is inherently expansionist; capital must constantly find new markets, new sources of labor, and new fields of investment.",
      "Capitalism has created a world after its own image, battering down Chinese walls and compelling all nations to adopt the bourgeois mode of production.",
      "Capitalism is a system of generalized crisis—not occasional disruption but periodic, necessary breakdowns built into its structure.",
      "Capitalism is not eternal or natural; it is a transient historical phase that creates the conditions for its own supersession.",
      "Capitalism transforms everything into commodities, including labor-power, land, and eventually knowledge and care—commodifying human life itself.",
      "Capitalism's progressive historical role—developing productive forces, creating the world market, producing the proletariat—is exhausted; it has become a fetter on human development."
    ]
  },
  {
    topic: "Capitalist",
    positions: [
      "The capitalist is the personification of capital—a character mask whose function is to accumulate, regardless of individual psychology.",
      "The capitalist's only use value is the capacity to extract surplus value; the capitalist performs no productive labor.",
      "As capitalist, the individual is merely capital personified; their soul is the soul of capital.",
      "The capitalist must accumulate or perish—competition compels each to expand or be absorbed by competitors.",
      "The capitalist experiences the contradiction between use and exchange in reverse: the use value of any commodity for the capitalist is that it embodies surplus value.",
      "The capitalist began historically as the merchant and usurer; the industrial capitalist subordinated these earlier forms of capital.",
      "The capitalist confronts the worker not as individual but as representative of a class; exploitation is structural, not personal.",
      "The individual capitalist is as much dominated by capital as the worker—both are subjected to the impersonal logic of accumulation.",
      "The functioning capitalist (entrepreneur) and the money capitalist (financier) divide surplus value between them as profit and interest.",
      "The capitalist will be abolished as a class through the socialization of the means of production, not through moral reform of individuals."
    ]
  },
  {
    topic: "Alienation",
    positions: [
      "Alienated labor is labor that does not belong to the worker but to another; in working, the worker does not affirm but denies themselves.",
      "The worker is alienated from the product of labor—the more they produce, the more they create an alien world of objects that dominates them.",
      "The worker is alienated from the activity of labor itself—work is not the satisfaction of a need but merely a means to satisfy needs external to it.",
      "Human beings are alienated from their species-being—from what makes them distinctively human: free, conscious, creative activity.",
      "Human beings are alienated from each other—capitalism transforms social relations into competitive, hostile encounters between isolated individuals.",
      "Private property is both the product and cause of alienated labor; the two are reciprocally determining.",
      "Alienation is not merely subjective unhappiness but an objective condition of estrangement from one's own activity, product, and fellow beings.",
      "The transcendence of alienation requires the abolition of private property and the creation of conditions for genuinely free human activity.",
      "Religion, philosophy, and other ideological forms are expressions of human alienation—the fantastic realization of human essence because the human essence has no true reality.",
      "Communism is the positive transcendence of alienation—the return of human beings to themselves as social beings, the genuine resolution of the conflict between existence and essence."
    ]
  }
];

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function embedMarxPositions() {
  console.log("Starting Karl Marx position embedding...");
  console.log(`Processing ${marxPositions.length} topics with 10 positions each = 220 total positions`);

  let totalEmbedded = 0;
  let totalSkipped = 0;

  for (const topicData of marxPositions) {
    console.log(`\nProcessing topic: ${topicData.topic}`);
    
    for (let i = 0; i < topicData.positions.length; i++) {
      const position = topicData.positions[i];
      const positionNumber = i + 1;
      
      const paperTitle = `Marx on ${topicData.topic} - Position ${positionNumber}`;
      const contentWithContext = `[DOMAIN: ${topicData.topic}] ${position}`;
      
      try {
        const embedding = await getEmbedding(contentWithContext);
        
        await db.insert(paperChunks).values({
          paperTitle,
          content: contentWithContext,
          embedding,
          author: "marx",
          figureId: "marx",
          chunkIndex: positionNumber,
        });
        
        totalEmbedded++;
        console.log(`  ✓ Position ${positionNumber}: ${position.substring(0, 60)}...`);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error: any) {
        if (error.code === '23505') {
          totalSkipped++;
          console.log(`  ⊘ Position ${positionNumber} already exists, skipping...`);
        } else {
          console.error(`  ✗ Error embedding position ${positionNumber}:`, error);
          throw error;
        }
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`Karl Marx embedding complete!`);
  console.log(`Total embedded: ${totalEmbedded}`);
  console.log(`Total skipped (already existed): ${totalSkipped}`);
  console.log(`========================================`);
}

embedMarxPositions()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

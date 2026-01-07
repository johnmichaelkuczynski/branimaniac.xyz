import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "../../shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const galileoPositions = [
  // SIDEREUS NUNCIUS (1610) - 20 positions
  {
    domain: "sidereus_nuncius",
    content: "The moon's surface is rough, uneven, and full of cavities and prominences—not a perfect sphere as Aristotelian cosmology demands."
  },
  {
    domain: "sidereus_nuncius",
    content: "Lunar mountains exist and can be measured geometrically by their shadows. I calculated some exceed four miles in height."
  },
  {
    domain: "sidereus_nuncius",
    content: "The boundary between lunar light and dark regions is irregular, not a smooth arc—proving the moon's surface is rough like Earth's."
  },
  {
    domain: "sidereus_nuncius",
    content: "The moon has no intrinsic light but reflects sunlight, just as Earth does."
  },
  {
    domain: "sidereus_nuncius",
    content: "Earthshine on the moon—the faint glow on the dark portion—is reflected light from Earth, proving Earth shines like a celestial body."
  },
  {
    domain: "sidereus_nuncius",
    content: "Earth itself would appear luminous when viewed from the moon. There is no fundamental difference between Earth and celestial bodies."
  },
  {
    domain: "sidereus_nuncius",
    content: "The Milky Way is composed of innumerable individual stars, not a luminous vapor as Aristotle taught."
  },
  {
    domain: "sidereus_nuncius",
    content: "Nebulae resolve into clusters of discrete stars under magnification. What appears cloudy to the naked eye is actually countless stars."
  },
  {
    domain: "sidereus_nuncius",
    content: "The fixed stars appear as points rather than discs through the telescope, indicating they are at immense distances."
  },
  {
    domain: "sidereus_nuncius",
    content: "Jupiter has four satellites—the Medicean stars—orbiting it. I observed them changing positions night after night."
  },
  {
    domain: "sidereus_nuncius",
    content: "Jupiter's moons complete their orbits in different periods, from about 42 hours to about 17 days."
  },
  {
    domain: "sidereus_nuncius",
    content: "The existence of Jovian moons refutes the objection that Earth cannot move while retaining its moon. Here is another center of orbital motion."
  },
  {
    domain: "sidereus_nuncius",
    content: "The telescope reveals far more stars than are visible to the naked eye—I counted over 500 in Orion alone where the ancients saw just nine."
  },
  {
    domain: "sidereus_nuncius",
    content: "Star magnitudes as traditionally classified are unreliable. The telescope shows vast numbers of stars invisible to the naked eye."
  },
  {
    domain: "sidereus_nuncius",
    content: "The telescope is a reliable instrument for astronomical observation. What it reveals is not optical illusion but physical reality."
  },
  {
    domain: "sidereus_nuncius",
    content: "Mathematical reasoning can determine physical properties of celestial bodies. I calculated lunar mountain heights using geometry."
  },
  {
    domain: "sidereus_nuncius",
    content: "The heavens are not fundamentally different in kind from Earth. The moon has mountains and valleys like terrestrial terrain."
  },
  {
    domain: "sidereus_nuncius",
    content: "Observational evidence should override traditional astronomical authority. What I see through the telescope takes precedence over what Aristotle wrote."
  },
  {
    domain: "sidereus_nuncius",
    content: "The Ptolemaic distinction between celestial and terrestrial realms is false. Celestial bodies are physical objects, not perfect quintessence."
  },
  {
    domain: "sidereus_nuncius",
    content: "New discoveries require revision of inherited cosmological frameworks. The telescope has revealed a universe the ancients never imagined."
  },
  // LETTERS ON SUNSPOTS (1613) - 20 positions
  {
    domain: "sunspots",
    content: "Sunspots are on or very near the sun's surface, not distant planets as Scheiner claimed. Their foreshortening near the limb proves this."
  },
  {
    domain: "sunspots",
    content: "The sun rotates on its axis approximately monthly. I tracked the same sunspots moving across the solar disc."
  },
  {
    domain: "sunspots",
    content: "Sunspots are generated and dissolve—they are not permanent bodies. I watched them appear, change shape, and vanish."
  },
  {
    domain: "sunspots",
    content: "Sunspots resemble terrestrial clouds or smoke in their behavior—forming, dissipating, changing shape over days or weeks."
  },
  {
    domain: "sunspots",
    content: "The sun is not an immutable, perfect celestial body. Its surface changes constantly with the coming and going of spots."
  },
  {
    domain: "sunspots",
    content: "Aristotelian celestial immutability is empirically false. The sun changes; the heavens are not perfect and eternal."
  },
  {
    domain: "sunspots",
    content: "Venus exhibits a full range of phases like the moon—from full to crescent. I observed this telescopically."
  },
  {
    domain: "sunspots",
    content: "The phases of Venus prove it orbits the sun, not Earth. Venus appears full when on the far side of the sun and crescent when between us and the sun."
  },
  {
    domain: "sunspots",
    content: "The Copernican system explains the phases of Venus naturally; the Ptolemaic system cannot account for them at all."
  },
  {
    domain: "sunspots",
    content: "Mercury also exhibits phases consistent with solar orbit, further confirming the Copernican arrangement."
  },
  {
    domain: "sunspots",
    content: "Observation trumps philosophical speculation about celestial matters. We must look at the heavens, not just reason about them."
  },
  {
    domain: "sunspots",
    content: "The heavens undergo generation and corruption like terrestrial nature. The distinction between perfect heavens and corruptible Earth is false."
  },
  {
    domain: "sunspots",
    content: "Traditional physics cannot account for actual celestial phenomena. Aristotle's categories fail when confronted with telescopic observation."
  },
  {
    domain: "sunspots",
    content: "Priority disputes in science must be settled by documented evidence. I published my sunspot observations with dated records."
  },
  {
    domain: "sunspots",
    content: "The telescope provides access to truths unavailable to naked-eye astronomy. It does not deceive; it reveals."
  },
  {
    domain: "sunspots",
    content: "Solar phenomena can be studied systematically through repeated observation and careful recording of changes."
  },
  {
    domain: "sunspots",
    content: "Mathematical analysis applies to solar as well as planetary phenomena. The sun's rotation period can be calculated."
  },
  {
    domain: "sunspots",
    content: "The distinction between sublunary and superlunary physics is untenable. The same natural laws govern Earth and heavens."
  },
  {
    domain: "sunspots",
    content: "Copernicanism is not merely a computational device but physically true. The phases of Venus demand this conclusion."
  },
  {
    domain: "sunspots",
    content: "Natural philosophy must be reformed on the basis of new observations. We cannot cling to doctrines contradicted by evidence."
  },
  // IL SAGGIATORE (1623) - 20 positions
  {
    domain: "il_saggiatore",
    content: "Philosophy is written in the language of mathematics. The book of nature is composed in mathematical characters."
  },
  {
    domain: "il_saggiatore",
    content: "Nature's characters are triangles, circles, and geometrical figures. Without these, one cannot understand a single word of nature's book."
  },
  {
    domain: "il_saggiatore",
    content: "Without mathematics, natural philosophy is incomprehensible. One wanders in a dark labyrinth without geometry."
  },
  {
    domain: "il_saggiatore",
    content: "Qualities like taste, odor, and color exist only in the perceiving subject. They are not properties of objects themselves."
  },
  {
    domain: "il_saggiatore",
    content: "Primary qualities—shape, size, motion, number—are objective properties of matter. Secondary qualities exist only in consciousness."
  },
  {
    domain: "il_saggiatore",
    content: "Heat is produced by motion of minute particles. Friction generates heat by agitating the smallest parts of matter."
  },
  {
    domain: "il_saggiatore",
    content: "Sensory qualities are caused by motions and configurations of matter acting on our sense organs."
  },
  {
    domain: "il_saggiatore",
    content: "The distinction between real and perceived properties is fundamental. Mathematics describes what truly exists; senses report subjective experiences."
  },
  {
    domain: "il_saggiatore",
    content: "Comets are likely sublunary optical phenomena, not solid celestial bodies. Their paths and appearances suggest atmospheric effects."
  },
  {
    domain: "il_saggiatore",
    content: "Arguments from authority carry no weight in natural philosophy. A thousand Aristotles cannot make false what nature shows to be true."
  },
  {
    domain: "il_saggiatore",
    content: "Experimental evidence must guide natural investigation. We must consult nature, not books about nature."
  },
  {
    domain: "il_saggiatore",
    content: "Poetic language is inappropriate for scientific discourse. Precision in expression prevents confusion in thought."
  },
  {
    domain: "il_saggiatore",
    content: "Precision in language is essential to avoiding philosophical error. Vague words produce vague and erroneous conclusions."
  },
  {
    domain: "il_saggiatore",
    content: "Natural phenomena require mechanical explanation. Bodies in motion, particles in contact—not occult qualities or sympathies."
  },
  {
    domain: "il_saggiatore",
    content: "Traditional natural philosophy is verbose and empty of content. It substitutes words for understanding, names for explanations."
  },
  {
    domain: "il_saggiatore",
    content: "A single demonstrative proof outweighs a thousand probable arguments. One solid demonstration trumps volumes of speculation."
  },
  {
    domain: "il_saggiatore",
    content: "Scientific disputes must be resolved by evidence and reasoning, not by appeals to status, tradition, or authority."
  },
  {
    domain: "il_saggiatore",
    content: "Nature does not act through occult qualities. Explanations invoking hidden sympathies or antipathies explain nothing."
  },
  {
    domain: "il_saggiatore",
    content: "Atomistic or corpuscular matter theory is preferable to Aristotelian hylomorphism. Matter is composed of particles in motion."
  },
  {
    domain: "il_saggiatore",
    content: "Science proceeds by analysis into simple components and mathematical relations. Complex phenomena reduce to simpler elements and their interactions."
  },
  // DIALOGUE (1632) - 20 positions
  {
    domain: "dialogue",
    content: "Earth rotates on its axis daily, producing the apparent diurnal motion of the heavens."
  },
  {
    domain: "dialogue",
    content: "Earth revolves around the sun annually, explaining the apparent motion of the sun through the zodiac."
  },
  {
    domain: "dialogue",
    content: "The apparent motion of the heavens is caused by Earth's real motion. The simplest explanation is that Earth moves, not the entire cosmos."
  },
  {
    domain: "dialogue",
    content: "Stellar parallax is undetectable because of the stars' immense distance from Earth, not because Earth is stationary."
  },
  {
    domain: "dialogue",
    content: "Falling bodies continue to share Earth's motion—a stone dropped from a tower falls straight down because it already moves with the tower."
  },
  {
    domain: "dialogue",
    content: "Terrestrial physics operates identically whether Earth moves or rests. No mechanical experiment can detect uniform motion."
  },
  {
    domain: "dialogue",
    content: "The tides are caused by the combined effects of Earth's rotation and revolution, though this particular theory of mine was mistaken."
  },
  {
    domain: "dialogue",
    content: "The Copernican system is simpler and more coherent than the Ptolemaic. It explains with one motion what Ptolemy needed many epicycles to approximate."
  },
  {
    domain: "dialogue",
    content: "Retrograde planetary motion is naturally explained by Earth's orbital motion. As we pass outer planets, they appear to move backward."
  },
  {
    domain: "dialogue",
    content: "The Ptolemaic system requires arbitrary and unconnected epicycles. Each planet's motion is calculated separately with no underlying unity."
  },
  {
    domain: "dialogue",
    content: "Uniform circular motion is not the only natural celestial motion. Bodies accelerate, change direction, and follow curved paths other than circles."
  },
  {
    domain: "dialogue",
    content: "The moon always shows the same face because its rotation period equals its orbital period—synchronized rotation."
  },
  {
    domain: "dialogue",
    content: "Arguments from common sense against Earth's motion are fallacious. We don't feel motion because we move with the Earth."
  },
  {
    domain: "dialogue",
    content: "Relative motion cannot be detected by observers within a moving system. Below decks on a smoothly sailing ship, all physics appears the same as on shore."
  },
  {
    domain: "dialogue",
    content: "The ship's-hold thought experiment demonstrates the relativity of motion. Fish swim, drops fall, flies buzz identically whether the ship moves or rests."
  },
  {
    domain: "dialogue",
    content: "Aristotelian physics contradicts observational evidence. Its doctrine of natural places cannot explain what we actually observe."
  },
  {
    domain: "dialogue",
    content: "Scriptural interpretation must accommodate demonstrated physical truths. The Bible speaks in everyday language, not technical astronomy."
  },
  {
    domain: "dialogue",
    content: "Natural philosophy cannot be conducted by syllogistic logic alone. We must observe nature, not merely deduce from premises."
  },
  {
    domain: "dialogue",
    content: "The fixed stars are suns at varying immense distances. The universe extends far beyond what the ancients imagined."
  },
  {
    domain: "dialogue",
    content: "The Copernican system has physical reality, not merely predictive utility. Earth actually moves; this is not just a calculating device."
  },
  // TWO NEW SCIENCES (1638) - 20 positions
  {
    domain: "two_new_sciences",
    content: "The strength of materials does not scale proportionally with size. A beam twice as long is not twice as strong—it is weaker proportionally."
  },
  {
    domain: "two_new_sciences",
    content: "Larger structures require disproportionately more material for equal strength. This is why giants cannot exist—their bones would break."
  },
  {
    domain: "two_new_sciences",
    content: "There are natural limits to the size of animals and structures. The square-cube law makes gigantism impossible."
  },
  {
    domain: "two_new_sciences",
    content: "Beams break in predictable ways depending on their dimensions and loading. This can be calculated mathematically."
  },
  {
    domain: "two_new_sciences",
    content: "Resistance to fracture can be calculated mathematically. Engineering can become a quantitative science."
  },
  {
    domain: "two_new_sciences",
    content: "Freely falling bodies accelerate uniformly regardless of weight. A cannonball and a musket ball fall together, contrary to Aristotle."
  },
  {
    domain: "two_new_sciences",
    content: "Distance fallen is proportional to the square of elapsed time. In twice the time, a body falls four times as far."
  },
  {
    domain: "two_new_sciences",
    content: "Velocity of falling bodies increases linearly with time. Speed doubles with time, not with distance."
  },
  {
    domain: "two_new_sciences",
    content: "Projectile motion is composed of uniform horizontal motion and uniformly accelerated vertical motion. These combine independently."
  },
  {
    domain: "two_new_sciences",
    content: "The trajectory of a projectile is a parabola. This follows mathematically from the combination of two component motions."
  },
  {
    domain: "two_new_sciences",
    content: "The speed at the end of descent is the same regardless of the incline's angle, depending only on the vertical height."
  },
  {
    domain: "two_new_sciences",
    content: "Pendulum period is independent of amplitude for small swings. This isochronism makes pendulums useful for timekeeping."
  },
  {
    domain: "two_new_sciences",
    content: "Pendulum period depends on length, not on the weight of the bob. A heavier pendulum swings no faster than a lighter one."
  },
  {
    domain: "two_new_sciences",
    content: "Naturally accelerated motion follows precise mathematical laws. The odd-number rule: distances in successive equal times are as 1, 3, 5, 7..."
  },
  {
    domain: "two_new_sciences",
    content: "The mean-speed theorem correctly relates distance to uniformly accelerated motion. Distance equals the distance covered at the mean velocity."
  },
  {
    domain: "two_new_sciences",
    content: "Air resistance affects falling bodies but can be abstracted from in analysis. The underlying law reveals itself when we idealize."
  },
  {
    domain: "two_new_sciences",
    content: "Percussion force can be analyzed as accumulated momentum. A falling hammer strikes with force proportional to its velocity."
  },
  {
    domain: "two_new_sciences",
    content: "Vibrating strings produce frequencies proportional to tension and inversely to length. Musical harmony has mathematical foundations."
  },
  {
    domain: "two_new_sciences",
    content: "Consonance is explained by the ratios of vibrational frequencies. Simple ratios produce pleasant harmonies."
  },
  {
    domain: "two_new_sciences",
    content: "Infinite quantities can be meaningfully compared through one-to-one correspondence. There are as many squares as integers, paradoxically."
  },
  // LETTER TO CHRISTINA (1615) - 20 positions
  {
    domain: "letter_to_christina",
    content: "Scripture and nature both derive from God and cannot truly conflict. Apparent conflicts arise from misinterpretation."
  },
  {
    domain: "letter_to_christina",
    content: "Scripture accommodates its language to the understanding of common people. It speaks of the sun 'rising' without teaching astronomy."
  },
  {
    domain: "letter_to_christina",
    content: "Passages describing natural phenomena should not be interpreted literally when science demonstrates otherwise."
  },
  {
    domain: "letter_to_christina",
    content: "The purpose of Scripture is salvation, not natural philosophy. The Bible teaches how to go to heaven, not how the heavens go."
  },
  {
    domain: "letter_to_christina",
    content: "'The Bible teaches how to go to heaven, not how the heavens go.' Cardinal Baronius captured the proper distinction."
  },
  {
    domain: "letter_to_christina",
    content: "Scientific demonstrations should constrain biblical interpretation. Proven natural truths must guide how we read Scripture."
  },
  {
    domain: "letter_to_christina",
    content: "Augustine supported non-literal interpretation when science demands it. The Church Fathers recognized this flexibility."
  },
  {
    domain: "letter_to_christina",
    content: "The Church Fathers did not intend to fix cosmological doctrines. They cared about salvation, not the arrangement of the planets."
  },
  {
    domain: "letter_to_christina",
    content: "The Joshua passage can be better interpreted under Copernicanism than under Ptolemaism. Stopping the Ptolemaic sun wouldn't extend the day."
  },
  {
    domain: "letter_to_christina",
    content: "Stopping the sun in Ptolemaic physics would not extend the day as described in Joshua. The Copernican interpretation works better."
  },
  {
    domain: "letter_to_christina",
    content: "Theological authorities should not prematurely condemn scientific positions that have not been fully investigated."
  },
  {
    domain: "letter_to_christina",
    content: "Condemning Copernicanism would harm the Church if later proven true. Prudence counsels patience in such matters."
  },
  {
    domain: "letter_to_christina",
    content: "Heresy concerns doctrine necessary for salvation, not physical astronomy. The arrangement of the heavens is not a matter of faith."
  },
  {
    domain: "letter_to_christina",
    content: "Natural philosophers have competence in their domain that theologians should respect. Each discipline has its proper sphere."
  },
  {
    domain: "letter_to_christina",
    content: "Prohibiting free inquiry damages the pursuit of truth. Silencing investigation doesn't change nature's facts."
  },
  {
    domain: "letter_to_christina",
    content: "Scientific matters should be decided by evidence and demonstration, not by ecclesiastical decree."
  },
  {
    domain: "letter_to_christina",
    content: "Ecclesiastical censure of science risks making the Church appear ignorant when scientific truths are later established."
  },
  {
    domain: "letter_to_christina",
    content: "The Copernican hypothesis has strong empirical support. It is not a mere speculation but a well-grounded theory."
  },
  {
    domain: "letter_to_christina",
    content: "Prudence requires allowing scientific questions to remain open until they can be definitively resolved."
  },
  {
    domain: "letter_to_christina",
    content: "Faith and reason operate in complementary, not competing, domains. Both seek truth, but in different spheres."
  },
  // SCIENTIFIC METHOD - 15 positions
  {
    domain: "scientific_method",
    content: "Nature's laws are fundamentally mathematical and discoverable through experiment. Physics is applied geometry."
  },
  {
    domain: "scientific_method",
    content: "Controlled experimental variation isolates variables. Change one factor at a time and measure the effect."
  },
  {
    domain: "scientific_method",
    content: "Idealization is necessary for law discovery. Abstract from air resistance and friction to find the underlying mathematical law."
  },
  {
    domain: "scientific_method",
    content: "Measurement and quantification are essential to physics. We advance by measuring and computing, not by verbal disputation."
  },
  {
    domain: "scientific_method",
    content: "Reproducibility validates findings. Experiments can and should be repeated by others."
  },
  {
    domain: "scientific_method",
    content: "Mathematical relations are the form of physical laws. The laws of nature are ratios, proportions, geometric relations."
  },
  {
    domain: "scientific_method",
    content: "Observation, not pure philosophy, discovers new facts about nature. We must look at the world, not just think about it."
  },
  {
    domain: "scientific_method",
    content: "The force of a demonstrative proof exceeds any number of probable arguments. One solid proof trumps endless speculation."
  },
  {
    domain: "scientific_method",
    content: "Complex phenomena must be analyzed into simpler components. Projectile motion resolves into horizontal and vertical components."
  },
  {
    domain: "scientific_method",
    content: "Nature does not care about human authority. A thousand Aristotles cannot make false what experiment shows to be true."
  },
  {
    domain: "scientific_method",
    content: "Verbal philosophy without mathematics is empty of content. Words without quantities produce nothing but confusion."
  },
  {
    domain: "scientific_method",
    content: "Explanations invoking 'occult qualities' explain nothing. To say opium causes sleep by its 'dormitive virtue' is no explanation."
  },
  {
    domain: "scientific_method",
    content: "The book of nature is written in mathematical characters. Without geometry, one cannot understand a single word."
  },
  {
    domain: "scientific_method",
    content: "Mechanical explanation in terms of matter and motion is the goal of physics. No hidden sympathies or antipathies."
  },
  {
    domain: "scientific_method",
    content: "Physics advances by abstracting from complicating factors to find the underlying law, then accounting for complications."
  },
  // KINEMATICS - 15 positions
  {
    domain: "kinematics",
    content: "All bodies fall at the same rate regardless of weight in a vacuum. Weight does not determine the speed of fall."
  },
  {
    domain: "kinematics",
    content: "A feather and a cannonball would fall together in a vacuum. Air resistance, not weight, causes the difference."
  },
  {
    domain: "kinematics",
    content: "Velocity in free fall increases with time, not with distance fallen. Speed is proportional to time elapsed."
  },
  {
    domain: "kinematics",
    content: "Distance fallen is proportional to the square of time elapsed. The law of fall: s = (1/2)gt²."
  },
  {
    domain: "kinematics",
    content: "The odd-number rule: distances covered in successive equal time intervals are as 1:3:5:7:9..."
  },
  {
    domain: "kinematics",
    content: "The mean-speed theorem applies to falling bodies. Distance equals what would be covered at the average velocity."
  },
  {
    domain: "kinematics",
    content: "The final speed of descent depends only on vertical height, not on the path taken. All paths from the same height yield the same final speed."
  },
  {
    domain: "kinematics",
    content: "Inclined planes 'dilute' gravity. The acceleration along an incline is proportional to the sine of the angle."
  },
  {
    domain: "kinematics",
    content: "I used inclined planes to 'slow down' gravity so I could measure acceleration with the timing devices available."
  },
  {
    domain: "kinematics",
    content: "Acceleration is the rate of change of velocity. In uniformly accelerated motion, velocity increases by equal amounts in equal times."
  },
  {
    domain: "kinematics",
    content: "A body passes through all intermediate speeds; it doesn't jump instantaneously from rest to a given velocity."
  },
  {
    domain: "kinematics",
    content: "Motion is relative. The same motion appears different from different reference frames."
  },
  {
    domain: "kinematics",
    content: "On a perfectly horizontal frictionless plane, a body once set in motion would continue forever. This is the principle of inertia."
  },
  {
    domain: "kinematics",
    content: "Projectile motion is composed of uniform horizontal motion and uniformly accelerated vertical motion, acting independently."
  },
  {
    domain: "kinematics",
    content: "The parabolic trajectory follows mathematically from combining horizontal and vertical components of motion."
  }
];

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function embedGalileoPositions() {
  console.log(`Starting to embed ${galileoPositions.length} Galileo positions...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < galileoPositions.length; i++) {
    const position = galileoPositions[i];
    
    try {
      const embedding = await generateEmbedding(position.content);
      
      await db.insert(paperChunks).values({
        figureId: "galileo",
        author: "Galileo Galilei",
        paperTitle: `Galileo Position: ${position.domain.replace(/_/g, " ")}`,
        content: position.content,
        embedding: embedding,
        chunkIndex: i,
        domain: position.domain,
        significance: "HIGH",
      });
      
      successCount++;
      
      if ((i + 1) % 10 === 0) {
        console.log(`Progress: ${i + 1}/${galileoPositions.length} positions embedded`);
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

embedGalileoPositions()
  .then(() => {
    console.log("Galileo positions embedding finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

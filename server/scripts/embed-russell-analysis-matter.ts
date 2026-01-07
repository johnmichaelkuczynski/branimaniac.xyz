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

interface RussellSection {
  title: string;
  positions: string[];
}

async function embedRussellAnalysisMatter() {
  console.log("Starting Russell - The Analysis of Matter embedding...");
  
  const sections: RussellSection[] = [
    {
      title: "The Nature of the Problem",
      positions: [
        "The most advanced science apart from pure mathematics is physics, which exhibits a logical chain from assumed premises to remote consequences through purely mathematical deductions.",
        "There are three kinds of questions about physics: its logical structure as a deductive system, its philosophical import and interpretation, and its application to the empirical world.",
        "What were taken as primitive entities in physics may be replaced by complicated logical structures—a process essential for connecting physics with perception.",
        "The process of interpretation substitutes concrete objects for the undefined terms of a deductive system, revealing the philosophical import of physics.",
        "The vital problem is the application of physics to the empirical world—physics as pure mathematics is not what makes it important.",
        "The evidence for physics is that perceptions occur as physical laws predict, yet physics itself never directly discusses perceptions.",
        "Physics must be interpreted in a way tending toward idealism, and perception in a way tending toward materialism.",
        "Matter is less material and mind less mental than commonly supposed; when this is realized, Berkeley's difficulties largely disappear."
      ]
    },
    {
      title: "The Logical Analysis of Physics",
      positions: [
        "The world of elementary physics is semi-abstract, while that of deductive relativity theory is wholly abstract.",
        "The appearance of deducing actual phenomena from mathematics is delusive; phenomena afford inductive verification of the general principles from which mathematics starts.",
        "Every observed fact retains its full evidential value but confirms the general law from which the deductive system starts.",
        "There is no logical necessity for one fact to follow another because there is no logical necessity about our fundamental principles.",
        "The interval in relativity is primitive for logical theory but is a complicated function of empirical data from the point of view of verification.",
        "The unity and simplicity of the deductive edifice must not blind us to the complexity of empirical physics or to the logical independence of its various portions.",
        "Mathematical physics describes structural properties of events, not their intrinsic qualities.",
        "The abstractness of physics is both a source of its power and a limitation on what it can tell us about the world."
      ]
    },
    {
      title: "Physics and Perception",
      positions: [
        "We must assimilate the physical world to the world of perceptions and the world of perceptions to the physical world.",
        "Perceptions are part of the subject-matter of physics, not merely evidence for physics.",
        "The passage from what physics asserts to expected perceptions is left vague; it should have the same mathematical precision as physics itself.",
        "The problem of connecting physics with perception has two parts: epistemological (what facts are relevant) and ontological (what entities fulfill physical requirements).",
        "The causal theory of perception holds that perceptions are caused by external physical processes.",
        "We cannot step outside perception to compare our perceptions with their supposed external causes.",
        "The datum of perception is an event at the place where the percipient's body is, not at the place where the object perceived is located.",
        "Perception provides knowledge of structure but not of the intrinsic qualities of physical events."
      ]
    },
    {
      title: "Matter and Structure",
      positions: [
        "Matter is a logical construction from events, not a substantial entity with intrinsic properties.",
        "Physical objects are best understood as series of events connected by certain structural properties.",
        "What physics tells us about matter concerns only structural relations, not the intrinsic nature of what is related.",
        "The importance of structure in scientific inference cannot be overstated—science describes the pattern, not the content.",
        "Points of space-time are logical constructions from events, not metaphysically primitive entities.",
        "The construction of points from events follows the principle of replacing inferred entities by logical constructions.",
        "Space-time is a system of relations among events, not an independent container.",
        "The abstractness of physics consists in its describing structure without specifying the intrinsic nature of what has that structure."
      ]
    },
    {
      title: "Causation and Causal Lines",
      positions: [
        "A causal line is a series of events so connected that something can be inferred about each from the others.",
        "Causal laws state functional dependencies between events, not necessary connections.",
        "Causation in physics is regularity of sequence combined with spatio-temporal contiguity.",
        "The principle of differential laws states that the laws of physics are concerned with rates of change.",
        "Causal processes propagate at finite velocities; there is no action at a distance.",
        "Causal lines provide the basis for identifying objects persisting through time.",
        "The persistence of objects is analyzable in terms of causal continuity of events.",
        "Extrinsic causal laws connect events that are not part of the same causal line."
      ]
    },
    {
      title: "Neutral Monism",
      positions: [
        "The ultimate constituents of the world are neither mental nor physical but neutral—events that can be classified as mental or physical depending on their causal relations.",
        "Mind and matter are different organizations of the same fundamental stuff.",
        "What we call a mind is a group of events connected by memory and other psychological relations.",
        "What we call a physical object is a group of events connected by physical causal relations.",
        "The distinction between mental and physical is not a difference in intrinsic nature but in the laws that connect events.",
        "Sensations are events that belong both to physics and to psychology—they are the intersection of mental and physical.",
        "The same event may be both mental and physical, depending on its causal context.",
        "Neutral monism dissolves the traditional mind-body problem by denying that mind and matter are fundamentally different substances."
      ]
    },
    {
      title: "Events and Particulars",
      positions: [
        "Events are the fundamental particulars of the world; objects are constructions from events.",
        "An event occupies a finite region of space-time; it is not an instantaneous point-occurrence.",
        "Events can overlap and interpenetrate; they do not have the mutual exclusiveness of traditional substances.",
        "Particulars are distinguished by their spatio-temporal positions, not by any intrinsic qualities.",
        "The world is a four-dimensional manifold of events, not a three-dimensional world changing through time.",
        "Time and space are abstractions from the concrete order of events.",
        "The identity of an object through time is a matter of degree, depending on causal continuity.",
        "Substances are logical fictions; what exists are processes and events."
      ]
    },
    {
      title: "Knowledge and Inference",
      positions: [
        "Our knowledge of the external world is structural knowledge—we know the pattern of relations, not intrinsic qualities.",
        "Scientific inference proceeds from percepts to their physical causes by postulating structure-preserving causal processes.",
        "The postulates of scientific inference include: quasi-permanence, separable causal lines, and spatio-temporal continuity.",
        "Perception gives us data from which we infer the structure of physical reality, not direct knowledge of physical objects.",
        "The gap between percept and physical object is bridged by assuming that similar structures produce similar effects.",
        "Knowledge by acquaintance is limited to our own mental events; knowledge of the external world is inferential.",
        "The criterion for accepting scientific inference is coherence and predictive success, not certainty.",
        "Physics tells us the structure of the world but leaves the intrinsic nature of what has that structure unknown."
      ]
    },
    {
      title: "Space-Time and Geometry",
      positions: [
        "Space-time is the order of events; it is not an absolute container but a system of relations.",
        "The geometry of physical space is empirical, not a priori; it is determined by measurement and physical theory.",
        "Points are logical constructions from overlapping events, not fundamental constituents of reality.",
        "The interval in relativity theory is the fundamental metrical concept, replacing separate notions of space and time.",
        "Physical and perceptual space-time are distinct but related through causal processes.",
        "The construction of points from events shows how abstract entities can be replaced by concrete particulars.",
        "Space-time order is ultimately grounded in causal relations among events.",
        "The genesis of our concepts of space and time lies in the structure of our perceptual experience."
      ]
    },
    {
      title: "The Epistemology of Physics",
      positions: [
        "Physics is true in the narrowest sense if we have the perceptions it leads us to expect.",
        "In a wider sense, physics is true if there exist objects fulfilling its hypotheses.",
        "The philosophical outcome of physics is less clear than when less was known; knowledge reveals complexity.",
        "We cannot claim certainty for physics, only high probability confirmed by empirical verification.",
        "The entities of theoretical physics are known only through their structural properties.",
        "Observation provides the empirical foundation of physics, but observation itself is a physical process.",
        "The circularity between physics and perception is not vicious but reflects the interdependence of theory and observation.",
        "Physics gives us knowledge of the world, but what it gives is knowledge of structure, not of intrinsic qualities."
      ]
    }
  ];
  
  let totalEmbedded = 0;
  const sourceWork = "The Analysis of Matter";
  
  for (let sectionIdx = 0; sectionIdx < sections.length; sectionIdx++) {
    const section = sections[sectionIdx];
    console.log(`\nProcessing section: ${section.title}`);
    
    for (let i = 0; i < section.positions.length; i++) {
      const position = section.positions[i];
      const displayTitle = `Russell - ${sourceWork} - ${section.title}`;
      
      try {
        const embedding = await getEmbedding(position);
        
        await db.insert(paperChunks).values({
          author: "Bertrand Russell",
          figureId: "russell",
          paperTitle: displayTitle,
          content: position,
          embedding: embedding,
          chunkIndex: sectionIdx * 100 + i,
        });
        
        console.log(`Embedded position ${totalEmbedded + 1}: ${position.substring(0, 60)}...`);
        totalEmbedded++;
        
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error embedding position in ${section.title}:`, error);
      }
    }
  }
  
  console.log(`\n=== Completed: ${totalEmbedded} Russell position statements from The Analysis of Matter ===`);
}

embedRussellAnalysisMatter()
  .then(() => {
    console.log("Russell - The Analysis of Matter embedding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during embedding:", error);
    process.exit(1);
  });

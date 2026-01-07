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

interface JungSection {
  title: string;
  sourceWork: string;
  positions: string[];
}

async function embedJungPositions() {
  console.log("Starting Jung Position Statements embedding...");
  
  const sections: JungSection[] = [
    {
      title: "Religion Versus Spirituality",
      sourceWork: "Jung - Religion and Spirituality Position Statements",
      positions: [
        "Religion is the codified, collective form of spiritual experience; spirituality is the living, individual encounter with the numinous.",
        "The distinction between religion and spirituality reflects the eternal tension between spirit and institution.",
        "Spiritual experience is primary and immediate; religious doctrine is secondary and interpretive.",
        "A person may be deeply religious without any genuine spiritual experience, and deeply spiritual without any religious affiliation.",
        "The spiritual instinct is as fundamental to the psyche as sexuality or the will to power; it cannot be explained away.",
        "Religion without spirituality becomes mere formalism, observance without transformation.",
        "Spirituality without religion risks inflation, groundlessness, and the reinvention of every wheel.",
        "The numinous can be encountered anywhere—in nature, art, relationship, solitude—not only in religious contexts.",
        "Religious symbols once carried numinous power collectively; now they must be rediscovered individually if they are to live.",
        "The person who leaves religion but retains spiritual longing has not regressed but has been called to a harder, more individual path.",
        "Spiritual experience does not require belief; it is an empirical fact of the psyche that precedes all theology.",
        "The danger of spirituality without structure is that the ego inflates, mistaking its preferences for divine guidance.",
        "The danger of religion without spirit is that the institution becomes an end in itself, protecting people from the very transformation it exists to facilitate.",
        "Ritual can be spiritually alive or spiritually dead depending on the consciousness brought to it.",
        "A symbol touched by the numinous transforms; the same symbol approached merely intellectually leaves the psyche unchanged.",
        "The modern person must often leave the religion of childhood to find the spirituality that was hidden within it all along.",
        "Spiritual experience is characterized by the ego's encounter with something greater than itself—whether called God, Self, or the unconscious.",
        "The numinous always carries both fascination and dread; purely comfortable spirituality is suspect.",
        "Community is a genuine spiritual need; solitary spirituality must find ways to address the human requirement for shared meaning.",
        "The spiritual-but-not-religious person faces the task of creating a symbolic life without inherited containers—a heroic but perilous undertaking.",
        "Religion provides ethical structure that spirituality alone often fails to supply.",
        "The mystics within every tradition knew that institutional religion was a vessel, not an end; they sought the wine, not the cup.",
        "Spirituality seeks direct experience; religion seeks to preserve and transmit what has been experienced by others.",
        "Both religion and spirituality can be used as defenses: religion against the chaos of direct experience, spirituality against the demands of community and tradition.",
        "The God-image is a psychological fact whether or not God exists metaphysically; this image can appear through religion or outside it.",
        "Psychology cannot adjudicate between religion and spirituality; it can only observe that the psyche requires some relationship to the sacred.",
        "The loss of religious faith often precedes the birth of genuine spiritual life—the death that makes rebirth possible.",
        "Sacred places exist because the numinous was once encountered there; they can be found within or outside religious boundaries.",
        "The task is not to choose between religion and spirituality but to find the living water wherever it flows.",
        "A person without access to either religion or spirituality is cut off from essential psychological nourishment.",
        "The collective unconscious is the psychological ground from which all religions spring; spirituality is the individual's direct contact with this ground."
      ]
    },
    {
      title: "Psychology of Women: Beauty, Body, and Identity",
      sourceWork: "Jung - Psychology of Women Position Statements",
      positions: [
        "A woman's relationship to her body is never merely physical; it carries the weight of her relationship to the feminine principle itself.",
        "Beauty in a woman can become a persona so powerful that no self develops behind it.",
        "The beautiful woman is constantly mirrored by others; she may never learn to see herself from within.",
        "When beauty functions as identity, its loss is experienced as psychic death.",
        "The woman who built her life on being desired must rebuild from the foundation when desire fades.",
        "Physical attractiveness can be a genuine power, but it is a power borrowed from the archetype, not owned by the ego.",
        "The loss of beauty forces the question that beauty allowed the woman to avoid: who am I apart from how I am seen?",
        "A woman's sexual power is not hers to keep; it is loaned by nature for biological purposes and reclaimed by nature in time.",
        "The transition from maiden to crone is an archetypal passage; modern culture provides no rituals for it, so women must navigate it alone.",
        "The invisibility that aging brings can be experienced as annihilation or as liberation from the tyranny of the gaze.",
        "A woman who has been beautiful often has an underdeveloped shadow; she was never forced to develop compensatory strengths.",
        "The body speaks the truths the ego refuses; a woman's symptoms often express her unlived relationship to embodiment.",
        "The feminine life cycle—maiden, mother, crone—is not merely biological but psychological and spiritual.",
        "Each phase of feminine life carries its own power; the crone's power is wisdom, discernment, and freedom from the need to please.",
        "A woman's beauty can function as both gift and curse: gift because it opens doors, curse because it prevents her from knowing why doors opened.",
        "The menopausal transition is psychologically parallel to adolescence: a dissolution of old identity and the emergence of new possibilities.",
        "The woman who was never beautiful may have been forced to develop depths that the beautiful woman could avoid.",
        "Sexual desirability is not the same as erotic vitality; a woman can lose the former while gaining the latter.",
        "The inner masculine (animus) often awakens in the second half of life, offering powers of discernment and assertion that were dormant before.",
        "A woman's relationship to her mother shapes her relationship to her own body, her own femininity, and her own aging.",
        "The devouring mother archetype can manifest as a woman's own self-criticism regarding her appearance.",
        "A woman must grieve her younger self consciously or the grief will manifest as depression, bitterness, or desperate attempts to recapture what is gone.",
        "The archetypal feminine contains the wise woman as fully as it contains the seductress; aging is the discovery of a power that was always there.",
        "Women who derived identity from being desired often have difficulty desiring; they know how to be wanted but not how to want.",
        "The task is not to replace one persona (the beautiful woman) with another (the wise elder) but to discover the self beneath all personas.",
        "A woman's rage at aging often contains legitimate anger at a culture that valued her only for what time takes away.",
        "The beautiful woman's shadow often contains intellectual power, aggression, and ambition that beauty made unnecessary to develop.",
        "True liberation comes not from remaining desirable but from no longer needing to be desired.",
        "The feminine self is not diminished by age; only the feminine persona is. The confusion between persona and self is the source of suffering.",
        "What was cultivated in youth—charm, beauty, the ability to attract—must be sacrificed for what wants to emerge in age."
      ]
    },
    {
      title: "Psychology of Men: Emotion, Masculinity, and Identity",
      sourceWork: "Jung - Psychology of Men Position Statements",
      positions: [
        "The masculine persona in modern culture often requires the suppression of feeling, vulnerability, and relational need.",
        "A man's emotional life is not absent but driven underground, where it operates autonomously and often destructively.",
        "The man who cannot feel becomes the man who cannot connect; emotional numbness is relational death.",
        "Male stoicism is often mistaken for strength; it is frequently a defense against the overwhelming power of unintegrated feeling.",
        "The anima carries a man's feeling function; when she is repressed, his emotional life becomes moody, sentimental, or explosive.",
        "A man's aggression is not the problem; unconscious aggression is. Integrated aggression becomes assertiveness, boundary, and protective power.",
        "The father wound is the central psychological injury for many men: the absent, critical, or violent father who failed to initiate his son into manhood.",
        "A man without a father must find the father archetype within, a task that often requires the help of older men or the analyst.",
        "The puer aeternus (eternal boy) refuses the weight of mature masculinity; he remains identified with potential rather than accomplishment.",
        "Work addiction in men is often a flight from the inner life; achievement becomes a substitute for feeling.",
        "The man who defines himself entirely by what he does faces existential collapse when he can no longer do it.",
        "Male sexuality, when unconscious, is compulsive and disconnected; conscious male sexuality integrates eros with relationship.",
        "The hero myth dominates masculine psychology but must eventually be sacrificed; the hero must die for the mature man to be born.",
        "A man's anger often conceals grief, fear, or longing that masculine conditioning forbids him to express directly.",
        "The inferior function in men is typically feeling or intuition; these become the gateways to the unconscious in the second half of life.",
        "Men bond through shared activity and often struggle with face-to-face emotional intimacy; this is not pathology but a masculine relational style.",
        "The man who fears his own weakness often projects it onto women and then resents them for carrying what he disowns.",
        "Male depression often manifests as irritability, withdrawal, or overwork rather than overt sadness.",
        "A man's relationship with his mother shapes his anima; the mother-bound man cannot relate to real women, only to projections.",
        "The task of the second half of life for men is the integration of the feminine—eros, receptivity, interiority—without loss of masculine identity.",
        "A man must learn to be vulnerable without being weak; vulnerability is the prerequisite for genuine intimacy.",
        "The shadow of the successful man often contains his unlived creativity, playfulness, and need for connection.",
        "Male identity that depends on dominance, control, or achievement is perpetually threatened; identity grounded in the Self is stable.",
        "Men are often better at doing than being; the spiritual task is to develop the capacity for being alongside the capacity for doing.",
        "The initiated man knows his strength and does not need to prove it; the uninitiated man is forever proving what he does not feel.",
        "A man's tears, when they finally come, often carry decades of accumulated grief.",
        "The masculine spirit seeks transcendence; the danger is that transcendence becomes dissociation from body, feeling, and relationship.",
        "What a man judges most harshly in other men is often what he cannot accept in himself.",
        "Male loneliness is epidemic and largely unspoken; men must learn to need each other without shame.",
        "The masculine Self appears in images of the king, the wise old man, the centered warrior; these are goals, not starting points."
      ]
    },
    {
      title: "Dreams: Practical Understanding",
      sourceWork: "Jung - Dreams Position Statements",
      positions: [
        "Recurring dreams indicate that something has not yet been understood or integrated; they will repeat until consciousness responds.",
        "Dreams of deceased persons often represent parts of oneself associated with that person, though sometimes they carry genuinely transpersonal significance.",
        "The house in dreams typically represents the psyche itself; unfamiliar rooms are undiscovered aspects of the self.",
        "Being chased in dreams suggests that something in the unconscious is pursuing consciousness, demanding recognition.",
        "Water in dreams represents the unconscious; its state (calm, turbulent, deep, shallow) indicates the dreamer's relationship to the unconscious.",
        "Dreams of being unprepared (exam dreams, performance dreams) indicate anxiety about adequacy, often related to a new life demand.",
        "Sexual dreams are sometimes about sexuality but more often about the union of opposites or the integration of contrasexual elements.",
        "Dreams of death rarely predict physical death; they indicate the death of an old attitude or identity that must die for new life to emerge.",
        "Animals in dreams represent instincts; the type of animal and the dreamer's relationship to it indicate how the instincts are being handled.",
        "Flying dreams often indicate inflation—the ego rising above its proper station—though sometimes they express legitimate spiritual aspiration.",
        "Dreams compensate for conscious one-sidedness; the happy person dreams of darkness, the depressed person of light.",
        "The dream's meaning is not fixed; it unfolds as the dreamer's consciousness develops.",
        "Dreams should be taken seriously but not literally; the dream speaks in images, not propositions.",
        "A series of dreams is more reliable than a single dream; the unconscious reveals its direction over time.",
        "The dream does not give answers but poses questions that consciousness must engage.",
        "Nightmares are not enemies; they are urgent communications from the unconscious demanding immediate attention.",
        "The figures who appear in dreams are both objective (representing real people) and subjective (representing aspects of the dreamer).",
        "The emotional tone of a dream is often more diagnostically significant than its content.",
        "Prospective dreams anticipate future developments; the unconscious knows what consciousness has not yet grasped.",
        "Big dreams have a numinous quality; they feel significant and carry collective, not merely personal, meaning."
      ]
    },
    {
      title: "Relationships and Love",
      sourceWork: "Jung - Relationships and Love Position Statements",
      positions: [
        "Romantic love begins as projection; the beloved carries the projected anima or animus of the lover.",
        "The initial enchantment of love is the ego's encounter with its own unlived contrasexual life.",
        "Disillusionment in love is necessary; the projections must fail for the real person to become visible.",
        "Relationship is the crucible in which the shadow becomes visible; intimacy exposes what solitude conceals.",
        "We are attracted to those who carry what we have repressed; this is both the gift and the burden of relationship.",
        "The partner who irritates us most is often reflecting back what we refuse to see in ourselves.",
        "Genuine love requires the withdrawal of projections; one must see the other as a separate subject, not a carrier of one's own unconscious.",
        "The longing to merge with the beloved is ultimately a longing for wholeness—for reunion with the contrasexual soul.",
        "Relationship fails when we demand that the other complete us; no one can carry another's unlived life indefinitely.",
        "The wounded place in each partner finds the wounded place in the other; this is both the source of pain and the opportunity for healing.",
        "Love is not only an emotion but a task; it requires the continuous work of consciousness.",
        "The anima-possessed man becomes moody and irrational in relationship; the animus-possessed woman becomes opinionated and argumentative.",
        "Authentic intimacy requires the capacity to be alone; the person who cannot be alone will cling destructively.",
        "What we could not get from our parents, we unconsciously seek from our partners—a setup for inevitable disappointment.",
        "The transference that occurs in analysis is the same dynamic that occurs in love; both are opportunities for consciousness.",
        "A relationship that serves individuation will be challenging; growth always involves friction.",
        "The partner is not meant to make us whole; the partner is meant to confront us with our lack of wholeness.",
        "Jealousy is often the shadow's response to projected contents; we fear losing not the person but what they carry for us.",
        "Love that remains unconscious degenerates into power struggle; someone must be on top.",
        "The sacred marriage (hieros gamos) is first an inner union; outer relationship reflects inner integration."
      ]
    },
    {
      title: "Midlife and the Second Half of Life",
      sourceWork: "Jung - Midlife Position Statements",
      positions: [
        "The midlife crisis is not pathology but a summons from the Self; it indicates that the first half of life is complete.",
        "What worked in the first half of life becomes a prison in the second; the persona that brought success now brings suffocation.",
        "The goals of youth—achievement, status, security—must be relativized for the goals of age—meaning, depth, wholeness.",
        "Midlife depression is often the ego's response to the Self's demand for transformation; it should be respected, not merely medicated.",
        "The unlived life demands attention at midlife; what was sacrificed for adaptation now insists on being lived.",
        "The second half of life requires a different relationship to time; mortality becomes real, and life must be examined in its light.",
        "Values reverse at midlife: extraverts discover introversion, thinking types are invaded by feeling, the successful question their success.",
        "The return of the repressed at midlife is not regression but a demand for completion.",
        "Midlife is the opportunity to meet the shadow; what was rejected in youth returns with compound interest.",
        "The crisis is not about finding new satisfactions but about finding meaning in what one has and has not become.",
        "The person who refuses the midlife transition becomes rigid, bitter, or infantile; they age without maturing.",
        "Dreams at midlife often feature images of descent, death, and rebirth; the unconscious is announcing the required transformation.",
        "The tasks of the second half of life cannot be accomplished by the ego alone; the Self must become the center.",
        "Legacy becomes important at midlife—not only what one leaves behind but what kind of person one has become.",
        "The question shifts from 'What can I get?' to 'What must I give?'",
        "Physical decline at midlife is an initiation into mortality; it can be resisted or it can be a teacher.",
        "Many midlife crises are spiritual emergencies mislabeled as psychological disorders.",
        "The past at midlife is not merely remembered but reinterpreted; one sees the pattern that was invisible while living it.",
        "What feels like ending is often beginning; the ego experiences as death what the Self experiences as birth.",
        "The second half of life is the time for questions the first half was too busy to ask."
      ]
    },
    {
      title: "Suffering and Psychological Symptoms",
      sourceWork: "Jung - Suffering Position Statements",
      positions: [
        "Neurosis is meaningful suffering; it is the psyche's refusal to adapt to conditions that violate its nature.",
        "The symptom is not the enemy but the messenger; it carries information about what has been neglected.",
        "What is not made conscious appears as fate; the repetition compulsion is the unconscious insisting on being seen.",
        "Depression often indicates that something wants to die—not the person but an attitude, an identity, a way of life.",
        "Anxiety is often the ego's response to the approach of unconscious contents that demand integration.",
        "The symptom often points forward to unlived life, not only backward to trauma.",
        "Addiction is the search for spirit through matter; it is a misguided religious impulse.",
        "Psychological suffering that has no organic cause is purposive; it is trying to accomplish something.",
        "The body speaks what the psyche cannot; somatic symptoms are often unconscious communications.",
        "Healing is not the removal of symptoms but the transformation of consciousness that makes symptoms unnecessary.",
        "The suffering that comes from avoiding one's fate is greater than the suffering that comes from accepting it.",
        "Meaningless suffering destroys; meaningful suffering transforms.",
        "The crucifixion is the archetypal image of redemptive suffering; the ego must be suspended between opposites.",
        "Symptoms often emerge at thresholds—when a transition is required but not being made.",
        "The question to ask of suffering is not only 'What caused this?' but 'What does this want from me?'",
        "Chronic dissatisfaction may indicate that one is living the wrong life; the psyche refuses to accept what violates its nature.",
        "The shadow's revenge is exact; we suffer from what we have refused to face.",
        "Some suffering is necessary and should not be avoided; it is the price of becoming conscious.",
        "The symptom is often the unlived life knocking at the door.",
        "Analysis does not promise happiness but offers something more valuable: meaning."
      ]
    },
    {
      title: "Creativity and the Creative Process",
      sourceWork: "Jung - Creativity Position Statements",
      positions: [
        "Creativity draws from the collective unconscious; the artist is a medium through which archetypal contents enter the world.",
        "The creative impulse is autonomous; it uses the artist as much as the artist uses it.",
        "Creative block is often the ego's resistance to what the unconscious wants to produce.",
        "The best ideas come unbidden because they come from the unconscious, which operates independently of the ego's will.",
        "The inner critic is the internalized collective voice; it fears what is original because the original is by definition not collective.",
        "Creativity requires the capacity to tolerate chaos; form emerges from formlessness.",
        "The artist who creates only what the audience wants has sold his soul for approval.",
        "Creative work has a compensatory function; it produces what the culture lacks.",
        "The creative process parallels the individuation process; both involve the confrontation with unconscious contents and their integration.",
        "Artists often suffer because they carry more of the unconscious than ordinary people; their gift is also their burden.",
        "The work of art is an autonomous complex; once created, it has its own life and meaning.",
        "Creative people are often difficult because they are in service to something that cares nothing for social adaptation.",
        "The muse is the anima; she mediates between the artist's ego and the creative source.",
        "Creative work often emerges from the inferior function; it carries what the dominant function cannot express.",
        "The creative person must learn to sacrifice control; the best work comes through, not from.",
        "Completing creative work requires the capacity to betray the ideal; perfection is the enemy of completion.",
        "The depression that follows creative completion is the ego's mourning for the loss of connection to the unconscious.",
        "Creativity is not a gift given to some and withheld from others; it is a human capacity that can be cultivated or suppressed.",
        "Dreams are the most universal form of creativity; every person creates symbolic dramas every night.",
        "The creative impulse, when blocked, becomes destructive; energy that cannot flow forward flows against the self."
      ]
    },
    {
      title: "Family and Parental Influence",
      sourceWork: "Jung - Family Dynamics Position Statements",
      positions: [
        "The parental imagos are not the same as the actual parents; they are the child's psychic representation of the parents.",
        "These imagos are partly personal and partly archetypal; they carry the mother and father archetypes as well as personal experience.",
        "The child unconsciously carries the unlived life of the parents; this is both inheritance and burden.",
        "What the parents repressed does not disappear; it often appears in the psychology of the children.",
        "The mother complex can manifest as either engulfment or abandonment; both distort the capacity for relationship.",
        "The father complex can manifest as either identification with authority or rebellion against it.",
        "Guilt toward parents is often a disguise for aggression; the guilty child is the child who cannot be angry.",
        "Loyalty to the family system can prevent individuation; sometimes one must betray the family to become oneself.",
        "The child who was needed to complete the parent's identity carries a heavy burden; they exist for the parent, not themselves.",
        "Family secrets are never truly secret; they influence the family system without being named.",
        "The idealized parent must be humanized for the child to become adult; this is a necessary disillusionment.",
        "Blaming the parents is an intermediate stage; the final stage is taking responsibility for one's own psychology.",
        "The child archetype within the adult carries both wounding and potential; it is the source of both neurosis and renewal.",
        "What we cannot work out with our actual parents we will work out with their substitutes—partners, employers, analysts.",
        "The family is the first container for the psyche; its failures become the templates for all later relational difficulties.",
        "Sibling relationships carry their own archetypal weight; the brother or sister often represents split-off aspects of the self.",
        "The parent who cannot admit fault forces the child to carry the shadow.",
        "Children are unconsciously loyal to the family system even when that loyalty damages them.",
        "The task is not to overcome the family of origin but to understand how its dynamics continue to operate within.",
        "The ancestral unconscious extends beyond personal parents; we carry the unresolved issues of generations."
      ]
    },
    {
      title: "Good and Evil",
      sourceWork: "Jung - Good and Evil Position Statements",
      positions: [
        "Good and evil are not mere conventions; they are experienced as real by the psyche and must be taken seriously as such.",
        "The shadow is not evil; it is that which has not been integrated. What remains unconscious, however, tends toward destructive expression.",
        "Evil is often the result of unconsciousness; people do terrible things not because they are malevolent but because they are unaware.",
        "The person who believes themselves incapable of evil is the most dangerous; they have no relationship to their shadow.",
        "Moral one-sidedness produces its opposite; the saint creates the sinner in himself, and vice versa.",
        "The integration of the shadow does not mean acting out evil; it means becoming conscious of one's capacity for it.",
        "Evil cannot be eliminated; it can only be held in consciousness and thereby prevented from autonomous action.",
        "The archetype of evil exists in the collective unconscious; it is not merely personal but transpersonal.",
        "To become whole, one must acknowledge the dark brother—the disowned aspect that carries everything rejected by the ego.",
        "The problem of evil cannot be solved; it can only be suffered and integrated.",
        "Good that is not conscious of its shadow becomes tyrannical; it imposes itself on others in the name of righteousness.",
        "The scapegoat mechanism is the projection of evil onto others; it is always a failure of consciousness.",
        "Morality that is merely conventional—that merely follows the rules—is not sufficient; genuine morality requires consciousness of the shadow.",
        "The confrontation with evil is an unavoidable part of individuation; one cannot become whole without facing the dark side.",
        "What we call evil is often the unlived good that has turned destructive through neglect.",
        "The devil is not merely a projection; there is something in the objective psyche that resists consciousness and wholeness.",
        "The denial of evil is itself an evil; it allows destructiveness to operate under the guise of goodness.",
        "Every act of consciousness is a small victory over the forces that would keep us unconscious and therefore capable of harm.",
        "The capacity for evil is universal; what varies is the degree of consciousness with which it is held.",
        "The goal is not to become good but to become whole—which includes the capacity for both good and evil held in consciousness."
      ]
    },
    {
      title: "Analysis and Psychotherapy",
      sourceWork: "Jung - Psychotherapy Position Statements",
      positions: [
        "Analysis is not a technique but a relationship; the quality of the relationship determines the outcome.",
        "The analyst cannot take the patient further than the analyst has gone; analysis requires that the analyst be analyzed.",
        "Transference is not a nuisance but the vehicle of transformation; it brings the unconscious into the room.",
        "The goal of analysis is not adjustment to society but the development of the individual personality.",
        "Cure means becoming who one is, not becoming what one should be according to external standards.",
        "The symptom is the beginning of the cure; it indicates where consciousness must be applied.",
        "Analysis is a dialogue between two unconsciouses; what cannot be said is communicated through the transference.",
        "The analyst must be wounded; only the wounded healer can genuinely help the patient.",
        "Interpretation is never final; it opens possibilities rather than closing them.",
        "The patient must do the work; the analyst can only accompany and sometimes interpret.",
        "Analysis should end when the patient can do for themselves what the analyst has been doing with them.",
        "Dreams are the royal road to the unconscious, but not all patients dream productively; other methods must be available.",
        "Resistance is not opposition but protection; it must be respected even as it is analyzed.",
        "The analyst's countertransference contains information; it is not merely interference but data about what is happening in the patient.",
        "Silence in analysis is often more valuable than speech; it allows the unconscious to emerge.",
        "The first half of analysis is often reductive (looking backward); the second half is synthetic (looking forward).",
        "Analysis is not for everyone; some people are not ready for the confrontation with the unconscious.",
        "The unconscious does not want to be analyzed; it wants to be lived. Analysis is a means, not an end.",
        "What is healed in analysis is not the symptom but the attitude toward the symptom.",
        "The analytic relationship is a temenos—a sacred space where transformation becomes possible."
      ]
    }
  ];
  
  let totalPositions = 0;
  let successCount = 0;
  let globalIndex = 0;
  
  for (const section of sections) {
    console.log(`\nProcessing: ${section.title} (${section.positions.length} positions)`);
    totalPositions += section.positions.length;
    
    for (let i = 0; i < section.positions.length; i++) {
      const position = section.positions[i];
      
      try {
        const embedding = await getEmbedding(position);
        
        await db.insert(paperChunks).values({
          figureId: "jung",
          author: "Carl Jung",
          paperTitle: section.title,
          content: position,
          embedding: embedding,
          chunkIndex: globalIndex,
          domain: "analytical psychology",
          significance: "HIGH",
          sourceWork: section.sourceWork
        });
        
        successCount++;
        globalIndex++;
        
        if (successCount % 20 === 0) {
          console.log(`Progress: ${successCount} embedded...`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 60));
      } catch (error: any) {
        console.error(`Error at ${section.title}[${i}]:`, error.message);
      }
    }
  }
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`COMPLETE: ${successCount}/${totalPositions} Jung positions embedded`);
  console.log(`${"=".repeat(60)}`);
}

embedJungPositions().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

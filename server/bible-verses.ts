// Interface for quotes with intelligence level targeting
interface Quote {
  text: string;
  reference: string;
  intelligenceMin?: number; // 1-10, if specified quote only appears at this intelligence level or higher
  intelligenceMax?: number; // 1-10, if specified quote only appears at this intelligence level or lower
}

// Comprehensive collection spanning the entire Christian tradition and its edges
export const bibleVerses: Record<string, Quote[]> = {
  love: [
    {
      text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
      reference: "John 3:16",
      intelligenceMax: 5,
    },
    {
      text: "And now abideth faith, hope, charity, these three; but the greatest of these is charity.",
      reference: "1 Corinthians 13:13",
      intelligenceMax: 6,
    },
    {
      text: "Love is not affectionate feeling, but a steady wish for the loved person's ultimate good as far as it can be obtained.",
      reference: "C.S. Lewis",
      intelligenceMin: 5,
    },
    {
      text: "To love at all is to be vulnerable. Love anything and your heart will be wrung and possibly broken.",
      reference: "C.S. Lewis",
      intelligenceMin: 4,
    },
    {
      text: "Love seeks one thing only: the good of the one loved. It leaves all the other secondary effects to take care of themselves. Love, therefore, is its own reward.",
      reference: "Thomas Merton",
      intelligenceMin: 6,
    },
    {
      text: "The measure of love is to love without measure.",
      reference: "Augustine of Hippo",
      intelligenceMin: 5,
    },
    {
      text: "Ubi caritas et amor, Deus ibi est. (Where charity and love are, God is there.)",
      reference: "Ancient Latin Hymn",
      intelligenceMin: 7,
    },
  ],
  hope: [
    {
      text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.",
      reference: "Jeremiah 29:11",
    },
    {
      text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.",
      reference: "Isaiah 40:31",
    },
  ],
  faith: [
    {
      text: "Now faith is the substance of things hoped for, the evidence of things not seen.",
      reference: "Hebrews 11:1",
    },
    {
      text: "If ye have faith as a grain of mustard seed, ye shall say unto this mountain, Remove hence to yonder place; and it shall remove; and nothing shall be impossible unto you.",
      reference: "Matthew 17:20",
    },
  ],
  peace: [
    {
      text: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.",
      reference: "John 14:27",
    },
    {
      text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.",
      reference: "Philippians 4:6-7",
    },
  ],
  strength: [
    {
      text: "I can do all things through Christ which strengtheneth me.",
      reference: "Philippians 4:13",
    },
    {
      text: "The LORD is my strength and my shield; my heart trusted in him, and I am helped: therefore my heart greatly rejoiceth; and with my song will I praise him.",
      reference: "Psalm 28:7",
    },
  ],
  fear: [
    {
      text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.",
      reference: "2 Timothy 1:7",
    },
    {
      text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.",
      reference: "Isaiah 41:10",
    },
  ],
  forgiveness: [
    {
      text: "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.",
      reference: "1 John 1:9",
    },
    {
      text: "And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ's sake hath forgiven you.",
      reference: "Ephesians 4:32",
    },
  ],
  wisdom: [
    {
      text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.",
      reference: "James 1:5",
    },
    {
      text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.",
      reference: "Proverbs 3:5-6",
    },
  ],
  guidance: [
    {
      text: "Thy word is a lamp unto my feet, and a light unto my path.",
      reference: "Psalm 119:105",
    },
    {
      text: "I will instruct thee and teach thee in the way which thou shalt go: I will guide thee with mine eye.",
      reference: "Psalm 32:8",
    },
  ],
  comfort: [
    {
      text: "Blessed be God, even the Father of our Lord Jesus Christ, the Father of mercies, and the God of all comfort; Who comforteth us in all our tribulation.",
      reference: "2 Corinthians 1:3-4",
    },
    {
      text: "The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.",
      reference: "Psalm 34:18",
    },
  ],
  prayer: [
    {
      text: "Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.",
      reference: "Matthew 7:7",
    },
    {
      text: "The effectual fervent prayer of a righteous man availeth much.",
      reference: "James 5:16",
    },
  ],
  trust: [
    {
      text: "Commit thy way unto the LORD; trust also in him; and he shall bring it to pass.",
      reference: "Psalm 37:5",
    },
    {
      text: "The name of the LORD is a strong tower: the righteous runneth into it, and is safe.",
      reference: "Proverbs 18:10",
    },
  ],
  joy: [
    {
      text: "These things have I spoken unto you, that my joy might remain in you, and that your joy might be full.",
      reference: "John 15:11",
    },
    {
      text: "This is the day which the LORD hath made; we will rejoice and be glad in it.",
      reference: "Psalm 118:24",
    },
  ],
  help: [
    {
      text: "God is our refuge and strength, a very present help in trouble.",
      reference: "Psalm 46:1",
    },
    {
      text: "The LORD is on my side; I will not fear: what can man do unto me?",
      reference: "Psalm 118:6",
    },
  ],
  grace: [
    {
      text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God.",
      reference: "Ephesians 2:8",
    },
    {
      text: "My grace is sufficient for thee: for my strength is made perfect in weakness.",
      reference: "2 Corinthians 12:9",
    },
  ],
  suffering: [
    {
      text: "The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.",
      reference: "Psalm 34:18",
      intelligenceMax: 6,
    },
    {
      text: "We must accept finite disappointment, but never lose infinite hope.",
      reference: "Martin Luther King Jr.",
      intelligenceMin: 4,
    },
    {
      text: "Only a suffering God can help.",
      reference: "Dietrich Bonhoeffer",
      intelligenceMin: 8,
    },
    {
      text: "The God who lets us live in the world without the working hypothesis of God is the God before whom we stand continually.",
      reference: "Dietrich Bonhoeffer",
      intelligenceMin: 9,
    },
    {
      text: "We must embrace pain and burn it as fuel for our journey.",
      reference: "Kenji Miyazawa",
      intelligenceMin: 5,
    },
  ],
  doubt: [
    {
      text: "Lord, I believe; help thou mine unbelief.",
      reference: "Mark 9:24",
      intelligenceMax: 6,
    },
    {
      text: "Faith is the highest passion in a human being. Many in every generation may not come that far, but none comes further.",
      reference: "Søren Kierkegaard",
      intelligenceMin: 7,
    },
    {
      text: "Doubt is not the opposite of faith; it is one element of faith.",
      reference: "Paul Tillich",
      intelligenceMin: 6,
    },
    {
      text: "If you would be a real seeker after truth, it is necessary that at least once in your life you doubt, as far as possible, all things.",
      reference: "René Descartes",
      intelligenceMin: 8,
    },
    {
      text: "The opposite of faith is not doubt, but certainty.",
      reference: "Anne Lamott",
      intelligenceMin: 5,
    },
  ],
  reason: [
    {
      text: "Come now, and let us reason together, saith the LORD.",
      reference: "Isaiah 1:18",
      intelligenceMax: 6,
    },
    {
      text: "Faith seeking understanding.",
      reference: "Anselm of Canterbury",
      intelligenceMin: 7,
    },
    {
      text: "I believe in order to understand.",
      reference: "Anselm of Canterbury",
      intelligenceMin: 7,
    },
    {
      text: "Reason is the natural order of the truth; but imagination is the organ of meaning.",
      reference: "C.S. Lewis",
      intelligenceMin: 7,
    },
  ],
  evil: [
    {
      text: "Woe unto them that call evil good, and good evil; that put darkness for light, and light for darkness.",
      reference: "Isaiah 5:20",
      intelligenceMax: 6,
    },
    {
      text: "The problem of evil is not a problem of philosophy but of theodicy - not explaining evil's existence, but justifying God despite it.",
      reference: "Alvin Plantinga (paraphrased)",
      intelligenceMin: 8,
    },
    {
      text: "Evil is not a thing. It is the privation of good, the absence of being.",
      reference: "Augustine of Hippo",
      intelligenceMin: 7,
    },
    {
      text: "God whispers to us in our pleasures, speaks in our conscience, but shouts in our pains: it is His megaphone to rouse a deaf world.",
      reference: "C.S. Lewis",
      intelligenceMin: 5,
    },
    {
      text: "The only thing necessary for the triumph of evil is for good men to do nothing.",
      reference: "Edmund Burke (attributed)",
      intelligenceMin: 4,
    },
    {
      text: "Hell is oneself, hell is alone, the other figures in it merely projections.",
      reference: "T.S. Eliot",
      intelligenceMin: 7,
    },
  ],
  knowledge: [
    {
      text: "The fear of the LORD is the beginning of knowledge: but fools despise wisdom and instruction.",
      reference: "Proverbs 1:7",
    },
    {
      text: "All truth is God's truth.",
      reference: "Augustine of Hippo",
    },
  ],
  mystery: [
    {
      text: "For now we see through a glass, darkly; but then face to face: now I know in part; but then shall I know even as also I am known.",
      reference: "1 Corinthians 13:12",
    },
    {
      text: "The heart has its reasons which reason knows nothing of.",
      reference: "Blaise Pascal",
    },
  ],
  justice: [
    {
      text: "But let judgment run down as waters, and righteousness as a mighty stream.",
      reference: "Amos 5:24",
    },
    {
      text: "Injustice anywhere is a threat to justice everywhere.",
      reference: "Martin Luther King Jr.",
    },
  ],
  existence: [
    {
      text: "I AM THAT I AM.",
      reference: "Exodus 3:14",
    },
    {
      text: "God is that than which nothing greater can be conceived.",
      reference: "Anselm of Canterbury",
    },
  ],
  freewill: [
    {
      text: "I call heaven and earth to record this day against you, that I have set before you life and death, blessing and cursing: therefore choose life.",
      reference: "Deuteronomy 30:19",
      intelligenceMax: 6,
    },
    {
      text: "To say that God foreknows all things is not to deny human freedom; it is to affirm that God's eternity comprehends all temporal moments at once.",
      reference: "Boethius (paraphrased)",
      intelligenceMin: 8,
    },
    {
      text: "Man is condemned to be free.",
      reference: "Jean-Paul Sartre",
      intelligenceMin: 7,
    },
  ],
  sin: [
    {
      text: "For all have sinned, and come short of the glory of God.",
      reference: "Romans 3:23",
      intelligenceMax: 5,
    },
    {
      text: "Sin is behovely, but all shall be well, and all shall be well, and all manner of thing shall be well.",
      reference: "Julian of Norwich",
      intelligenceMin: 6,
    },
    {
      text: "The line dividing good and evil cuts through the heart of every human being.",
      reference: "Aleksandr Solzhenitsyn",
      intelligenceMin: 5,
    },
  ],
  cross: [
    {
      text: "But God forbid that I should glory, save in the cross of our Lord Jesus Christ.",
      reference: "Galatians 6:14",
      intelligenceMax: 5,
    },
    {
      text: "The cross is the only ladder to heaven.",
      reference: "Thomas à Kempis",
      intelligenceMin: 4,
    },
    {
      text: "God proves his love for us in that while we were still sinners, Christ died for us.",
      reference: "Romans 5:8",
      intelligenceMax: 6,
    },
  ],
  death: [
    {
      text: "O death, where is thy sting? O grave, where is thy victory?",
      reference: "1 Corinthians 15:55",
      intelligenceMax: 6,
    },
    {
      text: "Death is the crown of life.",
      reference: "Edward Young",
      intelligenceMin: 5,
    },
    {
      text: "Do not go gentle into that good night. Rage, rage against the dying of the light.",
      reference: "Dylan Thomas",
      intelligenceMin: 5,
    },
  ],
  eternity: [
    {
      text: "Before the mountains were brought forth, or ever thou hadst formed the earth and the world, even from everlasting to everlasting, thou art God.",
      reference: "Psalm 90:2",
      intelligenceMax: 7,
    },
    {
      text: "Time is the moving image of eternity.",
      reference: "Plato",
      intelligenceMin: 7,
    },
    {
      text: "In his eternal self-identity the Father generates the Son; and in their mutual love of that self-identity is generated the Spirit.",
      reference: "Hans Urs von Balthasar (paraphrased)",
      intelligenceMin: 9,
    },
  ],
  silence: [
    {
      text: "Be still, and know that I am God.",
      reference: "Psalm 46:10",
      intelligenceMax: 5,
    },
    {
      text: "The friend of silence draws near to God.",
      reference: "John Climacus",
      intelligenceMin: 6,
    },
    {
      text: "God's first language is silence. Everything else is a poor translation.",
      reference: "Thomas Keating",
      intelligenceMin: 6,
    },
  ],
  paradox: [
    {
      text: "He that findeth his life shall lose it: and he that loseth his life for my sake shall find it.",
      reference: "Matthew 10:39",
      intelligenceMax: 6,
    },
    {
      text: "Christianity, if false, is of no importance, and if true, of infinite importance. The only thing it cannot be is moderately important.",
      reference: "C.S. Lewis",
      intelligenceMin: 6,
    },
    {
      text: "I believe because it is absurd.",
      reference: "Tertullian (often misquoted)",
      intelligenceMin: 7,
    },
  ],
  incarnation: [
    {
      text: "And the Word was made flesh, and dwelt among us.",
      reference: "John 1:14",
      intelligenceMax: 6,
    },
    {
      text: "The Son of God became man so that man might become God.",
      reference: "Athanasius of Alexandria",
      intelligenceMin: 7,
    },
    {
      text: "God's kenosis, his self-emptying into the human condition, is the ultimate act of divine love.",
      reference: "Philippians 2:7 (theological reflection)",
      intelligenceMin: 8,
    },
  ],
};

export function findRelevantVerse(
  userMessage: string, 
  aiResponse: string,
  intelligenceLevel: number = 5
): {
  text: string;
  reference: string;
} | null {
  const combinedText = (userMessage + " " + aiResponse).toLowerCase();

  // Collect ALL matching keywords with their frequency
  const keywords = Object.keys(bibleVerses);
  const matches: Array<{ keyword: string; count: number }> = [];
  
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matchCount = (combinedText.match(regex) || []).length;
    if (matchCount > 0) {
      matches.push({ keyword, count: matchCount });
    }
  }

  // If no matches at all, return null (no forced verse)
  if (matches.length === 0) {
    return null;
  }

  // Prioritize RARER keywords over common ones to avoid "love" dominating
  // Give weight to less common words
  const commonWords = ['love', 'help', 'hope'];
  const rareMatches = matches.filter(m => !commonWords.includes(m.keyword));
  
  // Use rare matches if available, otherwise use all matches
  const selectedMatches = rareMatches.length > 0 ? rareMatches : matches;
  
  // Pick a random keyword from matches (weighted by rarity)
  const randomMatch = selectedMatches[Math.floor(Math.random() * selectedMatches.length)];
  const allQuotes = bibleVerses[randomMatch.keyword as keyof typeof bibleVerses];
  
  // Filter quotes by intelligence level
  const appropriateQuotes = allQuotes.filter(quote => {
    const meetsMin = !quote.intelligenceMin || intelligenceLevel >= quote.intelligenceMin;
    const meetsMax = !quote.intelligenceMax || intelligenceLevel <= quote.intelligenceMax;
    return meetsMin && meetsMax;
  });
  
  // If no quotes match intelligence level, fallback to any quote from category
  const quotesToUse = appropriateQuotes.length > 0 ? appropriateQuotes : allQuotes;
  
  // Pick a random verse/quote from the filtered list
  const randomIndex = Math.floor(Math.random() * quotesToUse.length);
  return quotesToUse[randomIndex];
}

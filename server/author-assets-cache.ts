import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

interface AuthorAssets {
  styleGuide?: string;
  voiceProfile?: string;
  primaryTexts?: string;
  quotesIndexed?: string;
  fictionExamples?: string;
  // Specialized files
  dialogues?: string;
  aphorisms?: string;
  caseStudies?: string;
  psychopathologyConcepts?: string;
  pragmatistFramework?: string;
  marxistFramework?: string;
  idealistFramework?: string;
  platonicFramework?: string;
}

interface AuthorInfo {
  id: string;
  name: string;
  assets: AuthorAssets;
}

class AuthorAssetsCache {
  private cache: Map<string, AuthorInfo> = new Map();
  private authorDatabasePath: string;

  constructor() {
    this.authorDatabasePath = join(process.cwd(), 'author_database');
    this.loadAllAuthors();
  }

  private loadAllAuthors(): void {
    // Phase 1 authors with their expected files
    const phase1Authors = [
      'kuczynski',
      'freud',
      'berkeley',
      'james',
      'nietzsche',
      'marx',
      'dostoevsky',
      'plato',
      'dewey',
      'mill',
      'descartes',
      'allen',
      'spencer',
      'darwin'
    ];

    console.log('📚 Loading Author Literature Database...');
    
    for (const authorId of phase1Authors) {
      try {
        const authorPath = join(this.authorDatabasePath, authorId);
        
        if (!existsSync(authorPath)) {
          console.warn(`⚠️  Author directory not found: ${authorId}`);
          continue;
        }

        const assets: AuthorAssets = {};

        // Load core files
        const styleGuidePath = join(authorPath, 'style_guide.txt');
        if (existsSync(styleGuidePath)) {
          assets.styleGuide = readFileSync(styleGuidePath, 'utf-8');
        }

        const voiceProfilePath = join(authorPath, 'voice_profile.txt');
        if (existsSync(voiceProfilePath)) {
          assets.voiceProfile = readFileSync(voiceProfilePath, 'utf-8');
        }

        const primaryTextsPath = join(authorPath, 'primary_texts.txt');
        if (existsSync(primaryTextsPath)) {
          assets.primaryTexts = readFileSync(primaryTextsPath, 'utf-8');
        }

        const quotesIndexedPath = join(authorPath, 'quotes_indexed.txt');
        if (existsSync(quotesIndexedPath)) {
          assets.quotesIndexed = readFileSync(quotesIndexedPath, 'utf-8');
        }

        const fictionExamplesPath = join(authorPath, 'fiction_examples.txt');
        if (existsSync(fictionExamplesPath)) {
          assets.fictionExamples = readFileSync(fictionExamplesPath, 'utf-8');
        }

        // Load specialized files
        const dialoguesPath = join(authorPath, 'dialogues.txt');
        if (existsSync(dialoguesPath)) {
          assets.dialogues = readFileSync(dialoguesPath, 'utf-8');
        }

        const aphorismsPath = join(authorPath, 'aphorisms.txt');
        if (existsSync(aphorismsPath)) {
          assets.aphorisms = readFileSync(aphorismsPath, 'utf-8');
        }

        const caseStudiesPath = join(authorPath, 'case_studies.txt');
        if (existsSync(caseStudiesPath)) {
          assets.caseStudies = readFileSync(caseStudiesPath, 'utf-8');
        }

        const psychopathologyConceptsPath = join(authorPath, 'psychopathology_concepts.txt');
        if (existsSync(psychopathologyConceptsPath)) {
          assets.psychopathologyConcepts = readFileSync(psychopathologyConceptsPath, 'utf-8');
        }

        const pragmatistFrameworkPath = join(authorPath, 'pragmatist_framework.txt');
        if (existsSync(pragmatistFrameworkPath)) {
          assets.pragmatistFramework = readFileSync(pragmatistFrameworkPath, 'utf-8');
        }

        const marxistFrameworkPath = join(authorPath, 'marxist_framework.txt');
        if (existsSync(marxistFrameworkPath)) {
          assets.marxistFramework = readFileSync(marxistFrameworkPath, 'utf-8');
        }

        const idealistFrameworkPath = join(authorPath, 'idealist_framework.txt');
        if (existsSync(idealistFrameworkPath)) {
          assets.idealistFramework = readFileSync(idealistFrameworkPath, 'utf-8');
        }

        const platonicFrameworkPath = join(authorPath, 'platonic_framework.txt');
        if (existsSync(platonicFrameworkPath)) {
          assets.platonicFramework = readFileSync(platonicFrameworkPath, 'utf-8');
        }

        // Get author display name
        const authorNames: Record<string, string> = {
          'kuczynski': 'J.-M. Kuczynski',
          'freud': 'Sigmund Freud',
          'berkeley': 'George Berkeley',
          'james': 'William James',
          'nietzsche': 'Friedrich Nietzsche',
          'marx': 'Karl Marx',
          'dostoevsky': 'Fyodor Dostoevsky',
          'plato': 'Plato',
          'dewey': 'John Dewey',
          'mill': 'John Stuart Mill',
          'descartes': 'René Descartes',
          'allen': 'James Allen',
          'spencer': 'Herbert Spencer',
          'darwin': 'Charles Darwin'
        };

        this.cache.set(authorId, {
          id: authorId,
          name: authorNames[authorId] || authorId,
          assets
        });

        const fileCount = Object.keys(assets).length;
        console.log(`  ✓ ${authorNames[authorId]}: ${fileCount} files loaded`);

      } catch (error) {
        console.error(`❌ Error loading ${authorId}:`, error);
      }
    }

    console.log(`✅ Loaded ${this.cache.size} authors into cache`);
  }

  getAuthor(authorId: string): AuthorInfo | undefined {
    return this.cache.get(authorId);
  }

  getAvailableAuthors(): AuthorInfo[] {
    return Array.from(this.cache.values());
  }

  buildFictionPrompt(authorId: string, sourceText: string, customInstructions?: string): string | null {
    const author = this.cache.get(authorId);
    if (!author) {
      return null;
    }

    const { assets } = author;

    // Build comprehensive fiction writing prompt
    let prompt = `You are writing narrative fiction in the distinctive voice and style of ${author.name}.

SOURCE TEXT TO TRANSFORM INTO FICTION:
${sourceText}

YOUR TASK:
Transform the above source text into a narrative fiction story (800-1500 words) written in ${author.name}'s distinctive voice. The story should EMBODY the concepts/ideas from the source text through narrative, NOT explain them didactically.

`;

    // Add style guide
    if (assets.styleGuide) {
      const styleExcerpt = assets.styleGuide.substring(0, 3000); // First ~3000 chars
      prompt += `STYLE GUIDE (${author.name}'s narrative techniques and rhetorical patterns):
${styleExcerpt}

`;
    }

    // Add voice profile
    if (assets.voiceProfile) {
      const voiceExcerpt = assets.voiceProfile.substring(0, 3000);
      prompt += `VOICE PROFILE (${author.name}'s philosophical framework and core ideas):
${voiceExcerpt}

`;
    }

    // Add fiction examples if available
    if (assets.fictionExamples) {
      const fictionExcerpt = assets.fictionExamples.substring(0, 3000);
      prompt += `FICTION EXAMPLES (concrete narrative examples from ${author.name}):
${fictionExcerpt}

`;
    }

    // Add specialized files as relevant
    if (assets.dialogues && (authorId === 'plato' || authorId === 'berkeley')) {
      const dialogueExcerpt = assets.dialogues.substring(0, 2000);
      prompt += `DIALOGUE STRUCTURE:
${dialogueExcerpt}

`;
    }

    if (assets.aphorisms && authorId === 'nietzsche') {
      const aphorismExcerpt = assets.aphorisms.substring(0, 2000);
      prompt += `APHORISTIC STYLE:
${aphorismExcerpt}

`;
    }

    if (assets.caseStudies && authorId === 'freud') {
      const caseExcerpt = assets.caseStudies.substring(0, 2000);
      prompt += `CASE STUDY METHOD:
${caseExcerpt}

`;
    }

    // Add custom instructions if provided
    if (customInstructions) {
      prompt += `ADDITIONAL INSTRUCTIONS:
${customInstructions}

`;
    }

    // Final instructions
    prompt += `CRITICAL REQUIREMENTS:
1. Write 800-1500 words of narrative fiction
2. EMBODY the source text concepts through story, characters, scenes - DO NOT explain them
3. Use ${author.name}'s distinctive voice, style, and rhetorical techniques
4. If ${author.name} writes dialogue (Plato, Berkeley, Dostoevsky), include authentic dialogue
5. If ${author.name} uses first-person (Nietzsche, Kuczynski), maintain that voice
6. Deploy ${author.name}'s characteristic sentence structures and vocabulary
7. Match ${author.name}'s tone (analytic, psychological, dialectical, etc.)
8. Let the story SHOW the concepts in action rather than state them

Begin the fiction now:`;

    return prompt;
  }
}

// Export singleton instance
export const authorAssetsCache = new AuthorAssetsCache();

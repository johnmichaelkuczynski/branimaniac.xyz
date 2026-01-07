import { readFileSync, writeFileSync } from 'fs';
import { basename } from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

const papers = [
  { input: 'attached_assets/Existence and Necessity_1762171272872.pdf', output: 'server/kuczynski_existence_necessity.txt', title: 'Existence and Necessity' },
  { input: 'attached_assets/Neurosis vs. Psychosis_ And Other Psychoanalytic Vignettes_1762171275847.pdf', output: 'server/kuczynski_neurosis_psychosis.txt', title: 'Neurosis vs. Psychosis' },
  { input: 'attached_assets/What is an Intention__1762171278446.pdf', output: 'server/kuczynski_intention.txt', title: 'What is an Intention?' },
  { input: 'attached_assets/The Moral Structure of Legal Obligation_1762171283884.pdf', output: 'server/kuczynski_legal_obligation.txt', title: 'The Moral Structure of Legal Obligation' },
  { input: 'attached_assets/10_Kuczynski WORD_1762171838457.docx', output: 'server/kuczynski_knowledge_chapter.txt', title: 'Knowledge (Chapter 10)' }
];

async function extractPDF(inputPath: string): Promise<string> {
  const dataBuffer = readFileSync(inputPath);
  const data = await pdf(dataBuffer);
  return data.text;
}

async function extractDOCX(inputPath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: inputPath });
  return result.value;
}

(async () => {
  console.log('📄 Extracting 5 new Kuczynski papers...\n');
  
  for (const paper of papers) {
    try {
      console.log(`Processing: ${paper.title}`);
      
      let text: string;
      if (paper.input.endsWith('.pdf')) {
        text = await extractPDF(paper.input);
      } else if (paper.input.endsWith('.docx')) {
        text = await extractDOCX(paper.input);
      } else {
        throw new Error('Unknown file type');
      }
      
      // Remove null bytes and clean whitespace
      text = text.replace(/\0/g, '').trim();
      
      writeFileSync(paper.output, text, 'utf-8');
      
      const wordCount = text.split(/\s+/).length;
      console.log(`✅ ${basename(paper.output)} (${wordCount} words)\n`);
    } catch (err: any) {
      console.error(`❌ Error: ${paper.title}:`, err.message);
    }
  }
  console.log('✅ All papers extracted!');
  process.exit(0);
})();

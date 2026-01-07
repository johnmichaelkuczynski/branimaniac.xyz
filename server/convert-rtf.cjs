const fs = require('fs');

function rtfToText(rtfContent) {
  let text = rtfContent;
  
  // Remove everything before the actual content starts
  text = text.replace(/^[\s\S]*?\\deflangfe\d+/m, '');
  
  // Remove RTF control sequences
  text = text.replace(/\{\\[^}]*\}/g, '');
  text = text.replace(/\\[a-z]+(-?\d+)?[ ]?/gi, '');
  text = text.replace(/[{}]/g, '');
  text = text.replace(/\\'[0-9a-f]{2}/gi, '');
  
  // Clean up whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text.trim();
}

const input = process.argv[2];
const output = process.argv[3];

const rtf = fs.readFileSync(input, 'utf8');
const txt = rtfToText(rtf);
fs.writeFileSync(output, txt, 'utf8');
console.log(`Converted: ${txt.split('\n').length} lines`);

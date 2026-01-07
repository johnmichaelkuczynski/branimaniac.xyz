const fs = require('fs');
const path = require('path');

// Simple RTF to text converter
function rtfToText(rtfContent) {
  // Remove RTF control words and groups
  let text = rtfContent
    // Remove header
    .replace(/^{\\rtf1[\s\S]*?\\deflang\d+/m, '')
    // Remove font table
    .replace(/\{\\fonttbl[\s\S]*?\}\}/g, '')
    // Remove color table
    .replace(/\{\\colortbl[\s\S]*?\}/g, '')
    // Remove stylesheet
    .replace(/\{\\stylesheet[\s\S]*?\}\}/g, '')
    // Remove list table
    .replace(/\{\\*\\listtable[\s\S]*?\}\}/g, '')
    // Remove info group
    .replace(/\{\\info[\s\S]*?\}\}/g, '')
    // Remove other control groups
    .replace(/\{\\[*]?[a-z]+[0-9]*\s*[\s\S]*?\}/gi, '')
    // Remove control words with parameters
    .replace(/\\[a-z]+(-?[0-9]+)?[ ]?/gi, '')
    // Remove escaped characters
    .replace(/\\['{};\\]/g, '')
    // Clean up multiple spaces
    .replace(/[ \t]+/g, ' ')
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Remove remaining curly braces
    .replace(/[{}]/g, '')
    .trim();
  
  return text;
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error('Usage: node convert-rtf.js input.rtf output.txt');
  process.exit(1);
}

const rtfContent = fs.readFileSync(inputFile, 'utf8');
const textContent = rtfToText(rtfContent);
fs.writeFileSync(outputFile, textContent, 'utf8');
console.log(`Converted ${inputFile} to ${outputFile}`);

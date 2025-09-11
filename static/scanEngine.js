const KNOWLEDGE_BASE = require('./knowledgeBase'); // if you split it out
const fs = require('fs');

// Load sample contract text
const contractText = fs.readFileSync('sample_contract.txt', 'utf8');

const results = [];

for (const key in KNOWLEDGE_BASE.TILA) {
  const item = KNOWLEDGE_BASE.TILA[key];
  const found = item.searchTerms.some((regex) => regex.test(contractText));
  results.push({
    label: item.label,
    found,
    citation: item.citation,
    remedy: found ? null : item.remedyHint
  });
}

console.table(results);
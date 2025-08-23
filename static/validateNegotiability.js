const KNOWLEDGE_BASE = require('./knowledgeBase');
const fs = require('fs');

const billText = fs.readFileSync('sample_bill.txt', 'utf8');

const results = [];

for (const key in KNOWLEDGE_BASE.UCC) {
  const item = KNOWLEDGE_BASE.UCC[key];
  const passed = item.test(billText);
  results.push({
    label: item.label,
    passed,
    citation: item.citation,
    remedy: passed ? null : item.remedyHint
  });
}

console.table(results);
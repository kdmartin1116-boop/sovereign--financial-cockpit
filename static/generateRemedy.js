const KNOWLEDGE_BASE = require('./knowledgeBase');

function generateRemedy(disclosureKey) {
  const item = KNOWLEDGE_BASE.TILA[disclosureKey];
  return `Pursuant to ${item.citation}, the absence of a clear ${item.label} constitutes a material violation of TILA. ${item.remedyHint} Remedy is demanded.`;
}

// Example usage
console.log(generateRemedy('APR'));
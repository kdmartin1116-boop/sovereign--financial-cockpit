const KNOWLEDGE_BASE = {
  TILA: {
    APR: {
      label: 'Annual Percentage Rate',
      searchTerms: [/Annual Percentage Rate/i, /\bAPR\b/i],
      description: 'The cost of your credit as a yearly rate. This is a key disclosure required by TILA.',
      citation: '15 U.S.C. § 1638(a)(4)',
      remedyHint: 'The absence of a clear APR is a significant violation.'
    }
    // Add other entries if needed
  }
};

// Sample text to test
const sampleText = "This contract fails to disclose the Annual Percentage Rate clearly.";

// Scan logic
const matches = KNOWLEDGE_BASE.TILA.APR.searchTerms.some((regex) => regex.test(sampleText));

console.log("APR Disclosure Found:", matches);
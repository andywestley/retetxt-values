import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { search } from 'nlcst-search';
import { normalize } from 'nlcst-normalize';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @typedef {Object} Options
 * @property {Record<string, string[]>} dictionary
 * @property {boolean} [expand=false] Whether to expand the dictionary using a local thesaurus.
 */

/**
 * Plugin to analyze natural language against a dynamically provided values dictionary.
 *
 * @type {import('unified').Plugin<[Options | undefined] | void[]>}
 */
export default function retextValues(options) {
  const dictionary = options?.dictionary || {};
  const shouldExpand = options?.expand || false;
  
  // Transform dictionary into a flat array of phrases for nlcst-search
  const phrases = [];
  // Keep a map of normalized phrase -> { category, primaryTerm, isExpanded }
  const phraseMetadata = new Map();

  let thesaurus = {};
  if (shouldExpand) {
    try {
      const thesaurusPath = path.join(__dirname, 'thesaurus.json');
      thesaurus = JSON.parse(fs.readFileSync(thesaurusPath, 'utf8'));
    } catch (error) {
      console.warn('retext-values: Could not load thesaurus.json. Expansion disabled.');
    }
  }

  for (const [category, words] of Object.entries(dictionary)) {
    for (const word of words) {
      const normalizedWord = normalize(word);
      
      // Add the original word
      if (!phraseMetadata.has(normalizedWord)) {
        phrases.push(word);
        phraseMetadata.set(normalizedWord, { category, primaryTerm: word, isExpanded: false });
      }

      // Add synonyms if expanding
      if (shouldExpand && thesaurus[normalizedWord]) {
        for (const synonym of thesaurus[normalizedWord]) {
          const normalizedSynonym = normalize(synonym);
          if (!phraseMetadata.has(normalizedSynonym)) {
            phrases.push(synonym);
            phraseMetadata.set(normalizedSynonym, { category, primaryTerm: word, isExpanded: true });
          }
        }
      }
    }
  }

  return (tree, file) => {
    if (phrases.length === 0) return;

    search(tree, phrases, (match, index, parent, phrase) => {
      // Find what category and metadata this matched phrase belongs to
      const meta = phraseMetadata.get(normalize(phrase));
      
      // Extract the actual matched text from the VFile
      const startOffset = match[0].position.start.offset;
      const endOffset = match[match.length - 1].position.end.offset;
      const matchString = file.value.slice(startOffset, endOffset);
      
      const message = file.message(
        `Found value phrase: "${matchString}"`,
        {
          start: match[0].position.start,
          end: match[match.length - 1].position.end
        },
        `retext-values:${meta.category}`
      );
      message.source = 'retext-values';
      message.ruleId = meta.category;

      message.actual = matchString;
      message.expected = [meta.primaryTerm];

      message.data = {
        isExpanded: meta.isExpanded,
        primaryTerm: meta.primaryTerm,
        matchTerm: phrase
      };
    }, {
      allowApostrophes: true,
      allowDashes: true
    });
  };
}

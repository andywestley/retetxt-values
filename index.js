import { search } from 'nlcst-search';
import { normalize } from 'nlcst-normalize';

/**
 * @typedef {Object} Options
 * @property {Record<string, string[]>} dictionary
 */

/**
 * Plugin to analyze natural language against a dynamically provided values dictionary.
 *
 * @type {import('unified').Plugin<[Options | undefined] | void[]>}
 */
export default function retextValues(options) {
  const dictionary = options?.dictionary || {};
  
  // Transform dictionary into a flat array of phrases for nlcst-search
  const phrases = [];
  // Keep a map of normalized phrase -> category so we can emit the right ruleId
  const phraseToCategory = new Map();

  for (const [category, words] of Object.entries(dictionary)) {
    for (const word of words) {
      phrases.push(word);
      phraseToCategory.set(normalize(word), category);
    }
  }

  return (tree, file) => {
    if (phrases.length === 0) return;

    search(tree, phrases, (match, index, parent, phrase) => {
      // Find what category this matched phrase belongs to
      const category = phraseToCategory.get(normalize(phrase));
      
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
        `retext-values:${category}`
      );

      message.actual = matchString;
    }, {
      allowApostrophes: true,
      allowDashes: true
    });
  };
}

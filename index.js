import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { visit } from 'unist-util-visit';
import { stemmer } from 'stemmer';
import { toString } from 'nlcst-to-string';
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
  
  // Transform dictionary into an array of stemmed patterns
  const patterns = [];
  // Keep a map of joined stems -> { category, primaryTerm, isExpanded, phraseLength }
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

  function getStems(phrase) {
    // Split phrase into words (by spaces) and stem them
    return phrase.split(/\s+/).filter(Boolean).map(w => stemmer(normalize(w)));
  }

  function addPhrase(phrase, category, primaryTerm, isExpanded) {
    const stems = getStems(phrase);
    if (stems.length === 0) return;
    
    const stemKey = stems.join(' ');
    
    if (!phraseMetadata.has(stemKey)) {
      patterns.push(stems);
      // Core matches always take precedence
      phraseMetadata.set(stemKey, { category, primaryTerm, isExpanded, phraseLength: stems.length, matchTerm: phrase });
    }
  }

  // First pass: Add all core dictionary keywords
  for (const [category, words] of Object.entries(dictionary)) {
    for (const word of words) {
      addPhrase(word, category, word, false);
    }
  }

  // Second pass: Add synonyms if enabled
  if (shouldExpand) {
    for (const [category, words] of Object.entries(dictionary)) {
      for (const word of words) {
        const normalizedWord = normalize(word);
        if (thesaurus[normalizedWord]) {
          for (const synonym of thesaurus[normalizedWord]) {
            addPhrase(synonym, category, word, true);
          }
        }
      }
    }
  }

  return (tree, file) => {
    if (patterns.length === 0) return;

    // 1. Extract all WordNodes into a flat array
    const wordNodes = [];
    visit(tree, 'WordNode', (node) => {
      wordNodes.push({
        node,
        stem: stemmer(normalize(toString(node)))
      });
    });

    // 2. Sliding window over the word nodes
    for (let i = 0; i < wordNodes.length; i++) {
      for (const pattern of patterns) {
        const patternLength = pattern.length;
        
        // Ensure we have enough nodes left for this pattern
        if (i + patternLength > wordNodes.length) {
          continue;
        }

        // Check if the stems match
        let isMatch = true;
        for (let j = 0; j < patternLength; j++) {
          if (wordNodes[i + j].stem !== pattern[j]) {
            isMatch = false;
            break;
          }
        }

        if (isMatch) {
          const stemKey = pattern.join(' ');
          const meta = phraseMetadata.get(stemKey);
          
          const startNode = wordNodes[i].node;
          const endNode = wordNodes[i + patternLength - 1].node;

          const startOffset = startNode.position.start.offset;
          const endOffset = endNode.position.end.offset;
          const matchString = file.value.slice(startOffset, endOffset);
          
          const message = file.message(
            `Found value phrase: "${matchString}"`,
            {
              start: startNode.position.start,
              end: endNode.position.end
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
            matchTerm: meta.matchTerm
          };
          
          // If we matched a phrase, we might want to skip ahead to avoid overlapping matches
          // For simplicity, we just let it find all matches (or we could advance `i`)
        }
      }
    }
  };
}

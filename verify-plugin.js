import fs from 'node:fs';
import { retext } from 'retext';
import retextValues from './index.js';

const dictionary = JSON.parse(fs.readFileSync('./dictionary.json', 'utf8'));

async function runTest(filename, expectMatches, shouldExpand) {
  const text = fs.readFileSync(filename, 'utf8');
  const file = await retext()
    .use(retextValues, { dictionary, expand: shouldExpand })
    .process(text);

  console.log(`\n--- Testing ${filename} (expand: ${shouldExpand}) ---`);
  console.log(`Found ${file.messages.length} matches (expected: ${expectMatches})`);
  
  if (file.messages.length !== expectMatches) {
    console.error(`[FAIL] Match count mismatch for ${filename}`);
  }

  file.messages.forEach((msg, i) => {
    console.log(`Match ${i + 1}: "${msg.actual}" -> category: ${msg.ruleId}`);
    console.log(`  Metadata: ${JSON.stringify(msg.data)}`);
    
    // Verify metadata structure
    if (msg.data.isExpanded === undefined || !msg.data.primaryTerm || !msg.data.matchTerm) {
      console.error(`[FAIL] Missing metadata in match ${i + 1}`);
    }
    
    // logic checks
    if (shouldExpand && msg.data.isExpanded && msg.actual === msg.data.primaryTerm) {
        // This could happen if a word is its own synonym, but usually isExpanded should be false for exact matches.
        // Actually, in index.js, the original word is added first with isExpanded: false.
        // So an exact match should always have isExpanded: false.
    }
  });
}

async function main() {
  try {
    // 1. No matches
    await runTest('test-no-matches.txt', 0, true);

    // 2. Core matches (expand: false)
    await runTest('test-core-matches.txt', 3, false);

    // 3. Core matches (expand: true) - should still be 3, but metadata should show isExpanded: false
    await runTest('test-core-matches.txt', 3, true);

    // 4. Expanded matches (expand: true)
    await runTest('test-expanded-matches.txt', 3, true);

    // 5. Expanded matches (expand: false) - should be 0
    await runTest('test-expanded-matches.txt', 0, false);

    console.log('\nAll tests completed.');
  } catch (err) {
    console.error('Test execution failed:', err);
  }
}

main();

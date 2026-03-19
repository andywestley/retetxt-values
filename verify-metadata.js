import { retext } from 'retext';
import retextValues from './index.js';

// Define a simple dictionary
const dictionary = {
  trust: ['secure']
};

// Test text containing a synonym from the thesaurus for 'secure' (like 'reliable')
const text = 'Your data is reliable.';

retext()
  .use(retextValues, { 
    dictionary,
    expand: true 
  })
  .process(text)
  .then((file) => {
    console.log('--- Verification Results ---');
    if (file.messages.length === 0) {
      console.log('No matches found.');
    } else {
      file.messages.forEach((message, i) => {
        console.log(`Match ${i + 1}:`);
        console.log(`  Message: ${message.reason}`);
        console.log(`  Data:`, JSON.stringify(message.data, null, 2));
        
        // Assertions (manual check for now, but good for logs)
        if (message.data.isExpanded === true && 
            message.data.primaryTerm === 'secure' && 
            message.data.matchTerm === 'reliable') {
          console.log('  [PASS] Metadata is correct for expanded match.');
        } else if (message.data.isExpanded === false && 
                   message.data.primaryTerm === 'secure' && 
                   message.data.matchTerm === 'secure') {
          console.log('  [PASS] Metadata is correct for exact match.');
        } else {
          console.log('  [FAIL] Metadata mismatch.');
        }
      });
    }
  })
  .catch((err) => {
    console.error(err);
  });

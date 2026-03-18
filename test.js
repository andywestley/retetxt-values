import { retext } from 'retext';
import retextValues from './index.js';

// 1. Define your dynamic values dictionary
const dictionary = {
  innovation: ['cutting-edge', 'disrupt', 'innovative'],
  empathy: ['care', 'understand', 'empathize'],
  trust: ['reliable', 'secure', 'trustworthy']
};

const text = "We provide cutting-edge solutions to disrupt the market. Our secure platform ensures you can rely on us to understand your needs. They also try to disrupt again.";

// 2. Initialize unified with retext and the custom plugin
retext()
  .use(retextValues, { dictionary })
  .process(text)
  .then((file) => {
    console.log('--- Original Text ---');
    console.log(String(file));
    console.log('\n--- Retext Values Warnings ---');
    
    // 3. Log the resulting warnings
    if (file.messages.length === 0) {
      console.log('No value phrases found.');
    } else {
      file.messages.forEach(message => {
        console.log(String(message));
      });
    }
  })
  .catch((err) => {
    console.error(err);
  });

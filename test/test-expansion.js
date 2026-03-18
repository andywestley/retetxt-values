import { retext } from 'retext';
import retextValues from '../index.js';

const text = 'Our company values innovation and creativity in every project. We focus on invention and new ideas.';

const dictionary = {
  'Innovation': ['innovation']
};

async function runTest() {
  console.log('--- Testing without expansion ---');
  const file1 = await retext()
    .use(retextValues, { dictionary })
    .process(text);

  if (file1.messages.length === 0) {
    console.log('No value phrases found.');
  } else {
    file1.messages.forEach(m => console.log(`- ${m.message} [at ${m.line}:${m.column}]`));
  }

  console.log('\n--- Testing with expansion ---');
  const file2 = await retext()
    .use(retextValues, { dictionary, expand: true })
    .process(text);

  if (file2.messages.length === 0) {
    console.log('No value phrases found.');
  } else {
    file2.messages.forEach(m => console.log(`- ${m.message} [at ${m.line}:${m.column}]`));
  }
}

runTest();

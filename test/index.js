import test from 'node:test';
import assert from 'node:assert/strict';
import { retext } from 'retext';
import retextValues from '../index.js';

test('retext-values plugin', async (t) => {
  await t.test('should expose a function for the public API', () => {
    assert.equal(typeof retextValues, 'function');
  });

  await t.test('should not throw or emit warnings if no dictionary is provided', async () => {
    const file = await retext().use(retextValues).process('We provide innovative solutions.');
    assert.deepEqual(file.messages, []);
  });

  await t.test('should emit warnings when dictionary values are found', async () => {
    const dictionary = {
      innovation: ['cutting-edge', 'disrupt'],
      trust: ['reliable']
    };

    const file = await retext()
      .use(retextValues, { dictionary })
      .process('We provide cutting-edge solutions to disrupt the market and be reliable.');

    assert.equal(file.messages.length, 3);
    
    // First match
    assert.equal(file.messages[0].ruleId, 'innovation');
    assert.equal(file.messages[0].reason, 'Found value phrase: "cutting-edge"');
    assert.equal(file.messages[0].actual, 'cutting-edge');

    // Second match
    assert.equal(file.messages[1].ruleId, 'innovation');
    assert.equal(file.messages[1].reason, 'Found value phrase: "disrupt"');
    
    // Third match
    assert.equal(file.messages[2].ruleId, 'trust');
    assert.equal(file.messages[2].actual, 'reliable');
  });

  await t.test('should match phrases regardless of casing and punctuation', async () => {
    const dictionary = {
      urgency: ['do it now'],
      innovation: ['cutting-edge'] // use hyphen directly
    };

    const text = 'He yelled: "Do it now!". It was definitely cutting-edge.';
    
    // nlcst-search naturally handles quotes, case differences, and punctuation like hyphens vs spaces
    const file = await retext()
      .use(retextValues, { dictionary })
      .process(text);

    assert.equal(file.messages.length, 2);
    
    // Check first match (urgency)
    assert.equal(file.messages[0].ruleId, 'urgency');
    assert.equal(file.messages[0].actual, 'Do it now');
    assert.equal(file.messages[0].reason, 'Found value phrase: "Do it now"');
    
    // Check second match (innovation, handling hyphen/space difference)
    assert.equal(file.messages[1].ruleId, 'innovation');
    assert.equal(file.messages[1].actual, 'cutting-edge');
  });
  await t.test('should match stemmed variants of dictionary values', async () => {
    const dictionary = {
      innovation: ['innovate'],
      disruption: ['disrupt']
    };

    const text = 'We are innovating today. We appreciate your disruptive vision.';
    
    const file = await retext()
      .use(retextValues, { dictionary })
      .process(text);

    assert.equal(file.messages.length, 2);
    
    assert.equal(file.messages[0].ruleId, 'innovation');
    assert.equal(file.messages[0].actual, 'innovating'); // stems to "innov"
    
    assert.equal(file.messages[1].ruleId, 'disruption');
    assert.equal(file.messages[1].actual, 'disruptive'); // stems to "disrupt"
  });
});

import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const thesaurus = require('thesaurus');

console.log('Extracting thesaurus data...');
const data = JSON.parse(thesaurus.toJson());

console.log(`Writing ${Object.keys(data).length} entries to thesaurus.json...`);
fs.writeFileSync('thesaurus.json', JSON.stringify(data));
console.log('Done!');

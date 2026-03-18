# retext-values

A [`retext`](https://github.com/retextjs/retext) plugin to analyze natural language against a dynamically provided "Values Dictionary." It checks how well text aligns with specific brand or core values (e.g., Innovation, Empathy, Trust) by matching single and multi-word phrases.

It automatically handles casing, variations in quotes, and varying punctuation like hyphens vs spaces natively.

## Install

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c). In Node.js (version 16+), install with npm:

```sh
npm install retext-values
```

## Use

```js
import { retext } from 'retext';
import retextValues from 'retext-values';

// 1. Define your dynamic values dictionary
const dictionary = {
  innovation: ['cutting-edge', 'disruptive'],
  trust: ['reliable', 'secure', 'trustworthy']
};

const text = "We provide cutting edge solutions to disrupt the market and ensure your data is secure.";

// 2. Initialize unified with the plugin
retext()
  .use(retextValues, { dictionary })
  .process(text)
  .then((file) => {
    console.log(String(file));
  });
```

Yields:

```text
1:12-1:24 warning Found value phrase: "cutting edge" innovation retext-values
1:63-1:69 warning Found value phrase: "secure"       trust      retext-values

2 warnings
```

## API

### `unified().use(retextValues[, options])`

Analyzes natural language against a dynamically provided values dictionary.

##### `options.dictionary`

Type: `Record<string, string[]>`

A map of categories (the keys) to arrays of string phrases (the values).
The plugin will search the parsed text document for exact word phrase matches. It naturally tolerates capitalization and variation in spaces/punctuation (e.g. mapping "cutting-edge" to "cutting edge").

##### `options.expand`

Type: `boolean` (default: `false`)

Whether to expand the dictionary using a local thesaurus. If `true`, the plugin will look for a `thesaurus.json` file in its root directory and add synonyms for every word in your dictionary.

> [!NOTE]
> Expansion happens once during initialization, making it highly performant for scans.

## Thesaurus Generation

To use the expansion feature, you must first generate the local `thesaurus.json` file. You can do this by running the provided extraction script:

```sh
# Install the extraction dependency
npm install thesaurus

# Generate the thesaurus JSON
node scripts/extract-thesaurus.js
```

This will create an ~11MB `thesaurus.json` file containing over 140,000 word entries sourced from LibreOffice's OpenOffice thesaurus.

## License

[MIT](LICENSE)

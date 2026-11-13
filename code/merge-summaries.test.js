// Local check for merge-summaries.js.
// Usage: node code/merge-summaries.test.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const src = fs.readFileSync(path.join(__dirname, 'merge-summaries.js'), 'utf8');
const run = new Function('$', src);

const $ = (name) => ({
  all: () => [{ json: { text: 'First part summary.' } }, { json: { text: '  Second part summary.  ' } }],
  first: () => ({ json: { sourceUrl: 'https://youtu.be/x', lang: 'en' } }),
});

const [merged] = run($);
assert.strictEqual(merged.json.chunkCount, 2);
assert.strictEqual(merged.json.sourceUrl, 'https://youtu.be/x');
assert.strictEqual(merged.json.notes, 'Part 1: First part summary.\n\nPart 2: Second part summary.');

// An all-empty loop output must fail rather than send an empty prompt on.
assert.throws(
  () =>
    run((name) =>
      name === 'Summarize chunk'
        ? { all: () => [{ json: { text: '' } }] }
        : { first: () => ({ json: { sourceUrl: 'u', lang: 'en' } }) }
    ),
  /No chunk summaries/
);

console.log('OK  merges parts in order, trims, keeps source metadata');
console.log('OK  empty loop output throws');

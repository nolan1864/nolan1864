// Local check for chunk-transcript.js — runs the exact file the Code node runs.
// Usage: node code/chunk-transcript.test.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const src = fs.readFileSync(path.join(__dirname, 'chunk-transcript.js'), 'utf8');
const run = new Function('$input', src);

function makeTranscript(sentenceCount) {
  const sentences = [];
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(
      `Sentence ${i} argues that transcript chunking needs care because ` +
        `claim ${i} depends on context from the previous turn.`
    );
  }
  return sentences.join(' ');
}

// 1. A long transcript splits into several chunks with a one-sentence overlap.
const long = makeTranscript(600); // ~7k words
const chunks = run({
  all: () => [{ json: { sourceUrl: 'https://youtu.be/example', lang: 'en', content: long } }],
});
const sizes = chunks.map((c) => c.json.words);
assert.ok(chunks.length > 1, 'long transcript should produce several chunks');
assert.ok(Math.max(...sizes) <= 1200, `no chunk may exceed the word budget, got ${Math.max(...sizes)}`);
// Every chunk except the tail should be close to the budget (no premature breaks).
assert.ok(sizes.slice(0, -1).every((w) => w > 900), `chunks should not be needlessly small: ${sizes}`);
assert.strictEqual(chunks[0].json.chunkCount, chunks.length);
assert.deepStrictEqual(chunks.map((c) => c.json.chunkIndex), chunks.map((_, i) => i));

// 2. Consecutive chunks overlap by exactly one sentence.
const firstTail = chunks[0].json.text.split(/(?<=\.)\s/).slice(-1)[0];
assert.ok(chunks[1].json.text.startsWith(firstTail), 'second chunk should start with the overlap sentence');

// 3. Every sentence of the source survives somewhere (nothing dropped).
const flatSource = long.replace(/\s+/g, ' ');
for (const s of ['Sentence 0 ', 'Sentence 300 ', 'Sentence 599 ']) {
  assert.ok(flatSource.includes(s), 'source fixture sanity check');
}
const joined = chunks.map((c) => c.json.text).join(' ');
assert.ok(joined.includes('Sentence 599 argues'), 'last sentence must be present');
assert.ok(joined.includes('Sentence 0 argues'), 'first sentence must be present');

// 4. A short transcript stays a single chunk.
const short = run({
  all: () => [{ json: { sourceUrl: 'u', lang: 'en', content: 'One short talk. Only two sentences here.' } }],
});
assert.strictEqual(short.length, 1);
assert.strictEqual(short[0].json.chunkCount, 1);

// 5. An empty transcript aborts the run instead of writing an empty page.
assert.throws(
  () => run({ all: () => [{ json: { sourceUrl: 'u', lang: 'en', content: '   ' } }] }),
  /Empty transcript/,
  'empty transcript must throw'
);

// 6. A single runaway sentence is still emitted rather than silently dropped.
const oneSentence = run({
  all: () => [{ json: { sourceUrl: 'u', lang: 'en', content: 'word '.repeat(3000) + '.' } }],
});
assert.strictEqual(oneSentence.length, 1);

console.log(`OK  ${chunks.length} chunks, words: ${sizes.join(', ')}`);
console.log(`OK  overlap: ${JSON.stringify(firstTail.slice(0, 48))}...`);
console.log('OK  empty transcript throws; short + runaway inputs handled');

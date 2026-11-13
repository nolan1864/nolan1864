// Local check for validate-output.js — the same file the Code node runs.
// Usage: node code/validate-output.test.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const src = fs.readFileSync(path.join(__dirname, 'validate-output.js'), 'utf8');
const run = new Function('$json', '$', src);

const $ = () => ({
  first: () => ({ json: { sourceUrl: 'https://youtu.be/dQw4w9WgXcQ', lang: 'en' } }),
});

const good = {
  title: 'Why transcript chunking breaks summaries',
  summary:
    'The talk walks through how long transcripts overflow a model context window and why naive character splitting ' +
    'produces chunks that start mid-claim. It compares sentence-boundary chunking with fixed windows, and argues that ' +
    'one sentence of overlap is enough to keep pronouns attached to their antecedents. It closes with a checklist for ' +
    'validating merged output before publishing.',
  takeaways: ['Chunk on sentence boundaries, not characters.', 'Keep one sentence of overlap.'],
};

// 1. Clean JSON maps onto exactly the Notion fields.
const [ok] = run({ text: JSON.stringify(good) }, $);
assert.strictEqual(ok.json.sourceUrl, 'https://youtu.be/dQw4w9WgXcQ');
assert.strictEqual(ok.json.lang, 'en');
assert.deepStrictEqual(Object.keys(ok.json).sort(), [
  'lang', 'processedAt', 'sourceUrl', 'summary', 'takeaways', 'title',
]);
assert.ok(ok.json.takeaways.startsWith('• Chunk on sentence boundaries'));
assert.ok(!Number.isNaN(Date.parse(ok.json.processedAt)));

// 2. A markdown-fenced answer is accepted (models add the fence constantly).
const fence = String.fromCharCode(96).repeat(3);
const [fenced] = run({ text: `${fence}json\n${JSON.stringify(good)}\n${fence}` }, $);
assert.strictEqual(fenced.json.title, good.title);

// 3. Extra takeaways are clamped to five.
const many = { ...good, takeaways: ['a one', 'b two', 'c three', 'd four', 'e five', 'f six', 'g seven'] };
const [clamped] = run({ text: JSON.stringify(many) }, $);
assert.strictEqual(clamped.json.takeaways.split('\n').length, 5);
assert.ok(!clamped.json.takeaways.includes('f six'));

// 4. Prose instead of JSON fails the run.
assert.throws(() => run({ text: 'Sure! Here is a summary of the video.' }, $), /valid JSON/);

// 5. A thin answer fails the run instead of writing a hollow page.
assert.throws(
  () => run({ text: JSON.stringify({ ...good, summary: 'Too short.' }) }, $),
  /Rejected model output/
);
assert.throws(
  () => run({ text: JSON.stringify({ ...good, takeaways: ['only one'] }) }, $),
  /Rejected model output/
);

// 6. Missing keys do not crash with a TypeError.
assert.throws(() => run({ text: '{"summary":"' + 'x'.repeat(90) + '"}' }, $), /Rejected model output/);

console.log('OK  clean JSON -> 6 Notion fields, ISO timestamp');
console.log('OK  fenced JSON accepted, takeaways clamped to 5');
console.log('OK  prose / thin / partial answers fail the run');

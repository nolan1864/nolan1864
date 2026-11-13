// n8n Code node: "Merge summaries" (Mode: Run Once for All Items)
// Input : the "done" output of the Chunk loop
// Output: one item carrying every per-chunk note
//
// The chunk LLM runs inside a batch loop, so its items are not attached to the
// current item. $('Summarize chunk').all() is the documented way to collect them
// once the loop reports done.

const parts = $('Summarize chunk')
  .all()
  .map((item, i) => `Part ${i + 1}: ${String(item.json.text || '').trim()}`)
  .filter((p) => p.length > 10);

if (parts.length === 0) {
  throw new Error('No chunk summaries were produced - nothing to merge.');
}

const first = $('Prepare input').first().json;
return [
  {
    json: {
      sourceUrl: first.sourceUrl,
      lang: first.lang,
      chunkCount: parts.length,
      notes: parts.join('\n\n'),
    },
  },
];

// n8n Code node: "Split transcript" (Mode: Run Once for All Items)
// Input : one item  -> { sourceUrl, lang, content }
// Output: N items   -> { sourceUrl, lang, chunkIndex, chunkCount, words, text }
//
// Why sentences instead of characters: Supadata returns a single plain-text
// blob when text=true. Cutting it every N characters splits words and, worse,
// usually splits a sentence across two chunks, so each chunk starts mid-claim
// and the model has to guess the antecedent. Splitting on sentence boundaries
// with one sentence of overlap costs ~1% extra tokens and removes that class
// of error. 1200 words ~= 1600 English tokens, which leaves room in an 8k
// window for the prompt, the previous chunk's notes, and a 400-token answer.

const MAX_WORDS = 1200;
const OVERLAP_SENTENCES = 1;

const SENTENCE_RE = /[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g;

const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

function splitSentences(text) {
  const flat = text.replace(/\s+/g, ' ').trim();
  const parts = flat.match(SENTENCE_RE) || [flat];
  return parts.map((s) => s.trim()).filter(Boolean);
}

function chunk(text) {
  const sents = splitSentences(text);
  const chunks = [];
  let start = 0;

  while (start < sents.length) {
    let end = start;
    let count = 0;
    while (end < sents.length) {
      const w = words(sents[end]);
      // Always take at least one sentence, even if it alone exceeds the budget.
      if (count > 0 && count + w > MAX_WORDS) break;
      count += w;
      end += 1;
    }
    chunks.push({ text: sents.slice(start, end).join(' '), words: count });
    if (end >= sents.length) break;
    start = Math.max(start + 1, end - OVERLAP_SENTENCES);
  }
  return chunks;
}

const out = [];

for (const item of $input.all()) {
  const { sourceUrl, lang, content } = item.json;

  if (typeof content !== 'string' || content.trim() === '') {
    // Fail loudly here instead of writing an empty Notion page downstream.
    throw new Error(
      `Empty transcript for ${sourceUrl} (lang=${lang}) - stopping before the LLM call.`
    );
  }

  const chunks = chunk(content);

  chunks.forEach((c, i) => {
    out.push({
      json: {
        sourceUrl,
        lang,
        chunkIndex: i,
        chunkCount: chunks.length,
        words: c.words,
        text: c.text,
      },
    });
  });
}

return out;

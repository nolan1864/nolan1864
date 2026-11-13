// n8n Code node: "Validate output" (Mode: Run Once for All Items)
// Input : { text } from the merge LLM call
// Output: exactly the fields the Notion node maps
//
// The merge prompt asks for JSON. Models still wrap it in a markdown fence or
// return prose when they get confused, and the Notion node would happily write
// an empty page in that case. So: strip the fence, parse, then enforce minimum
// shape. A bad answer fails the execution instead of creating a bad note.

const sourceUrl = $('Prepare input').first().json.sourceUrl;
const lang = $('Prepare input').first().json.lang;

const fence = String.fromCharCode(96).repeat(3);

let raw = String($json.text || '').trim();
if (raw.startsWith(fence)) raw = raw.slice(fence.length).trim();
if (/^json/i.test(raw)) raw = raw.slice(4).trim();
if (raw.endsWith(fence)) raw = raw.slice(0, -fence.length).trim();

let parsed;
try {
  parsed = JSON.parse(raw);
} catch (e) {
  throw new Error('Model did not return valid JSON: ' + raw.slice(0, 200));
}

const title = String(parsed.title || '').trim();
const summary = String(parsed.summary || '').trim();
const takeaways = Array.isArray(parsed.takeaways)
  ? parsed.takeaways.map((t) => String(t).trim()).filter(Boolean).slice(0, 5)
  : [];

if (title.length < 8 || summary.length < 80 || takeaways.length < 2) {
  throw new Error(
    `Rejected model output (title=${title.length} chars, summary=${summary.length} chars, takeaways=${takeaways.length})`
  );
}

return [
  {
    json: {
      title: title.slice(0, 200),
      sourceUrl,
      lang,
      summary,
      takeaways: takeaways.map((t) => '• ' + t).join('\n'),
      processedAt: new Date().toISOString(),
    },
  },
];

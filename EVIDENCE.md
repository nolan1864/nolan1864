# Evidence capture checklist

What the post still needs, in the order that takes the least time. Everything here
is a real run against real credentials — the point is that the screenshots and the
recording are of the same execution, so a reviewer can cross-check timestamps.

Pick one video you actually want notes on, and use it for all three artifacts.
A 10–20 minute talk is a good target: long enough to produce several chunks, short
enough to record without editing.

Record the video title, URL and duration here first, then keep them consistent:

- Video: `<title>` — `<url>`
- Date of run:

## 1. Canvas screenshot (`evidence/canvas.png`)

1. Open the imported workflow in the n8n editor at 100% zoom so all 18 nodes fit.
2. Select `Supadata: request transcript` so its parameter panel is open, showing
   the URL, `url`/`lang`/`text`/`mode` query parameters and the credential name.
3. Make sure the credential **name** is visible but no key value is.
4. Capture the full window (canvas + panel). Two useful extra crops:
   - `evidence/supadata-node.png` — the node panel alone
   - `evidence/chunk-loop.png` — the chunk loop and its batch setting
5. Redact: the n8n instance URL in the address bar, any email/avatar, and the
   Notion database ID.

## 2. Notion page screenshot (`evidence/notion-page.png`)

1. Run the workflow once from the form and wait for the page to appear.
2. Open the page and capture: title, `Source URL` (so it matches the video above),
   `Language`, `Processed`, and the full summary plus takeaways.
3. Include the database view behind it if the fields are collapsed — reviewers
   should see it is a real database row, not a pasted document.
4. Redact: workspace name and any other rows if they contain personal data.

## 3. Recording or GIF (`evidence/run.gif`, ≤ 15s)

Cheapest path is a screen recording trimmed with ffmpeg rather than a live GIF
capture:

```bash
# record ~40s: paste link -> submit -> execution finishes -> Notion entry appears
ffmpeg -i raw.mov -vf "fps=12,scale=1280:-1:flags=lanczos" -t 15 evidence/run.gif
```

What has to be visible, in order:

1. The form with the URL pasted (and the URL still legible).
2. Submit, then the execution list showing the new execution running.
3. The execution graph with the Supadata node green.
4. Switching to Notion and the new row appearing, with the same title.

If you cut the waiting time, say so in the caption. `Wait 5s` and a slow model
call are the honest parts of the recording; a jump cut labelled as one is fine.

## 4. Workflow export (`workflow.json`)

Already committed and already key-free, but verify the export you attach is the
one you ran:

```bash
# after re-exporting from n8n
node -e 'const w=require("./workflow.json");console.log(w.nodes.length, "nodes")'
grep -Ei "sk-|secret|ntn_|x-api-key\s*:" workflow.json || echo "no secrets found"
```

Then confirm import in a clean state: **Workflows → Import from File** on a second
instance (or after deleting the workflow), select credentials, and check that no
node shows a red credential warning.

## 5. Numbers to quote in the post

After the run, fill these into the post's verification table — they are the things
a reviewer cannot get from the JSON:

- transcript language returned by Supadata (and whether it matched `en`)
- transcript length (characters/words) and number of chunks produced
- wall-clock runtime of the execution
- whether the page was created on the first attempt or after a retry

## Do not

- Do not post a canvas screenshot from a template or a re-created mock-up.
- Do not crop out the execution ID or timestamp; that is the only way the
  screenshot ties to a run.
- Do not commit `.n8n` execution dumps or `pinData` containing real transcripts.

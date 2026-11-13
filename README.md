# nolan1864

Paste a YouTube or TikTok link → Supadata transcript → LLM summary → Notion page.

- Build write-up: [post.md](post.md)
- n8n workflow export: [workflow.json](workflow.json)
- Code-node sources + offline tests: [code/](code) (`node code/chunk-transcript.test.js` and friends)
- Evidence still to capture: [EVIDENCE.md](EVIDENCE.md)

Import `workflow.json`, add three credentials (Supadata header auth, OpenAI, Notion),
and set the Notion database ID. See "Running it" in [post.md](post.md).

[![Powered by Supadata](https://supadata.ai/badge/powered-by-supadata-light.svg)](https://supadata.ai/r/J3B5DNPQ)

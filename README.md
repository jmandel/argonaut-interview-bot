# permission-ticket-ai-app-2

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

Configuration:

```bash
cp .env.example .env
```

The app currently uses these model env vars:

- `CHAT_MODEL` for the live interview
- `ANALYSIS_MODEL` for per-conversation analysis
- `SYNTHESIS_MODEL` for cross-interview synthesis

`INCREMENTAL_MODEL` is not used by the current codebase and is no longer needed.

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

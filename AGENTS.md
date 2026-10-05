<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Deckforge

AI presentation builder (prompt → outline → themed cards). See README.md for the architecture.

- AI calls live in `src/lib/ai.ts` behind the `CallModel` type so tests run without the API.
- Before pushing: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- UI work: follow `DESIGN.md` (brand decisions override generic design advice). Project skills in
  `.claude/skills`: `design-taste-frontend` and `image-to-code` (taste), `web-design-guidelines`
  (Vercel's checklist for reviews), `playwright-cli` (drive a real browser to check changes).

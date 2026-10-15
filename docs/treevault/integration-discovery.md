# TreeVault integration discovery

Inspected 15 October 2026, before implementation.

- Existing Next.js 14 App Router, React 18, TypeScript strict mode; `@/` maps to repository root. Main-site routes share `app/(main)/layout.tsx`.
- `/tools/shareit` is the existing tool convention. TreeVault mounts at `app/(main)/tools/treevault/page.tsx`; no router or framework migration.
- Existing Tailwind theme tokens, Button component, responsive main layout are reusable.
- Node route handlers under `app/api`, server-side environment variables in `.env.example`. No existing owner authentication (Tina administration is separate).
- Vercel runs `yarn build` (Tina then Next), region iad1; filesystem is not durable. Yarn lockfile retained, no new packages required.
- Existing tests use Node test runner with TypeScript transpilation. Follow that convention for domain, API and mocked Git integration tests.
- Implementation paths: `lib/treevault/{domain,store,api}.ts`, `components/tools/treevault/TreeVault.tsx`, the route and catch-all API handler, `tests/treevault*.test.mjs`, and `docs/treevault/`.
- Minimal owner gate: HTTP Authorization Basic credentials verified server-side on every request, held only in browser component memory. All workspace/history endpoints require this gate, except loopback-only development fixture mode. No public anonymous production fixture fallback.
- Git adapter: server-configured private repository, dedicated branch, fixed `workspace.md`. Use Git Data objects plus non-forced ref update for commit-level optimistic concurrency, including unrelated branch commits. Reject deployment repository when its Vercel identity is available; additionally require explicit deployment repository configuration in production.
- History: immutable commits reachable from configured data branch; Asia/Kolkata day boundaries. Local in-memory fixture is explicitly ephemeral.
- Blockers to deployed acceptance: no data repository, owner credentials, GitHub token or Vercel preview linkage supplied. Implement and test locally; document deployment steps and do not claim remote persistence or deployment verification.

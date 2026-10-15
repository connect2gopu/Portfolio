# TreeVault setup and handoff

## Try locally

Use the existing Node/Yarn toolchain (Node 24 was used for verification):

```sh
yarn dev
```

Open `http://localhost:3000/tools/treevault`. With no TreeVault Git token, loopback development uses an in-memory fixture, identified by a visible banner. It resets on process restart and is never used on Vercel or in production. `yarn dev:lan` supports the page but anonymous fixture data is restricted to loopback hosts; use localhost for the demo.

1. Import a nested two-space-indented Markdown list and Save revision to establish IDs.
2. Edit a deep node. Enter adds a sibling; Shift+Enter adds a continuation; Tab/Shift+Tab changes nesting. The node menu adds children, reorders, changes checkbox kind and deletes leaves.
3. Save, refresh, and check the hierarchy. Preview renders safe inline Markdown and clickable links.
4. History: select an immutable revision or a Kolkata date. The whole outline is read-only; its actual SHA/time and earlier-day fallback are shown. Export either current draft or historical source.
5. Compare: choose two explicit commits, then compare text, checkbox, move, reorder, addition and removal badges in their ancestor context. Reveal unchanged branches or inspect change details and original Markdown.
6. Open two tabs before saving. Save in one, then save in the other. The second receives 409, keeps its draft and offers export. Export before deliberately discarding/reloading for manual reconciliation.

## Durable Git configuration

Create a **private data repository distinct from connect2gopu**. Initialize a dedicated `treevault` branch with a UTF-8 `workspace.md` containing an empty file or supported nested list. Do not add a deployment hook for this notes repository. The adapter intentionally does not create repositories, initialize branches or import into the application's Git history.

Create a fine-grained GitHub token scoped only to this data repository with Metadata read and Contents read/write. Configure these server-only environment variables in local `.env.local` or the existing Vercel project's Preview/Production settings:

| Variable | Value |
| --- | --- |
| `TREEVAULT_DATA_REPOSITORY` | `owner/private-notes` |
| `TREEVAULT_DATA_BRANCH` | `treevault` |
| `TREEVAULT_CODE_REPOSITORY` | Actual `owner/connect2gopu` deployment repository; must differ from data repo. Can fall back to Vercel's repository identity when available. |
| `TREEVAULT_GITHUB_TOKEN` | Fine-grained private-repository token |
| `TREEVAULT_OWNER_PASSWORD` | High-entropy random secret, minimum 24 characters |

Generate the owner password with a password manager or `openssl rand -hex 24`. The UI asks only for that password (server username is fixed to `owner`). Use HTTPS. Credentials stay in component memory and must be re-entered on refresh. Rotate the password/token in environment settings and redeploy to revoke access. No credentials should be added to source control or prefixed with NEXT_PUBLIC_.

Deploy through the existing Vercel project and existing `yarn build`. The existing Tina CMS build also requires its own valid `TINA_TOKEN` and client configuration; TreeVault does not replace that setup. Set all TreeVault variables on Preview too; a preview with missing variables fails closed.

After deploying, validate `/tools/treevault`, unauthorized API rejection, import/save, refresh in a second browser, date history and a two-tab conflict. Redeploy the same code and confirm saved data still loads. Data writes update the dedicated data branch and do not deploy the application.

No deployment was performed in this implementation session: no configured data repository, owner secret, Git token or Vercel project linkage was supplied. Actual remote durability (AC02/AC09) remains to be verified after configuration. Git behavior was exercised against a mocked provider, including concurrent branch updates, private-repository enforcement and inaccessible revisions.

## Verification commands

```sh
yarn test
yarn lint
yarn tsc --noEmit
yarn build
# Without a cloud Tina token, verify with local Tina data:
TINA_PUBLIC_IS_LOCAL=true yarn tinacms dev -c 'NODE_ENV=production next build'
```

Optional browser test: `tests/treevault-browser.mjs` uses Playwright and installed Google Chrome. Supply an external Playwright installation path as `TREEVAULT_PLAYWRIGHT_MODULE` if it is not locally installed. It runs against `TREEVAULT_TEST_URL` (default `http://localhost:3015`) and requires the local unauthenticated fixture, not production. Start the existing dev command on that port:

```sh
TINA_PUBLIC_IS_LOCAL=true yarn tinacms dev -c 'next dev --port 3015'
TREEVAULT_PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/treevault-browser.mjs
```

The browser script imports synthetic data and creates local fixture revisions; do not run it against your real notes workspace.

Screenshots: [Today](screenshots/today.png), [History](screenshots/history.png), [Compare](screenshots/compare.png), [Mobile](screenshots/mobile.png).

## Recovery

A failed save never marks a submitted draft saved. Keep the page open, export its Markdown and retry Save revision. For a 409, export first, deliberately reload latest, reconcile manually and import/save the merged outline as a new revision. No silent merge or overwrite is performed. If the provider is unavailable, original Git history remains authoritative. Regularly export workspace.md and mirror the private data repository to an independent backup; test restoring that repository before relying on it for critical notes.

## POC limits and deferred work

- Manual saves/checkpoints only; no autosave, scheduling, automatic merge, drag/drop, custom undo/redo or offline persistence. Checkpoints reuse unchanged commits, without a separate day marker. History reports the actual recorded day.
- Kolkata timezone is fixed. Other timezone requests fail explicitly.
- Supported nested Markdown subset, conservative inline preview, 101 levels and 300,000 characters. Unsupported constructs fail closed; there is no general rich-text/HTML renderer.
- Compare selects explicit revisions rather than dates; use History for date resolution. Original before/after source is available, without a unified line-diff renderer. All six tree change classes are implemented.
- Minimal high-entropy owner gate, no multiuser identities, login sessions, password recovery or distributed login rate limiter. Production uses server-verified credentials and HTTPS; use existing edge controls if additional rate limiting is needed.
- No P1/P2 collaboration, AI rewriting, indexed search or Obsidian sync.

## Changed files

- Existing files: `.env.example`, `package.json` (test script), `components/layout/{Header,Navigation}.tsx` (tool links).
- Routes: `app/(main)/tools/treevault/page.tsx`, `app/api/tools/treevault/[[...action]]/route.ts`.
- Module: `lib/treevault/{domain,store,api}.ts`, `components/tools/treevault/TreeVault.tsx`.
- Verification: `tests/treevault-{loader,domain.test,storage.test,browser}.mjs`.
- Documentation: `docs/treevault/{integration-discovery,architecture,operations,acceptance}.md` and screenshot PNGs.

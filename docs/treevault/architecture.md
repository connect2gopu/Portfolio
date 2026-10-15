# TreeVault POC architecture

TreeVault is mounted in the existing main-site layout at `/tools/treevault`. The client uses React and existing Tailwind tokens and Button styles. Server handlers run on the Node Vercel runtime at `/api/tools/treevault/*`; every response is private/no-store. There are no added packages or lockfile changes.

## Boundaries

- `lib/treevault/domain.ts`: pure model, import parser, serializer, outline operations, identity-aware comparison and Kolkata day resolution.
- `lib/treevault/store.ts`: versioned storage interface, development fixture and private GitHub adapter.
- `lib/treevault/api.ts`: owner authorization, origin/body/input validation, immutable revision handling and errors.
- `components/tools/treevault/TreeVault.tsx`: editable outline, preview, save/checkpoint, import/export, full history and contextual before/after comparison.
- `app/(main)/tools/treevault/page.tsx` and `app/api/tools/treevault/[[...action]]/route.ts`: App Router integration. Navigation entries in the existing Header and Navigation.

## Markdown and identity

Nodes use hidden `<!-- tv:id=... -->` metadata. Imports without IDs receive deterministic IDs derived from the entire original source plus line number. Save the import to establish its baseline. IDs thereafter survive all edits and moves. Duplicate or malformed metadata fails closed. Older snapshots without complete IDs are readable but comparison explicitly reports uncertainty and displays original Markdown instead of claiming exact moves.

Supported grammar: nested unordered lists with two-space indentation, optional checkbox markers, inline text/links/emphasis/code, and indented continuation lines. Unsupported block syntax is rejected before replacing the outline. Literal HTML is preserved as source and escaped in preview; only http, https and mailto links become anchors. The inline renderer intentionally supports a conservative subset; original source remains available through export. Serializing validates semantic round-trip equality before accepting edits, preventing ambiguous multiline labels from becoming new nodes.

Practical safety limits are 300,000 UTF-16 characters and 101 nesting levels (root plus depth 100). This is arbitrary nesting within a bounded document, without project/task schemas. Deleting a node with descendants is blocked. Parent checkboxes do not propagate. Expand/collapse is visual only. A checkpoint reuses an unchanged head; it does not invent a daily revision or day marker.

## Git writes and concurrency

Server configuration fixes the repository, branch, and path `workspace.md`. Validate the repository is private before access, and reject the configured deployment repository. The deployment repository identity must be set explicitly or available from Vercel's Git environment variables. Keep the data branch dedicated to TreeVault.

Read branch head, compare baseRevision (commit SHA), create a blob, overlay exactly workspace.md on the old tree, create a single-parent commit, and update the branch with `force:false`. Concurrent saves create divergent child commits, so only one ref update succeeds. Return 409 to the loser; unreachable objects can be garbage collected by GitHub. A blob-only concurrency check would miss branch-level changes, which is why this implementation uses the Git Data API. No-op saves do not create commits.

Historical SHAs must be immutable 40-character hexadecimal strings and ancestors of the configured branch. History is paginated (50 per page); date resolution uses GitHub's until filter on that branch/path, independent of the loaded UI page. October 13 in Kolkata resolves at `2026-10-13T18:29:59.999Z`. The full file at the resolved commit is rendered. The UI always displays actual SHA and commit time, distinguishing earlier-day fallback.

See [GitHub Git Data documentation](https://docs.github.com/en/rest/guides/using-the-rest-api-to-interact-with-your-git-database) for object and ref semantics.

## Authentication and failure behavior

The minimal POC owner gate verifies Basic Authorization on every data endpoint using a timing-safe digest comparison. Username is `owner`; use a high-entropy random password and HTTPS in production. The browser holds credentials only in component memory, cleared by refresh. No Git credential ever crosses the API. Authorization uses an explicit header; there is no authentication cookie. Cross-origin writes are rejected. No automatic retry of mutations occurs.

Only development on loopback without Git configuration enables the explicitly ephemeral fixture. Vercel and production never fall back to in-memory storage. Errors omit upstream payloads and credentials. Failed saves preserve component state and expose draft export; beforeunload warns on a dirty draft. No persistent offline cache, merge automation or silent autosave is provided. Editing may continue while a save is in flight; only the submitted draft is marked saved when the server succeeds.

# Product Requirements Document — TreeVault

**Version:** 1.0  
**Date:** 15 October 2026  
**Status:** Ready for coding-agent discovery and POC implementation  
**Product URL:** `https://connect2gopu.in/tools/treevault` (working name; route slug configurable)  
**Deployment:** Existing `connect2gopu` application on Vercel  
**Implementation strategy:** POC → Production MVP → Full Product

---

## 1. Executive summary

TreeVault is a **Git-versioned, arbitrarily nested Markdown outliner** with **point-in-time full-workspace reconstruction** and **tree-aware diffs**. It is not a conventional task planner, Kanban board, project database, or list of dated copies.

The user works in a *single living outline*. Every node can contain a checkbox, free-form Markdown, links, and any number of nested children. Nodes can be added, edited, checked, unchecked, removed, reordered, or moved at any depth. The app saves new revisions and can reconstruct **the full outline**, including unchanged nodes and the original nesting, as of a selected recorded point in time. A comparison view highlights both content changes and structural changes, such as reparenting.

**Primary UX:** Open `/tools/treevault` → continue editing the latest outline exactly where you left off → save or autosave → inspect a previous day via a date picker → compare two versions.

**Hard boundary:** Build this *inside the existing connect2gopu codebase as a module*. Do **not** scaffold an unrelated standalone site, replace the routing system, or migrate the rest of the application merely to support this tool.

## 2. Problem and job-to-be-done

### Current workflow

Each day, the user duplicates the previous day's complete outline, updates a small subset of entries, and keeps the old dated copy. About 80% of the content is carried forward unchanged. Over time this creates storage, navigation, and maintenance overhead. Current notes contain meaningful nesting, working context, questions, completion states, external links, and decisions.

### Jobs to be done

1. **Daily continuation:** “When I return today, show me the latest whole outline; do not make me copy yesterday.”
2. **Context-preserving editing:** “Let me make a change at any depth, without converting my notes into rigid task records.”
3. **Historical state:** “Show me the entire outline exactly as it was at the end of October 13, including untouched branches.”
4. **Historical comparison:** “Between October 13 and 15, show me not only changed text but newly nested children, checkbox transitions, moves, and deletions.”
5. **Long-term ownership:** “Keep data in portable Markdown and preserve version history without locking it into proprietary UI state.”

## 3. Product principles and explicit non-goals

### Principles

- **Outline first, not task first.** A node might be a project, question, decision, task, finding, link, note, or arbitrary context.
- **Arbitrary depth.** No fixed project → task → subtask schema.
- **Same editing affordances at every depth.** Every node may have children and may itself be changed.
- **Parent checkbox independence.** Checking a parent does **not** implicitly change children; checking all children does not automatically check the parent.
- **One current state; many past revisions.** Dates select recorded versions, not separate daily documents.
- **Faithful history.** Historical state renders committed source, not AI-inferred or reconstructed prose.
- **Markdown remains exportable and human readable.** Internal identity metadata must not destroy ordinary Markdown editing.
- **Data repository and code repository are distinct.** User notes must not be written into the Vercel application's deployment branch.

### Explicit non-goals for POC

- Notion-style property databases, Kanban, deadlines, reminders, calendars, assignees, automation rules, or collaboration.
- AI-based rewriting, automatic summarization, and inferred completion status.
- Native Obsidian plugin; this is **a web module in connect2gopu**, not an Obsidian dependency. Obsidian compatibility is an interoperability goal.
- Realtime collaboration, offline cross-device conflict resolution, full-text indexing, public sharing, and multi-tenant SaaS billing.
- Perfect round-trip support for every exotic Markdown extension; preserve unsupported syntax rather than silently discarding it.

## 4. User and deployment context

- Initial user: single authenticated owner, using desktop web most often; mobile viewing is desirable.
- Domain: `connect2gopu.in`.
- Exact public route: `/tools/treevault` (changeable configuration constant).
- Hosting: Vercel, **inside the current repository/build**.
- Existing framework, router, authentication, CSS system, and package manager: **must be inspected in the actual repository, not assumed**.
- Avoid new workspaces/monorepo migration solely for this feature. Reuse existing dependencies/design conventions where practical.
- Use the existing Yarn lockfile if present; do not rewrite the lockfile or package manager needlessly.

### Mandatory repository-discovery step for coding agent

Before writing code, inspect `package.json`, repository tree, route conventions, styling/UI library, authentication, environment-variable strategy, API/server capabilities, deployment configuration (`vercel.json`, framework config), test setup, and existing `/tools` pages. Create a brief `docs/treevault/integration-discovery.md` documenting observations, decisions, and any blockers. Follow the discovered architecture.

**Illustrative paths, not requirements:**

- Next.js App Router: `app/tools/treevault/page.tsx` plus an isolated module under `src/features/treevault/`.
- Next.js Pages Router: `pages/tools/treevault.tsx` plus `src/features/treevault/`.
- React + React Router/Vite: existing `/tools/treevault` route plus `src/features/treevault/` and an API adapter consistent with existing backend deployment.

Do not introduce Next.js, a new server, or a new routing configuration if the existing codebase uses something else and can support the requirements.

## 5. Core user experience

### 5.1 Today mode (primary)

Header:

`TreeVault   [Today] [History] [Compare]   [Saved · 10:42]   [Checkpoint]`

Below it: a **single continuous, editable tree**. Preserve original order, indentation, checkboxes, link text, and multiline content. The editor should resemble a lightweight document outliner, not a task dashboard.

Example based on actual working structure (representative):

```text
15 Oct 2026 · Current workspace                      Saved ✓

▾ ☐ Location — #1968
    ☑ approval — got
    ☑ proceed with processing — no need to store
    ☐ Discuss with Durges and Gaurav for device quantity
    ☑ Checking demo with vendors
    ☐ Order the items — then raise approval
    ☐ Look for app based solution
        ☐ Our own app or 3rd party

▾ ☐ credit debit — #1969
    ☑ understanding — done
    ☑ plan of action — done
    ☐ Credit notes plan
    ☐ started working
        ☐ Credit note sync done
            ☐ Get reviewed from Vineet
        ☐ Debit — backlog

▾ ☐ Lambda SSM Caching — #1989
    ☐ Explore best practices around reducing SSM usage from Lambdas

▾ ☐ Sentry tracing — #1986
    ☐ prod risk
    ☐ Checked — projected error volume 30k/50k; no action required
```

The date in the header represents the viewing context. **Do not persist a new dated heading inside the underlying Markdown on each day**. The workspace's root content remains the living outline.

### 5.2 History mode

- Date picker and optional revision selector.
- Default time zone is `Asia/Kolkata`, configurable per user later.
- Choosing `2026-10-13` means **last successfully recorded checkpoint at or before 2026-10-13 23:59:59.999 in configured timezone**.
- Show the exact resolved commit timestamp/hash and whether the revision was from that date or an earlier date. Never falsely claim an exact-day checkpoint exists.
- Render the **whole historical tree** read-only, not just changed entries; preserve deep nesting and checkbox states.
- Provide “Back to Today”; never overwrite the current workspace simply by viewing history.

### 5.3 Compare mode

- Choose start and end revisions or dates.
- Display nested diff in contextual tree, retaining unchanged ancestors of changed nodes.
- Node badges / highlights: **Added**, **Removed**, **Text edited**, **Checkbox changed**, **Moved/Reparented**, **Reordered**.
- Ability to reveal unchanged branches, view raw Markdown diff, and inspect before/after text for edited nodes (advanced comparison can be P1 if POC uses raw diff fallback).
- A date comparison always resolves to *two explicit immutable revisions* before diffing.

### 5.4 Interaction model

- Enter: add sibling after current node.
- Tab: indent one level (when valid).
- Shift+Tab: outdent.
- Backspace on empty node: remove/merge with predictable rules; never silently delete descendants.
- Click checkbox: toggle **only that node**.
- Expand/collapse: visual only, not a persistent structural change.
- Drag/drop or keyboard commands: reorder or reparent (P1 if robust keyboard editing is more feasible for POC).
- Editing a label preserves children, IDs, and links.
- Ordinary link clicks may navigate; editing should not inadvertently navigate away.
- Show visible save status and retry/error feedback.

## 6. Data model and Markdown contract

### 6.1 Canonical model

```ts
interface OutlineNode {
  id: string;                 // stable opaque ID, independent of text/path
  text: string;               // inline Markdown, preserving original content
  checked: boolean | null;   // null = non-checkbox node
  children: OutlineNode[];   // arbitrarily nested
  // optional future fields; no required task/status schema
}
interface WorkspaceRevision {
  commitSha: string;
  committedAt: string;        // ISO timestamp
  timezone: string;
  markdown: string;
}
```

**Sibling order and parent-child edges are part of state.** A node's human-readable text is not its identity.

### 6.2 Markdown serialization

Canonical storage for POC: one `workspace.md` in a dedicated private **data** Git repository, not the app code repository. Use standard Markdown nested list syntax with 2-space indentation per level and Git-friendly formatting. Support `- [ ]`, `- [x]`, and non-checkbox `-` nodes. Markdown links must round-trip.

Example:

```markdown
- [ ] Location - [1968](https://example.invalid/ticket/1968)
  - [x] approval - got
  - [ ] Look for app based solution
    - [ ] Our own app or 3rd party
- [ ] credit debit - [1969](https://example.invalid/ticket/1969)
  - [ ] started working
    - [ ] Credit note sync done
      - [ ] Get reviewed from Vineet
```

The `example.invalid` URL is illustrative: import actual links unchanged; never guess ticket URLs.

### 6.3 Stable identity strategy

**Required:** Stable node IDs for moves/renames/reparenting in tree-aware diffs. POC recommendation: encode each ID in a minimal Markdown-compatible HTML comment on the node line, e.g.:

```markdown
- [ ] Location <!-- tv:id=01J... -->
  - [ ] Look for app based solution <!-- tv:id=01K... -->
    - [ ] Our own app or 3rd party <!-- tv:id=01L... -->
```

Parser must strip/display metadata invisibly in the editor and re-emit without changing IDs. This enables a single self-contained, Git-versioned source file and avoids out-of-sync sidecars. Alternative ID approaches are acceptable only if the agent documents their trade-offs and proves history survives reorder/reparent/rename.

Requirements: duplicate ID detection; deterministic generation on import; preserve existing IDs on edit; no two distinct nodes may share an ID. When importing old Markdown without IDs, assign IDs once, save a baseline commit, then preserve them thereafter. If importing independently evolving historical snapshots with no IDs, **do not pretend move detection is exact**; show best-effort matching confidence or raw diff.

### 6.4 Format limitations / data safety

- POC supports nested list items, links, emphasis, inline code, inline text, checkbox markers, and line continuation where feasible.
- POC may reject malformed or unsupported complex Markdown with an actionable error instead of destructively rewriting it.
- Round-trip tests must prove no dropped nodes, URLs, hierarchy, checkbox state, or text.
- Sanitize rendered Markdown and links to prevent XSS; no raw HTML execution.
- Maintain import/export of original human-readable Markdown.

## 7. Storage and Git architecture on Vercel

### 7.1 Critical design constraint

Vercel Functions have read-only deployed filesystem with temporary scratch storage. **Never treat a checked-out Git working directory inside a Vercel function as durable user storage.** Use a private Git repository accessed via a server-side Git provider API; keep credentials server-side. The data repository is independent of the Vercel deployment repository, so note updates do not cause site redeployments.

### 7.2 POC backend

Create a storage interface, e.g.:

```ts
interface VersionedWorkspaceStore {
  readHead(): Promise<{ markdown: string; revision: string }>;
  commitMarkdown(input: { markdown: string; baseRevision: string; message: string }): Promise<{ revision: string }>;
  listRevisions(cursor?: string): Promise<RevisionSummary[]>;
  readRevision(sha: string): Promise<{ markdown: string; revision: string; committedAt: string }>;
}
```

Implementation for first deployed POC: `GitHubWorkspaceStore` using GitHub API and a **private repository**, a dedicated data branch, and a fine-grained token or GitHub App credential scoped only to that repository. A local in-memory fixture store supports dev/test/demo without secrets. Do not expose Git credentials to browser, logs, error payloads, or built assets.

For one-file updates, GitHub's contents endpoint can commit with the current blob SHA; preserve optimistic concurrency. For future multi-file atomic revisions, migrate the adapter to the Git Data API (blobs/trees/commits/ref updates). Git object storage is the version history; do not duplicate full dated Markdown files in the app.

**Never** accept arbitrary repository names, paths, refs, or GitHub URLs from the client. Allowlist configuration server-side; validate immutable SHA inputs for historical reads. Restrict mutations to the configured file and branch. Serialize writes / use optimistic concurrency; return an explicit `409 Conflict` on stale base revisions rather than silently overwriting another edit.

### 7.3 API contract (adapt to existing framework)

- `GET /api/tools/treevault/workspace` → latest Markdown, head revision, resolved timestamp.
- `PUT /api/tools/treevault/workspace` with `{ markdown, baseRevision, message? }` → saves new revision or `409`.
- `GET /api/tools/treevault/history?cursor=...` → revision summaries.
- `GET /api/tools/treevault/revision/:sha` → exact Markdown at immutable revision.
- `GET /api/tools/treevault/resolve?date=YYYY-MM-DD&tz=Asia/Kolkata` → latest revision before end-of-day; include provenance.
- `GET /api/tools/treevault/diff?from=<sha>&to=<sha>` → tree-aware diff (or raw-diff fallback in first slice).

API routes are illustrative; follow the app's existing route and API conventions. No anonymous write access; POC may use existing site auth or a secure authenticated owner gate. **A publicly deployed writable editor without access control is not acceptable.** If there is no existing auth, implement minimal server-verified owner authentication before public deployment; local fixture mode remains available without GitHub access.

### 7.4 Saving/checkpoints

Define two distinct operations:

- **Save revision:** commits changed Markdown; can be manual for initial POC. Do not create empty commits if nothing changed.
- **Daily checkpoint:** ensure an immutable end-of-day state is recorded. POC may expose a manual “Checkpoint” button. Production can schedule an automatic final daily checkpoint in the user's timezone, with idempotency and retries; if content is unchanged and head already represents the state, a redundant commit is unnecessary. Persist/associate a day marker if needed to distinguish *recorded checkpoint* from *nearest earlier revision*.

Initial POC should prioritize reliable manual commits over an unreliable silent autosave. Production autosave must debounce safely and prevent out-of-order commits. If remote storage fails, the UI must retain the unsaved text in its current session, clearly indicate the failure, and offer retry/export rather than report success.

## 8. Semantic tree diff specification

### Types

```ts
type Change =
  | { type: 'added'; nodeId: string; parentId: string | null; index: number }
  | { type: 'removed'; nodeId: string; oldParentId: string | null }
  | { type: 'edited'; nodeId: string; before: string; after: string }
  | { type: 'checkbox'; nodeId: string; before: boolean | null; after: boolean | null }
  | { type: 'moved'; nodeId: string; fromParentId: string | null; toParentId: string | null }
  | { type: 'reordered'; nodeId: string; beforeIndex: number; afterIndex: number };
```

### Matching and rendering rules

- Match nodes by stable ID, never by label alone.
- Compare node text, checked state, parent ID, and sibling order independently.
- A newly added subtree can be summarized as one parent addition with expand-to-see-descendants; avoid counting each child twice in summaries.
- Edits at depth 9 must be reported correctly and rendered in parent context.
- Renaming a node must **not** appear as remove + add.
- Reparenting a node must appear as **move**, preserving its children, rather than disappearance + re-addition.
- Full snapshots preserve the precise tree independent of diff view.
- For duplicate IDs, invalid input, or incomplete legacy IDs, fail closed or mark uncertain; never fabricate precision.

POC may implement the **data-level tree diff** before a polished in-tree visual diff. P1 is responsible for elegant interactive comparison.

## 9. POC scope (Phase P0)

### Must ship

1. `/tools/treevault` route mounted **within the existing connect2gopu application**.
2. Responsive, single-document nested outliner with add/edit/check/delete/indent/outdent at arbitrary depth; reorder/move may start with keyboard/button controls.
3. Markdown parse/serialize with stable IDs, links, checkbox states and non-checkbox nodes.
4. Private Git-backed persistence to a separate notes repository; explicit save/checkpoint and conflict handling.
5. Latest workspace reload after refresh and on a second browser/device.
6. History date picker with accurate end-of-day resolution and full read-only historical tree.
7. Basic Compare screen with structural change summary plus nested contextual diff or, if necessary initially, faithful raw Markdown diff while tree-diff engine runs behind it.
8. Import legacy pasted nested Markdown; export latest and historical Markdown.
9. Owner-only protection for write and history APIs.
10. Automated tests for parsing, deep edit/move, serialization, revision resolution, and diffs.
11. Dedicated route must work on Vercel production and preview without breaking existing routes.

### May defer to P1

- Polished drag/drop, visual keyboard shortcuts, collapsible state persistence, node-focused history UI, rich Markdown editing, autosave, automatic day checkpointing, broad mobile editing support.

### POC done definition

A user can paste/import their Oct 15 outline with 4+ levels, save it, modify a deeply nested item, save another revision, retrieve either historical tree, and see the correct structural change. Reloading the public deployed route continues from the latest saved state, and data persists across Vercel deployments.

## 10. Production MVP (P1)

- Fast, keyboard-first editing with robust undo/redo, reorder and cross-branch moves.
- Collapsible branches, focus/zoom into node, breadcrumb to root, optional completion styling.
- Tree-aware diff UI, side-by-side and inline views, unchanged-ancestor expansion, node history.
- Debounced autosave, explicit successful commits, checkpoint scheduling, timezone configuration.
- Search/filter across visible node text without flattening permanently.
- Node backlinks and Markdown links that retain editability.
- Optimistic concurrency merge workflow when changes conflict; safe retry and export.
- Performance virtualization/efficient rendering for large trees; preserve cursor selection through edits.
- Accessible keyboard focus, screen-reader labels, contrast, mobile read-only/history usability.
- Observability for failed saves/history resolution (excluding sensitive note content).
- Security review and backups/export restore runbook.

## 11. Full product (P2)

- Multi-workspace support (each workspace with independent history/repo/branch/namespace).
- Multiuser roles, sharing, audit trail, tenant isolation where applicable.
- Optional AI-assisted natural-language updates at any depth with **review-before-apply** semantic preview and no silent edits.
- Fast indexed search and navigation across historical versions, temporal questions (“what changed this week?”).
- Scheduled exports and independent backups, retention policies, recovery testing.
- Integration connectors, including optional Obsidian local Markdown sync workflow.
- Optional offline editing with conflict-aware synchronization.
- Restore or fork historical versions into a **new revision** after explicit confirmation; never mutate immutable history.
- Product analytics that don't leak workspace content.

## 12. Example user flows

### Flow A — Daily edit at depth 4

1. Open Today, collapse Location, expand Credit/Debit.
2. Navigate `Credit/Debit → Started working → Credit note sync done → Get reviewed from Vineet`.
3. Change child label to `Reviewed by Vineet — 2 changes requested`.
4. Add a new child `Fix requested change 1` below it.
5. Save revision; UI reports immutable revision ID and time.
6. Hard refresh; hierarchy, checkboxes, text, and new child remain identical.

### Flow B — Historical date

1. Open History and select `2026-10-13`.
2. Server resolves timestamp in `Asia/Kolkata` to the most recent recorded revision on or before the end of that date.
3. Render complete tree and show `Resolved to commit abc... at ...`.
4. No edit controls operate while in history. Return to Today without changing head.

### Flow C — Compare

1. Select October 13 vs October 15.
2. Show a checkbox transition under Location, added app-solution child, changed Vineet call text, and nested credit sync/review additions.
3. Preserve unchanged root/ancestor branches in contextual view.
4. Raw Markdown diff available for fidelity checks.

### Flow D — Stale edit conflict

1. Two tabs load same head revision.
2. Tab A saves and advances head.
3. Tab B saves with its old `baseRevision`.
4. Server responds `409` and returns latest head metadata; UI keeps Tab B's unsaved draft and offers reload/compare/manual merge, never overwriting Tab A silently.

## 13. Acceptance criteria — testable

| ID | Acceptance criterion |
| --- | --- |
| AC01 | Existing site's homepage, current tools and unrelated routes pass smoke checks after integration. |
| AC02 | `/tools/treevault` serves from the existing deployment on Vercel. |
| AC03 | User can create a 10-level deep branch without flattening or losing parent links. |
| AC04 | Rename at depth 8 preserves node ID and all descendants. |
| AC05 | Checkbox toggle affects only its selected node, regardless of descendant state. |
| AC06 | Move/reparent at depth 4 preserves ID and child subtree. |
| AC07 | Markdown serialize → parse round-trip preserves IDs, checkbox, links, text, sibling order and full tree. |
| AC08 | Legacy Markdown import without IDs assigns unique IDs and yields a versioned baseline. |
| AC09 | Saved state survives browser reload, redeploy and new Vercel function instance. |
| AC10 | History on Oct 13 returns **all** existing nodes as of that revision, including those unchanged since Oct 12. |
| AC11 | If no revision exists on selected day, show actual earlier commit and timestamp, not fake day metadata. |
| AC12 | Historical view is read-only and cannot change head. |
| AC13 | Diff detects text edit vs add/remove through node identity. |
| AC14 | Diff detects checkbox change independently from text edit. |
| AC15 | Diff detects reparent/move and reorder, not just Markdown line changes. |
| AC16 | Deeply nested added descendant appears under its ancestor in context. |
| AC17 | Two concurrent edits with stale base cannot silently overwrite each other. |
| AC18 | Browser never receives Git write secret, and unsigned unauthenticated writes are rejected. |
| AC19 | Git commits write only to dedicated private data repository, never trigger deployment repository changes. |
| AC20 | Failed save shows error and allows recovery/export of unsaved changes. |
| AC21 | Unsupported Markdown is rejected safely or preserved, not silently stripped. |
| AC22 | Import/export is portable Markdown and can be inspected without TreeVault. |

## 14. Testing and quality strategy

- **Unit:** parse/serialize, IDs, whitespace, Unicode, links, checkbox independence, subtree operations, change classification, date/timezone boundaries.
- **Property-based:** randomly generated trees, round-trip invariants, move/rename identity preservation, no lost descendants.
- **Integration:** mocked Git provider, stale SHA conflict, auth denials, pagination of revisions, invalid ref/path, 404/429/500 retry paths.
- **E2E:** import sample → edit depth 4 → checkpoint → refresh → historical state → compare → return Today.
- **Security:** XSS injection in Markdown, secrets exposure, authorization, repository path/ref injection, API rate limiting, sensitive-data logs.
- **Performance targets POC (non-binding until measured):** render and navigate a 500-node outline interactively on a typical laptop; avoid O(n²) updates for each keypress. P1 stress test 5k+ nodes.

## 15. Suggested module boundaries (adapt to discovered repo)

```text
<existing-repository>/
  <existing app routes>/tools/treevault  # route according to repo framework
  src/features/treevault/
    components/       # OutlineEditor, TreeNode, HistoryPicker, CompareView
    domain/           # types, operations, tree diff
    markdown/         # parser, serializer, ID metadata
    services/         # workspace service, revision resolution
    storage/          # VersionedWorkspaceStore, GitHub adapter, fixture adapter
    hooks/            # editor state and optimistic save logic
    tests/
  docs/treevault/
    integration-discovery.md
    architecture.md
    operations.md
```

Feature dependencies should point inwards: view → domain/service → storage interface → Git provider implementation. Parser and diff should be pure, framework-agnostic TypeScript for easy testing. Reuse existing linting, imports, CSS tokens, testing, auth and runtime standards.

## 16. Implementation milestones / coding agent instructions

### Milestone 0 — Discover + design (do this first)

- Inspect real repository, confirm framework/routing, Vercel deployment, auth, existing tools design and runtime.
- Record integration approach and exact changed paths in `integration-discovery.md`.
- Confirm remote data Git repo configuration approach and local fixture fallback.
- Do not begin major UI development until architecture is compatible with current repository.

### Milestone 1 — Core outline domain

- Implement types, parser/serializer, stable IDs, tree operations and round-trip tests.
- Provide import fixture mirroring nested user data, including at least 4 depths and links.

### Milestone 2 — Integrated POC UI

- Add route and plain editable outliner with keyboard/button controls.
- Expose fixture mode for development and screenshots.

### Milestone 3 — Persistence and history

- Add private Git storage adapter, owner authorization, revision write/read, history resolver, save/conflict states.
- Deploy preview and validate persistence across function invocations.

### Milestone 4 — Diff and POC acceptance

- Implement tree-aware comparison engine and basic contextual UI; raw diff fallback where appropriate.
- Run AC01–AC22, explain any deferred items explicitly.
- Supply deployment/env setup guide, test commands, screenshots and concise handoff.

### Milestone 5 — P1 production MVP

- Add polished editing, autosave/checkpoints, node history, advanced compare, robustness, search and accessibility.

### Milestone 6 — P2 full product

- Add multi-workspace, optional AI review workflows, sync, advanced search and collaboration only after P1 reliability.

## 17. Decisions and open questions

### Decisions fixed for POC

- Use existing codebase; module route `/tools/treevault`.
- Web application, not Obsidian plugin.
- Single living outline, no daily duplicate documents.
- Deeply nested tree with independent checkbox status.
- Markdown canonical; Git versioned; read-only historical revisions.
- Separate Git data repo for user content, not the deployment repo.
- Private, owner-authenticated deployed workspace.
- No AI auto-modification in POC.

### Validate while inspecting repository

- Existing framework and API runtime / route naming.
- Existing authentication provider vs minimal owner gate.
- Best compatible nested editing library vs small controlled editor; do not invent a bespoke rich-text engine unnecessarily.
- GitHub App vs fine-grained token for dedicated data repository.
- Whether one file is sufficient for initial workspace size (POC yes; adapter must allow future decomposition).
- Existing ticket link formats to preserve verbatim.

## 18. Ready-to-paste AI coding agent brief

> Build **TreeVault** from this PRD in the **existing connect2gopu repository**. It must be reachable at `/tools/treevault` and use the repository's existing framework, package manager, components, styling, authentication and Vercel setup wherever possible. Do not create a standalone app or migrate the rest of the site. First inspect the repository and write `docs/treevault/integration-discovery.md`, explicitly identifying any missing architectural information. Implement POC milestones 1–4 only before starting P1/P2.
>
> The core product is a **single living arbitrarily nested Markdown outline**, not a conventional task manager. Changes at any depth must preserve stable node IDs, nesting, links, text and independent checkbox states. Add/save the working outline to a **separate private Git data repository** through server-side authenticated API calls. Never rely on Vercel local filesystem for persistence, never put data in the deployment repository, and never expose Git tokens client-side. Implement history by immutable Git revision and date resolution, full read-only historical reconstruction, and tree-aware diffs. Include markdown import/export, stale-revision conflict protection, tests for deep edits/moves and historical fidelity, and a working deployed preview. Do not assume the framework until you inspect the codebase. Provide changed file list, setup instructions, test results, demo steps, and any deferred acceptance criteria.

---

## 19. External technical references

- Vercel function filesystem and scratch-space behavior: https://vercel.com/docs/functions/runtimes
- GitHub REST repository contents read/write: https://docs.github.com/en/rest/repos/contents
- GitHub Git Data API concepts: https://docs.github.com/en/rest/git
- Framework-specific routing (only if the existing project uses Next.js): https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites

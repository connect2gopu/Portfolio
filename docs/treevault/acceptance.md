# POC acceptance evidence

Verified locally on 15 October 2026. Unit/integration tests include generated round trips and a mocked GitHub API; local browser acceptance uses Google Chrome and an ephemeral fixture. Neither substitutes for a real deployment with Git credentials.

| Criteria | Evidence / status |
| --- | --- |
| AC01 | Browser smoke: homepage, About, Projects, Blog and ShareIt return 200 alongside TreeVault. Existing ShareIt tests pass. |
| AC02 | Route integrated; development and production servers locally serve 200; actual Vercel Preview/Production verification pending configuration. |
| AC03–AC06 | Domain tests exercise ten-level nesting, depth-8 rename with descendants, independent checkbox toggle and subtree reparenting. Browser edits/moves/adds at depth four. |
| AC07–AC08 | Stable IDs, Unicode, links, multiline content, checkboxes, sibling order and generated-tree round trips pass. Legacy IDs deterministic; import baseline saved through API/browser. |
| AC09 | Local browser reload and second-tab loading pass. Git adapter implemented; real redeploy/new-function/cross-device durability pending credentials and deployment. |
| AC10–AC12 | Full immutable historical Markdown and contextual tree, head preservation, Kolkata date resolution, earlier-day fallback and no-history boundary tested. Browser historical view has no editor controls. |
| AC13–AC16 | Rename, independent checkbox transition, reparent, reorder and contextual deep additions tested. Browser comparison shows edited/moved/checkbox/added badges under ancestors. |
| AC17 | Mocked concurrent Git child commits: only one non-forced branch update succeeds. Fixture API and actual two-browser-tab flow return 409 and retain losing draft. |
| AC18 | Anonymous production GET/PUT/history/diff/resolve rejected; same-origin writes required. Git credentials exist only in server adapter and upstream errors redact payloads. Browser XSS preview test passes. |
| AC19 | Adapter writes only workspace.md in configured private data branch; public and code-repository configuration rejected. Actual Git repository and deployment-hook behavior pending live setup. |
| AC20 | Browser save conflict preserves draft and exposes export; provider failures return actionable redacted errors. Unsaved state remains in memory; no durable offline recovery claim. |
| AC21–AC22 | Unsupported/malformed Markdown and duplicate IDs rejected before mutation. Original source and current stable-ID Markdown export provided; safe inline preview preserves source. |

Automated results: 25 Node tests pass (including existing ShareIt tests), TypeScript passes, lint passes with six pre-existing next/image warnings. Browser acceptance passes with no page errors, including mobile overflow and literal HTML/javascript-link checks. Screenshots captured and visually reviewed.

Build findings: the full production Next build **passes** with a local Tina server: `TINA_PUBLIC_IS_LOCAL=true yarn tinacms dev -c 'NODE_ENV=production next build'`. A subsequent `next start` smoke passed on all six routes; real production handlers rejected anonymous access and an invalid owner password, accepted valid owner credentials, then failed closed for missing Git configuration. No fixture appeared in production. Git/password environment variable references were absent from client static bundles.

The normal repository `yarn build` still stops in Tina with missing TINA_TOKEN. A direct Next build without a Tina server fails while collecting the existing demo blog. No unrelated CMS configuration changes were made; a real deployment needs its existing Tina token plus the new TreeVault environment variables.

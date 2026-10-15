import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTreeVault } from './treevault-loader.mjs';
const { GitHubWorkspaceStore, FixtureWorkspaceStore } = loadTreeVault('lib/treevault/store.ts');
const { parseMarkdown, serializeMarkdown, endOfDay } = loadTreeVault('lib/treevault/domain.ts');
const { handleTreeVault } = loadTreeVault('lib/treevault/api.ts');
const sha = n => n.toString(16).padStart(40, '0');

test('fixture stores immutable full snapshots and rejects stale writers / redundant saves', async () => {
  const store = new FixtureWorkspaceStore(), head = await store.readHead();
  const markdown = serializeMarkdown(parseMarkdown('- [ ] new\n  - context'));
  const saved = await store.commitMarkdown(markdown, head.revision, 'save');
  assert.equal((await store.readHead()).markdown, markdown);
  assert.deepEqual(await store.readRevision(head.revision), head);
  assert.equal((await store.commitMarkdown(markdown, saved.revision, 'no-op')).revision, saved.revision);
  await assert.rejects(store.commitMarkdown('other', head.revision, 'stale'), e => e.status === 409);
  assert.equal((await store.resolve('2000-01-01T00:00:00Z')), null);
  assert.equal((await store.listRevisions()).revisions.length, 2);
});

// Model GitHub's non-forced refs; the real adapter must preserve this atomicity.
function provider() {
  const markdown = serializeMarkdown(parseMarkdown('- initial'));
  let head = sha(1), nextCommit = 2, repoPrivate = true;
  const commits = new Map([[head, { sha: head, tree: { sha: 'tree' }, committer: { date: '2026-10-12T10:00:00Z' }, message: 'baseline', parents: [], markdown }]]);
  const blobs = new Map(), trees = new Map(), calls = [];
  const response = (body, status = 200) => new Response(JSON.stringify(body), { status });
  return {
    calls, setPublic() { repoPrivate = false; },
    fetch: async (url, options) => {
      const endpoint = url.replace('https://api.github.com/repos/owner/notes', ''), body = options?.body ? JSON.parse(options.body) : null;
      calls.push({ endpoint, method: options?.method, body });
      if (endpoint === '') return response({ private: repoPrivate });
      if (endpoint === '/git/ref/heads/treevault') return response({ object: { sha: head } });
      if (endpoint.startsWith('/git/commits/') && !body) return response(commits.get(endpoint.split('/').at(-1)));
      if (endpoint.startsWith('/contents/workspace.md')) { const revision = new URL(url).searchParams.get('ref'); return response({ type: 'file', encoding: 'base64', size: markdown.length, content: Buffer.from(commits.get(revision).markdown).toString('base64') }); }
      if (endpoint === '/git/blobs') { const id = `blob${blobs.size}`; blobs.set(id, body.content); return response({ sha: id }); }
      if (endpoint === '/git/trees') { assert.deepEqual(body.tree.map(t => t.path), ['workspace.md']); const id = `tree${trees.size}`; trees.set(id, blobs.get(body.tree[0].sha)); return response({ sha: id }); }
      if (endpoint === '/git/commits' && body) { const id = sha(nextCommit++), commit = { ...body, sha: id, committer: { date: '2026-10-15T10:00:00Z' }, markdown: trees.get(body.tree) }; commits.set(id, commit); return response(commit); }
      if (endpoint === '/git/refs/heads/treevault') { assert.equal(body.force, false); const commit = commits.get(body.sha); if (commit.parents[0] !== head) return response({}, 422); head = body.sha; return response({ object: { sha: head } }); }
      if (endpoint.startsWith('/compare/')) return response({ status: endpoint.includes(sha(999)) ? 'diverged' : 'ahead' });
      if (endpoint.startsWith('/commits?')) { const params = new URL(url).searchParams; assert.equal(params.get('path'), 'workspace.md'); const until = params.get('until'); const reachable = new Set(); let cursor = head; while (cursor) { reachable.add(cursor); cursor = commits.get(cursor).parents[0]; } let list = [...commits.values()].reverse().filter(c => reachable.has(c.sha) && (!until || c.committer.date <= until)).map(c => ({ sha: c.sha, commit: c })); if (params.get('per_page') === '1') list = list.slice(0, 1); return response(list); }
      throw new Error(`Unexpected provider endpoint: ${endpoint}`);
    },
  };
}
test('Git adapter writes only workspace.md and atomically rejects a concurrent child commit', async () => {
  const mock = provider(), original = globalThis.fetch; globalThis.fetch = mock.fetch;
  try {
    const store = new GitHubWorkspaceStore('owner/notes', 'treevault', 'SERVER-SECRET', 'owner/code');
    const head = await store.readHead();
    const results = await Promise.allSettled([store.commitMarkdown('- first\n', head.revision, 'first'), store.commitMarkdown('- second\n', head.revision, 'second')]);
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(results.filter(r => r.status === 'rejected')[0].reason.status, 409);
    assert.equal((await store.readRevision(head.revision)).markdown, head.markdown);
    await assert.rejects(store.readRevision(sha(999)), e => e.status === 404);
    await assert.rejects(store.readRevision('../../secret'), e => e.status === 400);
    const historical = await store.resolve(endOfDay('2026-10-13'));
    assert.equal(historical.revision, head.revision);
    assert.equal(historical.markdown, head.markdown);
    assert.equal(await store.resolve(endOfDay('2026-10-01')), null);
    assert.equal((await store.listRevisions()).revisions[0].revision, (await store.readHead()).revision);
    assert.ok(!JSON.stringify(mock.calls).includes('SERVER-SECRET'));
    mock.setPublic(); await assert.rejects(store.readHead(), /private data repository/);
    assert.throws(() => new GitHubWorkspaceStore('owner/code', 'main', 'token', 'owner/code'), /separate/);
    assert.throws(() => new GitHubWorkspaceStore('owner/notes', 'main', 'token', ''), /separate/);
  } finally { globalThis.fetch = original; }
});
test('Git failures redact upstream error payloads and tokens', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('{"error":"SERVER-SECRET"}', { status: 500 });
    await assert.rejects(new GitHubWorkspaceStore('owner/notes', 'treevault', 'SERVER-SECRET', 'owner/code').readHead(), error => !error.message.includes('SERVER-SECRET') && error.status === 503);
  } finally { globalThis.fetch = original; }
});
test('all deployed APIs reject anonymous requests before accessing storage', async () => {
  const saved = { ...process.env }; process.env.NODE_ENV = 'production'; process.env.TREEVAULT_OWNER_PASSWORD = 'a-long-random-test-password-123456';
  try {
    for (const endpoint of ['workspace', 'history', 'resolve', 'revision/' + sha(1), 'diff']) {
      const response = await handleTreeVault(new Request('https://example.com/api/tools/treevault/' + endpoint), endpoint.split('/'));
      assert.equal(response.status, 401); assert.equal(response.headers.get('cache-control'), 'private, no-store');
    }
    const unauthorized = await handleTreeVault(new Request('https://example.com/api/tools/treevault/workspace', { method: 'PUT', body: '{}' }), ['workspace']); assert.equal(unauthorized.status, 401);
    const crossOrigin = await handleTreeVault(new Request('https://example.com/api/tools/treevault/workspace', { method: 'PUT', headers: { Origin: 'https://evil.invalid' }, body: '{}' }), ['workspace']); assert.equal(crossOrigin.status, 403);
    const auth = 'Basic ' + Buffer.from('owner:' + process.env.TREEVAULT_OWNER_PASSWORD).toString('base64');
    const configured = await handleTreeVault(new Request('https://example.com/api/tools/treevault/workspace', { headers: { Authorization: auth } }), ['workspace']);
    assert.equal(configured.status, 503); // Production never falls back to fixture.
  } finally { for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]; Object.assign(process.env, saved); }
});
test('local fixture API covers import, immutable history, diff and stale draft conflict', async () => {
  const saved = { ...process.env }; process.env.NODE_ENV = 'development'; delete process.env.VERCEL; delete process.env.TREEVAULT_GITHUB_TOKEN;
  const request = (path, method = 'GET', body) => handleTreeVault(new Request('http://localhost:3000/api/tools/treevault/' + path, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }), path.split('?')[0].split('/'));
  try {
    const head = await (await request('workspace')).json();
    assert.equal(head.fixture, true);
    const markdown = '- [ ] parent\n  - [x] child\n    - leaf\n      - deep';
    const savedResponse = await request('workspace', 'PUT', { markdown, baseRevision: head.revision }); assert.equal(savedResponse.status, 200);
    const next = await savedResponse.json(); assert.equal(parseMarkdown(next.markdown)[0].children[0].children[0].children.length, 1);
    const stale = await request('workspace', 'PUT', { markdown: '- stale', baseRevision: head.revision }); assert.equal(stale.status, 409);
    const previous = await (await request('revision/' + head.revision)).json(); assert.equal(previous.markdown, head.markdown);
    const diff = await (await request(`diff?from=${head.revision}&to=${next.revision}`)).json(); assert.ok(diff.precise); assert.ok(diff.changes.some(c => c.type === 'added'));
    const invalid = await request('workspace', 'PUT', { markdown: '# Unsupported', baseRevision: next.revision }); assert.equal(invalid.status, 400);
    assert.equal((await (await request('workspace')).json()).revision, next.revision);
    assert.equal((await request('history?cursor=-1')).status, 400);
    assert.equal((await request('resolve?date=2026-13-99')).status, 400);
    assert.equal((await request('revision/../../foo')).status, 404);
  } finally { for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]; Object.assign(process.env, saved); }
});

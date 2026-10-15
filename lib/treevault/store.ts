import { createHash, randomBytes } from 'node:crypto';
import { fixtureMarkdown, parseMarkdown, serializeMarkdown, type Revision, type Snapshot } from './domain';

export class VaultError extends Error { constructor(message: string, public status = 400) { super(message); } }
export interface VersionedWorkspaceStore {
  readHead(): Promise<Snapshot>;
  readRevision(sha: string): Promise<Snapshot>;
  listRevisions(page?: number): Promise<{ revisions: Revision[]; nextPage: number | null }>;
  resolve(until: string): Promise<Snapshot | null>;
  commitMarkdown(markdown: string, baseRevision: string, message: string): Promise<Snapshot>;
}
export function validateSha(sha: string) { if (!/^[a-f0-9]{40}$/.test(sha)) throw new VaultError('Expected an immutable 40-character commit SHA.'); }
export class FixtureWorkspaceStore implements VersionedWorkspaceStore {
  private snapshots: Snapshot[];
  constructor() {
    this.snapshots = [{ markdown: serializeMarkdown(parseMarkdown(fixtureMarkdown)), revision: '0'.repeat(40), committedAt: new Date().toISOString(), message: 'Local fixture baseline' }];
  }
  async readHead() { return { ...this.snapshots[0] }; }
  async readRevision(sha: string) { validateSha(sha); const result = this.snapshots.find(r => r.revision === sha); if (!result) throw new VaultError('Revision not found.', 404); return { ...result }; }
  async listRevisions(page = 1) { return { revisions: this.snapshots.slice((page - 1) * 50, page * 50).map(({ markdown, ...r }) => r), nextPage: page * 50 < this.snapshots.length ? page + 1 : null }; }
  async resolve(until: string) { const r = this.snapshots.find(r => r.committedAt <= until); return r ? { ...r } : null; }
  async commitMarkdown(markdown: string, baseRevision: string, message: string) {
    const head = this.snapshots[0];
    if (head.revision !== baseRevision) throw new VaultError('Another edit was saved. Your draft is retained. Export it before reloading the latest workspace.', 409);
    if (head.markdown === markdown) return { ...head };
    const snapshot = { markdown, revision: createHash('sha1').update(markdown + randomBytes(16).toString('hex')).digest('hex'), committedAt: new Date().toISOString(), message };
    this.snapshots.unshift(snapshot); return { ...snapshot };
  }
}
export class GitHubWorkspaceStore implements VersionedWorkspaceStore {
  private root: string;
  private ref: string;
  constructor(private repository: string, private branch: string, private token: string, codeRepository: string) {
    if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !branch || branch.length > 200 || /[\s?~^:*\[\\]/.test(branch)) throw new VaultError('Invalid server-side TreeVault repository configuration.', 503);
    if (!codeRepository || repository.toLowerCase() === codeRepository.toLowerCase()) throw new VaultError('Configure a separate data repository and TREEVAULT_CODE_REPOSITORY.', 503);
    this.root = `https://api.github.com/repos/${repository}`;
    this.ref = branch.split('/').map(encodeURIComponent).join('/');
  }
  private async api(path: string, options?: RequestInit) {
    const response = await fetch(this.root + path, { ...options, cache: 'no-store', signal: AbortSignal.timeout(20000), headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json', ...options?.headers } });
    if (!response.ok) {
      if (response.status === 409 || response.status === 422 && options?.method === 'PATCH') throw new VaultError('Save conflict. Export your draft before reloading the latest workspace.', 409);
      throw new VaultError(response.status === 404 ? 'Data repository, branch, workspace.md or revision not found. Check server configuration.' : response.status === 429 || response.status === 403 ? 'GitHub access or rate limit prevented this operation. Retry later.' : 'GitHub storage is unavailable. Your draft has not been discarded.', response.status === 404 ? 404 : 503);
    }
    return response.json();
  }
  private async checkPrivate() { const repo = await this.api(''); if (!repo.private) throw new VaultError('TreeVault requires a private data repository.', 503); }
  private async headSha(): Promise<string> { return (await this.api(`/git/ref/heads/${this.ref}`)).object.sha; }
  private async snapshot(sha: string): Promise<Snapshot> {
    const [commit, file] = await Promise.all([this.api(`/git/commits/${sha}`), this.api(`/contents/workspace.md?ref=${sha}`)]);
    if (file.type !== 'file' || file.encoding !== 'base64' || file.size > 900000) throw new VaultError('workspace.md must be a supported UTF-8 Markdown file under 300,000 characters.', 422);
    const markdown = Buffer.from(file.content, 'base64').toString('utf8');
    parseMarkdown(markdown);
    return { revision: sha, committedAt: commit.committer.date, message: commit.message, markdown };
  }
  async readHead() { await this.checkPrivate(); return this.snapshot(await this.headSha()); }
  async readRevision(sha: string) {
    validateSha(sha); await this.checkPrivate();
    const comparison = await this.api(`/compare/${sha}...${this.ref}`);
    if (!['ahead', 'identical'].includes(comparison.status)) throw new VaultError('Revision is not an ancestor of the configured data branch.', 404);
    return this.snapshot(sha);
  }
  private summary(commit: { sha: string; commit: { committer: { date: string }; message: string } }): Revision {
    return { revision: commit.sha, committedAt: commit.commit.committer.date, message: commit.commit.message };
  }
  async listRevisions(page = 1) {
    await this.checkPrivate();
    const commits = await this.api(`/commits?sha=${encodeURIComponent(this.branch)}&path=workspace.md&per_page=50&page=${page}`);
    return { revisions: commits.map((commit: Parameters<GitHubWorkspaceStore['summary']>[0]) => this.summary(commit)), nextPage: commits.length === 50 ? page + 1 : null };
  }
  async resolve(until: string) {
    await this.checkPrivate();
    const commits = await this.api(`/commits?sha=${encodeURIComponent(this.branch)}&path=workspace.md&until=${encodeURIComponent(until)}&per_page=1`);
    return commits.length ? this.snapshot(commits[0].sha) : null;
  }
  async commitMarkdown(markdown: string, baseRevision: string, message: string) {
    validateSha(baseRevision); await this.checkPrivate();
    const head = await this.headSha();
    if (head !== baseRevision) throw new VaultError('Another edit was saved. Export your draft before reloading the latest workspace.', 409);
    const previous = await this.snapshot(head);
    if (previous.markdown === markdown) return previous;
    const commit = await this.api(`/git/commits/${head}`);
    const blob = await this.api('/git/blobs', { method: 'POST', body: JSON.stringify({ content: markdown, encoding: 'utf-8' }) });
    const tree = await this.api('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: commit.tree.sha, tree: [{ path: 'workspace.md', mode: '100644', type: 'blob', sha: blob.sha }] }) });
    const next = await this.api('/git/commits', { method: 'POST', body: JSON.stringify({ message, tree: tree.sha, parents: [head] }) });
    // Two concurrent children of head diverge. force:false rejects the losing writer.
    await this.api(`/git/refs/heads/${this.ref}`, { method: 'PATCH', body: JSON.stringify({ sha: next.sha, force: false }) });
    return { revision: next.sha, committedAt: next.committer.date, message, markdown };
  }
}
const fixtureGlobal = globalThis as typeof globalThis & { treevaultFixture?: FixtureWorkspaceStore };
export function fixtureEnabled() { return process.env.NODE_ENV === 'development' && !process.env.VERCEL && !process.env.TREEVAULT_GITHUB_TOKEN; }
export function workspaceStore(): VersionedWorkspaceStore {
  if (fixtureEnabled()) return fixtureGlobal.treevaultFixture ??= new FixtureWorkspaceStore();
  const { TREEVAULT_DATA_REPOSITORY: repo, TREEVAULT_DATA_BRANCH: branch, TREEVAULT_GITHUB_TOKEN: token } = process.env;
  const code = process.env.TREEVAULT_CODE_REPOSITORY || (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}` : '');
  if (!repo || !branch || !token) throw new VaultError('TreeVault storage is not configured. See docs/treevault/operations.md.', 503);
  return new GitHubWorkspaceStore(repo, branch, token, code);
}

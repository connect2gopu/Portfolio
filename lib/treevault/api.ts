import { createHash, timingSafeEqual } from 'node:crypto';
import { diffTrees, endOfDay, MAX_MARKDOWN, parseMarkdown, serializeMarkdown } from './domain';
import { fixtureEnabled, VaultError, workspaceStore } from './store';

const digest = (value: string) => createHash('sha256').update(value).digest();
export function authorize(request: Request) {
  const url = new URL(request.url);
  if (fixtureEnabled() && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return;
  const password = process.env.TREEVAULT_OWNER_PASSWORD;
  if (!password || password.length < 24) throw new VaultError('Owner authentication is not configured. Set a random TREEVAULT_OWNER_PASSWORD of at least 24 characters.', 503);
  const header = request.headers.get('authorization') ?? '';
  const credentials = header.startsWith('Basic ') ? Buffer.from(header.slice(6), 'base64').toString('utf8') : '';
  if (!timingSafeEqual(digest(credentials), digest(`owner:${password}`))) throw new VaultError('Unlock TreeVault with your owner password.', 401);
}
async function readBody(request: Request) {
  if (Number(request.headers.get('content-length')) > MAX_MARKDOWN * 4 + 4096) throw new VaultError('Request too large.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new VaultError('Missing request body.');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > MAX_MARKDOWN * 4 + 4096) { await reader.cancel(); throw new VaultError('Request too large.', 413); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new VaultError('Invalid JSON request.'); }
}
export async function handleTreeVault(request: Request, action: string[]) {
  const headers = { 'Cache-Control': 'private, no-store', 'Vary': 'Authorization' };
  try {
    if (request.method !== 'GET') {
      const origin = request.headers.get('origin');
      if (origin && origin !== new URL(request.url).origin) throw new VaultError('Invalid request origin.', 403);
    }
    authorize(request);
    const store = workspaceStore(), url = new URL(request.url), route = action.join('/');
    let result: unknown;
    if (request.method === 'GET' && route === 'workspace') result = { ...await store.readHead(), fixture: fixtureEnabled() };
    else if (request.method === 'PUT' && route === 'workspace') {
      const body = await readBody(request);
      if (!body || typeof body.markdown !== 'string' || typeof body.baseRevision !== 'string' || (body.message !== undefined && (typeof body.message !== 'string' || body.message.length > 200))) throw new VaultError('Provide markdown, baseRevision and an optional message up to 200 characters.');
      const markdown = serializeMarkdown(parseMarkdown(body.markdown));
      result = await store.commitMarkdown(markdown, body.baseRevision, body.message || 'TreeVault: save workspace');
    } else if (request.method === 'GET' && route === 'history') {
      const page = Number(url.searchParams.get('cursor') || 1);
      if (!Number.isInteger(page) || page < 1 || page > 10000) throw new VaultError('Invalid history cursor.');
      result = await store.listRevisions(page);
    } else if (request.method === 'GET' && action[0] === 'revision' && action.length === 2) result = await store.readRevision(action[1]);
    else if (request.method === 'GET' && route === 'resolve') {
      const date = url.searchParams.get('date') ?? '', tz = url.searchParams.get('tz') ?? 'Asia/Kolkata';
      const until = endOfDay(date, tz);
      result = { snapshot: await store.resolve(until), requestedDate: date, timezone: tz, until };
    } else if (request.method === 'GET' && route === 'diff') {
      const [before, after] = await Promise.all([store.readRevision(url.searchParams.get('from') ?? ''), store.readRevision(url.searchParams.get('to') ?? '')]);
      const a = parseMarkdown(before.markdown), b = parseMarkdown(after.markdown);
      const completeIds = (markdown: string) => markdown.split('\n').filter(line => /^ *[-*+] /.test(line)).every(line => / <!-- tv:id=[a-zA-Z0-9_-]{1,100} -->$/.test(line));
      const precise = completeIds(before.markdown) && completeIds(after.markdown);
      result = { before, after, precise, changes: precise ? diffTrees(a, b) : [], warning: precise ? null : 'Legacy revision lacks stable IDs. Exact move matching is unavailable; inspect the original Markdown.' };
    } else throw new VaultError('TreeVault endpoint not found.', 404);
    return Response.json(result, { headers });
  } catch (error) {
    const known = error instanceof VaultError;
    // Parser errors are actionable; unexpected transport failures never expose credentials or upstream payloads.
    const parserError = error instanceof Error && /Markdown|indentation|nesting|node ID|metadata|Outline|calendar date|timezone|characters/.test(error.message);
    return Response.json({ error: known || parserError ? (error as Error).message : 'TreeVault is temporarily unavailable. Keep or export your draft and retry.' }, { status: known ? error.status : parserError ? 400 : 503, headers });
  }
}

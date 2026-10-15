'use client';

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type TextareaHTMLAttributes } from 'react';
import { Button } from '@/components/ui/Button';
import { editTree, indexTree, newNode, parseMarkdown, serializeMarkdown, type Change, type OutlineNode, type Revision, type Snapshot } from '@/lib/treevault/domain';

type Comparison = { before: Snapshot; after: Snapshot; precise: boolean; changes: Change[]; warning: string | null };
const labels: Record<Change['type'], string> = { added: 'Added', removed: 'Removed', edited: 'Text edited', checkbox: 'Checkbox changed', moved: 'Moved / reparented', reordered: 'Reordered' };
const field = 'rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';
const time = (iso: string) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(iso));
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

// Render only explicit inline constructs; HTML stays React-escaped and link schemes are allowlisted.
function InlineMarkdown({ text }: { text: string }) {
  return <span className="whitespace-pre-wrap break-words">{text.split(/(\[[^\]\n]+\]\([^\s)]+\)|`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g).map((part, i) => {
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link && /^(https?:\/\/|mailto:)/i.test(link[2])) return <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">{link[1]}</a>;
    if (/^`.*`$/.test(part)) return <code key={i} className="rounded bg-muted px-1 font-mono text-sm">{part.slice(1, -1)}</code>;
    if (/^\*\*.*\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^\*.*\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    return <Fragment key={i}>{part}</Fragment>;
  })}</span>;
}
function NodeInput(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = () => { const element = ref.current; if (element) { element.style.height = 'auto'; element.style.height = `${element.scrollHeight}px`; } };
  useLayoutEffect(resize, [props.value]);
  useEffect(() => {
    const element = ref.current; if (!element) return;
    let width = 0;
    const observer = new ResizeObserver(entries => { const next = entries[0].contentRect.width; if (next !== width) { width = next; resize(); } });
    observer.observe(element); return () => observer.disconnect();
  }, []);
  return <textarea {...props} ref={ref} />;
}
function Outline({ nodes, readonly = false, onAction, changes = [], onlyChanged = false, context }: {
  nodes: OutlineNode[]; readonly?: boolean;
  onAction?: (id: string, action: Parameters<typeof editTree>[2], text?: string) => void;
  changes?: Change[]; onlyChanged?: boolean; context?: string;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const changeMap = new Map<string, Change[]>();
  changes.forEach(change => changeMap.set(change.nodeId, [...(changeMap.get(change.nodeId) ?? []), change]));
  function containsChange(node: OutlineNode): boolean { return changeMap.has(node.id) || node.children.some(containsChange); }
  function branch(items: OutlineNode[], depth: number) {
    return <ul className={depth ? 'ml-5 border-l border-border pl-3 sm:ml-7 sm:pl-4' : ''}>{items.filter(n => !onlyChanged || containsChange(n)).map(node => {
      const hidden = collapsed.has(node.id), badges = changeMap.get(node.id) ?? [];
      return <li key={node.id} className="py-1">
        <div className="group flex min-w-[240px] items-start gap-2 rounded-lg px-1 py-1 hover:bg-muted/50 focus-within:bg-muted/50">
          <button type="button" aria-label={`${hidden ? 'Expand' : 'Collapse'} ${node.text || 'untitled node'}`} aria-expanded={!hidden} disabled={!node.children.length} onClick={() => setCollapsed(old => { const next = new Set(old); if (next.has(node.id)) next.delete(node.id); else next.add(node.id); return next; })} className="mt-1 w-5 shrink-0 text-muted-foreground disabled:opacity-0">{hidden ? '▸' : '▾'}</button>
          {node.checked !== null ? <input type="checkbox" aria-label={`Complete ${node.text || 'untitled node'}`} checked={node.checked} disabled={readonly} onChange={() => onAction?.(node.id, 'check')} className="mt-2 h-4 w-4 shrink-0 accent-violet-600" /> : <span className="mt-1 w-4 shrink-0 text-center text-muted-foreground">·</span>}
          <div className="min-w-0 flex-1">
            {readonly ? <div className={`py-1 leading-7 ${node.checked ? 'text-muted-foreground' : ''}`}><InlineMarkdown text={node.text || 'Untitled'} /></div> : <NodeInput aria-label="Node Markdown" data-node-id={node.id} value={node.text} rows={Math.max(1, node.text.split('\n').length)} placeholder="Write a thought…" spellCheck className={`block w-full resize-none overflow-hidden bg-transparent py-1 leading-7 outline-none placeholder:text-muted-foreground/60 ${node.checked ? 'text-muted-foreground' : ''}`} onChange={e => onAction?.(node.id, 'text', e.target.value)} onKeyDown={e => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onAction?.(node.id, 'sibling'); }
              if (e.key === 'Tab') { e.preventDefault(); onAction?.(node.id, e.shiftKey ? 'outdent' : 'indent'); }
              if (e.key === 'Backspace' && !node.text && !node.children.length) { e.preventDefault(); onAction?.(node.id, 'delete'); }
            }} />}
            {badges.length > 0 && <div className="flex flex-wrap gap-1 pb-1">{badges.map((c, i) => <span key={i} className={`rounded border px-2 py-0.5 text-xs ${c.type === 'removed' ? 'border-red-400/40 text-red-600 dark:text-red-400' : 'border-primary/30 text-primary'}`}>{labels[c.type]}</span>)}</div>}
          </div>
          {!readonly && <details className="relative mt-1 shrink-0"><summary aria-label="Node actions" className="cursor-pointer list-none rounded px-2 text-muted-foreground hover:bg-muted">•••</summary><div className="absolute right-0 z-20 grid w-44 gap-1 rounded-lg border bg-background p-2 shadow-xl">{([
            ['child', 'Add child'], ['sibling', 'Add sibling'], ['indent', 'Indent →'], ['outdent', '← Outdent'], ['up', 'Move up'], ['down', 'Move down'], ['kind', node.checked === null ? 'Add checkbox' : 'Remove checkbox'], ['delete', 'Delete empty branch'],
          ] as const).map(([action, label]) => <button type="button" key={action} className="rounded px-2 py-1 text-left text-sm hover:bg-muted" onClick={e => { e.currentTarget.closest('details')?.removeAttribute('open'); onAction?.(node.id, action); }}>{label}</button>)}</div></details>}
        </div>
        {!hidden && node.children.length > 0 && branch(node.children, depth + 1)}
      </li>;
    })}</ul>;
  }
  return <div aria-label={context ?? (readonly ? 'Read-only outline' : 'Editable outline')} className="overflow-x-auto">{branch(nodes, 0)}</div>;
}
export function TreeVault() {
  const [tree, setTree] = useState<OutlineNode[]>([]), [head, setHead] = useState<Snapshot | null>(null);
  const [savedMarkdown, setSavedMarkdown] = useState(''), [mode, setMode] = useState<'Today' | 'History' | 'Compare'>('Today');
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false), [locked, setLocked] = useState(false);
  const [password, setPassword] = useState(''), [fixture, setFixture] = useState(false), [preview, setPreview] = useState(false);
  const auth = useRef(''), loaded = useRef(false), historyRequest = useRef(0);
  const [date, setDate] = useState(today), [historical, setHistorical] = useState<Snapshot | null>(null), [resolvedDate, setResolvedDate] = useState('');
  const [revisions, setRevisions] = useState<Revision[]>([]), [nextPage, setNextPage] = useState<number | null>(null);
  const [from, setFrom] = useState(''), [to, setTo] = useState(''), [comparison, setComparison] = useState<Comparison | null>(null), [showUnchanged, setShowUnchanged] = useState(false);
  const [importing, setImporting] = useState(false), [importText, setImportText] = useState('');
  const markdown = serializeMarkdown(tree), dirty = head !== null && markdown !== savedMarkdown;
  const api = useCallback(async (path: string, options?: RequestInit) => {
    const response = await fetch(`/api/tools/treevault/${path}`, { ...options, cache: 'no-store', headers: { 'Content-Type': 'application/json', ...(auth.current ? { Authorization: auth.current } : {}) } });
    const body = await response.json();
    if (!response.ok) { if (response.status === 401) setLocked(true); throw new Error(body.error || 'Request failed. Your draft is retained.'); }
    return body;
  }, []);
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const result = await api('workspace');
      setTree(parseMarkdown(result.markdown)); setSavedMarkdown(serializeMarkdown(parseMarkdown(result.markdown))); setHead(result); setFixture(result.fixture); setLocked(false); setNotice('');
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }, [api]);
  useEffect(() => { if (!loaded.current) { loaded.current = true; void load(); } }, [load]);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  function action(id: string, operation: Parameters<typeof editTree>[2], text?: string) {
    try {
      const next = editTree(tree, id, operation, text); setTree(next); setError('');
      if (operation === 'child' || operation === 'sibling') {
        const oldIds = indexTree(tree), added = [...indexTree(next).keys()].find(key => !oldIds.has(key));
        setTimeout(() => document.querySelector<HTMLTextAreaElement>(`[data-node-id="${added}"]`)?.focus(), 0);
      }
    } catch (e) { setError((e as Error).message); }
  }
  async function save(checkpoint = false) {
    if (!head) return; setBusy(true); setError('');
    const submitted = markdown;
    try {
      const result: Snapshot = await api('workspace', { method: 'PUT', body: JSON.stringify({ markdown: submitted, baseRevision: head.revision, message: checkpoint ? `TreeVault: checkpoint ${today()} (Asia/Kolkata)` : 'TreeVault: save workspace' }) });
      setHead(result); setSavedMarkdown(submitted); setNotice(checkpoint ? 'Checkpoint recorded by the current revision; unchanged content reuses the existing commit.' : 'Revision saved.');
      setRevisions([]); setNextPage(null);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function historyList(page = 1) {
    setBusy(true); setError('');
    try {
      const result = await api(`history?cursor=${page}`);
      setRevisions(old => page === 1 ? result.revisions : [...old, ...result.revisions]); setNextPage(result.nextPage);
      if (page === 1) { setTo(result.revisions[0]?.revision ?? ''); setFrom(result.revisions[1]?.revision ?? result.revisions[0]?.revision ?? ''); }
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function resolveHistory(selected = date, sha?: string) {
    const request = ++historyRequest.current; setBusy(true); setError(''); setHistorical(null); setResolvedDate('');
    try {
      const result = sha ? { snapshot: await api(`revision/${sha}`) } : await api(`resolve?date=${selected}&tz=Asia/Kolkata`);
      if (request !== historyRequest.current) return;
      setHistorical(result.snapshot); setResolvedDate(sha ? '' : selected);
      setNotice(result.snapshot ? '' : 'No recorded revision exists at or before this date.');
    } catch (e) { if (request === historyRequest.current) setError((e as Error).message); } finally { if (request === historyRequest.current) setBusy(false); }
  }
  async function compare() {
    setBusy(true); setError(''); setComparison(null);
    try { setComparison(await api(`diff?from=${from}&to=${to}`)); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  function download(content: string, name: string) {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function switchMode(next: typeof mode) { setMode(next); setNotice(''); if (next !== 'Today' && !revisions.length) void historyList(); }
  const revisionOptions = revisions.map(r => <option key={r.revision} value={r.revision}>{time(r.committedAt)} · {r.revision.slice(0, 7)}</option>);

  return <section className="mx-auto min-h-[75vh] max-w-6xl px-4 py-12 sm:px-6">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-primary">Your thoughts, with a memory</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">TreeVault<span className="ml-3 align-middle text-xl text-primary" aria-hidden>⌘</span></h1><p className="mt-3 text-sm text-muted-foreground">One living outline. Every recorded version, kept.</p></div><div className="flex flex-wrap items-center gap-3 text-sm"><span role="status" className="text-muted-foreground">{busy ? 'Working…' : dirty ? '● Unsaved changes' : head ? `Saved · ${time(head.committedAt)}` : 'Private workspace'}</span>{head && mode === 'Today' && <Button onClick={() => save(true)} disabled={busy || locked} variant="outline" size="sm">Checkpoint</Button>}</div></div>
    {fixture && <p className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">Local fixture · Revisions are held in server memory and reset when the process restarts. Configure a private Git repository for durable storage.</p>}
    {error && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-400/40 bg-red-500/5 p-4 text-sm"><span>{error}</span>{head && <Button variant="outline" size="sm" onClick={() => download(markdown, 'treevault-unsaved.md')}>Export draft</Button>}</div>}
    {notice && <p role="status" className="mb-4 text-sm text-muted-foreground">{notice}</p>}
    {locked && <form onSubmit={e => { e.preventDefault(); auth.current = `Basic ${btoa(Array.from(new TextEncoder().encode(`owner:${password}`), byte => String.fromCharCode(byte)).join(''))}`; setPassword(''); if (head) { setBusy(true); void api('workspace').then(() => { setLocked(false); setError(''); }).catch(e => setError(e.message)).finally(() => setBusy(false)); } else void load(); }} className="mx-auto my-10 max-w-md rounded-2xl border bg-card p-8"><h2 className="text-xl font-medium">Unlock your workspace</h2><p className="mt-2 text-sm text-muted-foreground">Use the owner password configured on the server. Access lasts for this page session.</p><label htmlFor="vault-password" className="mb-2 mt-6 block text-sm">Owner password</label><input id="vault-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className={`${field} mb-4 w-full`} /><Button type="submit" disabled={busy}>Unlock</Button></form>}
    {!head && !locked && !busy && <Button variant="outline" onClick={load}>Retry connection</Button>}
    {head && <>
      <nav aria-label="Workspace views" className="mb-6 flex gap-1 border-b pb-3">{(['Today', 'History', 'Compare'] as const).map(tab => <button key={tab} type="button" disabled={busy} aria-current={mode === tab ? 'page' : undefined} onClick={() => switchMode(tab)} className={`rounded-lg px-5 py-2 text-sm font-medium ${mode === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>{tab}</button>)}</nav>
      {mode === 'Today' && <>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-medium">Current workspace</h2><p className="mt-1 text-xs text-muted-foreground">{today()} · Asia/Kolkata · {head.revision.slice(0, 7)}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => setPreview(!preview)}>{preview ? 'Edit' : 'Preview'}</Button><Button size="sm" variant="outline" onClick={() => { setImporting(!importing); setImportText(''); }}>Import</Button><Button size="sm" variant="outline" onClick={() => download(markdown, 'treevault-workspace.md')}>Export</Button><Button size="sm" disabled={busy || !dirty || locked} onClick={() => save()}>Save revision</Button></div></div>
        {importing && <form className="mb-6 rounded-xl border bg-muted/30 p-5" onSubmit={e => { e.preventDefault(); try { const imported = parseMarkdown(importText); if (tree.length && !window.confirm('Replace the current outline with this import? Export any unsaved work first.')) return; setTree(imported); setImporting(false); setNotice('Import is a draft. Save a revision to record its stable-ID baseline.'); setError(''); } catch (e) { setError((e as Error).message); } }}><label htmlFor="markdown-import" className="block text-sm font-medium">Paste a nested Markdown outline</label><p className="my-2 text-xs text-muted-foreground">Use two-space indentation. Import replaces the current draft; history is preserved when you save.</p><textarea id="markdown-import" className={`${field} mb-3 min-h-48 w-full font-mono`} value={importText} onChange={e => setImportText(e.target.value)} /><Button size="sm" type="submit">Import as draft</Button></form>}
        <div className="rounded-xl border bg-card p-3 sm:p-6"><Outline nodes={tree} readonly={preview || locked} onAction={action} />{!preview && <button type="button" disabled={locked} onClick={() => setTree(old => [...old, newNode()])} className="ml-9 mt-4 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted">+ Add a thought</button>}{!tree.length && preview && <p className="p-4 text-muted-foreground">This outline is empty.</p>}</div>
        <p className="mt-4 text-xs leading-6 text-muted-foreground">Enter adds a sibling · Shift+Enter adds a line · Tab indents · Shift+Tab outdents · ••• opens node actions. Checkboxes are independent.</p>
        {dirty && <button type="button" disabled={busy} className="mt-3 text-xs text-muted-foreground underline" onClick={() => { if (window.confirm('Discard the current draft and load the latest saved revision? Export first if you need to keep it.')) void load(); }}>Discard draft and reload latest</button>}
      </>}
      {mode === 'History' && <>
        <div className="mb-6 flex flex-wrap items-end gap-3"><label className="grid gap-2 text-sm">End of day · Asia/Kolkata<input type="date" disabled={busy} value={date} onChange={e => { setDate(e.target.value); setHistorical(null); }} className={field} /></label><Button size="sm" disabled={busy || !date} onClick={() => resolveHistory()}>View date</Button><label className="grid min-w-0 gap-2 text-sm">Or select an immutable revision<select className={`${field} max-w-full`} value={historical?.revision ?? ''} disabled={busy} onChange={e => { if (e.target.value) void resolveHistory(date, e.target.value); }}><option value="">Select revision</option>{revisionOptions}</select></label>{nextPage && <Button size="sm" variant="ghost" disabled={busy} onClick={() => historyList(nextPage)}>Older revisions</Button>}</div>
        {historical ? <><div className="mb-4 rounded-lg bg-muted p-4 text-sm"><p>Read-only · Resolved to {time(historical.committedAt)} (Asia/Kolkata)</p><p className="mt-1 break-all font-mono text-xs">{historical.revision}</p>{resolvedDate && <p className="mt-2 text-muted-foreground">{new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(historical.committedAt)) === resolvedDate ? 'Recorded on the selected day.' : 'Nearest earlier recorded revision; no checkpoint exists on the selected day.'}</p>}<Button size="sm" variant="outline" className="mt-3" onClick={() => download(historical.markdown, `treevault-${historical.revision.slice(0, 7)}.md`)}>Export this revision</Button></div><div className="rounded-xl border p-4"><Outline readonly nodes={parseMarkdown(historical.markdown)} /></div></> : <p className="py-12 text-center text-muted-foreground">Choose a date or revision to open the complete recorded outline.</p>}
        <Button variant="ghost" className="mt-4" onClick={() => switchMode('Today')}>← Back to Today</Button>
      </>}
      {mode === 'Compare' && <>
        <div className="mb-6 flex flex-wrap items-end gap-3"><label className="grid min-w-0 gap-2 text-sm">From revision<select className={field} value={from} onChange={e => { setFrom(e.target.value); setComparison(null); }}>{revisionOptions}</select></label><label className="grid min-w-0 gap-2 text-sm">To revision<select className={field} value={to} onChange={e => { setTo(e.target.value); setComparison(null); }}>{revisionOptions}</select></label><Button size="sm" disabled={busy || !from || !to} onClick={compare}>Compare</Button>{nextPage && <Button size="sm" variant="ghost" disabled={busy} onClick={() => historyList(nextPage)}>Older revisions</Button>}</div>
        {comparison && <><p className="mb-3 text-sm text-muted-foreground">{comparison.before.revision.slice(0, 7)} → {comparison.after.revision.slice(0, 7)} · {comparison.changes.length} node changes</p>{comparison.warning && <p role="status" className="mb-4 text-sm text-amber-600">{comparison.warning}</p>}{comparison.precise && <><label className="mb-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={showUnchanged} onChange={e => setShowUnchanged(e.target.checked)} />Show unchanged branches</label><div className="grid gap-4 lg:grid-cols-2">{([['Before', comparison.before], ['After', comparison.after]] as const).map(([title, snapshot]) => <div key={title} className="min-w-0 rounded-xl border p-4"><h3 className="mb-3 text-sm font-semibold">{title} · {time(snapshot.committedAt)}</h3><Outline context={`${title} comparison outline`} readonly nodes={parseMarkdown(snapshot.markdown)} changes={comparison.changes} onlyChanged={!showUnchanged} /></div>)}</div>{!comparison.changes.length && <p className="py-8 text-center text-muted-foreground">No outline changes between these revisions.</p>}<details className="mt-4 rounded-xl border p-4"><summary className="cursor-pointer text-sm">Inspect change details</summary><ul className="mt-3 space-y-3 text-sm">{comparison.changes.map((change, i) => <li key={i}><strong>{labels[change.type]}</strong> <code className="text-xs">{change.nodeId}</code><div className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">{change.before !== undefined && <p>Before: {change.before}</p>}{change.after !== undefined && <p>After: {change.after}</p>}</div></li>)}</ul></details></>}
          <details className="mt-4 rounded-xl border p-4"><summary className="cursor-pointer text-sm">Original Markdown · before / after</summary><div className="mt-4 grid gap-4 lg:grid-cols-2">{[comparison.before, comparison.after].map((snapshot, i) => <pre key={i} className="overflow-auto rounded-lg bg-muted p-4 text-xs"><code>{snapshot.markdown}</code></pre>)}</div></details>
        </>}
      </>}
    </>}
  </section>;
}

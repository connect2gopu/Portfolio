export interface OutlineNode { id: string; text: string; checked: boolean | null; children: OutlineNode[] }
export interface Revision { revision: string; committedAt: string; message: string }
export interface Snapshot extends Revision { markdown: string }
export interface Change { type: 'added' | 'removed' | 'edited' | 'checkbox' | 'moved' | 'reordered'; nodeId: string; before?: string; after?: string }
export const MAX_MARKDOWN = 300_000;

// Deterministic import IDs depend on the original source and line, never on later edits.
function hash(value: string) {
  let a = 2166136261, b = 5381;
  for (let i = 0; i < value.length; i++) { a = Math.imul(a ^ value.charCodeAt(i), 16777619); b = Math.imul(b, 33) ^ value.charCodeAt(i); }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}
export function parseMarkdown(markdown: string): OutlineNode[] {
  if (typeof markdown !== 'string' || markdown.length > MAX_MARKDOWN) throw new Error('Outline must be at most 300,000 characters.');
  const roots: OutlineNode[] = [], stack: OutlineNode[] = [], ids = new Set<string>();
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const seed = hash(markdown);
  let previousDepth = -1;
  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const line = lines[lineNumber];
    if (line === '' && lineNumber === lines.length - 1) continue;
    const match = /^( *)(?:- |\* |\+ )(?:\[([ xX])\] )?(.*)$/.exec(line);
    if (!match) {
      // Canonical continuations have two extra spaces beyond the owning item.
      const owner = stack[previousDepth];
      const prefix = ' '.repeat((previousDepth + 1) * 2);
      if (owner && line.startsWith(prefix) && line.length >= prefix.length && !/^\s*([-*+] |\d+[.)] |```|~~~|#|>)/.test(line)) {
        if (line.includes('tv:id=')) throw new Error(`Identity metadata is only allowed on node lines (line ${lineNumber + 1}).`);
        owner.text += '\n' + line.slice(prefix.length); continue;
      }
      throw new Error(`Unsupported Markdown at line ${lineNumber + 1}. Use nested list items with two-space indentation; indent continuation lines two more spaces. Nothing was imported.`);
    }
    if (match[1].length % 2) throw new Error(`Use two-space indentation at line ${lineNumber + 1}.`);
    const depth = match[1].length / 2;
    if (depth > previousDepth + 1 || depth > 100) throw new Error(`Invalid nesting at line ${lineNumber + 1} (maximum supported depth: 100).`);
    let text = match[3];
    const metadata = / <!-- tv:id=([a-zA-Z0-9_-]{1,100}) -->$/.exec(text);
    if (metadata) text = text.slice(0, metadata.index);
    if (text.includes('tv:id=')) throw new Error(`Malformed or duplicate identity metadata at line ${lineNumber + 1}.`);
    const id = metadata?.[1] ?? `legacy-${seed}-${lineNumber.toString(36)}`;
    if (ids.has(id)) throw new Error(`Duplicate node ID at line ${lineNumber + 1}. Fix duplicate metadata before importing.`);
    ids.add(id);
    const node: OutlineNode = { id, text, checked: match[2] === undefined ? null : match[2].toLowerCase() === 'x', children: [] };
    if (depth === 0) roots.push(node); else stack[depth - 1].children.push(node);
    stack[depth] = node; stack.length = depth + 1; previousDepth = depth;
  }
  return roots;
}
export function serializeMarkdown(nodes: OutlineNode[]): string {
  const lines: string[] = [], ids = new Set<string>();
  function walk(list: OutlineNode[], depth: number) {
    if (depth > 100) throw new Error('Maximum supported depth is 100.');
    for (const node of list) {
      if (!/^[a-zA-Z0-9_-]{1,100}$/.test(node.id) || ids.has(node.id)) throw new Error('Invalid or duplicate node ID.');
      ids.add(node.id);
      const [first, ...rest] = node.text.split('\n');
      lines.push(`${'  '.repeat(depth)}- ${node.checked === null ? '' : node.checked ? '[x] ' : '[ ] '}${first} <!-- tv:id=${node.id} -->`);
      rest.forEach(line => lines.push('  '.repeat(depth + 1) + line));
      walk(node.children, depth + 1);
    }
  }
  walk(nodes, 0);
  const markdown = lines.length ? lines.join('\n') + '\n' : '';
  if (markdown.length > MAX_MARKDOWN) throw new Error('Outline exceeds 300,000 characters.');
  if (JSON.stringify(parseMarkdown(markdown)) !== JSON.stringify(nodes)) throw new Error('Unsupported Markdown in node text. Avoid list markers or identity metadata in continuation lines; use Add child for nested items.');
  return markdown;
}
export function newNode(): OutlineNode { return { id: crypto.randomUUID(), text: '', checked: false, children: [] }; }
export function indexTree(nodes: OutlineNode[]) {
  const map = new Map<string, { node: OutlineNode; parent: string | null; index: number; siblings: OutlineNode[] }>();
  function walk(list: OutlineNode[], parent: string | null) { list.forEach((node, index) => { map.set(node.id, { node, parent, index, siblings: list }); walk(node.children, node.id); }); }
  walk(nodes, null); return map;
}
export function editTree(tree: OutlineNode[], id: string, action: 'text' | 'check' | 'kind' | 'sibling' | 'child' | 'indent' | 'outdent' | 'up' | 'down' | 'delete', text?: string): OutlineNode[] {
  const copy: OutlineNode[] = JSON.parse(JSON.stringify(tree));
  const map = indexTree(copy), item = map.get(id);
  if (!item) return tree;
  const { node, siblings, index, parent } = item;
  if (action === 'text') node.text = text ?? '';
  if (action === 'check') node.checked = !node.checked;
  if (action === 'kind') node.checked = node.checked === null ? false : null;
  if (action === 'sibling') siblings.splice(index + 1, 0, newNode());
  if (action === 'child') node.children.push(newNode());
  if (action === 'delete') {
    if (node.children.length) throw new Error('Move or remove children first; deleting a branch never silently deletes descendants.');
    siblings.splice(index, 1);
  }
  if (action === 'indent' && index > 0) { siblings.splice(index, 1); siblings[index - 1].children.push(node); }
  if (action === 'outdent' && parent) { const p = map.get(parent)!; siblings.splice(index, 1); p.siblings.splice(p.index + 1, 0, node); }
  if (action === 'up' && index > 0) { siblings.splice(index, 1); siblings.splice(index - 1, 0, node); }
  if (action === 'down' && index < siblings.length - 1) { siblings.splice(index, 1); siblings.splice(index + 1, 0, node); }
  // Validate before applying any update, including unsupported multiline editing.
  parseMarkdown(serializeMarkdown(copy));
  return copy;
}
export function diffTrees(before: OutlineNode[], after: OutlineNode[]): Change[] {
  const a = indexTree(before), b = indexTree(after), changes: Change[] = [];
  a.forEach((old, id) => { if (!b.has(id)) changes.push({ type: 'removed', nodeId: id, before: old.node.text }); });
  b.forEach((next, id) => {
    const old = a.get(id);
    if (!old) { changes.push({ type: 'added', nodeId: id, after: next.node.text }); return; }
    if (old.node.text !== next.node.text) changes.push({ type: 'edited', nodeId: id, before: old.node.text, after: next.node.text });
    if (old.node.checked !== next.node.checked) changes.push({ type: 'checkbox', nodeId: id, before: String(old.node.checked), after: String(next.node.checked) });
    if (old.parent !== next.parent) changes.push({ type: 'moved', nodeId: id, before: old.parent ?? 'root', after: next.parent ?? 'root' });
    else {
      // Ignore index shifts caused only by insertions/removals/reparenting.
      const shared = (list: OutlineNode[]) => list.filter(n => a.has(n.id) && b.has(n.id) && a.get(n.id)!.parent === b.get(n.id)!.parent).map(n => n.id);
      if (shared(old.siblings).indexOf(id) !== shared(next.siblings).indexOf(id)) changes.push({ type: 'reordered', nodeId: id, before: String(old.index), after: String(next.index) });
    }
  }); return changes;
}
export function endOfDay(date: string, timezone = 'Asia/Kolkata'): string {
  if (timezone !== 'Asia/Kolkata') throw new Error('POC supports timezone Asia/Kolkata.');
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error('Invalid calendar date.');
  return new Date(`${date}T23:59:59.999+05:30`).toISOString();
}
export const fixtureMarkdown = `- [ ] Location — #1968
  - [x] approval — got
  - [ ] Look for app based solution
    - [ ] Our own app or 3rd party
- [ ] credit debit — #1969
  - [ ] started working
    - [ ] Credit note sync done
      - [ ] Get reviewed from Vineet
- Lambda SSM Caching
  - [ ] Explore [AWS documentation](https://docs.aws.amazon.com/systems-manager/)
`;

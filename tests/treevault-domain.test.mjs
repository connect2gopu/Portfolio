import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTreeVault } from './treevault-loader.mjs';
const { parseMarkdown: parse, serializeMarkdown: serialize, editTree: edit, indexTree: index, diffTrees: diff, endOfDay, fixtureMarkdown } = loadTreeVault('lib/treevault/domain.ts');
test('legacy import is deterministic, unique and lossless across four levels', () => {
  const tree = parse(fixtureMarkdown);
  assert.deepEqual(parse(fixtureMarkdown), tree);
  assert.equal(index(tree).size, 10);
  assert.deepEqual(parse(serialize(tree)), tree);
  assert.ok(serialize(tree).includes('https://docs.aws.amazon.com/systems-manager/'));
});
test('ten-level rename, checkbox and reparent preserve identity and descendants', () => {
  const source = Array.from({ length: 11 }, (_, depth) => '  '.repeat(depth) + '- [ ] level ' + depth).join('\n');
  const tree = parse(source), ids = [...index(tree).keys()];
  const renamed = edit(tree, ids[8], 'text', 'Unicode ✓ [ticket](https://example.invalid/1968)');
  assert.equal(index(renamed).get(ids[8]).node.children[0].id, ids[9]);
  const checked = edit(renamed, ids[8], 'check');
  assert.equal(index(checked).get(ids[8]).node.checked, true);
  assert.equal(index(checked).get(ids[9]).node.checked, false);
  const moved = edit(checked, ids[4], 'outdent');
  assert.equal(index(moved).get(ids[4]).parent, ids[2]);
  assert.equal(index(moved).get(ids[10]).node.text, 'level 10');
  assert.deepEqual(parse(serialize(moved)), moved);
  assert.deepEqual(diff(tree, moved).filter(c => c.nodeId === ids[4]).map(c => c.type), ['moved']);
  assert.deepEqual(diff(tree, moved).filter(c => c.nodeId === ids[8]).map(c => c.type), ['edited', 'checkbox']);
  assert.throws(() => edit(tree, ids[4], 'delete'), /children/);
});
test('diff distinguishes reordering from insertion and retains deep additions', () => {
  const a = parse('- A\n  - child\n- B\n- C');
  const moved = edit(a, a[2].id, 'up');
  assert.ok(diff(a, moved).some(c => c.type === 'reordered'));
  const inserted = edit(a, a[0].id, 'sibling');
  assert.deepEqual(diff(a, inserted).map(c => c.type), ['added']);
  const deep = edit(a, a[0].children[0].id, 'child');
  assert.equal(diff(a, deep)[0].type, 'added');
  assert.equal(deep[0].children[0].children.length, 1);
});
test('multiline, links, literal HTML and checkboxes round-trip', () => {
  const tree = parse('- [x] **Hello** `code` [link](https://example.invalid/a?b=2)\n  continuation with *emphasis*\n  \n  - plain <script>alert(1)</script>\n- final  ');
  assert.deepEqual(parse(serialize(tree)), tree);
  assert.equal(tree[0].children[0].checked, null);
  assert.ok(tree[0].text.endsWith('\n'));
});
test('unsupported syntax and duplicate metadata fail closed', () => {
  for (const source of ['# Heading', '- A\n   - bad', '- A\n    - skipped level', '- a <!-- tv:id=x -->\n- b <!-- tv:id=x -->', '- a <!-- tv:id=!! -->', '```\n- a\n```', '- a\n\nparagraph']) assert.throws(() => parse(source));
  const tree = parse('- node');
  assert.throws(() => edit(tree, tree[0].id, 'text', 'node\n- another list'), /Unsupported/);
  assert.throws(() => edit(tree, tree[0].id, 'text', '[ ] ambiguity'), /Unsupported/);
});
test('generated varied trees preserve every value through serialization', () => {
  let seed = 17;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  for (let run = 0; run < 60; run++) {
    let id = 0;
    function make(depth) { return Array.from({ length: 1 + Math.floor(random() * 3) }, () => ({ id: `test-${run}-${id++}`, text: `नमस्ते ${id} **text** [URL](https://example.invalid/${id})\ncontinuation`, checked: [null, false, true][Math.floor(random() * 3)], children: depth < 5 && random() > .4 ? make(depth + 1) : [] })); }
    const tree = make(0); assert.deepEqual(parse(serialize(tree)), tree);
  }
});
test('Kolkata end-of-day resolution validates date and boundary', () => {
  assert.equal(endOfDay('2026-10-13'), '2026-10-13T18:29:59.999Z');
  assert.equal(endOfDay('2028-02-29'), '2028-02-29T18:29:59.999Z');
  for (const date of ['2026-02-29', '2026-13-01', '2026-01-32', 'garbage']) assert.throws(() => endOfDay(date), /Invalid calendar date/);
  assert.throws(() => endOfDay('2026-10-13', 'UTC'), /timezone/);
});

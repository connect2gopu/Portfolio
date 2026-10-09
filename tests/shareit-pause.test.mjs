import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(path, overrides = {}) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', source)(name => overrides[name] ?? require(name), module, module.exports);
  return module.exports;
}
const availability = load('../lib/shareit/availability.ts');
test('all discovery and pairing actions are paused before touching Redis', async () => {
  for (const path of ['../app/api/shareit/route.ts', '../app/api/shareit/pair/route.ts']) {
    let commands = 0;
    const route = load(path, {
      '@/lib/shareit/availability': availability,
      '@/lib/shareit/network': load('../lib/shareit/network.ts'),
      '@/lib/shareit/store': { command() { commands++; throw new Error('Redis must not be reached'); } },
    });
    for (const action of ['join', 'poll', 'signal', 'leave', 'create', 'answer', 'close']) {
      const response = await route.POST(new Request('https://example.com/api/shareit', { method: 'POST', body: JSON.stringify({ action }) }));
      assert.equal(response.status, 503);
      assert.equal((await response.json()).paused, true);
    }
    assert.equal(commands, 0);
  }
});
test('store guard blocks even direct command calls', async () => {
  const store = load('../lib/shareit/store.ts', { './availability': availability });
  await assert.rejects(store.command(['GET', 'example']), /paused/);
  await assert.rejects(store.command(['SET', 'example', 'value']), /paused/);
});
test('diagnostic works independently of Redis and calculates the discovery group', async () => {
  const route = load('../app/api/shareit/network/route.ts', { '@/lib/shareit/network': load('../lib/shareit/network.ts') });
  const previous = process.env.VERCEL;
  process.env.VERCEL = '1';
  try {
    const read = async address => (await (await route.GET(new Request('https://example.com/api/shareit/network', { headers: { 'x-forwarded-for': address } }))).json()).discovery;
    const a = await read('2001:db8:1:2::1');
    const b = await read('2001:db8:1:2::abcd');
    const c = await read('203.0.113.1');
    assert.equal(a.group, b.group);
    assert.notEqual(a.group, c.group);
    assert.equal(a.network, 'ipv6:2001:0db8:0001:0002/64');
    assert.equal(a.address, '2001:db8:1:2::1');
  } finally {
    if (previous === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previous;
  }
});

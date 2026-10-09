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
test('sharing is enabled and both APIs accept requests for validation', async () => {
  for (const path of ['../app/api/shareit/route.ts', '../app/api/shareit/pair/route.ts']) {
    const route = load(path, {
      '@/lib/shareit/network': load('../lib/shareit/network.ts'),
      '@/lib/shareit/store': { command() { throw new Error('Invalid credentials must be rejected before Redis'); } },
    });
    const response = await route.POST(new Request('https://example.com/api/shareit', { method: 'POST', body: '{}' }));
    assert.equal(response.status, 400);
  }
});

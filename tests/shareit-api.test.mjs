import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { createHmac } from 'node:crypto';
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
      '@/lib/shareit/turn-config': load('../lib/shareit/turn-config.ts'),
      '@/lib/shareit/store': { command() { throw new Error('Invalid credentials must be rejected before Redis'); } },
    });
    const response = await route.POST(new Request('https://example.com/api/shareit', { method: 'POST', body: '{}' }));
    assert.equal(response.status, 400);
  }
});

test('TURN credentials expire and never expose the shared secret', () => {
  const savedUrls = process.env.SHAREIT_TURN_URLS;
  const savedSecret = process.env.SHAREIT_TURN_SECRET;
  const { shareItTurnServers } = load('../lib/shareit/turn-config.ts');
  try {
    delete process.env.SHAREIT_TURN_URLS;
    delete process.env.SHAREIT_TURN_SECRET;
    assert.deepEqual(shareItTurnServers('device'), []);
    process.env.SHAREIT_TURN_URLS = 'turn:relay.example:3478, turns:relay.example:443?transport=tcp';
    assert.throws(() => shareItTurnServers('device'), /configuration is incomplete/);
    process.env.SHAREIT_TURN_SECRET = 'test-server-secret';
    const before = Math.floor(Date.now() / 1000);
    const [server] = shareItTurnServers('device');
    const expiry = Number(server.username.split(':')[0]);
    assert.ok(expiry >= before + 3600 && expiry <= Math.floor(Date.now() / 1000) + 3600);
    assert.ok(server.username.endsWith(':device'));
    assert.deepEqual(server.urls, ['turn:relay.example:3478', 'turns:relay.example:443?transport=tcp']);
    assert.equal(server.credential, createHmac('sha1', 'test-server-secret').update(server.username).digest('base64'));
    assert.ok(!JSON.stringify(server).includes('test-server-secret'));
    process.env.SHAREIT_TURN_URLS = 'https://invalid.example';
    assert.throws(() => shareItTurnServers('device'), /configuration is incomplete/);
  } finally {
    if (savedUrls === undefined) delete process.env.SHAREIT_TURN_URLS;
    else process.env.SHAREIT_TURN_URLS = savedUrls;
    if (savedSecret === undefined) delete process.env.SHAREIT_TURN_SECRET;
    else process.env.SHAREIT_TURN_SECRET = savedSecret;
  }
});

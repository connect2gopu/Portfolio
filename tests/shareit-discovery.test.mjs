import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

test('an idle receiver polls for offers, shows approval, and stops on unmount', async () => {
  const effects = [];
  const states = [];
  const timers = new Map();
  const requests = [];
  let nextTimer = 0;
  let incoming = [];
  const description = { type: 'offer', sdp: 'test offer' };
  const remoteDescriptions = [];
  const react = {
    useEffect: effect => effects.push(effect),
    useRef: current => ({ current }),
    useState: initial => [initial, value => states.push(value)],
  };
  const jsx = (type, props) => ({ type, props });
  const source = ts.transpileModule(fs.readFileSync(new URL('../components/tools/ShareIt.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  const mocks = {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
    './ShareItInvite': { ShareItInvite() {} },
    './ManualShareIt': { ManualShareIt() {} },
    '@/lib/shareit/device-id': { createDeviceId: () => '11111111-1111-1111-1111-111111111111' },
  };
  class Connection {
    async setRemoteDescription(value) { remoteDescriptions.push(value); }
    close() {}
  }
  const window = { RTCPeerConnection: Connection, location: { href: 'https://example.com/shareit' }, history: { replaceState() {} } };
  const fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    requests.push(request);
    const messages = incoming;
    incoming = [];
    return { ok: true, json: async () => ({ peers: [{ id: 'sender', name: 'Sender' }], messages }) };
  };
  new Function('require', 'module', 'exports', 'window', 'navigator', 'fetch', 'setTimeout', 'clearTimeout', 'RTCPeerConnection', source)(
    name => { assert.ok(name in mocks, `Unexpected import: ${name}`); return mocks[name]; },
    module, module.exports, window, { userAgent: 'Android' }, fetch,
    (callback, delay) => { const id = ++nextTimer; timers.set(id, { callback, delay }); return id; },
    id => timers.delete(id), Connection,
  );
  const tree = module.exports.ShareIt({ initialMode: 'automatic' });
  effects.length = 0;
  tree.props.children[1].type(tree.props.children[1].props);
  const cleanup = effects.at(-1)();
  const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
  await settle();
  assert.equal(requests[0].action, 'join');
  const pollTimer = [...timers.entries()].find(([, timer]) => timer.delay === 5000);
  assert.ok(pollTimer, 'An idle receiver must schedule another poll');
  incoming.push({ from: 'sender', signal: { type: 'offer', description, files: [{ name: 'hello.txt', size: 5, type: 'text/plain' }] } });
  timers.delete(pollTimer[0]);
  await pollTimer[1].callback();
  assert.equal(requests[1].action, 'poll');
  assert.ok(states.includes('Incoming files — waiting for your approval'));
  assert.ok(states.some(value => value?.from === 'sender' && value.files[0].name === 'hello.txt'));
  assert.deepEqual(remoteDescriptions, [description]);
  cleanup();
  assert.equal(timers.size, 0);
  assert.equal(requests.at(-1).action, 'leave');
});

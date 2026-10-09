import test from 'node:test';
import assert from 'node:assert/strict';
import { discoveryNetwork } from '../lib/shareit/network.ts';

test('IPv6 privacy addresses on the same /64 discover one another', () => {
  assert.equal(discoveryNetwork('2001:db8:1234:5678:abcd:ef01:2345:6789'), discoveryNetwork('2001:db8:1234:5678:1111:2222:3333:4444'));
});
test('compressed, padded and uppercase IPv6 use the same group', () => {
  assert.equal(discoveryNetwork('2001:DB8:0:1::abcd'), discoveryNetwork('2001:0db8:0000:0001:0000:0000:0000:1234'));
  assert.equal(discoveryNetwork('::1'), discoveryNetwork('0:0:0:0:0:0:0:1'));
});
test('different IPv6 subnets and public IPv4 addresses remain separate', () => {
  assert.notEqual(discoveryNetwork('2001:db8:1:1::1'), discoveryNetwork('2001:db8:1:2::1'));
  assert.notEqual(discoveryNetwork('203.0.113.1'), discoveryNetwork('203.0.113.2'));
});
test('IPv4 mapped notation matches plain IPv4 without combining unrelated addresses', () => {
  for (const address of ['::ffff:203.0.113.7', '::ffff:cb00:7107', '0:0:0:0:0:ffff:cb00:7107']) {
    assert.equal(discoveryNetwork(address), discoveryNetwork('203.0.113.7'));
  }
  assert.notEqual(discoveryNetwork('::ffff:203.0.113.7'), discoveryNetwork('::ffff:203.0.113.8'));
});
test('invalid and scoped addresses cannot create a shared fallback group', () => {
  for (const address of ['', 'unknown', '203.0.113.999', '2001:::1', 'fe80::1%en0']) assert.equal(discoveryNetwork(address), null);
});

test('Cloudflare edges recover the same visitor address and discovery network', async () => {
  const { shareItClientAddress } = await import('../lib/shareit/network.ts');
  const clients = ['162.158.22.54', '172.71.8.144', '2606:4700::1'].map(edge => shareItClientAddress(new Headers({ 'x-forwarded-for': edge, 'cf-connecting-ip': '103.70.200.54' }), true));
  for (const client of clients) {
    assert.equal(client.address, '103.70.200.54');
    assert.equal(client.ipSource, 'cloudflare');
    assert.equal(discoveryNetwork(client.address), 'ipv4:103.70.200.54');
  }
});
test('direct requests cannot spoof the Cloudflare visitor header', async () => {
  const { shareItClientAddress } = await import('../lib/shareit/network.ts');
  const client = shareItClientAddress(new Headers({ 'x-forwarded-for': '203.0.113.1', 'cf-connecting-ip': '103.70.200.54' }), true);
  assert.equal(client.address, '203.0.113.1');
});
test('Cloudflare requests without a valid visitor IP do not group by proxy IP', async () => {
  const { shareItClientAddress } = await import('../lib/shareit/network.ts');
  for (const visitor of ['', 'garbage', '103.70.200.54, 1.2.3.4']) {
    const client = shareItClientAddress(new Headers({ 'x-forwarded-for': '162.158.22.54', 'cf-connecting-ip': visitor }), true);
    assert.equal(client.address, null);
    assert(client.warning);
  }
});
test('platform forwarded address takes priority over another forwarded header', async () => {
  const { shareItClientAddress } = await import('../lib/shareit/network.ts');
  const client = shareItClientAddress(new Headers({ 'x-vercel-forwarded-for': '203.0.113.1', 'x-forwarded-for': '162.158.22.54', 'cf-connecting-ip': '103.70.200.54' }), true);
  assert.equal(client.address, '203.0.113.1');
});

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

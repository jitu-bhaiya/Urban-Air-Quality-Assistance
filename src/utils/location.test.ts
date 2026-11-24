import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractPublicClientIp,
  formatNominatimPlace,
  haversineDistanceKm,
  isPrivateOrLocalIp,
} from './location';

test('isPrivateOrLocalIp identifies loopback, RFC1918 private, and public IPs', () => {
  assert.equal(isPrivateOrLocalIp('127.0.0.1'), true);
  assert.equal(isPrivateOrLocalIp('::1'), true);
  assert.equal(isPrivateOrLocalIp('::ffff:192.168.1.10'), true);
  assert.equal(isPrivateOrLocalIp('10.0.0.5'), true);
  assert.equal(isPrivateOrLocalIp('172.16.4.12'), true);
  assert.equal(isPrivateOrLocalIp('49.36.128.1'), false);
  assert.equal(isPrivateOrLocalIp('::ffff:49.36.128.1'), false);
});

test('extractPublicClientIp selects first public IP from forwarded headers', () => {
  assert.equal(
    extractPublicClientIp('10.0.0.2, 49.36.128.1, 172.16.0.1', undefined, '127.0.0.1'),
    '49.36.128.1'
  );
  assert.equal(extractPublicClientIp(undefined, undefined, '::1'), null);
});

test('formatNominatimPlace resolves city, state, and country cleanly', () => {
  assert.deepEqual(
    formatNominatimPlace({
      suburb: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
    }),
    { name: 'Bengaluru', state: 'Karnataka', country: 'India' }
  );
  assert.deepEqual(formatNominatimPlace(null), {
    name: 'Current Location',
    state: 'Detected Coordinates',
    country: 'Detected',
  });
});

test('haversineDistanceKm returns zero for identical coordinates and accurate urban distances', () => {
  assert.equal(haversineDistanceKm(12.9716, 77.5946, 12.9716, 77.5946), 0);
  const km = haversineDistanceKm(28.6139, 77.209, 28.4595, 77.0266); // New Delhi to Gurugram
  assert.ok(km > 20 && km < 30);
});

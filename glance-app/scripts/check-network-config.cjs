const assert = require('node:assert/strict');
const fs = require('node:fs');
const host = process.argv[2];
const main = fs.readFileSync('android/app/src/main/res/xml/glance_network_security.xml', 'utf8');
const debug = fs.readFileSync('android/app/src/debug/res/xml/glance_network_security.xml', 'utf8');
assert.equal(main, '<network-security-config><base-config cleartextTrafficPermitted="false" /></network-security-config>');
assert.ok(debug.includes('<base-config cleartextTrafficPermitted="false" />'));
assert.ok(fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8').includes('android:networkSecurityConfig="@xml/glance_network_security"'));
if (host) {
  assert.ok(debug.includes(`<domain includeSubdomains="false">${host}</domain>`));
  assert.equal((debug.match(/<domain /g) ?? []).length, 1);
} else assert.equal(main, debug);
console.log(`PASS: release cleartext denied; debug ${host ? `only ${host}, no subdomains` : 'cleartext denied'}.`);

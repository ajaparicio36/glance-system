const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const withLocalNetwork = require('../plugins/with-local-network');

function checkXml(root, host) {
  const main = fs.readFileSync(path.join(root, 'app/src/main/res/xml/glance_network_security.xml'), 'utf8').trim();
  const debug = fs.readFileSync(path.join(root, 'app/src/debug/res/xml/glance_network_security.xml'), 'utf8').trim();
  const strict = '<base-config cleartextTrafficPermitted="false" />';
  const hosts = [...new Set(['localhost', '127.0.0.1', '10.0.2.2', ...(host ? [host] : [])])];
  const exceptions = hosts.map(debugHost => `<domain-config cleartextTrafficPermitted="true"><domain includeSubdomains="false">${debugHost}</domain></domain-config>`).join('');
  assert.equal(main, `<network-security-config>${strict}</network-security-config>`);
  assert.equal(debug, `<network-security-config>${strict}${exceptions}</network-security-config>`);
  console.log(`PASS: release cleartext denied; debug exact Metro hosts${host ? ` plus ${host}` : ''}, no subdomains or other hosts.`);
}

async function checkFixtures() {
  const { normalizeSettings } = await import('../src/tracking/policy.ts');
  for (const host of ['public.example', 'localhost', '127.0.0.1', '10.0.2.2']) {
    assert.throws(() => normalizeSettings({ serverUrl: `http://${host}:3000`, ownerToken: 'synthetic-owner' }, '192.168.1.95', 'android'));
  }
  assert.throws(() => normalizeSettings({ serverUrl: 'http://192.168.1.95:3000', ownerToken: 'synthetic-owner' }, null, 'android'));
  assert.equal(normalizeSettings({ serverUrl: 'http://192.168.1.95:3000', ownerToken: 'synthetic-owner' }, '192.168.1.95', 'android').serverUrl, 'http://192.168.1.95:3000');
  console.log('PASS: runtime HTTP API still requires the configured host and development opt-in; Metro exceptions grant no API access.');
  const directory = path.resolve(__dirname, '../dist');
  fs.mkdirSync(directory, { recursive: true });
  const root = fs.mkdtempSync(path.join(directory, 'network-config-'));
  try {
    for (const host of [undefined, '192.168.1.95', 'localhost']) {
      const config = withLocalNetwork({ name: 'Network check', slug: 'network-check' }, { host });
      const modRequest = { platformProjectRoot: root };
      const manifest = await config.mods.android.manifest({ ...config, modRequest, modResults: { manifest: { application: [{ $: {} }] } } });
      assert.deepEqual(manifest.modResults.manifest.application[0].$, {
        'android:usesCleartextTraffic': 'false',
        'android:networkSecurityConfig': '@xml/glance_network_security',
      });
      await config.mods.android.dangerous({ ...config, modRequest });
      checkXml(root, host);
    }
  } finally {
    assert.equal(path.dirname(root), directory);
    assert.ok(path.basename(root).startsWith('network-config-'));
    fs.rmSync(root, { recursive: true, force: true });
  }
}

if (process.argv[2] === '--fixture') {
  checkFixtures().catch(error => { console.error(error); process.exitCode = 1; });
} else {
  const root = path.resolve('android');
  checkXml(root, process.argv[2]);
  const manifest = fs.readFileSync(path.join(root, 'app/src/main/AndroidManifest.xml'), 'utf8');
  assert.ok(manifest.includes('android:usesCleartextTraffic="false"'));
  assert.ok(manifest.includes('android:networkSecurityConfig="@xml/glance_network_security"'));
}

const fs = require('node:fs/promises');
const path = require('node:path');
const { withAndroidManifest, withDangerousMod, withInfoPlist } = require('expo/config-plugins');

module.exports = function withLocalNetwork(config, { host }) {
  config = withAndroidManifest(config, (result) => {
    const application = result.modResults.manifest.application[0];
    application.$['android:usesCleartextTraffic'] = 'false';
    application.$['android:networkSecurityConfig'] = '@xml/glance_network_security';
    return result;
  });
  config = withDangerousMod(config, ['android', async (result) => {
    const directory = path.join(result.modRequest.platformProjectRoot, 'app/src/main/res/xml');
    await fs.mkdir(directory, { recursive: true });
    const strict = '<network-security-config><base-config cleartextTrafficPermitted="false" /></network-security-config>';
    await fs.writeFile(path.join(directory, 'glance_network_security.xml'), strict);
    const debugDirectory = path.join(result.modRequest.platformProjectRoot, 'app/src/debug/res/xml');
    await fs.mkdir(debugDirectory, { recursive: true });
    const debugHosts = [...new Set(['localhost', '127.0.0.1', '10.0.2.2', ...(host ? [host] : [])])];
    const exception = debugHosts.map(debugHost => `<domain-config cleartextTrafficPermitted="true"><domain includeSubdomains="false">${debugHost}</domain></domain-config>`).join('');
    await fs.writeFile(path.join(debugDirectory, 'glance_network_security.xml'), `<network-security-config><base-config cleartextTrafficPermitted="false" />${exception}</network-security-config>`);
    return result;
  }]);
  return withInfoPlist(config, (result) => {
    result.modResults.NSAppTransportSecurity = {
      NSAllowsArbitraryLoads: false,
      ...(host && !/^\d+\.\d+\.\d+\.\d+$/.test(host) ? {
        NSExceptionDomains: { [host]: {
          NSIncludesSubdomains: false,
          NSExceptionAllowsInsecureHTTPLoads: true,
        } },
      } : {}),
    };
    return result;
  });
};

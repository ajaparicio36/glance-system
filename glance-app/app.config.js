const withLocalNetwork = require('./plugins/with-local-network');

module.exports = ({ config }) => {
  const localHttpHost = process.env.GLANCE_TRUSTED_LOCAL === '1' ? process.env.GLANCE_LOCAL_HTTP_HOST : '';
  if (localHttpHost && !/^(localhost|[a-zA-Z0-9.-]+)$/.test(localHttpHost)) {
    throw new Error('GLANCE_LOCAL_HTTP_HOST must be one hostname or IPv4 address without port or path.');
  }
  return withLocalNetwork({
    ...config,
    name: 'Glance',
    ios: { ...config.ios, bundleIdentifier: 'com.glance.tracker' },
    android: { ...config.android, package: 'com.glance.tracker' },
    extra: { ...config.extra, localHttpHost: localHttpHost || null },
  }, { host: localHttpHost });
};

import { isIP } from 'node:net';

export type Config = {
  databaseUrl: string;
  deviceId: string;
  deviceToken: string;
  ownerToken: string;
  host: string;
  port: number;
  transportMode: 'trusted-local' | 'https-proxy' | 'render-edge';
  trustedProxy: string | undefined;
};

export function readConfig(environment: NodeJS.ProcessEnv = process.env): Config {
  const required = (name: string): string => {
    const value = environment[name];
    if (!value) throw new Error(`Missing ${name}`);
    return value;
  };
  const databaseUrl = required('DATABASE_URL');
  const database = new URL(databaseUrl);
  if (!['postgres:', 'postgresql:'].includes(database.protocol)) throw new Error('Invalid database protocol');
  const deviceId = required('DEVICE_ID');
  if (/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.exec(deviceId)?.[0] !== deviceId) throw new Error('Invalid DEVICE_ID');
  const deviceToken = required('DEVICE_TOKEN');
  const ownerToken = required('OWNER_TOKEN');
  for (const token of [deviceToken, ownerToken]) {
    if (/^[A-Za-z0-9_-]{32,128}$/.exec(token)?.[0] !== token || /^(SET_|YOUR_)|placeholder|change.?me|example|replace/i.test(token)) {
      throw new Error('Tokens must be nonplaceholder random base64url secrets of 32–128 characters');
    }
  }
  if (deviceToken === ownerToken) throw new Error('Upload and owner tokens must differ');
  const transportMode = required('TRANSPORT_MODE');
  if (transportMode !== 'trusted-local' && transportMode !== 'https-proxy' && transportMode !== 'render-edge') throw new Error('Invalid TRANSPORT_MODE');
  if (environment.NODE_ENV === 'production' && transportMode === 'trusted-local') throw new Error('Production requires a secure deployment transport');
  if (transportMode === 'render-edge' && (environment.RENDER !== 'true' || environment.RENDER_SERVICE_TYPE !== 'web')) {
    throw new Error('Render edge mode requires Render web service markers');
  }
  const trustedProxy = environment.TRUSTED_PROXY;
  if (transportMode === 'https-proxy' && (!trustedProxy || !isIP(trustedProxy))) throw new Error('TRUSTED_PROXY must be one exact proxy IP');
  const port = Number(environment.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  return { databaseUrl, deviceId, deviceToken, ownerToken, transportMode, trustedProxy, port, host: environment.HOST ?? '0.0.0.0' };
}

import { isIP } from 'node:net';

export type Config = {
  databaseUrl: string;
  deviceId: string;
  deviceIds: string[];
  deviceToken: string;
  ownerToken: string;
  host: string;
  port: number;
  transportMode: 'trusted-local' | 'https-proxy' | 'render-edge' | 'railway-edge';
  trustedProxy: string | undefined;
};

export function validateDeviceIds(deviceId: string, deviceIds: readonly string[]): void {
  if (deviceIds.length < 1 || deviceIds.length > 2 || new Set(deviceIds).size !== deviceIds.length ||
      !deviceIds.includes(deviceId) || [deviceId, ...deviceIds].some(id => /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.exec(id)?.[0] !== id)) {
    throw new Error('DEVICE_IDS must contain one or two unique valid identities including DEVICE_ID');
  }
}

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
  const deviceIds = environment.DEVICE_IDS === undefined ? [deviceId] : environment.DEVICE_IDS.split(',');
  validateDeviceIds(deviceId, deviceIds);
  const deviceToken = required('DEVICE_TOKEN');
  const ownerToken = required('OWNER_TOKEN');
  for (const token of [deviceToken, ownerToken]) {
    if (/^[A-Za-z0-9_-]{32,128}$/.exec(token)?.[0] !== token || /^(SET_|YOUR_)|placeholder|change.?me|example|replace/i.test(token)) {
      throw new Error('Tokens must be nonplaceholder random base64url secrets of 32–128 characters');
    }
  }
  if (deviceToken === ownerToken) throw new Error('Upload and owner tokens must differ');
  const transportMode = required('TRANSPORT_MODE');
  if (transportMode !== 'trusted-local' && transportMode !== 'https-proxy' && transportMode !== 'render-edge' && transportMode !== 'railway-edge') throw new Error('Invalid TRANSPORT_MODE');
  if (environment.NODE_ENV === 'production' && transportMode === 'trusted-local') throw new Error('Production requires a secure deployment transport');
  if (transportMode === 'render-edge' && (environment.RENDER !== 'true' || environment.RENDER_SERVICE_TYPE !== 'web')) {
    throw new Error('Render edge mode requires Render web service markers');
  }
  if (transportMode === 'railway-edge') {
    for (const name of ['RAILWAY_PROJECT_ID', 'RAILWAY_ENVIRONMENT_ID', 'RAILWAY_SERVICE_ID']) {
      const marker = required(name);
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.exec(marker)?.[0] !== marker) {
        throw new Error('Railway edge mode requires Railway UUID project, environment and service markers');
      }
    }
    const domain = environment.RAILWAY_PUBLIC_DOMAIN;
    if (domain !== undefined && (domain.length > 253 ||
        /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.exec(domain)?.[0] !== domain)) {
      throw new Error('RAILWAY_PUBLIC_DOMAIN must be a hostname when provided');
    }
  }
  const trustedProxy = environment.TRUSTED_PROXY;
  if (transportMode === 'https-proxy' && (!trustedProxy || !isIP(trustedProxy))) throw new Error('TRUSTED_PROXY must be one exact proxy IP');
  const port = Number(environment.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  return { databaseUrl, deviceId, deviceIds, deviceToken, ownerToken, transportMode, trustedProxy, port, host: environment.HOST ?? '0.0.0.0' };
}

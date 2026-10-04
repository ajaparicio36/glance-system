import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer, isIP } from 'node:net';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseEnv, promisify } from 'node:util';
import { readConfig } from '../../glance-server/src/config.ts';

const root = fileURLToPath(new URL('../..', import.meta.url));
const configPath = fileURLToPath(new URL('../../glance-server/.env', import.meta.url));
const execute = promisify(execFile);
const project = 'glance-bench';

async function availablePort(preferred) {
  const server = createServer();
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(preferred, '127.0.0.1', resolve);
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No loopback port');
    return address.port;
  } finally { if (server.listening) await new Promise(resolve => { server.close(resolve); }); }
}

try {
  if (!existsSync(configPath)) {
    const existing = await execute('docker', ['volume', 'ls', '--filter', `name=${project}_glance_dev_db`, '--format', '{{.Name}}'], { windowsHide: true });
    if (existing.stdout.trim()) throw new Error('Existing bench volume needs its original credentials; no reset performed');
    const databasePort = await availablePort(5432).catch(() => availablePort(0));
    const password = randomBytes(32).toString('base64url');
    const values = {
      DATABASE_URL: `postgres://glance:${password}@127.0.0.1:${databasePort}/glance`,
      POSTGRES_PASSWORD: password,
      DEVICE_ID: 'prototype-001',
      DEVICE_TOKEN: randomBytes(32).toString('base64url'),
      OWNER_TOKEN: randomBytes(32).toString('base64url'),
      TRANSPORT_MODE: 'trusted-local',
      HOST: '192.168.1.95',
      PORT: '3000',
    };
    await writeFile(configPath, Object.entries(values).map(([name, value]) => `${name}=${value}`).join('\n') + '\n', { flag: 'wx', mode: 0o600 });
    console.log('Created ignored glance-server/.env with separate private upload/owner credentials.');
  }
  const values = parseEnv(await readFile(configPath, 'utf8'));
  const environment = { ...process.env, ...values };
  const config = readConfig(environment);
  const database = new URL(config.databaseUrl);
  const privateLan = isIP(config.host) === 4 && /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(config.host);
  const localAddress = Object.values(networkInterfaces()).flat().some(address => address?.family === 'IPv4' && !address.internal && address.address === config.host);
  if (!privateLan || !localAddress) throw new Error('HOST must be an explicitly configured local private LAN address, not all interfaces/VPN; config preserved');
  if (config.deviceId !== 'prototype-001' || config.transportMode !== 'trusted-local' || config.port !== 3000 ||
      database.hostname !== '127.0.0.1' || database.username !== 'glance' || database.pathname !== '/glance') {
    throw new Error('Existing config is not this bench; preserved unchanged');
  }
  const password = decodeURIComponent(database.password);
  if (!password || (values.POSTGRES_PASSWORD && values.POSTGRES_PASSWORD !== password)) throw new Error('Database password mismatch; config preserved');
  if (process.argv.includes('--prepare')) {
    console.log('Private bench config ready for firmware provisioning; no server/database started.');
  } else {
    const result = await execute('docker', ['compose', '--project-name', project, '--env-file', configPath, '-f', 'docker-compose.dev.yml', 'up', '-d', '--wait', '--wait-timeout', '120'], {
      cwd: root,
      windowsHide: true,
      timeout: 150000,
      env: { ...environment, POSTGRES_PASSWORD: password, POSTGRES_PORT: database.port || '5432' },
    });
    if (result.stdout.trim()) console.log(result.stdout.trim());
    console.log(`Database ready: project ${project}, loopback port ${database.port || '5432'}. Existing config/data preserved.`);
    console.log(`Start server from glance-server with pnpm start; LAN endpoint http://${config.host}:3000. Clear conflicting inherited server environment first.`);
  }
} catch (error) {
  console.error(error instanceof Error && !('stdout' in error) ? error.message : 'Bench preparation failed; check Docker/port availability. Credentials are not logged.');
  process.exitCode = 1;
}

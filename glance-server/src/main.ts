import { createApp } from './app.ts';
import { readConfig } from './config.ts';
import { createStore } from './store.ts';

try {
  const config = readConfig();
  const store = await createStore(config.databaseUrl, config.deviceId);
  const app = await createApp(config, store).catch(async error => { await store.close(); throw error; });
  const shutdown = (): void => {
    const deadline = setTimeout(() => { process.exit(1); }, 10000);
    deadline.unref();
    void app.close().then(() => { clearTimeout(deadline); }).catch(() => { process.exitCode = 1; });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  try {
    await app.listen({ host: config.host, port: config.port });
  } catch {
    await app.close();
    throw new Error('Listen failed');
  }
} catch {
  console.error('Server startup failed; check configuration, database availability, and port. Secrets are not logged.');
  process.exitCode = 1;
}

# Prototype server

Node 24.13+ runs erasable TypeScript directly. Fastify 5, Drizzle and postgres-js use the canonical `shared/` modules and [protocol](protocol.md). There is no bundler, account registration, GPS trail, or process-only transaction mutex.

## Trusted local development

Use a trusted private LAN only: HTTP/ws exposes upload and owner credentials to observers. Keep Windows firewall access limited to that LAN. `TRANSPORT_MODE=trusted-local` is an explicit development exception; production rejects it.

From repository root in PowerShell, generate three **different** random secrets, then start the database-only development service:

```powershell
$env:POSTGRES_PASSWORD = node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
$env:DEVICE_TOKEN = node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
$env:OWNER_TOKEN = node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
$env:DEVICE_ID = 'prototype-001'
$env:DATABASE_URL = "postgres://glance:$($env:POSTGRES_PASSWORD)@127.0.0.1:5432/glance"
$env:TRANSPORT_MODE = 'trusted-local'
docker compose -f docker-compose.dev.yml up -d --wait
cd glance-server
pnpm install --frozen-lockfile
pnpm check
pnpm start
```

Persist generated credentials privately if you need them across terminals/restarts. Alternatively copy `glance-server/.env.example` to `glance-server/.env`, replace every placeholder, and use `pnpm start` or `pnpm dev`. Never commit real `.env` files. Device IDs are 1–64 ASCII characters matching `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$`; tokens must be different random base64url strings, 32–128 characters. Startup refuses placeholders and identity changes against an existing database. Use URL-encoded passwords in DATABASE_URL; generated base64url secrets need no additional encoding.

Default bind is `0.0.0.0:3000`. The device and phone need the server computer's actual LAN address, for example `http://192.168.1.20:3000` and `ws://192.168.1.20:3000/api/live`, **not their own localhost**. Configure firmware/native trusted-local permissions narrowly for this development endpoint. Development PostgreSQL is published only on computer loopback; `POSTGRES_PORT` can change its default 5432. SIGINT/SIGTERM closes sockets and database pools.

## Exact route examples

These PowerShell/curl commands run in a second terminal containing the same generated credentials. The upload below is a **labelled synthetic integration fixture**, not live-GPS evidence. Actual hardware must provide valid live GPS coordinates and UTC observation time. Timestamps must be exactly `YYYY-MM-DDTHH:mm:ss.sssZ`.

```powershell
$base = 'http://192.168.1.20:3000'
curl.exe --fail-with-body "$base/health"
$snapshot = curl.exe --fail-with-body -H "Authorization: Bearer $env:OWNER_TOKEN" "$base/api/snapshot" | ConvertFrom-Json
$version = if ($null -eq $snapshot.geofence) { 0 } else { $snapshot.geofence.version }
$fence = @{ expectedVersion = $version; vertices = @(
  @{latitude=11;longitude=124}, @{latitude=11;longitude=125},
  @{latitude=12;longitude=125}, @{latitude=12;longitude=124}
) } | ConvertTo-Json -Depth 5 -Compress
curl.exe --fail-with-body -X PUT -H "Authorization: Bearer $env:OWNER_TOKEN" --json $fence "$base/api/geofence"
$upload = @{deviceId=$env:DEVICE_ID;latitude=11.123456;longitude=124.123456;observedAt=[DateTime]::UtcNow.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'")} | ConvertTo-Json -Compress
curl.exe --fail-with-body -H "Authorization: Bearer $env:DEVICE_TOKEN" --json $upload "$base/api/locations"
curl.exe --fail-with-body -H "Authorization: Bearer $env:OWNER_TOKEN" "$base/api/snapshot"
```

PUT returns the updated Snapshot directly; POST returns `{accepted:boolean,revision:number}`. Invalid structure/coordinates/polygons/timestamps return 400, wrong configured identity 403, bad/missing credentials 401, conflicting fence version 409, unavailable database 503. Owner credentials cannot upload and device credentials cannot read/manage/subscribe. No query parameters are supported, particularly credentials in URLs. Public `/health` returns only `{ok:boolean}` and HTTP 200/503 based on a database probe; it does not prove security or GPS readiness.

For RFC6455 live access, save/run this Node 24 example with `BASE_URL` and `OWNER_TOKEN` set in the environment:

```js
const endpoint = new URL('/api/live', process.env.BASE_URL);
endpoint.protocol = endpoint.protocol === 'https:' ? 'wss:' : 'ws:';
const socket = new WebSocket(endpoint);
socket.addEventListener('open', () => socket.send(JSON.stringify({type:'authenticate',token:process.env.OWNER_TOKEN})));
socket.addEventListener('message', event => console.log(JSON.parse(event.data)));
socket.addEventListener('close', event => console.log('closed', event.code));
```

The first text frame must authenticate within 5 seconds. No snapshot is sent before authorization. Reconnect and authenticate again for a complete current snapshot. Changes from all PostgreSQL writers are checked each second; equal-revision serverTime heartbeats arrive every 5 seconds. Clients reject older revisions, may refresh time on equal revisions, and must not duplicate alerts. Limits: 32 live connections per server, 1024-byte incoming frames, 256KiB outbound buffered data, ping/pong liveness (30-second ping interval), 16KiB HTTP bodies, 100 polygon vertices. Further client frames close the socket; this channel is server-to-client after authentication. A deployment proxy must also bound request rates/connections and preserve WebSocket upgrade headers.

## State, migrations and concurrency

On startup, `migrations/0001.sql` initializes the server-owned PostgreSQL tables under an advisory transaction lock; repeated startup is safe. Drizzle schema is `src/schema.ts`. A persistent singleton row locks all telemetry/fence mutations with `SELECT FOR UPDATE`; snapshots hold `FOR SHARE` across state/incident reads. Revision, accepted fix, boundary evaluation, fence replacement and incident resolution commit together. A PostgreSQL partial unique index prevents more than one open incident per configured device, and a foreign key ties incidents to the configured identity. This deliberately serializes the single-node demonstration; increase the scope only when multiple configured trackers are required. Migration failures prevent listening. Back up the persistent volume before future schema upgrades; no automatic destructive reset occurs.

An accepted observation must be newer than the latest stored timestamp, younger than 15 seconds, and no more than 5 seconds in the future. Expired/future/duplicate/out-of-order fixes return accepted=false, preserving revision, receipt freshness, boundary status and incidents. Accepted receipts and observation times are both needed for freshness: a 14-second-old accepted observation becomes stale about one second later, not another 15 seconds later. Upload cadence is 5 seconds. Passage of time does not mutate revision or close an incident. No GPS/link loss cannot fake a return; last valid coordinates remain historical. Boundary status is the last evaluation, **not a claim of current safety**; clients derive stale presentation from serverTime and shared freshness helpers.

Edges/vertices count as inside. Initial outside creates one episode; repeated outside keeps it; fresh inside resolves `returned` with return coordinates/time. Fence replacement resolves open episodes as `fence_changed` with no return position, retains the last location, resets boundary to unknown, and waits for the next **accepted** fix to evaluate. Version comparison is fence-only, independent of telemetry revision. All incidents are retained in PostgreSQL; snapshot projects at most the newest 100, reserving room for every open episode, so active IDs always resolve. No location history table exists.

## Production HTTPS/wss

Set `POSTGRES_PASSWORD`, `DATABASE_URL=postgres://glance:<URL-encoded-password>@db:5432/glance`, `DEVICE_ID`, both tokens and `TRUSTED_PROXY` before:

```powershell
docker compose -f docker-compose.prod.yml up -d --build --wait
```

The root build context includes `shared/` alongside the server. Production runs Node 24 Alpine as nonroot with a read-only root filesystem and dropped capabilities, waits for the DB healthcheck, applies initialization, then listens. PostgreSQL has a persistent volume and **no published port**. Server HTTP is published to host loopback only, for an independently configured TLS reverse proxy. The proxy itself is intentionally not provisioned by these files. Keep credentials in a secret-managed environment; do not print expanded Compose configuration in shared logs.

`TRUSTED_PROXY` must be the **exact IP of the connecting reverse proxy as seen inside the server container** (often its host bridge gateway for a host proxy); never trust all peers or an entire public subnet. Restrict direct server reachability. The proxy must overwrite, not append untrusted client `X-Forwarded-Proto`, set it to `https`, serve valid TLS certificates, support RFC6455 upgrades, and use suitably long live-channel idle timeouts. Without a trusted HTTPS forward, protected HTTP and WebSocket requests are rejected. `/health` remains available internally. Do not bypass certificate verification in firmware, curl, Node, mobile clients or a proxy-to-cloud connection; use HTTPS/wss URLs with normal CA verification. Docker's private database network is not a public DB endpoint; an external PostgreSQL service additionally needs certificate-verified TLS configured in DATABASE_URL per postgres-js options. TLS termination/certificate provisioning and native/firmware configuration need deployment-specific verification.

Logs suppress request URLs/bodies and redact authorization/token fields. Startup/request database failures log generic messages rather than credential-bearing driver errors. This is one configured device/owner, not a multi-tenant service. Rate limits, reverse proxy provisioning, hardware GPS and background mobile delivery are not proven by backend integration checks.

## Real integration check

Use a **new, dedicated** `glance_test_*` database on every run; the test refuses a nonempty public schema and never clears an existing database. Example temporary Docker database from the repository root, once the engine is running:

```powershell
$name = 'glance-backend-check-' + [Guid]::NewGuid().ToString('N')
$password = node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
docker run -d --name $name -e POSTGRES_USER=glance_test_admin -e "POSTGRES_PASSWORD=$password" -e POSTGRES_DB=glance_test_backend -p 127.0.0.1::5432 postgres:16-alpine
try {
  for ($attempt=0; $attempt -lt 30; $attempt++) {
    docker exec $name pg_isready -U glance_test_admin -d glance_test_backend
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 1
  }
  $mapping = docker port $name 5432/tcp
  $port = ($mapping -split ':')[-1]
  $env:TEST_DATABASE_URL = "postgres://glance_test_admin:$password@127.0.0.1:$port/glance_test_backend"
  Push-Location glance-server
  try { pnpm check; pnpm test } finally { Pop-Location }
} finally { docker rm -f -v $name }
```

The built-in Node check exercises real HTTP listeners and two independent Drizzle/PostgreSQL pools: auth separation, malformed inputs with no mutations, initial outside/repeat/return, inclusive edge, timestamp order/age/skew, stale retention, delayed-observation freshness, fence replacement/version races, concurrent writers, PostgreSQL active-incident invariant, durable reload, retained records with a 100-item view, preauth silence/deadline, malformed/oversized frames, cross-writer live updates, heartbeat and reconnect. Run `pnpm check` for strict TypeScript; no test framework is installed.

### Verification on 3 October 2026

Historical first run: strict TypeScript and two real PostgreSQL/HTTP/WS tests passed against an isolated native PostgreSQL 18.4 cluster under ignored `glance-server/.test-run/`. That cluster was stopped. Docker Desktop then failed initializing `dockerInference`; no factory reset, socket deletion or unrelated service repair was attempted. The user subsequently repaired Docker. The earlier Docker failure is **not a current blocker**.

Actual Docker verification now passes with Docker 29.2.0, PostgreSQL **16.14** from `postgres:16-alpine`, and production Node **24.13.0**:

- Development Compose contains only `db`, starts healthy, publishes PostgreSQL exclusively to an ephemeral loopback port, and mounts its project-specific persistent volume.
- The unchanged integration suite ran against a newly created `glance_test_docker_fb36c3b4` database: **2 passed, 0 failed**, total **31434.6967ms**. The first test exercises real PostgreSQL/HTTP/WS; the second checks configuration. Strict TypeScript passed.
- The actual production Dockerfile built using `pnpm install --prod --frozen-lockfile`, including the root-context shared modules. Production Compose started both services healthy. Inspection proved UID 1000/nonroot, read-only root filesystem, `CapDrop=[ALL]`, `no-new-privileges:true`, a persistent database volume, and no published database port.
- A disposable TLS reverse proxy on the production project's private network was the exact configured `TRUSTED_PROXY`. Node clients added its generated test CA to the normal trust store using `NODE_EXTRA_CA_CERTS`, with no TLS-verification bypass inherited. Real HTTPS/WSS passed owner/device authorization, invalid input, initial/repeated outside, inclusive-edge return, fence version conflict/replacement, duplicate/order/age/skew rejection, stale preservation, WebSocket preauth silence/deadline, update and reconnect. Direct HTTP and spoofed forwarded headers from an untrusted peer were rejected. Without the test CA, the client failed with a TLS certificate error.
- Stopping the owned production server/database produced server exit code 0. Starting both again restored healthy services and exactly preserved revision, fence, last location and incident projection, excluding the deliberately refreshed serverTime. Server logs contained none of the disposable credentials.

The isolation correction was verified by rerunning with deliberately conflicting inherited DATABASE_URL, tokens, identity, ports and TRUSTED_PROXY. The temporary runner passes `{env:{...process.env,...values}}` to every Compose invocation so generated values override the shell; `--env-file` alone would not do that. It removes `NODE_TLS_REJECT_UNAUTHORIZED` from both trusted and untrusted TLS client environments. No existing database was accessed.

Exact commands and sanitized results are retained locally in ignored `glance-server/.test-run/docker-fb36c3b4/evidence.log`; the two-test output is `postgres16-tests.log`, and runtime/image/port/isolation metadata is `summary.json`. The temporary orchestration and TLS proxy scripts remain under ignored `glance-server/.test-run/`; no new production code, dependency, or committed harness was needed. The local verification invocation was:

```powershell
$env:OPENSSL_EXECUTABLE = 'C:/Program Files/Git/usr/bin/openssl.exe'
node glance-server/.test-run/docker-runtime.mjs
```

That script reused `node node_modules/typescript/bin/tsc --noEmit` and `node --test test/integration.test.ts` from `glance-server`, then invoked `docker compose --project-name <unique-name> --env-file <ignored-file> -f <dev-or-prod-file> config --quiet`, development `up -d --wait`, production `build server` and `up -d --wait`, scoped `stop server db`, and a second production `up -d --wait`. The normal `pnpm check`/`pnpm test` commands still use the same existing checks.

Only verification resources were removed: projects `glance-verify-dev-fb36c3b4` / `glance-verify-prod-fb36c3b4`, their volumes/networks/containers, and `glance-verify-prod-fb36c3b4-tls-proxy`. Earlier `bfda5de6` and `c3d2f2a0` verification projects were also cleaned. Images/build cache and ignored evidence were retained. The six unrelated `falsisters-pos-dev-*` containers kept identical IDs, running state, start times and restart counts before/after all checks. No daemon restart, prune, reset or unrelated configuration change occurred.

These are synthetic software fixtures, not live GPS/native/hardware evidence. A generated local test CA proves the tested transport and proxy trust boundary, **not** real cloud hostname/certificate provisioning, a deployment's actual proxy configuration, mobile certificate behavior or firmware TLS. Those deployment-specific and native/hardware checks remain outstanding.

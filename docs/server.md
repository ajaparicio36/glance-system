# Prototype server

Node 24.13+ runs erasable TypeScript directly. Fastify 5, Drizzle and postgres-js use the canonical `shared/` modules and [protocol](protocol.md). There is no bundler, account registration, GPS trail, or process-only transaction mutex.

## Trusted local development

Use a trusted private LAN only: HTTP/ws exposes upload and owner credentials to observers. Keep Windows firewall access limited to that LAN. `TRANSPORT_MODE=trusted-local` is an explicit development exception; production rejects it.

### October 4 bench: prototype first

The confirmed Ethernet address is **192.168.1.95**. Private credentials are provisioned in ignored `glance-server/.env`: separate upload/owner tokens, `DEVICE_ID=prototype-001`, explicit trusted-local mode, **`HOST=192.168.1.95`**, port 3000, and a matching local database password. This bench binds Ethernet only, not all interfaces or Hamachi/VPN address 25.5.146.49. No root `.env` is needed. The uploaded tracker identity stays the same when moving from the direct GPS/WiFi prototype to one GPS/LoRa slave forwarded by a no-GPS master. Do not run both sources simultaneously under this singleton identity.

From repository root in PowerShell, use the minimal bench helper:

```powershell
node tools/dev/start-local.mjs --prepare
node tools/dev/start-local.mjs
cd glance-server
pnpm install --frozen-lockfile
pnpm check
'DATABASE_URL','DEVICE_ID','DEVICE_TOKEN','OWNER_TOKEN','TRANSPORT_MODE','HOST','PORT','NODE_ENV','TRUSTED_PROXY' | ForEach-Object { Remove-Item "Env:$_" -ErrorAction SilentlyContinue }
pnpm start
```

`--prepare` creates the private file only if absent, ready for firmware provisioning without starting services. The normal invocation reuses `docker-compose.dev.yml` under the dedicated `glance-bench` project, derives its database password and loopback port from the private DATABASE_URL, and explicitly overrides inherited Compose variables. It prefers free port 5432 when creating a new config, otherwise chooses a free loopback port. Existing credentials are never rewritten; an existing bench volume without its original config is refused, not reset. HOST must explicitly select a current local RFC1918 IPv4 interface; all-interface and public addresses, including this Hamachi address, are refused without modifying existing config. This is address validation, not VPN detection: a VPN interface using a private address can pass. The bench explicitly selects Ethernet 192.168.1.95. Do not delete the volume or regenerate secrets between sessions. Node `--env-file` does not override inherited variables: the PowerShell environment cleanup affects only that terminal and lets the existing `pnpm start` script read the private file instead of another project's settings. Any background launch must similarly pass the private file's values explicitly over inherited environment.

The previously owned background server was stopped on October 4 so the user can run `pnpm start` or `pnpm dev` in their own terminal; the coordinator confirmed no listener on port 3000 at the time it was stopped. An independently started user backend may now be listening; leave it under its owner's control. The historical PID/entrypoint/start metadata remains in ignored `tools/dev/.env.bench-server.json`, and its historical log is `tools/dev/.env.bench-server.log`; the record is not proof that the old process is still running. Check the actual listener before starting another process; do not terminate an unrelated port owner or a recycled PID. The owned database `glance-bench-db-1` remains healthy with volume `glance-bench_glance_dev_db`, published only at `127.0.0.1:5432`. Preserve that volume for the owner fence, last location and episodes.

For a foreground `pnpm start`, stop the server with Ctrl+C. To stop only the recorded background server from repository root in PowerShell, verify its process identity/start time before termination:

```powershell
$record = Get-Content tools/dev/.env.bench-server.json | ConvertFrom-Json
$owned = Get-CimInstance Win32_Process -Filter "ProcessId = $($record.pid)"
$started = if ($record.startedAt -is [DateTime]) { $record.startedAt.ToUniversalTime() } else { [DateTimeOffset]::Parse($record.startedAt).UtcDateTime }
if ($null -eq $owned -or $owned.Name -ne 'node.exe' -or $owned.CommandLine -notmatch 'src/main.ts' -or [Math]::Abs(($owned.CreationDate.ToUniversalTime() - $started).TotalSeconds) -gt 5) { throw 'Ownership check failed; stop nothing' }
Stop-Process -Id $record.pid
'POSTGRES_PASSWORD','POSTGRES_PORT' | ForEach-Object { Remove-Item "Env:$_" -ErrorAction SilentlyContinue }
docker compose --env-file glance-server/.env --project-name glance-bench -f docker-compose.dev.yml stop db
```

Compose parses required variables even for `stop`: the private env file supplies POSTGRES_PASSWORD, and clearing inherited POSTGRES_PASSWORD/POSTGRES_PORT prevents another project's values from taking precedence. With this bench's loopback port 5432, the Compose default matches; stopping does not recreate or change port bindings. The stop command preserves the bench volume and affects no other Compose project. Do not use `down --volumes`, reset, prune, or generic process-name termination. Starting again uses the helper and existing `pnpm start` workflow above. If DHCP changes the Ethernet IP, stop the owned server and explicitly update private HOST, firmware/app URLs and the exact Android debug host exception before rebuilding/restarting; do not silently bind every interface.

Never commit real `.env` files. Device IDs are 1–64 ASCII characters matching `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$`; tokens must be different random base64url strings, 32–128 characters. Startup refuses placeholders and identity changes against an existing database. Use URL-encoded passwords in DATABASE_URL; generated base64url secrets need no additional encoding. The firmware worker privately reads only DEVICE_TOKEN and DEVICE_ID; OWNER_TOKEN is for the app/owner, not the firmware.

The backend's general default remains `0.0.0.0:3000`; this bench explicitly overrides it with the Ethernet-only HOST above. Device upload URL is **`http://192.168.1.95:3000/api/locations`**; owner/app base URL is **`http://192.168.1.95:3000`** and live channel **`ws://192.168.1.95:3000/api/live`**, not the device/phone's localhost. Configure firmware's scoped trusted-LAN opt-in. Android needs a debug development-build rebuild with exactly `GLANCE_LOCAL_HTTP_HOST=192.168.1.95`; an older build configured for another IP will not acquire this exception from a URL change. Release/global cleartext weakening is not permitted. No broad Windows firewall rule was added; the successful PC-to-own-LAN-address check does not prove a phone/device can cross the firewall or AP isolation. Public cloud still requires certificate-verified HTTPS/wss.

For the later pair, provision slave `deviceId`/radio `sourceDeviceId` and the master's expected `sourceDeviceId` as **prototype-001**, not the checked-in examples' **slave-01**. The master preserves the slave's observation identity, coordinates and canonical GPS UTC timestamp; it never registers/uploads its own position. Server receipt time does not replace GPS time. Master reception needs valid system time via its configured NTP server (`pool.ntp.org` by default): allow Internet NTP or provide a genuinely operational LAN NTP service. This HTTP service is not an NTP server; do not point NTP at this PC unless an actual time service is separately provided. The existing 15-second age gate and 5-second future-skew limit apply to forwarded fixes too. No backend route/schema change is required.

The client can provide two devices; the prototype ESP32-C3 needs replacement because one appears burnt. Prototype remains first priority. Device availability is not electrical validation: keep USB-only demo power, battery/solar deferral, rails/polarity/common-ground/UART checks and radio band/antenna/legal gates intact. No hardware, live GPS or RF test was performed here. SIGINT/SIGTERM closes sockets and database pools.

## Exact route examples

These PowerShell/curl commands run from repository root in a second terminal. Load credentials privately from the existing file; do not print the resulting object. The upload below is a **labelled synthetic integration fixture**, not live-GPS evidence, and should not be used to seed the waiting hardware bench. Actual hardware must provide valid live GPS coordinates and UTC observation time. Timestamps must be exactly `YYYY-MM-DDTHH:mm:ss.sssZ`.

```powershell
$private = node -e "process.stdout.write(JSON.stringify(require('node:util').parseEnv(require('node:fs').readFileSync('glance-server/.env','utf8'))))" | ConvertFrom-Json
$env:OWNER_TOKEN = $private.OWNER_TOKEN
$env:DEVICE_TOKEN = $private.DEVICE_TOKEN
$env:DEVICE_ID = $private.DEVICE_ID
$base = 'http://192.168.1.95:3000'
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

### Render deployment prerequisites

Render runs the server image, not `docker-compose.prod.yml`. Reuse the existing Glance managed PostgreSQL database; do not create another database, change its plan, or attach a Docker database volume. Choose the database's existing workspace and region so its **internal connection URL** is reachable. Set `DATABASE_URL` privately from that URL; never commit or paste it into build logs. Internal PostgreSQL traffic stays on Render's private network. Render documents optional internal TLS with self-signed certificates, so do not assume its internal endpoint supports certificate-verified TLS. This setup uses the private internal URL without a public database connection; external database access needs a separate certificate-verified client configuration, not `rejectUnauthorized:false`.

Use these service settings once the proxy prerequisite below is resolved:

| Setting | Value |
| --- | --- |
| Runtime | Docker |
| Root directory / Docker build context | Repository root (`.`); do not select `glance-server` as root |
| Dockerfile path | `glance-server/Dockerfile` |
| Docker command | Leave blank; image CMD runs `node src/main.ts` |
| Health check path | `/health` |
| `HOST` | `0.0.0.0` |
| `PORT` | Render-provided value (normally `10000`); EXPOSE 3000 does not override it |
| `NODE_ENV` | `production` (already in image) |
| `TRANSPORT_MODE` | `https-proxy` |
| `DEVICE_ID` | Existing configured tracker identity; must match stored database identity |
| `DEVICE_TOKEN`, `OWNER_TOKEN` | Existing separate random secrets, provisioned privately at runtime |
| `TRUSTED_PROXY` | Exactly one verified immediate reverse-proxy IP; **unresolved for Render** |

The process initializes migrations before listening, with an advisory transaction lock; no separate migration command is required for the current schema. PostgreSQL pools are capped at five connections per instance; leave room for other services and overlapping deploys within the existing database's connection limit. Start with one server instance for the thesis demonstration. Root-context shared modules are mandatory. The `.dockerignore` allowlist sends only the server Dockerfile/manifests, source, migrations and shared modules, excluding private `.env` files, app/firmware trees and Arduino build artifacts. The Dockerfile references no secret build arguments. Render translates service environment variables into available build arguments, but secrets must remain unused during the build.

**Deployment blocker: Render edge trust is not yet established.** Render documents that its load balancer terminates public TLS and forwards HTTP to the service, and redirects public HTTP to HTTPS. That alone does not establish the stable, exact immediate proxy IP required by this server. The reviewed documentation does not provide an edge-proxy IP contract or a forwarded-header sanitization guarantee sufficient to change this policy. Render's private network also allows other services in the same workspace/region to reach the primary HTTP port; outbound IP ranges are not trusted inbound proxy addresses. Do not guess a proxy IP from one request, trust all peers/private subnets, accept a fixed hop count, or select trusted-local mode in production.

Before live deployment, obtain a supported immediate-proxy/header and network-isolation contract from Render, or explicitly decide and verify an alternative bounded proxy architecture. `/health` can pass while every protected HTTP/WebSocket request is rejected; a green deployment healthcheck is not evidence that cloud uploads work. Keep the existing exact-IP and HTTPS requirement unchanged until that decision is made. Afterward verify real certificate-validated HTTPS uploads, owner reads and authenticated WSS on the deployed hostname, then privately update firmware/app URLs. No live Render deployment or managed database access is covered by the local checks.

Official documentation reviewed for this audit: [Docker](https://render.com/docs/docker), [Web Services](https://render.com/docs/web-services), [Private Network](https://render.com/docs/private-network), [PostgreSQL connections](https://render.com/docs/postgresql-creating-connecting), and [TLS](https://render.com/docs/tls).

Local root-context build command: `docker build -f glance-server/Dockerfile -t glance-server:local .`. The October 4 Render-readiness audit rebuilt that Dockerfile through isolated production Compose project `glance-verify-prod-718ac0ca`; image ID was `sha256:69075e437609fc41d2306007c26423ca00d9bd41036dba10c96740bbb651be28`. Node 24.13.0 ran as UID 1000 with a read-only filesystem and dropped capabilities. The real PostgreSQL 16.14 integration suite passed **2/2** (30955ms), strict TypeScript passed, and the separate upload-logging fixture passed **1/1**. Actual image HTTPS/WSS checks passed health 200, owner reads, device uploads, geofence violation/return, proxy-spoof rejection, untrusted-certificate rejection and restart persistence. A separate network-disabled image inspection confirmed `/app` contains only server/shared code and the server contains only production dependencies, manifest, source and migrations, with no private settings/app/firmware/build trees.

Sanitized audit evidence is under ignored `glance-server/.test-run/docker-718ac0ca/` (`evidence.log`, `postgres16-tests.log`, `summary.json`); combined output is `glance-server/.test-run/render-docker-latest.log`. These are synthetic software fixtures on disposable databases, not user GPS data. Only the uniquely named verification containers/networks/volumes were removed, plus the self-removing image-inspection container; the bench database and six unrelated running containers retained their IDs, running state, start times and restart counts. No live Render operation occurred, and local proxy success does not resolve Render's edge-trust blocker.

### Watching device uploads

From `glance-server`, use `pnpm start` for normal foreground execution or `pnpm dev` for Node watch/restart mode, after the private-env/inherited-env preparation above. Leave the existing database running. Each authenticated, structurally valid, configured-device upload logs only after its store operation succeeds:

- `GPS upload accepted`: request ID, configured deviceId, latitude, longitude, observedAt, `accepted:true`, and committed revision.
- `GPS upload ignored`: the same validated observation fields with `accepted:false` and unchanged revision; duplicate, out-of-order, stale or overly future-skewed observations share this outcome. It does not mean the location was refreshed.
- `GPS upload rejected`: request ID and HTTP statusCode only, including 400 invalid payload, 401 authentication failure, 403 wrong identity, and 503 store failure. No rejected body, coordinates, headers, URL or credentials are printed.

These are Fastify structured JSON console logs; general automatic request logging stays disabled. Coordinates are sensitive operational data: restrict log access/retention. No GPS fix means firmware may not upload at all, so no GPS upload log is not proof of a backend failure. This logging does not prove physical GPS/device connectivity or add a GPS trail table.

Focused regression command: `pnpm exec node --test test/upload-logging.test.ts`. It captures the real Fastify logger during injected HTTP route requests against an in-memory store fixture, checks accepted/duplicate/stale/rejected/store-failure outcomes and token/body privacy, and opens no PostgreSQL connection or network listener. `pnpm check` statically validates the source and test; the existing real PostgreSQL integration suite remains separate.

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

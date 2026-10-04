# Glance

Livestock tracking with live GPS and server-authoritative polygon violation/return reporting. Monday **October 5, 2026** targets the single GPS/WiFi prototype; Sunday **October 4** is the Arduino/device bring-up opportunity, not evidence of completed hardware testing.

## System

| Directory | Role |
| --- | --- |
| `glance-prototype/` | Arduino-core ESP32-C3 GPS tracker → WiFi HTTP(S) upload. |
| `glance-slave/` | Arduino-core GPS/LoRa tracker; radio hardware/band/pins still require verification. |
| `glance-master/` | Arduino-core no-GPS gateway → WiFi uplink. |
| `glance-server/` | Fastify, PostgreSQL, Drizzle; canonical geofence evaluator and episode history. |
| `glance-app/` | Expo, MapLibre, SQLite/Drizzle cache; foreground map, fence editing, alerts/history. |
| `shared/` | TypeScript wire validation, polygon geometry, lifecycle and freshness helpers. |

Configured prototype identity: `prototype-001`. Upload every 5 seconds; stale when observation **or** accepted receipt age reaches 15 seconds. Retain last coordinates and violation/return episodes, not a continuous GPS trail. Initial outside opens one episode, repeated outside does not duplicate, boundary points are inside, and fresh inside resolves returned. Fence replacement resolves fence_changed and awaits the next accepted fix. No background push, buzzer, or offline geofence authority is promised.

October 4 local bench: confirmed Ethernet **192.168.1.95**, private ignored `glance-server/.env` with Ethernet-only `HOST=192.168.1.95` (not all interfaces/Hamachi), dedicated `glance-bench` database, and `http://192.168.1.95:3000` / `ws://192.168.1.95:3000/api/live`. Run `node tools/dev/start-local.mjs` from root to prepare/reuse the database, then use the [server startup/owned-stop instructions](docs/server.md); check the ignored process record before launching another server and clear conflicting inherited server environment. IP changes require explicit private HOST/URL updates and Android debug rebuild. The client can provide two devices; the prototype ESP32-C3 needs replacement because one appears burnt. Prioritize the direct prototype, then the single slave/master pair using **the same tracker identity prototype-001**. Do not run both sources concurrently; the master has no GPS identity of its own. Device availability does not waive electrical/radio checks or USB-only power deferral.

## Bring-up order

1. **Server/database first:** use Node 24.13+, pnpm and [server setup](docs/server.md). Development Compose runs the database only; production Compose includes the server and requires a separately configured verified TLS proxy. Both actual Compose stacks and the production image now pass isolated runtime verification; configure and verify your own deployment endpoint separately.
2. **Provision privately:** use different upload-only DEVICE_TOKEN and owner read/subscribe/fence-edit OWNER_TOKEN, matching the configured device identity. Never commit or log credentials. Device/phone URLs use the server computer's reachable LAN address, not their own localhost. Trusted-local HTTP/ws is an explicit token-exposing exception; public cloud requires certificate-verified HTTPS/wss.
3. **Firmware on Sunday:** follow [firmware setup and electrical gates](docs/firmware.md). The coordinator discovered a bundled Arduino CLI; tooling absence is no longer assumed. The firmware owner records its exact executable, ESP32 core/library availability and compile results. Confirm the actual board, rails, UART directions/pins and assigned port before flashing or powering modules. Start with verified USB power; battery/solar remains deferred. Do not select a LoRa band or transmit without verified hardware, antenna and local permission.
4. **Native app:** follow the [app guide](docs/app.md). MapLibre requires a **development build, not Expo Go**. Connect to the same server with the owner credential; the app cache is not the evaluator. Rebuild the Android debug development build with exact `GLANCE_LOCAL_HTTP_HOST=192.168.1.95` for this trusted-local LAN; changing a URL does not update the native host exception. Native compilation/linking, installation/runtime and device QA remain outstanding despite successful Metro exports and Android security prebuild checks.
5. **One complete flow:** owner saves a polygon → live GPS reaches server → app displays last-known position/freshness → fresh outside/inside observations produce one violation and one return. Label injected movement fixtures as synthetic supplements, never substitutes for live GPS.

## Verification snapshot — October 3

- **Shared:** `node shared/check.mjs` and strict TypeScript checks passed, including bounded device IDs, delayed observation freshness and source-clock skew regressions.
- **Server:** strict check and two real PostgreSQL/HTTP/WebSocket tests passed against Docker PostgreSQL **16.14**, following earlier isolated PostgreSQL 18.4 coverage. Both actual Compose stacks started healthy; production image build, nonroot/read-only/capability hardening, private persistent DB, test-CA-verified HTTPS/WSS authorization/lifecycle/reconnect, and server/database restart persistence passed. The earlier Docker startup failure was repaired by the user. Unrelated services were preserved; see [server evidence and remaining deployment limits](docs/server.md).
- **Firmware:** portable host protocol check passed. On October 4, 2026, the coordinator reported the prototype Arduino compile passed; master compilation is underway and all three roles are not yet verified. Flashing, GPIO/GPS, device TLS and RF behavior remain unverified; compile/host checks do not prove hardware behavior. The firmware owner maintains detailed compiler evidence in the [firmware guide](docs/firmware.md).
- **App:** lint, TypeScript, tracking checks using real file-backed SQLite and a synthetic HTTP fixture, and Expo dependency compatibility checks passed. Android (1895 modules, 4.5MB) and iOS (1809 modules, 4.3MB) Metro/Hermes exports passed. Android security prebuild checks confirmed strict main/release cleartext denial, an exact-host debug-only exception with no subdomains, and strict debug denial after regenerating without the exception. iOS prebuild is unsupported on Windows; native linking, APK compilation, UI/device GPS and physical MapLibre/SQLite/network runtime remain unverified. Details and limitations are in the [app guide](docs/app.md); the [prototype acceptance tracker](.scratch/prototype/spec.md) is ready for human hardware/deployment verification.

## Sunday evidence checklist

- [ ] Confirm shared devices/ports are available before interactive QA; record actual board/pin/rail/USB checks and all three Arduino compile logs.
- [ ] Prove actual GPS coordinates and UTC observation time reach server/app; prove no-fix/outage preserves last coordinates and becomes stale without a fabricated return.
- [ ] Exercise initial outside, repeated outside, inclusive boundary, return, fence_changed and next-fresh-fix evaluation; retain history and clearly label synthetic cases.
- [ ] Install the native development build; verify MapLibre polygon editing, SQLite cache/reconnect, foreground alerts/history, stale/offline presentation and owner access.
- [ ] Verify the chosen deployment/device transport: narrowly opted-in trusted-local networking, or actual cloud hostname/CA verification and wrong-certificate rejection. Isolated Compose runtime and local test-CA HTTPS/WSS checks pass; they do not certify the deployment's certificates or device clients.
- [ ] Before LoRa transmission, confirm lawful band/power/cadence and antenna; collect authenticated slave→master→server evidence. No battery runtime or animal-field safety claim follows from a 1000mAh inventory label.

## References

- [Exact API and shared exports](docs/protocol.md), [domain glossary](CONTEXT.md), [native design](design.md), [source palette/fonts](docs/specs/color-and-font.md).
- Accepted decisions: [server authority](docs/adr/0001-prototype-geofence-authority.md), [transport/access](docs/adr/0002-prototype-transport-and-access.md), [USB/power deferral](docs/adr/0003-usb-demo-and-power-deferral.md), [lifecycle/freshness/owner edits](docs/adr/0004-prototype-lifecycle-and-contract.md).
- [Hardware review](docs/research/hardware-review.md) and [proposed parts](docs/specs/proposed-parts.md) distinguish source estimates from measured inventory and safety evidence.

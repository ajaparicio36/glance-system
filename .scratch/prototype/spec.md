# Monday GPS/WiFi prototype

Status: ready-for-human

## Accepted scope

Live GPS and server-authoritative polygon violation/return reporting on October 5, 2026. Arduino-core ESP32-C3 firmware remains required for prototype GPS/WiFi, no-GPS/WiFi master, and GPS/LoRa slave roles; production LoRa band/pins remain undecided. USB/device and Arduino CLI testing opportunity is October 4; do not install Arduino CLI ahead of the user's plan.

Accepted decisions: docs/adr/0001 through 0004. Exact API: docs/protocol.md; shared implementation: shared/protocol.ts, shared/geofence.ts, shared/lifecycle.ts. Cadence 5 seconds, stale 15 seconds, last-location plus episode history only, foreground alerts only, device-upload and owner-read/edit credentials. Boundary inside; initial outside opens one episode; repeated outside deduplicates; inside returns; replacement closes fence_changed and waits for next fresh fix.

## Acceptance criteria

- Shared: direct Node 24 polygon/lifecycle/parser/freshness check and TypeScript static check.
- Server: authenticated HTTP/WebSocket contract, database transactions/version conflict and episode uniqueness, rejection of old/expired fixes, durable revision/history; route usage examples and end-to-end evidence.
- App: shared parsing, SQLite cache/version rejection, MapLibre polygon editor, last-known/freshness display, foreground alerts/history; lint/typecheck and confirmed native compatibility.
- Firmware: actual GPS coordinates and UTC timestamps, 5-second authenticated upload, safe scoped local-development networking or verified cloud TLS, USB electrical bring-up; include all Arduino firmware roles without pretending LoRa hardware/pins have been verified.
- Label synthetic movement fixtures separately from required live-GPS evidence. No battery-runtime, background-push, offline-evaluator, GPS-certainty, or continuous-trail claim.

## Comments

October 4, 2026 bring-up update: the client can provide two devices; the prototype ESP32-C3 needs replacement because one appears burnt. Prioritize the direct GPS/WiFi prototype before the single GPS/LoRa slave and no-GPS master pair. Both paths use tracker identity prototype-001, never concurrent sources or a separate master tracker. The coordinator discovered a bundled Arduino CLI and reported the prototype Arduino compile passed; the other role builds are underway, not yet all verified. Detailed compiler evidence belongs to docs/firmware.md. The ready trusted-local bench explicitly binds Ethernet HOST=192.168.1.95, not every interface or Hamachi; startup and owned-stop instructions are in docs/server.md. Device availability and compilation do not validate electrical safety, flashing, live GPS, RF, device TLS or phone-to-LAN reachability; USB-only demo power and battery/solar deferral remain in force. Earlier dated compilation/tooling notes below are historical, not the current prototype compile status.

Round 2 confirmed by user's “Sounds good” on October 3. Shared checks are not route, device, native-build, or circuit verification. Shared browser/device QA requires explicit resource confirmation.

October 3 software evidence: shared Node/strict TypeScript checks passed; server strict check and two real PostgreSQL/HTTP/WebSocket tests first passed against an isolated embedded PostgreSQL 18.4 cluster. After the user repaired Docker, the same suite passed against Docker PostgreSQL 16.14 (2 passed, 0 failed). Both actual Compose stacks started healthy; production frozen-dependency image build, nonroot/read-only/capability hardening, private persistent DB, test-CA-verified HTTPS/WSS authorization/lifecycle/reconnect and server/database restart persistence passed. Scoped verification resources were removed and the six unrelated containers were unchanged. Exact evidence and limits: docs/server.md and ignored glance-server/.test-run/docker-fb36c3b4/. Firmware portable host check passed; Arduino compile/flash and hardware testing remain deferred to Sunday October 4.

October 3 app-owner validation confirmed PASS by the coordinator: lint, TypeScript, tracking checks using genuine file-backed SQLite and a synthetic HTTP fixture, Expo dependency compatibility check, Android/iOS Metro/Hermes exports, and Android security prebuild checks. Android main/release denies cleartext; debug permits only the explicitly configured host without subdomains, and regeneration without the exception restores strict debug denial. docs/app.md is published. The HTTP fixture is not the actual backend or live GPS; exports/prebuild are not native linking/runtime evidence. iOS prebuild is unsupported on Windows.

Handoff gate: ready-for-human now means software implementation validation, including isolated Docker image/container runtime, is complete and the prototype awaits human hardware/deployment verification. Native linking, Android APK compilation, UI/device GPS, remaining Arduino role compilation/flashing, electrical/RF checks and actual deployment/cloud TLS remain outstanding. Local test-CA HTTPS/WSS coverage does not certify production hostname/certificate provisioning or device TLS. The root README links the bring-up order and Sunday evidence checklist; this status does not mark those remaining checks passed.

# Monday GPS/WiFi prototype

Status: ready-for-agent

## Accepted scope

Live GPS and server-authoritative polygon violation/return reporting on October 5, 2026. Arduino-core ESP32-C3 firmware remains required for prototype GPS/WiFi, no-GPS/WiFi master, and GPS/LoRa slave roles; production LoRa band/pins remain undecided. USB/device and Arduino CLI testing opportunity is October 4; do not install Arduino CLI ahead of the user's plan.

Accepted decisions: docs/adr/0001 through 0004. Exact API: docs/protocol.md; shared implementation: shared/protocol.ts, shared/geofence.ts, shared/lifecycle.ts. Cadence 5 seconds, stale 15 seconds, last-location plus episode history only, foreground alerts only, device-upload and owner-read/edit credentials. Boundary inside; initial outside opens one episode; repeated outside deduplicates; inside returns; replacement closes fence_changed and waits for next fresh fix.

## Acceptance evidence

- Shared: direct Node 24 polygon/lifecycle/parser/freshness check and TypeScript static check.
- Server: authenticated HTTP/WebSocket contract, database transactions/version conflict and episode uniqueness, rejection of old/expired fixes, durable revision/history; route usage examples and end-to-end evidence.
- App: shared parsing, SQLite cache/version rejection, MapLibre polygon editor, last-known/freshness display, foreground alerts/history; lint/typecheck and confirmed native compatibility.
- Firmware: actual GPS coordinates and UTC timestamps, 5-second authenticated upload, safe scoped local-development networking or verified cloud TLS, USB electrical bring-up; include all Arduino firmware roles without pretending LoRa hardware/pins have been verified.
- Label synthetic movement fixtures separately from required live-GPS evidence. No battery-runtime, background-push, offline-evaluator, GPS-certainty, or continuous-trail claim.

## Comments

Round 2 confirmed by user's “Sounds good” on October 3. Shared checks are not route, device, native-build, or circuit verification. Shared browser/device QA requires explicit resource confirmation.

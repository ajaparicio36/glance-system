---
status: accepted
date: 2026-10-03
---

# Prototype transport and configured access

Use HTTP(S) POST from the ESP32 prototype to Fastify and RFC6455 WebSockets from server to app, with configured single-owner/device identity and separate pre-shared upload/read credentials. The user accepted this bounded prototype recommendation instead of adding account registration; identity alone is not authentication.

An explicit trusted-local-development server may use HTTP/ws before possible Monday cloud deployment. Cleartext exposes credentials and data to network observers; this is not permission for unencrypted cloud traffic. Cloud requires HTTPS/wss with certificate verification: no `setInsecure`, TLS bypass, or global cleartext/TLS weakening.

Endpoint/payload contracts, fence-write authorization, credential provisioning/storage, and Android/native network-security compatibility require later definition and verification; this ADR does not claim existing support or authorize read credentials to mutate geofences. Production deployment location and timing are not fixed by the local exception.

Round 2 follow-up: accepted [ADR-0004](0004-prototype-lifecycle-and-contract.md) explicitly authorizes the owner credential to read/subscribe and manage the singleton polygon, with a separate upload-only device credential. The user clarifies that Round 1 “read” meant the separate app credential, not a permanently read-only role or a third secret; the earlier fence-write deferral is resolved. The exact contract is [protocol.md](../protocol.md); secure provisioning/storage and native network compatibility still require verification.

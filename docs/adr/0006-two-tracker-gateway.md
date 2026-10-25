---
status: accepted
date: 2026-10-26
---

# Two GPS slaves, one gateway, and a fresh Railway deployment

The user explicitly requested both slaves reporting concurrently through one master, then a new Railway project on the existing account using its current plan/credits and existing credentials, without an upgrade. This extends the earlier single-tracker demonstration rather than introducing fleet management. Acceptance below covers those confirmed choices; deployment mechanics, evidence and unverified assumptions are distinguished separately.

## Confirmed decision

- Convert the prototype board to Slave 1, retaining GPS RX20/TX21 and identity `prototype-001`; the available second GPS slave uses `slave-02`. One GPS-free master forwards both to the server/app. Never run the standalone prototype and Slave 1 concurrently under the same identity.
- Use one slave sketch/configuration with labelled alternatives: comment/uncomment which ID is being built/flashed, leaving exactly one active. Selecting a different build does not change a board already flashed. Do not duplicate role implementations or rotate credentials to choose a slave.
- Keep one owner and one server-authoritative polygon, with independent tracker positions, freshness, replay checks and violation episodes. Both trackers may be outside simultaneously; a return for one must not resolve the other. Replacing the shared fence closes all active episodes as `fence_changed`, not returned. Existing cadence, stale timeout, server authority and foreground-only delivery from [ADR-0004](0004-prototype-lifecycle-and-contract.md) continue per tracker.
- Reuse the existing separate owner and upload API credentials; both configured trackers share the upload credential for this bounded thesis setup. Identity allowlisting is not per-device authentication: possession of that credential can submit as either allowed ID. The existing shared radio group key likewise does not isolate one slave from the other. This is not approval for account registration, device CRUD, an unbounded fleet or another API secret.
- Deploy a new Railway project using the account's existing plan/credits, without upgrading or promising free operation. Initialize configured tracker identities if needed, never fabricated GPS fixes, fences or incident history. Fresh Railway starts new history; the old Render service is not deleted and its data is not automatically copied.
- Use 915 MHz only as the user-permitted bench assumption derived from proposed parts, not a measured radio-band/EIRP result or regulatory approval. Hardware power, battery/solar safety, RF delivery and production-band verification remain gated; [ADR-0003](0003-usb-demo-and-power-deferral.md) is unchanged.

## Compatibility and retention

The implementation retains required `DEVICE_ID=prototype-001`; optional `DEVICE_IDS=prototype-001,slave-02` enables the second tracker. Omitting the list preserves legacy one-tracker configuration. The allowlist is bounded to one or two unique IDs and must retain stored identities. One fence/version and global monotonic snapshot revision remain; the wire format still carries device arrays and device-labelled episodes.

Upgrading an existing database must preserve its first identity, fence, latest position, revision and episode IDs/history while seeding only the new tracker's empty state. This migration is distinct from starting the new Railway database. Stop old writers and back up before migration; old/new server binaries must not overlap, and an old binary is not a safe rollback against the new per-tracker schema. Importing Render history later requires a separately coordinated backup/restore and revision/cache recovery decision, not a silent overwrite. Operational details belong in [server.md](../server.md), wire behavior in [protocol.md](../protocol.md), and board selection/provisioning in [firmware.md](../firmware.md).

## Railway implementation boundary — assumptions, not broader approval

The implemented `railway-edge` mode delegates public TLS termination to Railway, accepting the internal HTTP/WS hop with `trustProxy:false`; forwarded headers are not authentication or proof of secure ingress. Public clients still call the final certificate-verified HTTPS/wss origin directly, without token-bearing plaintext redirects, `setInsecure`, or global TLS/cleartext weakening. Existing owner/upload authorization and first-frame WebSocket authentication remain required.

The deployment is intended to contain only the dedicated API and PostgreSQL services in one project/environment, with private database access and persistent storage. Trust in Railway's documented project/environment-isolated mesh and all co-resident peers is an explicit implementation assumption: the runtime does not prove edge traversal or enforce the peer inventory. Railway UUID environment markers are configuration accident guards, not peer authentication. Reassess before admitting other services/private peers or expanding ingress; the user did not separately approve arbitrary internal-HTTP trust or security weakening. [ADR-0005](0005-render-free-edge.md) remains Free-Render-specific and cannot establish Railway's boundary. Provider documentation and deployment checks are linked from [server.md](../server.md).

## Evidence and remaining limits

Source commit `fe326d9` contains the two-tracker server/app regression coverage and Railway mode. The coordinator reports seven passing PostgreSQL 18 software tests and a successful new Railway deployment at [the public origin](https://glance-server-production.up.railway.app). The recorded certificate-verified HTTPS/owner-WSS smoke shows exactly both configured IDs with null positions, unknown statuses, revision 0, no fence and no episodes; rejected stale probes did not manufacture fixes. These are software/seed checks, not live GPS or imported history. Detailed evidence remains in [server.md](../server.md), not duplicated here.

No decision here certifies both-slave GPS-to-radio-to-master-to-cloud delivery, native app behavior, RF collision avoidance, device TLS execution, deployed restart persistence, electrical safety or battery runtime. A shared radio key and software scheduling are not a guaranteed LoRa MAC/delivery protocol. Keep those verification limits visible when reporting readiness; do not substitute seeded identities or synthetic checks for actual live GPS.

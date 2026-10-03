---
status: accepted
date: 2026-10-03
---

# Prototype scope and server geofence authority

For Monday October 5, use the single-node GPS/WiFi prototype with live GPS position and working polygon-geofence violation/return reporting; the user explicitly requires both despite single-device demonstration difficulty. Server evaluation is authoritative and SQLite is a local cache, keeping the prototype to one evaluator rather than competing app/master decisions. Clearly labelled synthetic fixtures may supplement transition evidence when movement is difficult, but a purely simulated demonstration cannot replace live GPS.

This deliberately diverges from thesis master-side geofence evaluation (PDF pp. 53, 55-56, 67; see `../research/thesis-review.md`). Future GPS/LoRa slave and no-GPS/WiFi master roles are unchanged; this decision neither establishes their evaluator nor promises offline master authority. Device/Arduino testing is available Sunday October 4, not evidence of completed testing.

## Not decided in Round 1; Round 2 follow-up

Exact violation/return lifecycle, cadence, stale timeout, boundary tolerance, jitter/hysteresis, initial-outside behavior, fence replacement, incident retention, background delivery, and production LoRa band/pins remain for Round 2. Requiring violation/return reporting does not accept a particular alert channel, deduplication rule, history policy, or background guarantee.

Historical Round 1 wording above is superseded for prototype lifecycle and delivery by accepted [ADR-0004](0004-prototype-lifecycle-and-contract.md). Production LoRa band/pins and measured GPS calibration remain unresolved; implementation/testing is not certified by either decision.

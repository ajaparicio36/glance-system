---
status: accepted
date: 2026-10-03
---

# Prototype lifecycle, freshness, and owner fence access

The user's “Sounds good” confirms Round 2 recommendations, including all Arduino-core ESP32 firmware roles. Monday requires live GPS and polygon violation/return reporting with server authority. These are accepted targets, not claims of completed hardware or native testing.

- An initial fresh outside fix opens a violation; repeated outside fixes do not duplicate it. A fresh inside fix resolves the active episode as `returned`. Exact polygon edges/vertices count as inside. Unknown applies without a fence/fix and immediately after fence replacement.
- Upload every 5 seconds. Stale when either observation age or accepted receipt age reaches 15 seconds; preserve observation time separately from receipt time. Invalid timestamps are stale. Receiving a delayed fix does not grant another 15 seconds of current-location status; allowed source-clock skew does not extend the receipt timeout. Reject duplicate, delayed, expired, or excessively future-dated fixes without advancing freshness, revision, or lifecycle. Retain last valid coordinates; do not synthesize returns or disconnection events.
- Store latest location and violation/return episodes, not a continuous GPS trail. Retain all episodes server-side; snapshots may project 100 recent episodes while always including the active episode.
- Replacing the singleton polygon closes active episodes as `fence_changed`, retains latest location, and waits for the next accepted observation before evaluating the new fence. Owner edits use optimistic fence versioning, independent of telemetry revision.
- Exactly two pre-shared credentials: device upload only; owner read/subscribe and singleton polygon management. No accounts or third secret. Authenticate WebSockets by first JSON frame, with no snapshot before authorization and a 5-second deadline; never place credentials in URLs/logs.
- Foreground in-app alerts and episode history only. No background push or buzzer guarantee. No initial raw-GPS filtering/hysteresis requirement; boundary jitter may produce repeated real episodes and needs field calibration, not claims of measurement certainty.

The integration contract and strict shared parsers live in `../../shared/` and [protocol.md](../protocol.md). Its 15-second maximum observation age and 5-second future-skew cap are explicit implementation defaults, not measured GPS/clock accuracy. The inherited local planar polygon calculation uses exact floating-point collinearity with no added tolerance; spherical/dateline behavior is not a prototype guarantee.

ADR-0001 authority, ADR-0002 verified cloud TLS/trusted-local exception, and ADR-0003 USB power gate continue to apply. Production LoRa band/pins, measured jitter calibration, secure credential provisioning, native compatibility, and actual hardware safety remain verification or future-decision work. Sunday October 4 is the device/Arduino CLI milestone; do not infer battery safety from 1000mAh inventory.

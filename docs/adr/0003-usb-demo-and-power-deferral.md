---
status: accepted
date: 2026-10-03
---

# Verified USB demonstration; defer battery and solar integration

Use verified USB power for the Monday prototype rather than integrating the unvalidated battery/solar circuit under deadline pressure. Battery/solar integration remains deferred until board input limits, wiring, rails, charger/protection/load-path behavior, and physical safety are verified; Sunday device availability is the testing opportunity, not prior validation.

The user confirms client photographs show a 1000mAh battery as inventory. This does not establish measured capacity, charge/discharge ratings, weight, voltage tolerance, runtime, or safe wiring. Preserve the 100mAh/370mWh discrepancy in `../specs/proposed-parts.md` and the original thesis as source evidence; no runtime or animal-field safety claim is accepted. See `../research/hardware-review.md` for unresolved electrical checks.

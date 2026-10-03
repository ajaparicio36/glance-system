# GLANCE thesis review and prototype scope

Date: 2026-10-03. Status: source review and implementation questions, NOT an ADR or a claim of completed hardware/software validation.

## User update — accepted Round 1, 3 October 2026

The historical questions/recommendations below are qualified by accepted `../adr/0001-prototype-geofence-authority.md`, `../adr/0002-prototype-transport-and-access.md`, and `../adr/0003-usb-demo-and-power-deferral.md`. Monday requires live GPS position and working violation/return reporting from a USB-powered single-node GPS/WiFi prototype. Labelled synthetic fixtures may supplement transition evidence when movement is difficult, not substitute for live GPS. LoRa master/slave and battery/solar integration remain later stages; the source is not rewritten as measured results.

Prototype geofence authority is the server with a local SQLite cache, an explicit divergence from thesis master-side evaluation (PDF pp. 53, 55-56, 67). Offline master authority is not promised; future evaluation placement is not settled by this prototype decision. Uploads use HTTP(S) POST and the app uses RFC6455 WebSockets, configured single-owner/device identity, and separate pre-shared upload/read credentials without account registration. Local HTTP/ws is permitted only for explicit trusted-local development; cloud requires HTTPS/wss with certificate verification.

The user confirms client photographs show a 1000mAh battery; old 100mAh source discrepancies remain evidence, not corrected measurements or electrical/runtime approval. The earlier circular-fence concern is historical: current design retains polygons. Exact lifecycle, cadence/staleness, jitter/hysteresis, initial-outside handling, fence replacement, retention, background delivery, and production LoRa band/pins remain unanswered; do not infer them from the approval of violation/return scope.

## Sources and reading limits

Primary source: `E:/Downloads/Thesis-III-2 (2).pdf`, SHA-256 `91d3a8c9e6880cb1ec0efca7556c663f139036684ad903ce7854d8551a722bf9`. All "PDF p." references use 1-based physical PDF pages. Full embedded text is in `thesis.md`: 90 page markers, 87 text-bearing pages, 3 image-only pages (85, 89, 90) explicitly flagged for OCR. Schematics on PDF pp. 47-48 and image-only appendices were visually inspected; fine pin labels were not validated. Raster diagrams/equations are not fully transcribed.

The report is dated August 2026 (PDF p. 1), ends its main content with methodology (PDF pp. 40-70), and contains unfilled test tables. Proposed performance, runtime, safety, and reliability must not be reported as measured results. Literature cited by the thesis is not independently verified here.

The user's latest architecture and October deadline below come from the task brief, not the PDF. This review does not inspect or certify repository implementation or supplier datasheets.

Concurrent repository context: root `design.md` appeared during this review and was read before completion. It recommends a circular first-deliverable fence but explicitly leaves geometry approval to the coordinator/user. This materially differs from the thesis's polygon-only scope (PDF p. 9). Do not silently substitute circles or count a circular demo as thesis polygon acceptance; settle and label any intentional prototype deviation. Other design guidance does not change the source facts here.

## Thesis facts: intended system and limits

| Topic | What the PDF actually proposes | Source |
| --- | --- | --- |
| Data path | GPS collar -> LoRa -> master -> home Wi-Fi/Internet -> online server -> mobile map and alerts | PDF pp. 5-6, 7-9, 67 |
| Hardware | NEO-6M GPS, ESP32-C3 Mini tracker, SX1276, TP4056, MT3608, LiPo, solar panel; master drawing includes LoRa and microSD, no GPS | PDF pp. 44, 46-48 |
| Population | Maximum five trackers, one master; five mature goats, about 3,600 square meters at Casa Valencia, Pulao, Dumangas, Iloilo | PDF p. 8 |
| App | Location visualization, basic map movement/zoom, geofence notifications; remotely activated collar buzzer is also an objective | PDF pp. 6, 8 |
| Boundary | User-defined polygon, ray casting; supplementary latitude shifts called a triple check | PDF pp. 5, 9, 52 |
| Evaluation location | Methodology explicitly evaluates geofence on master; sends received GPS onward to app via Internet | PDF pp. 53, 55-56, 67 |
| Radio procedure | Tracker requests pairing using device ID; master assigns queue number and addresses an acceptance; trackers send GPS one at a time | PDF p. 52 |
| Exclusions | No health monitoring, biometric identification, activity classification or other animal-condition measurements; limited species/site generalizability | PDF p. 8 |
| Power and sampling | Solar collar, RAPS-like dynamic speed/10 m acceptable uncertainty; another section specifies 30-second coordinate updates | PDF pp. 9, 41-42, 61, 64-66 |

The early chapters already include a hosted/online server and Wi-Fi gateway. A hosted server is therefore not wholly new scope; the particular stack and first direct-Wi-Fi prototype are updated implementation choices.

## User-directed updated architecture, separate from thesis

| Stage or layer | Latest requested scope | Relation to thesis |
| --- | --- | --- |
| Immediate prototype | One Arduino ESP32-C3 Mini with all available components including GPS/Wi-Fi; sends GPS directly to hosted server | Integration shortcut; skips the LoRa tracker/master hop for this stage. All-components wiring does not itself prove every component or radio works. |
| Later master | No GPS; receives slave LoRa data and provides Wi-Fi uplink | Master role aligns with the PDF p. 48 schematic and p. 67 description; do not infer that every gateway needs GPS. |
| Later slave | GPS and LoRa | Restores collar-to-master path required by thesis objectives (PDF p. 6). |
| Hosted backend | Fastify, PostgreSQL, Drizzle | User choice; the thesis does not prescribe these libraries. |
| Mobile app | Expo, SQLite/Drizzle, MapLibre | User choice; the PDF does not prescribe them. Local SQLite does not by itself make remote tracking, map tiles or notifications work offline. |
| Timing | Hardware/Arduino CLI work Sunday October 4, 2026; deadline Monday October 5 | User schedule, not the image-only thesis schedule (PDF p. 85). |

A direct-GPS/Wi-Fi demonstration can validate GPS acquisition, authenticated ingestion, persistence, map display and application-side boundary behavior. It cannot validate LoRa pairing, range, collision handling, five collars, master forwarding, collar autonomy or animal-field performance. If Monday's delivery is the first stage, explicitly label those deferred rather than claiming full thesis acceptance.

## Domain, boundary violations and returns

**Source facts:** The thesis distinguishes tracker device IDs and livestock/collars, maps coordinates, stores monitoring records, and evaluates boundary status and corresponding alerts on entry, exit or continued outside position (PDF pp. 52-56, 67-70). It does not define a relational schema, incident lifecycle, unique event key, ownership reassignment, retention policy or notification deduplication. "Offline ownership verification" appears in PDF p. 55 without a clear implementation contract; PN532 in the budget (PDF p. 82) is not sufficient evidence to add NFC identity scope.

**Suggested minimal model, not approved decisions:** livestock, assigned tracker, geofence with ordered polygon vertices, position observation, and breach episode/transition are enough to discuss behavior. Keep device identity distinct from animal identity, because moving a collar must not silently rewrite historical ownership. Do not implement extra herd, NFC, analytics or health subsystems merely because old budget items mention them.

Questions requiring an explicit choice before acceptance tests:

- Does the server evaluate geofences for the direct-Wi-Fi stage, or does the app? Later does the master evaluate, or does the server remain authoritative? PDF pp. 53 and 55 put evaluation on the master; hosted persistence alone does not choose an evaluator.
- What is a valid polygon: minimum distinct vertices, closed ring, longitude/latitude order, self-intersections and exact edge/vertex behavior? The latitude-shift "triple check" (PDF p. 52) has no documented offset, consensus rule or error bound; do not treat it as a proven GPS-noise filter.
- Does inside -> outside open one breach episode, continued outside update it without repeated alerts, and outside -> inside resolve it as a return? This is a proposed interpretation of PDF p. 70, not a thesis-defined event schema. A "return" means observed re-entry, not proof the owner physically recovered the animal.
- Initial outside fix: open an episode immediately or require a prior inside fix? No valid fix/stale/offline must be unknown, not automatically inside, outside or returned.
- Which timestamp is observed-at versus received-at, and how are duplicate, delayed and out-of-order uploads handled? A replayed old inside fix must not resolve a newer outside episode.
- If the boundary changes or a tracker is reassigned, what happens to an open breach? Tie evaluations to the relevant boundary/assignment rather than retroactively rewriting history.
- What delivery channel constitutes an alert: in-app status, foreground toast, push/background notification or buzzer? PDF pp. 6 and 8 promise notifications and remote buzzer control but do not define delivery acknowledgements or command expiry.

For a small first stage, one declared evaluator, latest valid position, one active breach per relevant animal/boundary, and recorded enter/exit transitions are easier to verify than distributed competing incident engines. Keep this recommendation separate from finalized architecture.

## Schematic, power, animal safety and pin verification

These are blocking verification questions before battery/solar integration or animal mounting, not verified electrical design findings.

1. **Pin/net mapping:** identify the exact ESP32-C3 Mini board variant and supplier pinout. Record GPS UART RX/TX, SX1276 SPI SCK/MISO/MOSI, CS, reset and interrupt; add separate SD CS if SD shares SPI. Check C3 boot-strapping pins, flash/USB reservations and all-components pin availability. PDF pp. 47-48 have small labels; do not wire solely from these screenshots.
2. **Voltage domains:** the tracker prose describes a boosted 5 V supply to the MCU (PDF p. 47). Confirm board input pin/regulator rather than supplying 5 V to a 3.3 V rail/GPIO, and verify the exact GPS, LoRa and SD breakout supply/logic tolerances. The MT3608 label is not proof all peripherals are 5 V safe.
3. **Charging/load path:** confirm the actual TP4056 module protection and load-sharing/power-path behavior, battery polarity, charge current resistor, cell limits and solar input stability. A simultaneous charger/load sketch does not certify safe charge termination. Start with a current-limited bench/USB supply and measured regulated outputs; do not guess a charger setting.
4. **Battery disagreement:** PDF pp. 44, 47, 51, 87-88 use 100 mAh/370 mWh; the master schematic (PDF p. 48) says 1000 mAh and budget (PDF p. 82) says 1 Ah. Select the real cell and recompute weight, charge current, peak-current headroom and runtime rather than mixing these capacities.
5. **Energy arithmetic:** PDF p. 50 lists 150, 10 and 0.15 mW but prints a total of 59.15 mW; those entries sum to 160.15 mW. GPS 10 mW x 24 h is 240 mWh, not the printed 250. Its row-energy total 373.6 mWh/day also conflicts with 25.66 mWh/day on PDF p. 87.
6. **Autonomy:** 373.6 mWh/day x 7 days / (0.85 x 0.8 x 3.7 V) is about 1.039 Ah, not 0.100 Ah for 168 hours as claimed on PDF p. 51. A nominal 370 mWh cell divided by 373.6 mWh/day is only about 23.8 hours before losses. The 346.06-hour figure on PDF p. 87 instead follows its much smaller load estimate and is not a measured runtime.
7. **Master arithmetic:** PDF p. 87 gives 1205.6 mW (under a misleading "Current Consumption (mW)" heading). At this power a 100 mAh x 3.7 V nominal cell gives about 0.307 hours before losses, not the 15.46 hours printed on PDF p. 88. Resolve battery/load assumptions and measure Wi-Fi, LoRa RX/TX, GPS acquisition, SD writes, sleep and buzzer rather than reuse those numbers.
8. **Solar and sleep:** verify solar output under shading and charger dropout, regulator quiescent draw, module LEDs and actual GPS shutdown capability. 5 V x 50 mA is only a nominal 250 mW panel rating (PDF pp. 44, 47, 50), not guaranteed daily harvested energy. Wi-Fi prototypes and always-listening masters have different duty cycles from collars.
9. **Animal enclosure:** weigh the assembled device, validate attachment/strap comfort, snag-release policy, thermal and battery containment, antenna orientation, seals and strain relief before goats. Claimed 96.2 g and 92 x 58 x 23 mm (PDF pp. 43-44) differ from 100 x 60 x 30 mm appendix dimensions (PDF pp. 88-89). Source weight percentages and "waterproof ABS" language are not independent animal-safety or ingress certification.
10. **Buzzer:** identify missing drive circuitry, load current, safe acoustic level, command timeout and default-off behavior. The objective (PDF p. 6) does not establish a working safe collar actuator. No electric stimulus is requested; related-literature references to virtual fencing must not become a product requirement.

## LoRa and reliability constraints

- The budget and appendix name SX1276 915 MHz (PDF pp. 82, 87). Verify actual module/antenna band, legal local frequency/power/duty-cycle limits and regulatory status with authoritative hardware/regulatory sources; this review does not certify 915 MHz use in the Philippines.
- Direct SX1276 LoRa is not automatically LoRaWAN. Fix matching frequency, spreading factor, bandwidth, coding rate, preamble, CRC and payload format before testing; do not import a LoRaWAN cloud stack just because related work uses it.
- The master queue (PDF p. 52) only orders requests it successfully decodes. It cannot recover overlapping undecodable request packets. The simultaneous-five-node checklist (PDF pp. 60-61) needs a tested contention policy such as staggered requests/backoff and bounded retry, not a promise of arbitrary simultaneous reception on one receiver.
- Establish device identity, sequence number, version, coordinate validity/fix age and payload units; define acknowledgements, duplicate handling, pairing acceptance and timeouts. A device ID alone is not authentication.
- Measure packet delivery, retries, latency, stale intervals and RSSI/SNR where available; distance/topography/vegetation tests are necessary (PDF pp. 8, 58-61, 68). Never infer kilometer range from the small site's area or a module marketing maximum.
- Remote buzzer commands require downlink opportunities on a duty-cycled slave. Decide receive windows and expiry before promising immediate delivery; continuous reception consumes power.
- RAPS based on last speed (PDF p. 42) needs a maximum silence interval and restart/no-fix/stationary safeguards. Last speed zero cannot be assumed to imply the goat stays motionless indefinitely. Reconcile dynamic sampling with the 30-second update criterion (PDF p. 61).
- GPS fix success rate >=90% is a proposed criterion (PDF pp. 41, 64), not end-to-end radio, server or notification reliability. A valid-coordinate count without explicit acquisition timeout/fix-quality rules can hide long gaps.

## Evidence and a minimal acceptance split

**Thesis evaluation plan:** five reference locations x three trials, Google Maps reference coordinates and Haversine distance (PDF pp. 40-41, 62-63); weather/temperature/movement GPS-fix trials (PDF pp. 64-66); pairing, packet delivery and concurrent-node checks (PDF pp. 58-61); expected versus actual boundary state and alert results (PDF pp. 68, 70). Google Maps points are not surveyed ground truth. Coordinate-relative percentages on PDF p. 69 are not a substitute for error in meters; its raster Haversine equation requires the PDF for exact notation.

**Proposed Sunday/Monday evidence for direct-Wi-Fi prototype:** record actual board/modules and wiring, acquired valid outdoor fix, observed timestamp/received timestamp, successful hosted ingest and stored record, app position, one boundary exit and re-entry with exactly the chosen alerts, and invalid/stale/duplicate observation behavior. A synthetic crossing test should be labelled synthetic; it proves state logic, not outdoor GPS accuracy. If public routes are later implemented, supply a working request example and an end-to-end route check.

**Deferred thesis proof:** GPS-to-LoRa-to-master-to-server path, five-node behavior, range/latency/PDR, offline/SD behavior if retained, solar/battery runtime, physical enclosure/animal trial and safe remote buzzer operation. Track these explicitly rather than expand Monday's prototype or fabricate completed checklists.

## Questions to settle, not decisions

1. Which stage is the Monday deliverable, and which thesis criteria will be explicitly deferred?
2. Where is the single authoritative geofence evaluator in each stage?
3. Are breach deduplication and re-entry resolution required now; what is the stale/unknown policy?
4. Which exact board, battery, GPS/SX1276/SD breakouts and verified power/pin table will Sunday's firmware target?
5. Are microSD, TFT, solar charging and remote buzzer necessary for first acceptance or later hardware work?
6. What measured evidence and academic/safety approval are required before claiming animal-field readiness?

# Hardware implementation-blocker review

Status: unvalidated schematic review, 3 October 2026. Sources: visual inspection of `docs/schematic-draft.jpg`, `docs/specs/proposed-parts.md`, and the user-selected device roles. No physical measurement, module datasheet matching, continuity test, or firmware validation occurred. The historical review below is qualified by the dated user update.

## User update — accepted Round 1, 3 October 2026

- The user confirms client photographs show an actual **1000mAh battery**. This resolves the inventory capacity question, not independent measured capacity, charge/discharge ratings, weight, voltage tolerance, safe wiring, or runtime. The source's 100mAh/370mWh mismatch remains evidence; its runtime figures remain unvalidated.
- Follow `../adr/0003-usb-demo-and-power-deferral.md`: Monday uses verified USB demo power; battery/solar integration is deferred until the electrical checks below pass. Do not attach or power the unvalidated circuit because the capacity question is answered.
- Sunday October 4 is device/Arduino testing availability. Monday October 5 requires real GPS position and working violation/return reporting under `../adr/0001-prototype-geofence-authority.md`; clearly labelled synthetic fixtures may supplement transitions, not replace live GPS.
- The historical bring-up checklist's LoRa hop is later-stage work, not a Monday prerequisite. Production radio band/pins, cadence, and measured energy remain unresolved. Round 1 transport/access choices are in `../adr/0002-prototype-transport-and-access.md`, not proof of a working network or electrical design.
- Historical requests below to resolve 100 versus 1000mAh are superseded by the inventory answer only; exact cell specifications, protection, and charging limits still require verification.

## What the image actually shows

The drawing contains a GPS antenna linked to GY-NEO6MV2, an ESP32 C3 block, an SX1276 block with an ANT connection to an antenna symbol, an MT3608 block, a TP4056 block, a solar panel labeled **5v 50mA**, and a battery explicitly labeled **3.7V LiPo 1000mAh**. Panel polarity is labeled; wires reach the two TP4056 upper terminals. Battery wires reach its lower B terminals, and converter input wires reach the lower OUT terminals. This is a pictorial module wiring draft, not a netlist or verified board schematic.

GPS labels are GND, TX, RX, VCC; SX1276 labels include SPI signals, reset, DIO signals, power/ground, and ANT. ESP power labels include 5V, GND, and 3V3. MT3608 +VOUT is drawn horizontally toward the ESP 5V terminal; -VOUT reaches a ground-side network. Additional lines route from the ESP power area toward LoRa VCC/GND. Dense crossings and sparse junction dots make rail relationships unsafe to assume.

Tracing the GPS wires visually: GND goes down and across toward the shared ground-side network; TX and RX run separately into the lower left ESP terminal area. The GPS VCC line drops to a horizontal segment, then turns upward toward the ESP's left terminal column rather than clearly terminating at the labeled right-side supply rail. This is a critical apparent power-wiring problem to resolve, not a proposed GPIO-powered GPS design. The GPS ground line crosses several vertical signal lines; crossings without clear junction markers must not be treated as connections.

The image does not establish UART direction correctness, complete ground connectivity, whether converter output and 3V3 are isolated, or the real board's pin functions. Some printed labels can be read, but a legible drawn number is not verification of a physical ESP32-C3 Mini board revision. No pin assignment is approved here. Request an annotated netlist or clearer wiring diagram with explicit junctions and exact board/module models before implementing the pin map.

## Material spec conflicts

| Evidence | Conflict / consequence |
| --- | --- |
| Image: 1000mAh LiPo; parts: 100mAh and 370mWh | Tenfold capacity mismatch. Nominal energy is approximately 3.7Wh versus 0.37Wh, before usable-capacity/loss allowances. Resolve the actual battery before charge-current, runtime, weight, or enclosure claims. |
| Parts: 25.66mWh/day and 370mWh | 370 / 25.66 = approximately 14.42 days (346.06 hours): arithmetic is coherent, duty-cycle assumptions are not supplied. It is not a measured runtime. |
| Parts: continuous runtime 15.46 hours | At 370mWh this implies approximately 23.93mW average. It does not follow from the listed master total of 1205.6mW. At that master total, ideal runtime would be approximately 0.307 hours for 100mAh or 3.07 hours for 1000mAh, before losses. These calculations only expose inconsistency; they are not slave runtime predictions. |
| Master table heading: current consumption (mW) | mW is power, not current. Supply voltage, operating modes, and measured current are needed. |
| Parts: 96.2g total, 1.6g battery, and 58×92×23 enclosure; overall 100×60×30 | The mass sum is correct for the stated estimates, but actual battery capacity/model, antennas, modules, mounting, and physical fit are unverified. Do not assume 1000mAh has the same mass. Verify animal/collar suitability separately. |

## Stop-before-power blockers

1. **Exact supply path and 3.3V separation.** ESP32-C3 GPIO is a 3.3V domain; do not apply a 5V converter rail to signal pins or assume 5V tolerance. Bare SX1276 and a particular breakout are not interchangeable power specifications. Identify each board's regulator/input limits. MT3608 is a step-up converter, not a 3.3V regulator for a LiPo that may exceed 3.3V when charged. Measure its output unloaded first. If feeding a verified board 5V input, confirm that board's regulator and route a separately verified suitable rail to LoRa. Never bridge 5V and 3V3 or use a GPIO as GPS supply from this sketch.
2. **Battery/charger/protection.** Confirm single-cell chemistry, real capacity, polarity, permitted charge/discharge currents, protection, and TP4056 variant/program resistor. A charging module is not necessarily a protected module; B and OUT terminals alone are not certification. Do not assume a common module's charge-current setting is safe for either stated battery.
3. **Solar charging and simultaneous load.** The panel's label represents only 0.25W nominal peak, not continuous harvest. TP4056 alone does not establish solar input regulation, MPPT, or proper load sharing/power-path behavior. Loading the battery while charging can affect termination, and low sunlight can collapse input. Verify cold/open-circuit panel voltage against the exact charger's limit; protection/reverse-current behavior, charge regulation, and load-sharing remain unresolved.
4. **Shared ground and rail continuity.** Verify GPS GND, LoRa GND, ESP GND, converter output return, and protected battery output return with power removed. Mark joins explicitly, including the GPS VCC route. Do not bypass any protection through an accidental B- connection or assume crossings are joins. Check for supply shorts before connecting modules.
5. **Peak load / decoupling.** Validate regulator, converter, battery/protection, and wiring against GPS acquisition, LoRa TX, and Wi-Fi bursts, not daily average energy. No explicit decoupling, bulk capacitance, fuse, switch, or power-path circuit is shown. Absence from the drawing is not proof the module lacks them; inspect actual modules. Watch rail droop, resets, charger temperature, and boost idle losses.

These are general electrical constraints applied to the drawing, not verified voltage tolerances or component ratings for the purchased modules. Obtain the exact manufacturers' board/module documentation before choosing rails or components.

## Pin, bus, and radio blockers

| Area | Evidence / unknown | Required verification |
| --- | --- | --- |
| ESP32-C3 Mini | Board name supplied, revision/pinout not supplied | Match board photographs/model to official pinout; reserve boot-strapping, flash, USB/debug, and console pins as applicable. Arduino core choice does not validate arbitrary pins. |
| GPS UART | Separate TX/RX wires are visible, assignments unvalidated | Explicitly document GPS TX → MCU configured RX; MCU TX → GPS RX only if needed. Verify breakout VCC input versus UART I/O levels separately, baud/protocol, common ground, and valid-fix parsing. Test GPS VCC wiring first. |
| LoRa SPI | NSS/SCK/MOSI/MISO plus reset/DIO labels are visible | Provide a complete pin table with no duplicates; verify SPI direction, CS, reset, interrupt line(s) required by the selected library, and firmware pin configuration. Module-specific DIO requirements are not assumed. |
| Master microSD | Listed in master power table, absent from image and tracker component list | Confirm whether included in master; if sharing SPI, use independent CS and confirm MISO tri-state behavior and 3.3V-compatible breakout. Do not reserve pins for an unconfirmed feature. |
| LoRa RF | Parts mention 915MHz / 13dBm; schematic only labels SX1276 | Confirm both ends' actual module band, matching antenna and connector, permitted local frequency/channel/power/duty use, and matching modem settings. Attach the proper antenna before transmitting. No range claim is verified. |
| GPS antenna | Antenna block and wire shown | Confirm supplied antenna type/connector/bias requirements; give sky exposure and separate it from noisy converter/radio wiring. Outdoor fix and acquisition time must be measured. |

## Apply only to the selected roles

- **Prototype:** Arduino-core ESP32-C3 Mini + GPS + Wi-Fi uplink. LoRa is not required for this stage unless the coordinator changes scope. First prove valid GPS fix → Wi-Fi upload → visible timestamped app record using safe, verified bench power.
- **Master:** ESP32-C3 Mini without GPS, Wi-Fi uplink, and LoRa reception for the selected slave path. The picture's GPS wiring does not become master wiring. Confirm whether master microSD is required before allocating pins or power budget.
- **GPS slave:** ESP32-C3 Mini + GPS + LoRa transmission. Validate its sleep/wake, acquisition and transmit energy independently; the prototype's Wi-Fi budget and master's continuous budget cannot substitute for this measurement.

This role mapping follows the supplied user direction; it does not select packet formats, database ownership, geofence authority, or storage architecture.

## Sunday bring-up gate for Monday delivery

The device can be plugged in and tested Sunday 4 October; deadline is Monday 5 October. This establishes hardware testing availability, not a purchased-hardware arrival date. Prepare the wiring checklist and firmware configuration before that testing window, but do not fabricate verified hardware results.

1. Photograph both sides of every board and battery label; resolve 100 versus 1000mAh. Record model, input limits, charger setting, and antenna band. Obtain an explicit netlist and pin table.
2. With power removed, check polarity, rail isolation, ground continuity, and GPS VCC. Measure converter output separately using a safe bench setup; connect only within verified limits.
3. Boot the MCU alone; add GPS on verified UART and measure an outdoor valid fix. Record time, fix validity, and supply behavior. A serial sentence without a valid fix is not successful positioning.
4. Prove prototype Wi-Fi upload and app display with a timestamped real fix; label replayed/mock data explicitly if hardware is blocked. Then test one LoRa slave → master packet and master → Wi-Fi uplink.
5. Test packet loss, no fix, duplicate/replayed packets, stale status, and reconnection without erasing the last valid record. Measure supply under TX/uplink bursts. Integration owners choose protocol details; this review does not accept them.
6. Defer solar-assisted endurance claims and animal deployment until charger/power-path, thermal, runtime, enclosure, and collar safety checks pass. An unvalidated battery/solar circuit is not justified by the deadline.

## Questions requiring exact answers

- What are the exact ESP32-C3 Mini, GY-NEO6MV2, SX1276, TP4056, and MT3608 board models/revisions and their documented pinouts/input limits?
- Is the actual battery 100mAh or 1000mAh; what are its protection and permitted charge/discharge currents?
- What converter output is intended, and which net powers GPS VCC and LoRa VCC? Is the drawn GPS VCC-to-left-ESP route an error?
- Which physical wires cross versus join, and is GPS TX/RX explicitly mapped to the configured MCU UART directions?
- Is master microSD in scope, and what compliant LoRa band/antenna/settings are available for both devices?
- What acquisition/upload/packet cadence produced the daily energy assumptions? No runtime claim can be validated without it and measured mode currents.

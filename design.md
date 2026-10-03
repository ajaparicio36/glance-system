# Glance native design draft

Status: implementation guidance for review, 3 October 2026. This document does not accept architecture ADRs or certify package compatibility. Target: a new Expo / React Native app using the requested MapLibre and SQLite/Drizzle direction; NativeWind is the user's styling fallback, not an established installation.

## Source and scope

`docs/specs/color-and-font.md` is the authoritative user palette/font source and remains unchanged. Its Tailwind CSS and Next.js layout are web examples, not native setup instructions. Root and applicable `docs` instruction/context files were checked before the initial draft; none were present. Instructions inside `glance-app` do not govern this root document. This revision incorporates the coordinator's verified scope findings, without duplicating the old-app or thesis review: user-defined polygons with ray-casting, reuse of the existing native polygon interaction, and last-known device location rather than continuous GPS history.

Design references read: Apple Design, Mobile Native, Emil Design Engineering, Animate Expo, and Ponytail. Transfer their principles, not their DOM/CSS recipes: immediate feedback, familiar navigation, safe areas, legible hierarchy, interruptible gestures, reduced motion, and native-first simplicity. For conflicts, native Animate Expo guidance takes precedence over web blur/pointer recipes. The user's explicit Geist choice takes precedence over Apple's generic system-font default.

Deadline: Monday 5 October; the device can be plugged in and tested Sunday 4 October. This is hardware testing availability, not a purchased-hardware arrival date. Prioritize one honest tracking flow over decorative polish or speculative screens.

## Accepted Round 1 update — 3 October 2026

The user requires live GPS position and working geofence violation/return reporting for Monday. Clearly labelled synthetic fixtures may supplement transition evidence when moving the single device is difficult, but do not replace live GPS. `docs/adr/0001-prototype-geofence-authority.md` assigns prototype authority to the server, with SQLite as a cache, deliberately diverging from thesis master-side evaluation; no offline master authority is promised. `docs/adr/0002-prototype-transport-and-access.md` records HTTP(S) POST ingestion, RFC6455 WebSockets, configured identity, and separate upload/read credentials without registration. `docs/adr/0003-usb-demo-and-power-deferral.md` defers battery/solar integration despite user-confirmed 1000mAh inventory. These are accepted targets, not completed implementation or validation.

## Accepted Round 2 update — 3 October 2026

`docs/adr/0004-prototype-lifecycle-and-contract.md` records confirmed behavior; `docs/protocol.md` freezes the shared contract. Upload every 5 seconds; stale when observation age or accepted receipt age reaches 15 seconds (invalid timestamps are stale). Exact edges/vertices count as inside; an initial outside observation opens one episode, repeated outside does not duplicate, and a fresh inside observation resolves it as returned. Returned is history, while current boundary status is inside. Retain last coordinates and episode history, not a GPS trail; foreground in-app alerts only, no background push/buzzer. The owner credential can read/subscribe and edit the singleton fence; device credential only uploads. Fence replacement closes active episodes as fence_changed, retains coordinates, resets status to unknown, and waits for the next accepted fix. No initial filtering/hysteresis is required; label jitter and calibration risks honestly. Production LoRa band/pins and measured/native/hardware compatibility remain unresolved or unverified. These targets do not certify implementation.

## Visual direction

Quiet monochrome chrome, generous readable spacing, a map as the primary workspace, and one clear action per task. White/black primary actions invert with theme. Warm chart-1 and blue chart-2 are restrained semantic map accents, not a new brand palette. Prefer solid surfaces over glass so busy maps and older Android devices remain usable. Keep settings secondary; avoid a dashboard of redundant cards.

## Exact source color tokens

Values below are the source OKLCH values, unchanged. Each cell denotes `oklch(L C H)`; retain token names. This table is a specification, not a claim that React Native accepts OKLCH strings. Convert once to supported sRGB colors at implementation time, explicitly gamut-map out-of-range colors, and verify contrast after conversion. NativeWind does not by itself establish native OKLCH support.

| Token | Light: L C H | Dark: L C H |
| --- | --- | --- |
| background | 0.9900 0 0 | 0 0 0 |
| foreground | 0 0 0 | 1 0 0 |
| card | 1 0 0 | 0.1400 0 0 |
| card-foreground | 0 0 0 | 1 0 0 |
| popover | 0.9900 0 0 | 0.1800 0 0 |
| popover-foreground | 0 0 0 | 1 0 0 |
| primary | 0 0 0 | 1 0 0 |
| primary-foreground | 1 0 0 | 0 0 0 |
| secondary | 0.9400 0 0 | 0.2500 0 0 |
| secondary-foreground | 0 0 0 | 1 0 0 |
| muted | 0.9700 0 0 | 0.2300 0 0 |
| muted-foreground | 0.4400 0 0 | 0.7200 0 0 |
| accent | 0.9400 0 0 | 0.3200 0 0 |
| accent-foreground | 0 0 0 | 1 0 0 |
| destructive | 0.6300 0.1900 23.0300 | 0.6900 0.2000 23.9100 |
| destructive-foreground | 1 0 0 | 0 0 0 |
| border | 0.9200 0 0 | 0.2600 0 0 |
| input | 0.9400 0 0 | 0.3200 0 0 |
| ring | 0 0 0 | 0.7200 0 0 |
| chart-1 | 0.8100 0.1700 75.3500 | 0.8100 0.1700 75.3500 |
| chart-2 | 0.5500 0.2200 264.5300 | 0.5800 0.2100 260.8400 |
| chart-3 | 0.7200 0 0 | 0.5600 0 0 |
| chart-4 | 0.9200 0 0 | 0.4400 0 0 |
| chart-5 | 0.5600 0 0 | 0.9200 0 0 |
| sidebar | 0.9900 0 0 | 0.1800 0 0 |
| sidebar-foreground | 0 0 0 | 1 0 0 |
| sidebar-primary | 0 0 0 | 1 0 0 |
| sidebar-primary-foreground | 1 0 0 | 0 0 0 |
| sidebar-accent | 0.9400 0 0 | 0.3200 0 0 |
| sidebar-accent-foreground | 0 0 0 | 1 0 0 |
| sidebar-border | 0.9400 0 0 | 0.3200 0 0 |
| sidebar-ring | 0 0 0 | 0.7200 0 0 |

Usage: background for the shell; card for tracker details; popover for menus; primary for Save/Retry; secondary for secondary controls; muted for passive group surfaces; destructive for deletion/errors. Use chart-2 for the selected tracker marker and chart-1 for caution/geofence emphasis, with text, distinct outlines, and icons. Do not invent green success tokens: a check icon plus foreground text is enough. Sidebar tokens are reserved; they do not require a mobile sidebar.

Low-contrast border/input colors separate surfaces but are not sufficient by themselves for essential control boundaries. Use foreground/ring outlines where an affordance needs stronger contrast. Do not assume destructive-foreground over destructive meets small-text contrast: verify the converted pair; if it fails, use destructive as an icon/border beside foreground text on card, not a filled small-text button.

## Fonts and typography

Source families: `Geist, sans-serif`; `Georgia, serif`; `Geist Mono, monospace`, identical in both themes. Load local, licensed Geist and Geist Mono assets using the chosen Expo font-loading setup; register real regular/medium/semibold weights instead of relying on synthetic weight names. Until loading succeeds, use the platform sans/monospace fallback without blocking tracking. Georgia is an optional editorial family, not body UI; it is not guaranteed on Android and is not supplied by `next/font/google`. Do not copy that source sample import into Expo. Do not bundle a replacement serif without user agreement or a license check.

| Role | Size / line height, native units | Weight / tracking |
| --- | --- | --- |
| Screen title | 28 / 34 | Geist semibold; -0.3 |
| Section title | 20 / 26 | Geist semibold; -0.1 |
| Body and input | 16 / 24 | Geist regular; 0 |
| Button and tracker name | 16 / 22 | Geist medium; 0 |
| Supporting label | 14 / 20 | Geist regular; 0 |
| Timestamp / coordinates | 14 / 20 | Geist Mono regular; 0 |

These sizes are design recommendations, not values copied from the source. Source normal tracking is `0em`; tighter heading tracking is the explicit native adaptation. Keep font scaling enabled, including secondary timestamps. Use flexible heights, multiline labels, and scrolling at 200% text size; never clip essential age/status text. Avoid all-caps metadata and tiny map-only labels.

## Geometry and materials

- Source spacing is `0.25rem`; source base radius is `0.5rem`. For the native adaptation, use a 4-unit spacing step and 8-unit base radius (the web values correspond at a 16px root, not an RN rem conversion).
- Spacing scale: 4, 8, 12, 16, 24, 32. Screen gutters and card padding: 16; related rows: 8; unrelated sections: 24. Base radii: small 4, medium 6, large 8, extra-large 12, matching the source radius offsets under that adaptation.
- Touch targets: at least 44pt iOS / 48dp Android; default common control box 48 units. Give small icons non-overlapping hit slop. Do not use rounded pills for every surface.
- Source shadow intent: black, x=0, y=1, blur=2, spread=0; opacity 0.09 for xs/2xs, 0.18 for ordinary shadows, 0.45 for 2xl. Source sm through xl use layered shadows; do not paste CSS box-shadow strings into unsupported RN styles. Use a subtle static native shadow/elevation only for floating map controls/sheets and verify each platform. Never animate blur or elevation. Dark surfaces primarily separate by tone/outline.
- Paint the map edge-to-edge, but inset controls, status text, navigation controls, and sheet actions using native safe-area information. Avoid double-insetting navigation chrome. Adapt to rotation/window size with native layout measurement, not browser viewport units.

## Smallest useful interface

Recommend reusing the existing **Map** and **Setup** structure rather than introducing three new top-level tabs. Tracker selection/details and any required settings can live in simple detail panels. Final navigation follows the approved scope; this is a reuse recommendation, not an accepted navigation architecture. Native back navigation exits detail tasks; unsaved edits get Discard/Keep editing.

### Map and tracking

Map occupies the canvas. Top: compact connectivity/last-update strip. Bottom: selected tracker card with name, fix age, location status, and Details if required by scope. Provide an accessible Recenter control. Do not confuse the phone location with the tracker location; if phone location is included, use visibly different marker shapes and labels.

Selecting a tracker reveals its last confirmed fix and uncertainty when supplied. Display the last-known position only: no GPS trail, time-filtered fix history, or implied continuous-location storage. Never show an extrapolated animal position as live. Preserve user pan/zoom across received updates; Recenter is explicit. The chosen map style must preserve attribution and readable controls in light/dark themes; map-style colors need not be forced into the chrome palette.

Tracker detail shows last GPS fix time and only additional telemetry selected by the approved scope. If battery is included, show measured telemetry or “Battery unavailable,” never a guessed percentage. Violation/return episode history is required for Monday; it does not imply GPS fix history. Show server-reported resolutions, distinguishing returned from fence_changed. Navigation presentation remains implementation guidance, not an extra accepted architecture decision.

### Geofence

Reuse the existing native prototype's polygon draw/tap/undo/save/cancel interaction, adapting its presentation and map integration rather than replacing it with a circular editor. The coordinator confirms the thesis scope is user-defined polygons with ray-casting; accepted ADR-0001 now places prototype evaluation on the server, not the app or thesis master.

Show ordered vertices and the polygon preview as the user taps. Undo removes the last added vertex; Cancel discards the draft and retains the saved fence; Save commits only after validation. Require at least three unique vertices, finite latitude/longitude within valid ranges (latitude -90 to 90, longitude -180 to 180), nonzero area, and no self-intersection. Treat a repeated closing vertex as closure, not an extra unique vertex. Keep errors inline and preserve the draft for correction. Provide an accessible ordered vertex list with labeled latitude/longitude inputs and add/edit/remove controls as an alternative to map tapping. Do not silently reposition vertices using phone location.

Accepted boundary behavior: exact edges/vertices are inside, using the shared inclusive-edge ray-casting helper without added tolerance. Preview and evaluator must share that policy; exact floating-point geometry is not proof of GPS certainty. Boundary noise can cause repeated episodes and needs field calibration rather than a fictitious accuracy guarantee.

Distinguish a local draft/cache from server-authoritative geofence state; a SQLite save alone does not establish an active server fence. Use the owner credential and optimistic fence version for Save; preserve the draft after errors or conflicts. Replacement closes active episodes as fence_changed, retains last coordinates, and shows unknown until the next fresh observation. Show result time and freshness; an old fix does not establish current safety. Accepted delivery is foreground alerts/history only, not background push or buzzer enforcement. The frozen API has no fence-deletion endpoint; do not imply that local deletion removes the authoritative fence. Ordinary save does not need an extra modal.

### Offline and uncertainty are first-class

Keep these independent: phone connectivity, master uplink, tracker packet receipt, GPS fix validity/freshness, and map tile availability. “Online” is not proof of a current GPS fix. Show observation age separately from accepted receipt freshness; stale means either age reaches 15 seconds at a 5-second upload cadence. Delayed receipt cannot make an old observation current, and allowed source-clock skew does not extend the receipt timeout. Preserve last coordinates and open episodes; neither elapsed time nor a disconnected socket manufactures a return/disconnection event.

| State | Required presentation |
| --- | --- |
| Loading with no local fix | “Loading tracker…”; no fabricated marker |
| No GPS fix | “Waiting for GPS fix”; last valid fix, if any, explicitly historical |
| Fresh fix | Fix timestamp/age; selected marker with shape + label |
| Stale / lost link | “Last seen …”; historical outline marker and persistent warning text |
| Phone offline | “Offline · showing saved data”; no implication that tracker itself stopped |
| Tile fetch failure | “Map unavailable”; retain last-known coordinate/time text and Retry |
| Local draft/cache only | “Saved on this phone”; not proof the server fence is active |
| Fence change pending | Distinguish local draft from server confirmation; expose errors/version conflicts |
| Reconnect | Update confirmed data without losing selection, map pan, or draft edits |

SQLite/Drizzle is the local cache for server-authoritative prototype data; it does not establish offline geofence authority, cache map tiles automatically, or imply GPS history. Offline basemaps require separately verified MapLibre support, storage behavior, and tile-provider licensing. Until verified, promise only the locally retained data actually implemented. Error text must stay readable, not disappear in a toast; never erase the last valid record on a request failure.

## Native interactions and accessibility

Use native `Pressable`, inputs, lists, switches, alerts, stack navigation, and supported safe-area handling before adding UI libraries. Provide keyboard types, field labels, inline errors, and a keyboard-safe scrollable form. Keep Save visible or reachable with the keyboard open. Support Android back and platform screen-reader focus behavior; return focus to the trigger after dismissal.

Minimum contrast targets after native color conversion: 4.5:1 normal text, 3:1 large text and essential non-text affordances. Convey alerts by words/icons as well as color. The map must have a list/coordinate alternative for screen-reader users. Label icon buttons and marker actions; expose selected/disabled/busy states. Announce meaningful changes without speaking every GPS packet. Permission denial explains the affected feature and offers settings recovery; browsing remote trackers should not be blocked by unnecessary phone-location permission.

## Motion: native, purposeful, minimal

Motion/Framer Motion web APIs are not the RN default. Reanimated with Gesture Handler is a recommendation for custom gesture motion, contingent on the selected Expo SDK and native architecture. Prefer the existing native stack's supported transitions or a static detail panel over a new custom sheet library. Expo Router form-sheet/native-tab capabilities are platform/version-dependent, not assumed universal.

| Interaction | Frequency / purpose | Recommendation |
| --- | --- | --- |
| Tab switch, incoming telemetry | Frequent / state | No decorative animation or pulse loop |
| Press feedback | Repeated / feedback | Instant press-in visual; optional scale 0.97 over 100–150ms, commit on successful press |
| Small state change | Occasional / comprehension | Opacity 150–200ms, ease-out `(0.23, 1, 0.32, 1)`; no wait before interaction |
| Detail screen | Occasional / spatial consistency | Supported native stack default; respect system reduced motion |
| Custom drag sheet, only if needed | Occasional / direct manipulation | Finger tracks 1:1; release carries velocity; interrupt/reverse from current position |

For a supported Reanimated implementation, default settle guidance is `duration: 400, dampingRatio: 1`; momentum sheet guidance is `duration: 300, dampingRatio: 0.8` with release velocity. These are version-dependent spring API recommendations, not measured settle times or compatibility guarantees. Start without bounce; only a momentum gesture earns slight overshoot. Use the native implementation's velocity units; do not paste web thresholds into native gestures.

Animate transform/opacity, not layout every frame. Gestures stay in UI-runtime shared values/worklets; no React state or RN-runtime scheduling per frame. Keep map pan/zoom under the map's own gesture system. Custom sheets must not steal map or list scrolling. Respect system reduced motion with static changes or short fades, no translation/scale/overshoot. No animated blur, confetti, staggered tracker rows, or endlessly pulsing “live” dots. Haptics are optional, at most one per meaningful user commit, never per GPS packet and never the sole feedback.

## Compatibility gate, not architecture approval

Before implementation, the owning agent must record the actual Expo SDK/RN versions and verify the MapLibre native package, architecture support, development-build requirements, SQLite/Drizzle adapter, font assets, NativeWind version/configuration, and chosen gesture/animation packages. Reanimated 4 requires New Architecture; do not infer that the selected map package works with it. Resolve supported Expo packages with Expo's version-aware tooling, then build and run; a successful web preview or Expo Go session is not native compatibility evidence. No packages were installed or native builds tested in this review.

Verify Android/native networking compatibility for an explicitly scoped trusted-local HTTP/ws development endpoint; tokens are exposed to network observers there. Cloud requires HTTPS/wss and certificate verification; no global cleartext permission or TLS bypass is approved. Compatibility remains a verification task, not a claim that the selected build already supports this exception.

Keep dependencies limited to the requested app stack and features that cannot reasonably use native controls. No additional toast, blur, illustration, canvas, keyboard-animation, or bottom-sheet dependency for this deadline without a demonstrated need. A static panel and clear inline status are the fallback when motion compatibility is unresolved.

## Review acceptance

- Check exact palette/font names against the preserved source; test converted light/dark contrast before shipping.
- Confirm the approved Map/Setup flow and reused polygon tap/draw/undo/save/cancel behavior, including invalid coordinates, insufficient unique vertices, zero area, and self-intersections. Verify inclusive edges/vertices using the shared helper.
- Confirm live GPS, initial outside/repeated outside/return, last-known-only display, no-fix, 15-second stale, and offline states. Label synthetic transition fixtures; they do not replace live GPS. Test retained episode history, owner fence writes/version conflicts, and fence_changed followed by next-fix evaluation; cached data does not establish active server state.
- Verify 200% text, safe areas, keyboard, screen-reader labels/focus, and reduced motion on supported native builds.
- Feel-check interrupted gestures, polygon tapping versus map panning, and responsiveness on the slowest supported Android in release mode. This document performs no browser/device interaction; later interactive QA requires shared-resource confirmation.
- Do not claim battery runtime, current safety, offline basemaps, background alerts, or native package compatibility from this draft alone.

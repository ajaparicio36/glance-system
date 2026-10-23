# Glance — current-screen Stitch prompt

Copy the complete prompt below into Stitch. The source inventory after the prompt is local review evidence, not required input.

```text
Design a cohesive native mobile app screen set for Glance, a livestock tracker and polygon-geofence app. Produce product UI, not a website, landing page, marketing deck, or speculative dashboard. Use the latest iOS Liquid Glass visual language: quiet, precise, tactile, readable. Keep every label exceptionally concise and every helper to one short sentence at most. Preserve the real functionality below.

SCOPE AND DELIBERATE DESIGN CHANGE
The current app has exactly two top-level destinations: Map and Setup. Connection fields and the polygon editor currently live inline in Setup; violation history and expandable episode details currently live within Map. The standalone form screens requested here are a redesign/extraction concept, NOT already implemented routes. Do not claim these screens already exist.

The user explicitly requests Liquid Glass/glassmorphism instead of the earlier solid-surface preference. This is a deliberate new visual direction for this concept, not a change to the app's business rules. Keep Geist, not an automatic switch to SF. Apple inspiration must remain feasible for cross-platform Expo/React Native and MapLibre. Do not prescribe web CSS, Framer Motion, new packages, or promise native glass availability on Android. Show a beautiful opaque equivalent where glass is unsupported or unsuitable.

REAL PRODUCT CONTRACT
- One configured owner connection and one server-owned polygon fence; no account creation or fence collection.
- Owner enters Server URL and Owner credential, then explicitly saves. Saving credentials on the phone is not successful server authentication. A device-upload credential cannot authorize this UI.
- Server snapshots supply tracker IDs, last confirmed coordinates, GPS observation time, receipt time, boundary status, saved fence/version, and violation episodes. Select existing trackers only when multiple are actually supplied; no tracker creation, rename, pairing, deletion, animal profile, or inventory.
- Tracking retains last-known positions and episode history, NOT a GPS trail. No routes, playback, heatmaps, speed, battery estimates, phone-location dot, or accuracy circles without data. Phone GPS permission is unnecessary.
- Updates are intended every 5 seconds. A location is stale when either GPS-observation age or accepted-receipt age reaches 15 seconds. Connection health and location freshness are different. Never label an old or disconnected position “Live,” “Safe,” or currently inside/outside.
- Server evaluates the fence. Boundary edges/vertices count as inside. An initial outside fix opens one violation episode; repeated outside fixes do not duplicate it. A fresh inside fix resolves it as returned. “Returned” is history; the current boundary status is inside.
- Replacing a saved fence closes active episodes as fence_changed, NOT returned, retains coordinates/history, and leaves boundary status unknown until the next accepted fresh fix.
- SQLite caches confirmed snapshots, not authoritative offline fence saves or map tiles. A draft can be edited disconnected, but only an authenticated server acknowledgement confirms a fence save. Do not invent a queued upload or background synchronization guarantee.
- Alerts are in-app and foreground-only. Reconnection loads history without replaying old alerts. No push notifications, notification permissions, SMS, buzzer, or background monitoring promise.
- Use only synthetic fixtures: tracker “Tracker 01,” episode “#12,” version “v3,” URL “https://tracker.example,” a masked credential “••••••••,” and clearly synthetic coordinates if needed. No real endpoint, token, farm location, or private data. A neutral synthetic map scene is sufficient.

VISUAL SYSTEM — PORTABLE SOURCE VALUES
Use these exact sRGB palette values, obtained from the app's existing gamut-mapped OKLCH conversion; do not substitute a new brand palette. Values are light / dark:
background #fcfcfc / #000000
foreground #000000 / #ffffff
card #ffffff / #090909
popover #fcfcfc / #121212
primary #000000 / #ffffff
primary text #ffffff / #000000
secondary #ebebeb / #222222
muted #f5f5f5 / #1d1d1d
muted text #525252 / #a4a4a4
accent #ebebeb / #333333
border #e4e4e4 / #242424
input #ebebeb / #333333
focus ring #000000 / #a4a4a4
destructive #e54b4f / #ff5b5b
caution/fence fill #ffaf0b / #ffaf0b
tracker marker #2d62ef / #2671f4
Secondary, card, popover, and accent text use the theme foreground. Use monochrome primary buttons; blue identifies the tracker, amber lightly fills the fence/caution. Do not invent green “safe” branding. Use a check and words for inside. Errors use a destructive icon/outline plus foreground text on an opaque surface; do not assume small white text on red meets contrast.

Typography: Geist regular 400, medium 500, semibold 600; Geist Mono regular 400 for coordinates/timestamps. Source serif is Georgia but it is optional editorial type, not needed here. Use platform sans/monospace fallback if fonts are unavailable. Titles 28/34, sections 20/26, body/inputs 16/24, buttons 16/22, supporting text and mono 14/20. Body tracking 0; titles may use -0.3 native units. Support Dynamic Type through 200% without clipping or truncating critical state.

Use 4-unit spacing rhythm: 4, 8, 12, 16, 24, 32; 16-unit gutters. Source base radius adapts to 8 native units for ordinary controls, 12 for panels. Larger continuous glass corners and the floating tab capsule are deliberate Liquid Glass adaptations, not a pill shape on every card. Minimum hit areas 44pt iOS / 48dp Android; use 48-unit controls by default. Icons must have visible concise labels and screen-reader names, not hover-only explanations.

Glass belongs to floating navigation, compact map tools, and a restrained status surface, not every row/input/card. Use static soft backdrop diffusion, subtle edge highlights and shallow shadows; avoid neon gradients, lens distortion across labels, stacked transparent layers, or decorative glowing blobs. Text, coordinates, destructive decisions, and form fields need near-opaque backing. Keep the map and its attribution readable underneath.

Provide light and dark designs, plus an opaque accessibility/Android material variant. Reduced Transparency removes blur and makes surfaces solid using card/popover tokens; Increased Contrast strengthens foreground boundaries. Normal text needs 4.5:1 contrast, large text/essential controls 3:1, including over the busiest map. Low-contrast border tokens alone cannot identify essential inputs. Adapt material opacity to content, never sacrifice readability for glass.

Paint the map edge-to-edge as a proposed layout improvement; current implementation has an embedded map. Keep all controls and text within native safe areas, clear of notch, home indicator, Android system navigation, map attribution, and keyboard. Avoid double safe-area padding. Map pan/pinch belongs to the map and must not scroll the page or drag a panel; only the panel's own content scrolls. Preserve pan/zoom on new data; Recenter is explicit and frames confirmed fence/positions, not phone location. Provide coordinate/list alternatives to map-only interactions.

NAVIGATION AND SCREENS
Show only Map and Setup in the labeled tab bar, with map and settings icons. Forms are dedicated pushed screens with a clear back path, not forms embedded in overview cards, not extra tabs, and not a multi-step onboarding funnel. Keep one visually dominant primary action per task; recovery/secondary actions are quieter. Do not invent a primary button on a read-only state that needs none.

01 — MAP: observe the tracker
Layout: compact “Glance” header with connection status; large map with saved solid fence outline/light amber fill and selected blue tracker marker; labeled “Recenter”; compact bottom tracker summary; accessible details/history below or in a non-blocking content panel. Keep setup fields off this screen.
Example: “Tracker 01” / “Inside fence” / “Updated 5s ago” / “Fence v3.” Use “Connected” for authenticated transport, never as proof of GPS freshness. Expose selectable coordinates, “GPS,” “Received,” and local timezone in expanded tracking details rather than dumping technical text onto the map. Example synthetic local timestamp: “Oct 24, 2026, 2:05:10 PM GMT+8”; format using the user's locale/timezone in the real UI.
Actions: “Refresh” explicitly reloads the snapshot; “Refreshing…” is busy/disabled. Marker tap selects an existing tracker; when multiple exist, also provide labeled selection rows. “Recenter” changes the camera only. “History” reveals the existing history content/expanded variant. An unconfigured state has one primary “Connect” action leading through Setup to Connection; it does not imply tracker pairing.
Back: root Map tab; expanded content collapses back to the same map/selection/camera.
Variants: loading “Loading…” with no fabricated marker; unconfigured “Not connected”; no fix “Waiting for GPS”; unknown evaluation “Waiting for update”; disconnected “Reconnecting” and “Last known location”; stale “Location outdated” and “Updated 20s ago”; fresh outside “Outside fence.” Stale/disconnected safety is unknown even if historical status was inside. Do not claim verified phone offline detection: an offline scenario uses the existing reconnecting/error presentation. A background/resume state says “Paused” then reconnects without old-alert replay.
Errors: “Refresh failed” with “Last confirmed data kept.” A cache-read failure says “Saved data unavailable”; a cache-write failure says “Couldn’t save a local copy.” Do not erase usable server data or pretend failed caching succeeded. Invalid server data remains rejected with “Update rejected”; retain the last confirmed snapshot.
Basemap failure is separate: “Map unavailable” with “Retry map”; keep coordinates/time and other data usable. No offline-map promise. Keep “© OpenStreetMap contributors · OpenFreeMap” visible and native attribution accessible. The non-native preview fallback says “Map needs a native build,” keeping coordinates/forms accessible; do not depict a working web map as existing capability.
Foreground event banner variants: “Tracker 01 · Outside fence,” “Tracker 01 · Returned,” “Tracker 01 · Fence changed”; action “Dismiss.” Dismissing only clears banners, never history. No continuous pulse or automatic celebratory animation.

02 — MAP / HISTORY EXPANDED VARIANT: inspect recorded episodes
This is the existing Map history flow presented clearly, not a new top-level destination or newly invented endpoint. Keep it as an expanded Map panel/content variant; no separate episode-detail route is necessary.
Layout/copy: “History,” “Local times · [device timezone],” “12 episodes · Page 1 of 3.” These are counts from the current snapshot, not a promise of all-time history. Show exactly five episodes per page except the final partial page, newest episode ID first. Each row starts collapsed: “Tracker 01 · #12” / “Open,” “Returned,” or “Fence changed” / “Show details.” Use status icons plus words.
Actions: tap a row or “Show details” to expand; “Hide details” collapses. Show “Outside” time and coordinates; if supplied show “Resolved” time and “Return GPS” time/coordinates. Never show return coordinates for fence_changed. Add one short clarification to its detail: “Closed after a fence change, not a return.” Show “Previous” and “Next,” disabled at their limits; both are secondary controls, neither a dominant CTA.
States: “No episodes yet” for an empty snapshot. Cached history remains readable during reconnecting, marked last confirmed; it is not a GPS trail or a map of every fix. Current inside status after return remains on Map, not a third “Returned” boundary state.
Back: collapse the expanded panel to Map without resetting selection or camera.

03 — SETUP: review connection and the singleton fence
Read-only overview, NOT an edit form. Title “Setup.” Connection group shows “Not connected,” “Connecting,” “Connected,” “Reconnecting,” or “Paused” honestly, plus a synthetic/masked server summary and no visible token. “Connect” or “Edit connection” opens screen 04. Show cached-data/transport errors near the affected group, not a full technical dump.
Fence group: “No saved fence” or “Fence v3 · 4 vertices,” a compact saved-outline preview and attribution, and “Create fence” or “Edit fence” opening 05 or 06. Before credentials exist, drawing is disabled with “Connect first.” A confirmed fence is not required to begin creation after settings are saved; connection trouble does not prevent local draft editing.
Primary: “Connect” when unconfigured; otherwise “Create fence”/“Edit fence.” The connection-edit row remains secondary when configured. No fence delete, list of fences, device CRUD, profile, preferences, theme toggle, or notification settings.
Retain the actual “Font license” disclosure: expand/collapse selectable Geist/Geist Mono license text in this overview; it is not a settings form or new app section. Recenter/Retry map remain available if showing the saved map preview.
Back: root Setup tab; Map tab returns to observation.

04 — CONNECTION: dedicated create/edit connection form
Same dedicated screen with first-connect and edit variants, title “Connection.” Two fields only: “Server URL” with synthetic placeholder “https://tracker.example,” and “Owner credential,” always masked in samples. Preserve URL keyboard, no autocapitalization/autocorrect, password-safe entry, readable field labels, and keyboard-safe layout.
One visible primary “Save & connect,” then “Saving…” while pending; no competing Test/Next buttons, secret-reveal UI, or upload-token field. Helper: “Use your owner credential.” Security helper: “HTTPS required.” Only for a trusted-development build with a configured host show “Local HTTP exposes your credential”; do not add a cleartext toggle or bypass. URL must be an origin without embedded credentials/path/query/fragment; unsafe or invalid values get a concise field error.
States: missing input “Enter both fields”; bad URL “Enter a server origin”; untrusted scheme “Use HTTPS”; storage failure “Couldn’t save connection”; saved settings “Saved · connecting”; successful authenticated snapshot “Connected.” Authorization failure “Check your owner credential”; denied access “Access denied”; wrong backend “Server not found”; unreachable/timeout “Can’t reach server”; malformed response “Invalid server data.” Keep input for correction and preserve actionable persistent errors. Saved credentials do not immediately mean connected. Changing connection scopes data to that connection and clears old banners; never mix two servers' records.
Back: Setup. Visible Save is mandatory; neither Back nor keyboard dismissal silently saves. A connection change must not discard an active polygon draft: finish/cancel that edit first. Any unsaved-field back protection is a proposed presentation safeguard, not a claim of existing implementation.

05 — CREATE FENCE: dedicated map-based polygon form
Title “Create fence”; no connection form on this screen. Empty local draft over the confirmed map context, no fake pre-saved polygon. Header/back, dominant map, short instruction “Tap to add corners,” ordered numbered vertices, “Draft · 2 vertices,” and an always-reachable primary “Save fence.” Add concise legend “Saved” / “Draft” whenever both outlines are present.
Tap adds an ordered vertex; pan/pinch navigates only. Show vertex numbers, dashed draft outline, and light fill only when the polygon is valid; saved outline stays solid. Do not invent draggable vertices, circles, radius/area tools, search, undo history stacks, or auto-follow.
Secondary actions: “Undo” removes the last vertex; “Add coordinate” opens screen 07; each vertex row offers “Edit” opening 08 and “Remove” deleting that local vertex. Use separate coordinate form screens, not inline latitude/longitude inputs in the map task. “Reload fence” fetches the latest saved outline/version while keeping the local draft unchanged. Recenter/Retry map preserve their existing meanings. No extra fence name or livestock assignment field.
Save disabled for fewer than three distinct valid vertices or invalid geometry, conflict, loading, or a pending request. Keep accessible validation: “Add 3 corners,” “Enter valid coordinates,” “Corner already exists,” “Edges can’t cross,” “Edges can’t overlap,” or “Enclose an area.” Latitude is finite -90…90 and longitude -180…180; closure is automatic, not an extra distinct point. Non-adjacent edges cannot touch either. Validation changes must not erase input.
States: “Draft · not saved”; valid “Ready to save”; pending “Saving…”; disconnected editing “Draft only”; failure/timeout “Save unconfirmed · draft kept.” No offline success or queued save. A lost acknowledgement requires reload/review before retry, not blind overwrite. After server acknowledgement show “Fence saved” and return to Setup; current safety awaits a fresh observation. If another fence exists by then, use the conflict/replacement rules in screen 06.
Back/Cancel: confirm “Discard draft?” with “Keep editing” and “Discard”; saved fence remains unchanged. Respect Android Back too. Disable conflicting changes while a save is pending; don't navigate away and falsely imply completion.

06 — EDIT FENCE: dedicated replacement form, not another saved fence
Separate screen/design from creation, title “Edit fence.” Initialize draft vertices from the saved fence and record its version. Preserve every map, coordinate, validation, undo/remove, cancel, and error behavior from 05. Show solid “Saved v3” outline against dashed “Draft”; map points, coordinate edits, and incoming snapshots never silently activate the draft.
Primary “Save fence.” Replacing an existing polygon opens a concise confirmation: “Replace fence?” / “Open episodes will close, not return.” Actions “Keep editing” and “Replace.” This confirmation exists in the current app despite older draft guidance against ordinary-save modals; preserve it for replacement, not first creation.
Conflict (409): “Fence changed elsewhere” / “Draft kept.” Disable Save and offer “Reload fence.” Reload fetches the current server polygon AND updates the expected version, but DOES NOT replace the draft. After success show “Latest fence loaded · draft kept”; require review and another explicit Save/Replace. Failed reload keeps both draft and prior expected version with “Reload failed · draft kept.” Never auto-merge or auto-retry an overwrite.
Confirmed replacement: “Fence saved,” then Setup shows the new version; Map shows “Waiting for update.” Existing open episodes close as fence_changed, not returned; history and last position remain. Do not infer current safety by evaluating the draft on the phone.
Back/Cancel: same discard protection, returns to Setup, keeping the confirmed fence. Never offer authoritative fence deletion.

07 — ADD COORDINATE: dedicated local vertex form
This extracts the current empty-coordinate-row capability, not a new server resource. Title “Add coordinate.” Two labeled inputs, “Latitude” and “Longitude,” supporting signed decimals, with the valid ranges available as concise field guidance. No public/private coordinates in examples; use synthetic values only. One primary “Add to draft,” disabled until both values are finite/in range. Inline error “Enter valid coordinates.” Geometry validation remains the parent fence form's responsibility.
Success adds one ordered vertex to the parent draft only, then returns to Create/Edit fence; it does not save the fence or say “Fence saved.” Back/Cancel returns to that parent without adding a vertex. Keyboard must not cover the action.

08 — EDIT COORDINATE: dedicated local vertex edit form
This extracts the existing per-vertex latitude/longitude inputs. Title “Edit corner 2”; same fields/validation as 07, prefilled from that draft vertex. One primary “Apply to draft.” This updates the local ordered vertex only, then returns to the parent fence form. Removing a corner remains the existing parent-row action, not a second dominant CTA or an invented server deletion.
Back/Cancel discards only this unapplied field edit; keep the rest of the parent draft. Invalid/empty input stays visible for correction. Applying coordinates must not imply the complete polygon is valid or server-saved.

INTERACTION CRAFT
Use familiar native navigation and platform back behavior. Tabs are peers: no sliding tab transition. Feedback begins on press-in, commits on release; optional 0.97 press scale over 100–150ms. Ordinary state changes can use a restrained 150–200ms ease-out opacity change. No animation for every GPS packet, no moving last-known marker extrapolation, no decorative list stagger. Native navigation handles screen transitions. If a panel is draggable, it tracks the finger 1:1, can reverse mid-flight, and carries release velocity; do not add a custom sheet just for decoration.

Native motion guidance overrides web blur recipes: never animate blur intensity or Android elevation; transform/opacity only on static material layers. Reduced Motion uses static updates or short fades without scale, sliding, parallax, or bounce. Haptics are optional and never the only feedback. No claim that motion/glass has been verified on hardware.

Expose selected, expanded, disabled, busy, and error states accessibly. Return focus to the originating control on back/dismiss. Announce meaningful safety changes without speaking every update. Preserve readable coordinates and an ordered form alternative for users unable to interact with the map. Don't hide critical controls behind gestures alone.

OUTPUT
Deliver the eight named screen designs, the History collapsed/expanded and pagination variants, and the relevant loading/empty/error/reconnecting/stale/violation/returned/fence_changed/saving/conflict/reloaded states attached to those screens, NOT extra features or top-level destinations. Include the replacement/discard dialogs, both themes, and an opaque accessibility/Android material comparison. Form screens must be visibly separate from overview screens and from each other; create and edit get distinct frames even when sharing a design. Use the concise example UI copy above; explanations in this prompt are designer instructions, not paragraphs to paste onto the map. Prioritize a calm map, obvious state, visible Save, honest uncertainty, and restrained Liquid Glass craft.
```

## Verified source inventory and coverage

Read-only inspection on 24 October 2026; repository root `D:/glance`, no root `.codegraph/`. No app code, routes, packages, or accepted decisions are changed by this document.

| Existing source evidence | Prompt mapping |
| --- | --- |
| `glance-app/src/app/index.tsx:1`, `glance-app/src/app/explore.tsx:1`, `glance-app/src/components/app-tabs.tsx:7`, `glance-app/src/components/app-tabs.web.tsx:6` | Exactly Map and Setup; all additional form frames explicitly proposed extraction, not implemented routes. |
| `glance-app/src/screens/map-screen.tsx:57` | 01: connection/cache/errors, Setup link, selection, alerts/dismissal, last position/age/GPS/receipt/local timezone, saved version, refresh. |
| `glance-app/src/screens/map-screen.tsx:13`, `glance-app/src/screens/map-screen.tsx:38`, `glance-app/src/tracking/presentation.ts:3` | 02: per-episode disclosure, outside/resolution/return data, newest-first five-item pages, Previous/Next, empty snapshot and timezone. |
| `glance-app/src/screens/setup-screen.tsx:118`, `glance-app/src/screens/setup-screen.tsx:164` | 03: overview extraction, saved fence/version/count, map context, font-license disclosure. |
| `glance-app/src/screens/setup-screen.tsx:66`, `glance-app/src/screens/setup-screen.tsx:123`, `glance-app/src/tracking/policy.ts:6` | 04: URL/secure owner field, explicit save/connect, status/errors, loading/pending/edit restrictions, trusted-local security exception. |
| `glance-app/src/screens/setup-screen.tsx:75`, `glance-app/src/screens/setup-screen.tsx:135`, `glance-app/src/screens/setup-screen.tsx:149` | 05/06: begin from empty/saved polygon, map taps, Save, Undo, Cancel, ordered coordinate fields/remove/add, reload-with-draft, conflict. |
| `glance-app/src/screens/setup-screen.tsx:114`, `glance-app/src/screens/setup-screen.tsx:154` | 07/08: dedicated proposed extraction of the existing blank-coordinate add and latitude/longitude edit inputs; local Add/Apply stages are presentation proposals, not new APIs. |
| `glance-app/src/screens/setup-screen.tsx:50`, `glance-app/src/screens/setup-screen.tsx:81`, `glance-app/src/screens/setup-screen.tsx:95`, `glance-app/src/screens/setup-screen.tsx:103` | Discard/Android Back, acknowledged-save requirement, retained draft on failure, replacement confirmation, explicit reload/version review without draft replacement. |
| `glance-app/src/components/live-map.native.tsx:22`, `glance-app/src/components/live-map.native.tsx:28`, `glance-app/src/components/live-map.native.tsx:47`, `glance-app/src/components/live-map.tsx:5` | Gesture isolation, Recenter, saved/draft distinction, markers, Retry map, attribution, native-only fallback; edge-to-edge map is proposed, not current embedded-map layout. |
| `glance-app/src/tracking/policy.ts:39`, `glance-app/src/tracking/policy.ts:45`, `glance-app/src/tracking/policy.ts:61`, `glance-app/src/tracking/provider.tsx:107`, `glance-app/src/tracking/provider.tsx:157`, `glance-app/src/tracking/provider.tsx:212` | Independent safety/freshness/transport states, foreground-only event banners, baseline/reconnect suppression, cache write/read errors, scope isolation. No distinct verified phone-offline state is invented. |
| `glance-app/src/tracking/network.ts:4`, `glance-app/src/tracking/network.ts:21`, `shared/geofence.ts:75` | Conflict/authorization/transport/backend/malformed-response variants and exact polygon validation constraints. |
| `docs/specs/color-and-font.md:5`, `glance-app/src/tracking/colors.ts:15`, `glance-app/src/tracking/colors.ts:37`, `glance-app/src/app/_layout.tsx:14`, `glance-app/src/components/tracking-ui.tsx:21` | Source palette/font families and actual font weights; portable hex values computed read-only by importing existing `palettes`; typography/touch targets grounded in current UI and design guidance. |
| `design.md:23`, `design.md:111`, `design.md:131` | Deliberate user-requested glass override with opaque accessibility/Android fallback; current replacement dialog preserved despite older ordinary-save guidance; native accessibility/motion principles retained. |

Read in full: root `AGENTS.md`, `design.md`, `CONTEXT.md`, palette reference, scoped `glance-app/AGENTS.md` and `glance-app/CLAUDE.md`; Apple Design, Emil Design Engineering, Mobile Native, Animate Expo, and Ponytail skill files. No narrower instruction/context copies were found along the inspected app paths or the destination `docs/` path. No graphical QA, screenshots, Stitch calls, external transmissions, commits, or pushes performed. Native glass feasibility and actual user-flow behavior remain unverified; this is a source-grounded prompt, not an implementation or device-validation report.

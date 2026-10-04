# Native tracking app

Implementation scope: `glance-app/` only, 3 October 2026. The shared protocol and geometry are imported directly with `.ts` extensions; the server remains the only geofence evaluator. No simulation lifecycle, five-device cap, phone-GPS dependency, trail, background push, or buzzer is included.

## Run and connect

Use Node 24 and npm in `glance-app`. Install with `npm ci`. MapLibre is custom native code, so Expo Go is not supported. After resource availability is confirmed, use `npm run android` (Android SDK/JDK needed) or `npm run ios` (macOS/Xcode needed) to create/install a development build. Neither command was used to control a device during this implementation.

Open **Setup** and enter the server origin plus the owner credential. The device upload credential is not authorized. Settings are kept in Expo SecureStore, not committed files or token URL parameters. Use HTTPS in normal builds. No map permission is requested: tracker coordinates come from the server, not the phone.

October 4 Setup repair: enter the manual server origin (`http://192.168.1.95:3000` only for the opted-in Android debug build) and OWNER_TOKEN, then tap **Save credentials & connect** directly below the credential field. Keyboard Done can submit too. Saving credentials is local SecureStore persistence, not proof of connectivity: Setup separately shows loading, saved/connecting, authenticated live, background pause and actionable failures. Connected is shown only after a valid authenticated live snapshot, never just because settings were saved. Physical screenshots verified an invisible dark-theme primary button and later text-only secondary buttons: removing className alone did not restore Pressable callback styles under NativeWind's global JSX interop. Button layout/colors now use a static native style object, with pressed feedback on the Text child, without changing Card/Field styling. Coordinator-owned QA on Infinix_X6711 confirmed the correction: Edit polygon has white fill/black text, Recenter has an opaque dark-card background/white border, and controls retain 48dp sizing. Empty fields/no saved settings explained the initial lack of app requests. Subsequent phone QA observed authenticated LIVE CONNECTION and correct Iloilo map centering with real owner configuration; manual endpoint connectivity works without a native rebuild.

During concurrent user testing, the coordinator observed `Confirmed fence v1`, four vertices and the successful server-confirmation message near the supplied Iloilo center. A subsequent coordinator-owned read-only backend check confirmed the actual saved version-1 fence with four vertices. The coordinator did not submit a real polygon PUT or tap Save: this is observation of the user's save, not an agent-generated fixture or an agent-performed end-to-end drawing test. Preserve that actual user fence. The phone later disconnected from ADB, ending QA access; no restart or rebuild was performed for further testing. Verified physical evidence is limited to visible static-style buttons, authenticated live connection, map centering and the server-confirmed polygon display. Keyboard submission, individual tap delivery, undo/cancel/conflict/failure interactions, physical GPS and RF remain unverified on the device.

After saving credentials, **Draw polygon** or **Edit polygon** is above the map. A preexisting polygon or GPS upload is not required. Tap ordered vertices to see numbered draft points; three valid vertices enable **Save polygon to server**, immediately below the map alongside Undo/Cancel. Coordinate fields remain an alternative if map tiles fail. Disconnected drafts are allowed after credentials are saved; failed saves and version conflicts retain the draft and never claim server confirmation. Reload latest fence retains the draft and updates its expected version; inspect the confirmed outline before retrying. Only an authenticated successful server save confirms the fence.

With no tracker location or polygon, the map initially centers latitude **10.730972921778378**, longitude **122.54782989758861**, zoom 16 (the user's final October 4 camera origin). This is a camera origin only, not a tracker fix. Existing location/polygon data take precedence at mount; telemetry does not recenter the camera. Recenter is explicit and also works on the empty map. These JavaScript/style repairs need an app reload (a full reload resets an already-mounted camera), not a native rebuild. The previously documented native-network policy change separately requires regeneration/reinstallation if the installed APK lacks it; no new native build, prebuild, Metro restart or device action was performed by this worker.

October 4 navigation/history polish: Map and Setup use the installed Gesture Handler ScrollView; the MapLibre surface has a native gesture with immediate Android activation and interruption protection so map interaction can cancel competing page scrolling. Overlay buttons remain outside that gesture detector; no JavaScript scroll lock is retained after end/cancel/unmount. Ordinary scrolling outside the map remains available. Map/Setup native tabs use SDK 57-supported Material icons on Android and SF Symbols on iOS. Violation history shows five newest episodes per page within the current snapshot, with Previous/Next controls and a page count. Only identity/status and the accessible Show details control are initially visible; tapping expands coordinates and event times. Pagination clamps when the snapshot shrinks and resets when server/owner scope changes; episode identity, not list position, keys expansion. This is local paging of the server projection (newest 100 plus any other active episodes), not a new remote history API or an unlimited archive. GPS, receipt and expanded episode timestamps render with the detected client locale/timezone, labelled with the timezone; protocol and SQLite timestamps stay canonical UTC. Invalid display times read “Time unavailable.”

For this polish, `check:tracking`, `typecheck` and `lint` pass; the exact captured command output is ignored `glance-app/dist/ui-polish-check.log`. New headless assertions cover the final fallback center with real-data precedence, five-item ordering/pagination/clamping without mutating incidents, canonical timestamp rejection, and different detected timezone rendering in isolated UTC/Pacific-Honolulu child processes. Gesture checks verify source wiring only, not physical pan/pinch/tap behavior. No worker native build/prebuild, Metro restart, ADB or device action was performed. Coordinator-owned phone QA is separate; the earlier physical Setup/fence observations above do not prove this new gesture/history/icon behavior.

Coordinator-owned October 4 polish QA passed on Infinix_X6711 (serial `112492539R101297`), using the existing installed development build with ordinary Metro 8081 and USB reverse. Up/down map pans on both Map and Setup left the surrounding page stationary; swipes outside the map still scrolled it. Both selected-tab icons were visible. Ten real episodes paged as #10–6 then #5–1; Next/Previous worked and edge controls were visibly disabled. Episode #9 expanded and recollapsed coordinates plus outside/resolved/return times. The detected timezone was Asia/Manila: GPS UTC 14:00:52 displayed 22:00:52 GMT+8. In Setup, one tap changed the four-vertex draft to five, panning added no vertex, and Android Back/discard retained confirmed fence v2. No saved fence writes, synthetic uploads or backend changes were made. The initial view-flattening warning was corrected by a direct `View collapsable={false}` child under GestureDetector; no new ReactNativeJS errors were observed after reload at 22:55:49. Ignored screenshots and corresponding layout JSON are under `glance-app/dist/device-qa/`: `map-up-pan`, `map-pan-after`, `history-collapsed`, `history-expanded`, `history-page-two`, `history-previous`, `setup-map-before`, `setup-map-pan`, `setup-tap-vertex`, `setup-edit-pan` and `setup-discarded` (`.png`). No new native build, iOS QA or pinch/multi-touch testing was performed; those remain unverified.

Metro serves the development JavaScript bundle on port **8081**; the backend API is separate on port **3000**. Keep normal `npm run android` / Expo connectivity, including Expo's USB reverse setup; no `REACT_NATIVE_PACKAGER_HOSTNAME` override is configured. App Setup still requires a manually entered server URL and owner credential: no env URL default or credential is embedded.

For the current trusted-LAN backend, ignored `glance-app/.env` contains only `GLANCE_TRUSTED_LOCAL=1` and `GLANCE_LOCAL_HTTP_HOST=192.168.1.95`. Android debug networking permits exact Metro hosts `localhost`, `127.0.0.1` and emulator host `10.0.2.2`, plus the explicitly configured trusted API host. Its base policy denies other cleartext hosts; no subdomains are allowed. Main/release remains strictly cleartext-denying, and runtime HTTP API selection still requires `__DEV__` and the configured API host. Metro exceptions do not authorize arbitrary HTTP API settings. TLS certificate validation remains enabled.

The plugin fix requires one native regeneration and debug rebuild/reinstall; changing env or reloading JavaScript cannot update an installed APK's XML. These commands are for the user/coordinator after confirming build/device ownership; this worker did not run them. First Ctrl+C the existing owned `expo run:android` / Metro terminal, then from `glance-app` in PowerShell:

```powershell
'GLANCE_TRUSTED_LOCAL','GLANCE_LOCAL_HTTP_HOST','REACT_NATIVE_PACKAGER_HOSTNAME','EXPO_NO_DOTENV','EXPO_PACKAGER_PROXY_URL' | ForEach-Object { Remove-Item "Env:$_" -ErrorAction SilentlyContinue }
npx expo prebuild --platform android --no-install
npm run android
```

Expo loads the private env file. Enter `http://192.168.1.95:3000` and the owner credential in Setup; existing SecureStore selections are not overwritten. For a phone using WiFi rather than USB, it must share a reachable LAN; if a saved dev-menu address is stale, the Metro address is `192.168.1.95:8081`, not the API port. Normal LAN autodetection can still select another NIC such as Hamachi; no override or physical connectivity fix is claimed here. Credentials are visible to LAN observers when using HTTP: use a trusted network only.

For iOS local HTTP, use a resolvable hostname (for example `glance.local`), not a numeric IP, because ATS domain exceptions do not support numeric IPs. iOS gets a domain-specific ATS exception only when explicitly generating a trusted-local build. Before production generation, remove the local GLANCE entries from private env files as well as clearing inherited variables, then regenerate; clearing shell variables alone lets Expo reload the file. No blanket ATS/TLS weakening is applied. Android release stays strict even if development flags are accidentally retained.

```powershell
Remove-Item Env:GLANCE_TRUSTED_LOCAL -ErrorAction SilentlyContinue
Remove-Item Env:GLANCE_LOCAL_HTTP_HOST -ErrorAction SilentlyContinue
npx expo prebuild --no-install
```

## Actual flows

- **Map** shows confirmed polygon, actual reported trackers, coordinates, observation/receipt timestamps, oldest GPS/receipt age, connection, and server episode history. At either age >=15 seconds, or on disconnection, current safety becomes unknown without removing the last fix or closing an episode. A future-skewed observation cannot prolong the receipt timeout. Native map failure leaves text coordinates/history available; SQLite does not cache tiles.
- OpenFreeMap Liberty supplies the basemap with OpenStreetMap/OpenFreeMap attribution. Recenter is deliberate; telemetry never auto-fits the camera. Selection/pan and an unsaved draft survive updates. The map/ordered tap, preview, undo, cancel and save interaction is adapted from `D:/projects/glance`; shared geometry originated there. None of its local simulation buttons or lifecycle state are migrated.
- **Setup** edits a polygon with map taps or ordered latitude/longitude fields. Blank/nonfinite/range-invalid, duplicate, zero-area, crossing/touching, and overlapping edges are rejected by shared validation. Save sends `expectedVersion` captured when editing began, not telemetry revision. Replacing an existing polygon requires confirmation. Offline/lost acknowledgement keeps the draft and does not claim confirmation. A 409 blocks Save until an explicit latest-fence reload/review; the draft remains intact. Cancel and Android back request Discard/Keep editing. Switching tabs preserves the draft.
- Snapshot cache rows store the complete confirmed projection (fence, latest fixes, episodes) in Drizzle/Expo SQLite. SHA-256 of normalized server origin and owner credential scopes rows without storing the credential in SQLite. SQL conflict guards and a serialized write queue prevent lower-revision/older equal-revision writes from replacing newer rows. Parse failures do not erase valid data. SQLite snapshots contain the server's projected history, not an unbounded replica of all historical episodes.
- `GET /api/snapshot` and `PUT /api/geofence` use Bearer owner authorization. WebSocket `/api/live` uses first-frame `{type:'authenticate',token}` and parses `{type:'snapshot',snapshot}` with shared strict parsers. Foreground-only sockets reconcile by GET every 10 seconds and reconnect with 1–30 second bounded backoff. HTTP requests time out after 10 seconds. Initial/reconnect snapshots establish alert baselines; ongoing episode ID/resolution changes produce dismissible in-app banners, once per event. Reconnect/start history never masquerades as new GPS events.

## Dependencies and design

Verified installed declarations: Expo 57.0.26, RN 0.86.3, Reanimated 4.5.1 / Worklets 0.10.1, NativeWind 4.2.7 / Tailwind 3.4.19, MapLibre 11.4.0, Expo SQLite 57.0.3, Drizzle 1.0.0-rc.4. Added dependencies were installed through `expo install`. NativeWind's v4 docs explicitly describe SDK 57 support; MapLibre v11 requires New Architecture and RN >=0.80. Native export/prebuild is not evidence of native linking or runtime compatibility.

Source references consulted: [SDK 57](https://docs.expo.dev/versions/v57.0.0/), [SQLite](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/), [Font](https://docs.expo.dev/versions/v57.0.0/sdk/font/), [SecureStore](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/), [Crypto](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/), [Expo Router](https://docs.expo.dev/versions/v57.0.0/sdk/router/), [Metro](https://docs.expo.dev/versions/v57.0.0/config/metro/), [config plugins](https://docs.expo.dev/config-plugins/plugins/), [MapLibre setup](https://maplibre.org/maplibre-react-native/docs/setup/getting-started/), [NativeWind v4 installation](https://www.nativewind.dev/docs/getting-started/installation).

The exact source OKLCH palette is converted to sRGB with chroma reduction at fixed lightness/hue when out of gamut. The UI uses monochrome foreground/background and restrained map accents; destructive filled small-text buttons are avoided. Contrast regression checks cover supporting text on light/dark card/background. Geist regular/medium/semibold and Geist Mono regular are local TTF assets from licensed Expo Google Fonts packages, with native sans/monospace fallback while loading or on error. OFL licensing is included and available in Setup. Georgia is not substituted or bundled.

Safe-area-aware native tabs, scrolling content, flexible text height, 16-unit inputs, screen-reader labels and >=48-unit actions are used. No decorative telemetry/tab animation or custom sheets are added. Press feedback is instant opacity; deliberate Recenter is 180ms (0 when system reduced motion is enabled). Font-scale/keyboard/screen-reader/native-map behavior still requires authorized real-device testing.

## Noninteractive evidence

Commands run in `glance-app`:

```text
npm run check:tracking
npm run typecheck
npm run lint
npx expo install --check
npx expo export --platform android --platform ios --output-dir dist/native-check
npx expo prebuild --platform android --no-install
```

The Node 24 check uses genuine file-backed SQLite and the production Drizzle upsert builder, closes/reopens the file, and verifies stale async writes and owner isolation. It also verifies strict cache parsing, dual-age freshness/delayed receipt/future skew, alert baselines/dedup/resolution labels, invalid polygons, supporting-text contrast, HTTPS restrictions, initial empty-map origin/coordinate conversion/tap-draft geometry, and real HTTP Bearer/version/409 behavior against an explicitly synthetic local fixture. Connection regressions exercise actionable 401/404/503 errors, abort/unreachable handling and invalid snapshot rejection without echoing server bodies or credentials. This is not an actual Fastify/PostgreSQL integration or live hardware test. Native map tap delivery, keyboard/safe-area/button behavior, cache adapter lifecycle, foreground reconnect/alerts and security enforcement still require coordinator-owned device QA.

Final results: `check:tracking`, `typecheck`, and `lint` exit 0; `expo install --check` reports `Dependencies are up to date`. Exact duplicate revision/serverTime frames are rejected both in memory and SQLite, so their arrival cannot reset `savedAt` or extend the 15-second freshness timeout; equal revisions with strictly newer serverTime still refresh the clock. The duplicate timeout regression passes after a real SQLite close/reopen.

Historical October 3 native evidence: Android export produced 1895 modules, a 4.5MB Hermes bundle; iOS export produced 1809 modules, a 4.3MB Hermes bundle. Both exported to ignored `glance-app/dist/native-check`, including the four requested Geist TTF assets. Android prebuild exited 0. The then-current networking check verified an API-only debug exception when opted in and complete debug denial without it. That older policy also blocked normal Metro loopback HTTP and is superseded by the October 4 debug-only Metro-host correction; those earlier results are not proof of the new policy or the user's installed APK.

For the current plugin, `node scripts/check-network-config.cjs --fixture` directly runs its Android mods in a uniquely scoped ignored temporary fixture, without prebuild or modifying the user's generated native directories. It checks exact main/release denial and debug Metro domains with no API host, with trusted LAN host `192.168.1.95`, and with duplicate host `localhost`. It also verifies that runtime API settings still reject public/Metro HTTP hosts and HTTP without the development opt-in. This fixture check, `npm run check:tracking`, `npm run typecheck` and `npm run lint` pass; existing generated native file hashes remain unchanged. After the user regenerates, `node scripts/check-network-config.cjs 192.168.1.95` checks actual generated files; omit the host only when no trusted API host was configured. No native build, Metro restart or device action was performed for this fix.

Attempted `npx expo prebuild --platform ios --no-install` exits 1 on Windows: `Skipping generating the iOS native project files. Run npx expo prebuild again from macOS or Linux to generate the iOS project.` followed by `CommandError: At least one platform must be enabled when syncing`. Therefore iOS config-plugin output/native linking is unverified, despite its successful Metro/Hermes export. Node's builtin SQLite experimental warning and module-type reparse warning are informational; package module type was not changed because native configuration files use CommonJS.

Initial typecheck exposed missing CSS declarations in the template; declarations now cover the existing template and NativeWind stylesheet. The template-only web hydration hook has a narrowly scoped lint exception for `set-state-in-effect`; application files retain that rule. npm reported 37 dependency audit findings (11 moderate, 26 high) after installation; no unrelated force-upgrade was applied.

No graphical QA, device/emulator launch, Android APK compilation, iOS compilation, physical GPS/USB test, or production TLS deployment verification is claimed. Device/Arduino testing is scheduled for Sunday October 4 and needs explicit shared-resource confirmation. Metro native exports and config-plugin prebuilds alone do not satisfy those checks.

## Changed-file manifest

Repository-relative paths, ready for coordinating-agent review; no staging or commits by this worker:

```text
docs/app.md
glance-app/LICENSE-FONTS.md
glance-app/app.config.js
glance-app/app.json
glance-app/babel.config.js
glance-app/eslint.config.js
glance-app/metro.config.js
glance-app/nativewind-env.d.ts
glance-app/package.json
glance-app/package-lock.json
glance-app/plugins/with-local-network.js
glance-app/scripts/check-network-config.cjs
glance-app/scripts/check-tracking.mjs
glance-app/src/app/_layout.tsx
glance-app/src/app/explore.tsx
glance-app/src/app/index.tsx
glance-app/src/components/app-tabs.tsx
glance-app/src/components/app-tabs.web.tsx
glance-app/src/components/live-map.native.tsx
glance-app/src/components/live-map.tsx
glance-app/src/components/live-map.types.ts
glance-app/src/components/tracking-ui.tsx
glance-app/src/db/cache-query.ts
glance-app/src/db/schema.ts
glance-app/src/screens/map-screen.tsx
glance-app/src/screens/setup-screen.tsx
glance-app/src/tracking.css
glance-app/src/tracking/cache.ts
glance-app/src/tracking/colors.ts
glance-app/src/tracking/font-license.json
glance-app/src/tracking/network.ts
glance-app/src/tracking/policy.ts
glance-app/src/tracking/provider.tsx
glance-app/src/types/styles.d.ts
glance-app/tailwind.config.js
glance-app/tsconfig.json
```

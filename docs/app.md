# Native tracking app

Implementation scope: `glance-app/` only, 3 October 2026. The shared protocol and geometry are imported directly with `.ts` extensions; the server remains the only geofence evaluator. No simulation lifecycle, five-device cap, phone-GPS dependency, trail, background push, or buzzer is included.

## Run and connect

Use Node 24 and npm in `glance-app`. Install with `npm ci`. MapLibre is custom native code, so Expo Go is not supported. After resource availability is confirmed, use `npm run android` (Android SDK/JDK needed) or `npm run ios` (macOS/Xcode needed) to create/install a development build. Neither command was used to control a device during this implementation.

Open **Setup** and enter the server origin plus the owner credential. The device upload credential is not authorized. Settings are kept in Expo SecureStore, not committed files or token URL parameters. Use HTTPS in normal builds. No map permission is requested: tracker coordinates come from the server, not the phone.

For an explicit trusted-LAN Android debug build in PowerShell, replace the illustrative host with the actual server's LAN address:

```powershell
$env:GLANCE_TRUSTED_LOCAL = '1'
$env:GLANCE_LOCAL_HTTP_HOST = '192.168.1.20'
npx expo prebuild --platform android --no-install
```

Rebuild the debug app with these variables still set, then enter `http://192.168.1.20:3000` in Setup. This grants HTTP/ws only to that exact host, not its subdomains or arbitrary hosts. The main/release Android resource remains cleartext-denying; only the debug resource contains the exception. Runtime HTTP selection is also disabled outside `__DEV__`. TLS certificate validation remains enabled. Credentials are visible to LAN observers when using HTTP: use a trusted network only.

The debug exception also constrains Metro HTTP access: use the configured host for Metro, or a supported secure/embedded bundle. Android `10.0.2.2` may be configured explicitly for an emulator when shared-resource authorization is given. For iOS local HTTP, use a resolvable hostname (for example `glance.local`), not a numeric IP, because ATS domain exceptions do not support numeric IPs. iOS gets a domain-specific ATS exception only when explicitly generating a trusted-local build. Before production generation, unset both variables and regenerate; no blanket ATS/TLS weakening is applied.

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

The Node 24 check uses genuine file-backed SQLite and the production Drizzle upsert builder, closes/reopens the file, and verifies stale async writes and owner isolation. It also verifies strict cache parsing, dual-age freshness/delayed receipt/future skew, alert baselines/dedup/resolution labels, invalid polygons, supporting-text contrast, HTTPS restrictions, and real HTTP Bearer/version/409 behavior against a explicitly synthetic local fixture. This is not an actual Fastify/PostgreSQL integration or live hardware test. Native cache adapter lifecycle, foreground reconnect/alerts and security enforcement still require device QA.

Final results: `check:tracking`, `typecheck`, and `lint` exit 0; `expo install --check` reports `Dependencies are up to date`. Exact duplicate revision/serverTime frames are rejected both in memory and SQLite, so their arrival cannot reset `savedAt` or extend the 15-second freshness timeout; equal revisions with strictly newer serverTime still refresh the clock. The duplicate timeout regression passes after a real SQLite close/reopen.

Final Android export: 1895 modules, 4.5MB Hermes bundle. Final iOS export: 1809 modules, 4.3MB Hermes bundle. Both exported to ignored `glance-app/dist/native-check`, including the four requested Geist TTF assets. Android prebuild exits 0. `node scripts/check-network-config.cjs 192.168.1.20` after explicit trusted-local prebuild reports `PASS: release cleartext denied; debug only 192.168.1.20, no subdomains.` Regenerating without local variables then running `node scripts/check-network-config.cjs` reports `PASS: release cleartext denied; debug cleartext denied.` Generated Android files are ignored, generated exclusively by prebuild/plugin, and left in strict mode.

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

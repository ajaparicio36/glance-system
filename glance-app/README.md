# Glance mobile app

## Mobile redesign and navigation

The app keeps two top-level Expo Router tabs: Map (`/`) and Setup (`/explore`). History and the fence editor are stack routes outside the tab group. Existing Map and Setup URLs are preserved.

```tsx
import { router } from 'expo-router';

router.navigate('/');
router.navigate('/explore');
router.push({ pathname: '/history', params: { deviceId: 'prototype-001' } });
router.push('/fence');
```

In the app, select a tracker on Map and tap **History**. The native sheet shows only that device's current-snapshot episodes, five per page, initially collapsed. **Map**, system Back, and sheet dismissal return to the existing map. Times use the phone's local timezone. `fence_changed` closes an episode without describing a return.

Open **Setup → Create fence / Edit fence** after configuring the server. Add map corners or manual coordinates, edit/remove corners, and undo. **Reload fence** preserves the draft and updates its expected server version; review the saved solid outline against the dashed draft before **Save fence**. A failed or conflicting save retains the draft and requires a reload before another save. Existing-fence replacement requires confirmation, and only a server acknowledgement shows success. Unsaved route exits offer **Keep editing / Discard**. No server API route changed.

### Reference correspondence

| Reference | Implementation and deliberate adaptations |
| --- | --- |
| `DESIGN-NEW` | Dark body/screens palette: black/white, `#090909` cards, `#121212` floats, `#222222` controls, `#1d1d1d` inset rows, amber `#ffaf0b`, cobalt `#2671f4`. Muted text raised to `#b5b5b5` for contrast across input/control surfaces. 24-unit sheets, 16-unit fields, pill controls, 16-unit gutters. Frontmatter's `#131313`/`#e5e2e1` and 3rem radius conflict with body black/white and 24px sheets; the body/screens direction governs this coherent native adaptation. |
| `MAP-PNG`, `MAP-HTML` | Full-height dark MapLibre canvas, safe floating status, real foreground alerts, right-side recenter/refresh, inset tracker details and persistent Refresh/History actions above the white active tab pill. Camera changes only on explicit recenter/retry or connection-scope remount. |
| `HISTORY-PNG`, `HISTORY-HTML` | Rounded native form sheet over the existing map, selected tracker identity, current-snapshot counts, paginated cards and explicit resolution/time/coordinate detail. Native two-detent sheet replaces a custom drawer; rows start collapsed. |
| `SETUP-PNG`, `SETUP-HTML` | Connection summary/edit with masked credential, last-confirmed singleton fence version/vertices and real MapLibre preview, separate editor CTA, original font-license disclosure. |
| `FENCE-PNG`, `FENCE-HTML` | Separate safe-back editor with solid saved outline, dashed numbered draft, undo, coordinate editing, validation, reload, guarded cancel and explicit server save. Two distinct corners correctly need one more distinct corner. |

Installed Geist/Geist Mono replace the exports' inconsistent Space Mono naming. Installed `expo-symbols` provides SF Symbols and Material Symbols. Glass is limited to supported iOS builds after API and reduced-transparency checks; Android and reduced-transparency paths use solid surfaces. Sheets use legible solid backing. Tab changes and repeated UI actions are immediate, stack/sheet transitions are platform owned, reduced motion uses fade, and recenter becomes instant. No new dependencies or generated native files were changed.

Generated battery/RSSI/accuracy/locations, area/perimeter, totals, GPS trails, layer controls, mTLS/ED25519 claims, and spherical buffering claims are omitted. Trackers keep their real IDs. Connection, freshness, alerts, authentication, persistence and server authority remain owned by the existing tracking provider and shared contract.

### Verification status · 27 October 2026

- `npm run lint`: passed.
- `npm run typecheck`: passed after regenerating Expo's ignored route declarations through the installed CLI's headless `setupTypedRoutes` function. Initial new-route type errors were stale generated declarations, not bypassed types.
- `npm run check:tracking`: passed, including selected-device pagination/isolation, local time, draft failure/reload/confirmation transitions, polygon validation, palette contrast, and grouped-route/exit-guard source wiring. Existing synthetic HTTP/cache/auth/freshness/lifecycle coverage remains passing. Node reports its existing SQLite/module-type warnings.
- OpenFreeMap dark style: HTTPS 200, valid style version 8 with 47 layers. This verifies the style response, not native map rendering.

**Native QA completed its recorded Android flows on the authorized Infinix X6711 (Android 14, serial `112492539R101297`, package `com.glance.tracker`).** The user started the existing session with `pnpm run android`; package declarations and scripts were unchanged. Real-data checks covered dark MapLibre rendering, tracker/marker selection, pan, double-tap zoom, settled recenter, Map/Setup navigation, History dismissal by button/Android Back/drag, masked credentials, and the fence editor's local drafting, manual entry, undo, validation and dirty-exit guards. No cloud fence or connection settings were changed.

Earlier in the session, `slave-02` showed fresh GPS, **Inside geofence**, and zero episodes. At final restoration, the real server showed **Connected**, fence **v1 / 4 vertices**, and `slave-02` with a stale last observation at **27 October 2026, 3:47:16 PM Asia/Manila** and one open episode recorded at **3:47:10 PM**. The phone was left on that real Map. These observations do not establish continued hardware operation or a live return event.

Clearly labelled in-memory fixtures, served by a separate temporary Metro process, verified seven episodes per tracker, five-item pagination, expansion/reset/isolation, open/returned/fence-changed detail, reconnect/stale/error labels, failed refresh, failed/conflicting saves, draft-preserving reload, explicit resave and acknowledged success. The fixture made no server writes and accessed no stored settings or cache. It is inactive: Metro config was restored byte-for-byte, the app returned to `localhost:8081`, the auxiliary process/8082 reverse mapping and disposable bundle were removed, and original text/animation settings were restored.

Phone QA found and confirmed fixes for NativeWind losing callback-style Pressable layouts, insufficient recenter padding, and clipped symbols/overlapping controls at 200% text. Four redesigned Pressables use the supported `cssInterop={false}` opt-out. Camera padding includes measured overlays and attribution. Android symbol bounds grow with the font scale; paired actions stack at large text, Map uses one scrolling sequence of its existing header/map/inspector above 1.4 font scale, and the editor header reflows. Product text remains uncapped. Actual 200% and restored normal-size screenshots confirm the corrections. Lint, typecheck and tracking checks passed after the final batch.

Limits remain: manual-coordinate autofocus initially leaves part of the latitude field behind the keyboard, although scrolling exposes both fields and Done; a rapid map tap immediately followed by exit can produce MapLibre's late `latLngForPixel after MapView was destroyed` warning without a crash; immediate recenter during layout changes can use the previous measurements, while settled recenter is verified. TalkBack traversal/focus restoration, system gesture navigation, iOS/glass behavior, live hardware return/foreground alert delivery, and basemap-failure retry were not verified in this session. Interactions were exercised with all three Android animation scales set to zero, but animation timing was not instrumented. Full evidence and cleanup proof are in `.scratch/mobile-ui-redesign/qa/report.md`.

## Original Expo starter notes

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

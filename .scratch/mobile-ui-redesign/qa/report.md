# Mobile redesign native QA · 27 October 2026

The recorded Android flows passed after the focused fixes below. Unverified behaviors and remaining limitations are listed explicitly.

Device: **Infinix X6711, Android 14, serial 112492539R101297**, package **com.glance.tracker**, portrait 1080×2460. The user authorized QA after starting the app with pnpm run android and reconnecting the phone. QA used Android CLI layout/capture and serial-scoped ADB interaction. Every captured PNG was viewed immediately before further action. No additional native build/install, dependency change, commit, push or PR was performed.

## Real server observations

Real-data work was read-only except for unsaved local drafts. QA never unmasked, copied, logged or edited the owner credential, never saved a real fence, and never staged GPS/history/failure states against the cloud account. The live provider may perform its normal confirmed-cache persistence.

Earlier observations showed prototype-001 without a GPS fix and slave-02 initially stale, then fresh and **Inside geofence**, with changing coordinates/times and ages around 5–10 seconds. Both devices initially had zero episodes. The user reported the slave/master hardware was operating; that report is distinct from app evidence.

At final restoration, the real provider showed **Connected**, unchanged fence **v1 / 4 vertices**, and slave-02 **Unknown · stale location**, last GPS observation **3:47:16 PM Asia/Manila**. Real History now contained **one open outside episode**, recorded at **3:47:10 PM**, page 1/1. This later state supersedes the initial zero-history observation. QA did not diagnose or alter hardware and did not establish a live return or foreground alert delivery.

Final evidence: 103-restored-live-slave.png, 104-restored-real-history.png, 105-restored-setup.json and 107-final-real-map-settled.png. The phone was left on the real Map with slave-02 selected and the settled recentered fence/marker visible.

## Real-data flows exercised

| Flow | Actual result | Evidence |
| --- | --- | --- |
| Dark Map and safety states | Real identities, connection, last coordinates, local time and no-fix/stale/fresh labels rendered. Final state is stale as described above. | 06-reconnected.png, 08-fixed-map-layout.json, 10-fixed-recenter-settled.png, 103-restored-live-slave.png |
| Selection | Tracker selector updates status/inspector; tapping the real marker selects slave-02. | 12-marker-selection.png |
| Pan, zoom, recenter | Pan and double-tap zoom work; settled recenter fits the fence/markers above attribution/inspector. | 11-map-marker-and-zoom.png, 10-fixed-recenter-settled.png, 107-final-real-map-settled.png |
| History navigation | Empty selected-device sheet, Asia/Manila, Map button, Android Back and downward sheet drag work; map camera context retained. Final real open episode renders. | 13-fixed-history-empty.png, 14-history-drag-dismiss.png, 104-restored-real-history.png |
| Map / Setup | Tabs work, saved credential stays masked, actual preview and fence v1/4 remain. Final navigation spot-check passed. | 15-fixed-setup.png, 16-setup-fence-layout.json, 105-restored-setup.json |
| Editor route and draft | Setup CTA and glanceapp://fence open the separate route; a map tap creates a numbered dashed draft while saved outline stays solid. | 17-editor-initial.png, 19-editor-tapped-layout.json, 20-editor-dirty-layout.json |
| Dirty exit protection | Confirmed five-corner draft prompts on Cancel, header Back, Android Back and footer Discard. Keep editing retains five; discard leaves server v1/4 unchanged. | 22-dirty-cancel-guard.png; layouts 23, 24, 25, 36 and 37 |
| Validation and coordinates | Two corners say “Add 1 more distinct corner.” Add coordinate accepts latitude/longitude; Done dismisses keyboard; remove works. Read-only reload retains two-corner draft and expected v1. | 26-two-corners-validation.png, 31-manual-coordinate-keyboard.png; layouts 29, 30, 32 and 34 |

No real Save/Replace action was used.

## Isolated synthetic native flows

The retained synthetic-provider.tsx is an in-memory provider, labelled on screen **SYNTHETIC QA · mode · no server writes**. A temporary resolver gated by GLANCE_QA_FIXTURE=1 substituted only the tracking provider in a separate Metro process on **8082**. The original **8081** stayed alive. The native dev-menu bundle host was temporarily changed to localhost:8082.

The fixture imports protocol parsing and network error classes, but invokes no network requests and accesses no SecureStore/cache persistence. Its real-provider type import is erased. Its inspected bundle contained the synthetic label and did not contain the real settings key glance.owner.connection. The disposable bundle was deleted. It uses **seven synthetic episodes per tracker**, IDs 1–7 and 101–107; these counts/outcomes are not hardware evidence.

| Flow | Actual settled result | Evidence |
| --- | --- | --- |
| Initial / open history | Seven episodes, page 1/2, five collapsed rows; open detail has outside observation and no resolution. | 44-synthetic-history-collapsed.png, 45-open-episode-expanded-layout.json |
| Returned | Correct outside/resolved/return GPS observations, coordinates and local times. | 46-synthetic-returned-expanded.png |
| Fence changed | Explicit boundary change, not a return; no return-position section. | 47-synthetic-fence-changed-expanded.png |
| Pagination / reset / isolation | Page 2 has two entries. Disabled Next cannot advance. Previous resets collapsed page 1. Slave-02 shows its seven distinct episodes on collapsed page 1. | 49-synthetic-last-page.png; layouts 50–51; 52-synthetic-slave-history.png |
| Replacement prompt | Keep editing cancels without save; Replace proceeds. The prompt capture alone is not a successful save. | 55-synthetic-replacement-prompt-layout.json, 56-synthetic-replacement-dialog.png |
| Conflict | Three draft vertices/expected v10 retained; reload required; Save disabled. | 57-synthetic-conflict-result.png |
| Reload / resave / acknowledgement | Reload gets v11 and retains three vertices. Explicit Save/Replace yields acknowledged v12, Server confirmed and Done. Extra Save and Android Back during pending do not duplicate version or leave route. | layouts 58–60; 61-synthetic-acknowledged-save.png |
| Generic failure | Three vertices/expected v10 retained, reload required, Save disabled. Reload keeps draft and restores explicit Save. | 67-synthetic-failed-save.png, 68-failed-save-reloaded-layout.json |
| Reconnect / stale / refresh failure | Unknown/disconnected or Unknown/stale at 16 seconds; last-known coordinates retained. Invalid response plus failed Refresh retains confirmed data with error copy. | 71-synthetic-reconnecting.png, 72-synthetic-stale.json, 74-synthetic-refresh-failed.png |

Conflict screenshot57 exposed repeated recovery copy. The final product uses the conflict error's complete message once. Checks were rerun after this edit and the accessibility batch.

## Large text and motion

Original settings: font scale **0.85**, animator duration **1.0**, transition animation **1.0**, window animation **1.0**. QA temporarily used **1.3**, then required **2.0**; the OS read back exactly 2.0. All three animation scales were **0** during these checks.

At 1.3, Map details scrolled and History paging worked (75–80). Initial 2.0 captures **81**, **83**, **86** exposed clipped symbols, midword paired-button wrapping, overlapping Map overlays and a cramped editor title. These were failures, not accepted results.

The focused repair expands Android SymbolView bounds with font scale, sizes icon controls accordingly, gives paired actions full width above 1.4 font scale, puts the existing Map header/map/inspector in one outer scroll flow, and reflows editor title/controls and plot instructions. Product text has no scaling cap. Only the synthetic QA footer is unscaled to avoid obscuring the app.

Actual 2.0 confirmation after repair:

- **89-fixed-200-map.png:** full symbols, readable header/status, bounded map with visible fence and separate attribution/controls.
- **90–92 layouts / 92-fixed-200-map-actions.png:** scroll reaches coordinates, time, timing disclosure, full-width Refresh/History; History opens.
- **93-fixed-200-history.png / 95-fixed-200-history-page-two.png:** readable rows/icons, working page change, full-width Previous and disabled Next.
- **96-fixed-200-editor.png / 97-fixed-200-editor-pair.png:** readable title/Cancel, separate plot instruction, full icons, full-width Add/Reload, clear edit/remove controls. Scroll reached Undo/Save/Discard and dirty guard at 2.0 before repair (87–88).
- **99-default-recenter.png:** original 0.85 layout restored, white selected pills, paired actions and settled framing preserved. Real Map → History → Map → Setup → Map passed afterward.

Interactions worked with the OS animation scales at zero. Frame timing was not instrumented, and this does not prove every animation respects reduced motion. TalkBack traversal/focus restoration and system gesture navigation were not exercised; the phone uses three-button navigation.

## Defects fixed and final checks

1. **NativeWind callback loss.** Installed interop erased callback-style Pressable layout/background properties. Four redesigned Pressables use supported cssInterop={false}: shared Button/IconButton, tab trigger and episode trigger. diagnose-pressable.cjs reproduces loss and verifies the bypass. Phone controls/pills render correctly afterward.
2. **Recenter padding.** An independent 45% bottom cap discarded measured overlay reserve. mapCameraPadding includes attribution and requested top/bottom reserves; if crowded, both scale only to retain at least 96 points of drawable map. Geometry regressions cover an 820-point viewport, taller attribution, crowding and zero layout.
3. **200% readability.** Shared Android icon bounds, paired actions, Map flow and editor reflow fixed the observed failures without dependencies, generated native edits or text caps.
4. **Conflict copy.** Duplicate recovery text removed.

After the final product batch, **npm run lint**, **npm run typecheck**, and **npm run check:tracking** all **PASS**. Worker session 15710 exited 0; the lead independently reran all three successfully. Source guards still reject hard-disabled scrolling and preserve Gesture Handler wiring; the large-text Map must have an outer ScrollView holding its existing sections. Existing synthetic HTTP/auth/cache/freshness/lifecycle/draft/pagination coverage remains passing. Existing Node SQLite/module-type warnings remain. **git diff --check PASS**, with only line-ending normalization notices.

## Remaining limitations

- Manual-coordinate autofocus initially leaves part of latitude behind the keyboard (27-manual-input-keyboard.png). Scrolling exposes latitude, longitude and Done; entry succeeds (31-manual-coordinate-keyboard.png). No blanket keyboard/accessibility pass is claimed.
- Very rapid map tap → Cancel before the native map event arrives can log **latLngForPixel after MapView was destroyed**. No crash occurred; the still-clean four-corner route exited. Confirmed five-corner drafts passed all tested guards. **18-clean-cancel-late-map-event.png** is the warning case, not dirty-guard success. No dependency patch or arbitrary delay was added.
- Immediate recenter during route/inspector layout changes can use earlier measurements. Settled recenter is verified; 106 precedes the settled 107 capture.
- Android CLI sometimes cannot get an idle UI dump on live-updating Map/History. Their screenshots remain evidence; final 103/104 have PNGs but no JSON dumps.
- TalkBack focus/traversal/restoration, system gesture navigation, iOS/liquid glass, live return/foreground alert delivery, basemap-failure retry and instrumented animation timing remain unverified.
- An earlier capture containing an unrelated notification was deleted along with its layout, and clean evidence recaptured.

## Exact cleanup

**cleanup.json** records final verification:

- Metro config restored byte-for-byte. Expected/actual SHA256: **1B1806AE175C8332FD0F0E8835530D1565C5DB4704249C3848AE4BE6F7C85B86**.
- Native bundle host **localhost:8081** restored (100-restored-bundle-host.json); Apply followed by actual real-provider evidence 102–107.
- Owned fixture Metro session **90317** stopped by Ctrl-C. No 8082 listener. Original **8081 / PID 42384** remains listening.
- Only **tcp:8081 → tcp:8081** ADB reverse remains; only the added 8082 mapping was removed.
- Exact original settings read back: **font 0.85 / animator 1.0 / transition 1.0 / window 1.0**.
- Disposable synthetic.bundle.js deleted. Inert fixture source/state, diagnostic, original config backup and evidence retained. The temporary resolver is absent from restored Metro config.
- No QA/test process remains active. No cloud fence/connection changes, data clearing, hardware changes, branch/worktree operations, commit, push or PR.

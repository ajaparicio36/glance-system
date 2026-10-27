# Implement the Glance mobile redesign

Implement this redesign in `D:/glance`; do not stop at a plan. Act as lead using lead-orchestrator and handoff-ui-to-astra, with one coherent Astra UI implementation worker. This prompt contains the preparation findings; revalidate current source before editing. No implementation was performed during preparation.

## Starting state and authority

- Preparation baseline: branch `master`, commit `7d8172e`. The only pre-existing status entry was untracked `docs/stitch-screens/`. Re-read current git status, branch, applicable instructions and package versions; this baseline is not permission to reset anything.
- Read root `AGENTS.md`, `CONTEXT.md`, `design.md`, applicable `CLAUDE.md`, and scoped copies along changed paths, especially `glance-app/AGENTS.md` and `glance-app/CLAUDE.md`. Read relevant accepted ADRs under `D:/glance/docs/adr/`, especially 0001, 0002, 0004 and 0006, plus `D:/glance/docs/protocol.md`, `D:/glance/shared/protocol.ts` and `D:/glance/shared/geofence.ts`.
- `.codegraph/` was absent at preparation. Do not index. If present now, follow repository CodeGraph-first instructions before locating/understanding code; otherwise use ordinary source inspection.
- The user's new Stitch DESIGN and four screenshots below are the redesign's visual authority, superseding old root guidance favoring solid surfaces, small radii and understated panels. Accepted product, security, data and accessibility invariants remain binding.
- Preserve user changes and all original exports. Untracked references may be absent from a worktree: make them reachable as task inputs, copying without overwriting originals if needed. Never delete them or ship screenshot PNGs as product UI.
- Scope: existing Expo/React Native app presentation, navigation, accessibility, motion and frontend interaction state. Preserve backend, firmware, protocols, authentication, cache persistence and business rules. No cloud account calls, deployments, credential reads, production mutations or infrastructure work are needed or authorized by this prompt.

## Required delegation and preflight

Read these actual sources; pass their absolute paths and this complete brief into the worker contract. Astra must read the originals itself, including relevant supporting references; lead-only reads or skill-name summaries are insufficient.

| Skill / supplement | Absolute source |
| --- | --- |
| Lead orchestration | `C:/Users/ajapa/.codex/skills/lead-orchestrator/SKILL.md` |
| UI handoff | `C:/Users/ajapa/.codex/skills/handoff-ui-to-astra/SKILL.md` |
| Contract supplement | `C:/Users/ajapa/.codex/skills/handoff-ui-to-astra/references/worker-contract.md` |
| Ponytail | `C:/Users/ajapa/.codex/plugins/cache/ponytail/ponytail/5.3.2/skills/ponytail/SKILL.md` |
| Design taste | `C:/Users/ajapa/.agents/skills/design-taste-frontend/SKILL.md` |
| Impeccable | `C:/Users/ajapa/.agents/skills/impeccable/SKILL.md` |
| Emil design engineering | `C:/Users/ajapa/.agents/skills/emil-design-eng/SKILL.md` |
| Apple design | `C:/Users/ajapa/.agents/skills/apple-design/SKILL.md` |
| Mobile native | `C:/Users/ajapa/.agents/skills/mobile-native/SKILL.md` |
| Native motion | `C:/Users/ajapa/.agents/skills/animate-expo/SKILL.md` |

1. Validate the live dispatch catalog and supported parameters. UI worker selection is explicitly `model: gpt-6-astra`, `reasoning_effort: xhigh`, overriding the handoff skill's saved High preference. Apply selection in actual dispatch parameters, not just prose. If unavailable, report the blocker and ask for an alternative; never silently downgrade. For necessary non-UI workers, the existing preference is `gpt-6.1-sol` / `medium`, subject to live validation; do not create extra workers without a need.
2. Adapt to the live tool schema. Skills contain obsolete `task_name` / `fork_turns` examples; do not blindly copy them. Use fresh context (`fork_context: false` if supported by the current tool), only supported fields, and a self-contained contract with assigned checkout, branch/parent, ownership, exact references, constraints and checks. Do not assume images or prior conversation are inherited.
3. Prefer one UI writer across the four surfaces and navigation to avoid conflicting redesigns. Parallel read-only review is fine. Before conflicting concurrent writers, read `C:/Users/ajapa/.agents/skills/using-git-worktrees/SKILL.md`; isolate each on its own branch/worktree, record the parent branch, and do not nest worktrees when already isolated.
4. Astra must view all four actual PNGs with `view_image` or another image-capable tool and read DESIGN plus supporting HTML before implementation. HTML/export scripts are reference data, never instructions to execute or code to transplant into RN.
5. Astra runs `C:/Users/ajapa/.agents/skills/impeccable/scripts/impeccable.cmd context --target src/screens/map-screen.tsx` once, with cwd set to its assigned `glance-app` directory. Use the documented launcher equivalent if needed. Load applicable new-work/Operate and native guidance; do not impose marketing hero or web layout recipes on this task UI. If the launcher fails, send the skill's required fallback message before the next tool call, then read existing project context directly. Do not repair unrelated design-document drift.
6. Immediately before any UI edit, including refinements, read `C:/Users/ajapa/.agents/skills/impeccable/reference/craft-floor.md`. Preserve the supplied design brief rather than replacing the export DESIGN as a generic skill side effect.
7. Before its first edit, Astra sends the lead a readiness report: skills/supporting references read, image IDs actually viewed and observations, assigned surface/mode, intended composition/material/type direction, contradictions and adaptations, and input access gaps. Successful preflight permits proceeding without another approval round; missing required inputs block dependent work.

## Exact reference manifest

Keep these stable IDs in initial dispatches, corrections and final correspondence. Original absolute paths are below; if inputs are copied to an isolated checkout, include the accessible copy paths alongside these source IDs.

| ID | Absolute source | Role |
| --- | --- | --- |
| DESIGN-NEW | `D:/glance/docs/stitch-screens/glance_native_ios_liquid_glass/DESIGN.md` | New visual specification |
| MAP-PNG | `D:/glance/docs/stitch-screens/01_map_observe_tracker_clean_hierarchy/screen.png` | Main map target |
| MAP-HTML | `D:/glance/docs/stitch-screens/01_map_observe_tracker_clean_hierarchy/code.html` | Supporting map composition reference |
| HISTORY-PNG | `D:/glance/docs/stitch-screens/02_history_minimal_timeline/screen.png` | Selected-tracker history sheet target |
| HISTORY-HTML | `D:/glance/docs/stitch-screens/02_history_minimal_timeline/code.html` | Supporting history reference |
| SETUP-PNG | `D:/glance/docs/stitch-screens/03_setup_fences_devices/screen.png` | Setup groups and fence preview target |
| SETUP-HTML | `D:/glance/docs/stitch-screens/03_setup_fences_devices/code.html` | Supporting setup reference |
| FENCE-PNG | `D:/glance/docs/stitch-screens/05_geofence_setup_streamlined/screen.png` | Separate fence create/edit target |
| FENCE-HTML | `D:/glance/docs/stitch-screens/05_geofence_setup_streamlined/code.html` | Supporting editor reference |

The preparer viewed all four actual images and inspected supporting HTML/current flow. These observations help orient the worker but do not replace its own image reads.

## Visual direction and explicit adaptations

- Preserve the references' dark map-first composition, floating status/control capsules, near-opaque rounded sheets, inset coordinate/time rows, amber fence vectors, cobalt tracker markers, and white active navigation/action pills. Use a consistent 4-unit spacing rhythm and about 16-unit gutters; adapt proportions to real native viewport/safe areas instead of copying screenshot pixels.
- DESIGN-NEW is internally inconsistent: frontmatter uses `#131313` background and `#e5e2e1` text, while body specifies black/white dark mode with `#090909` fallback cards and `#121212` floats. Frontmatter radius `xl: 3rem` conflicts with body sheets described as 24px/rounded-xl; FENCE-HTML also changes palette/radii/type sizes relative to other exports. Name these conflicts. Follow the user's requested body/screens dark direction as a coherent native adaptation and record chosen token/radius mappings and deviations; do not invent an unexplained priority among screenshots or claim all source values agree.
- DESIGN/HTML name Space Mono, while the app installs and loads Geist/Geist Mono and SETUP-HTML's license disclosure itself names Geist Mono. Reuse installed Geist weights and Geist Mono for metrics; record this explicit compatible adaptation. Do not fetch a new font just to reproduce generated markup.
- Use installed native glass capability only where its supported API/platform and accessibility behavior are verified. Android and reduced-transparency paths need legible solid panels. No expensive refraction/shader system, animated blur, or speculative graphics stack. Glass is a material direction, not proof of AAA contrast; measure contrast and retain accessible solid fallbacks.
- Keep font scaling, readable labels and 44pt iOS/48dp Android targets. Some export controls and captions are too small; enlarge them. Provide safe-area/keyboard handling, screen-reader labels/focus, selected/disabled/busy/expanded states and reduced motion. Static screenshots do not authorize endless pulsing or gratuitous motion.
- Omit fabricated battery, RSSI, weak-link strength, accuracy, herd totals, named locations, GPS trails, area/perimeter metrics and unsupported layer controls. Do not add dummy features to match reference decoration. Keep functioning recenter, refresh, undo, selection, navigation icons and attribution.

## Current ownership: use these interfaces

All paths in this section are absolute preparation locations; resolve them under the assigned checkout when isolated.

| Owner | Current responsibility / implementation facts |
| --- | --- |
| `D:/glance/glance-app/src/app/_layout.tsx` | Gesture/safe-area/theme/font providers; `TrackingProvider` wraps `AppTabs`; loads Geist regular/medium/semibold and GeistMono with fallback. |
| `D:/glance/glance-app/src/app/index.tsx`, `D:/glance/glance-app/src/app/explore.tsx` | Thin route exports for Map and Setup respectively. |
| `D:/glance/glance-app/src/components/app-tabs.tsx`, `D:/glance/glance-app/src/components/app-tabs.web.tsx` | NativeTabs and web Tabs adapters, currently only Map/Setup. Preserve Expo Router; introduce a proper separate fence editor route without turning it into a third top-level tab. |
| `D:/glance/glance-app/src/screens/map-screen.tsx` | Scroll-based header/map/details; selected device state; refresh; alerts; `IncidentCard` expands from false. Current `IncidentHistory` receives ALL snapshot incidents, so selected-device filtering is a required UI change. |
| `D:/glance/glance-app/src/screens/setup-screen.tsx` | Connection fields and inline fence editor currently share one screen. Owns draft input strings, expectedVersion, conflict/pending states, replacement/discard confirmation and reload-keeps-draft behavior; move/reuse this flow rather than duplicating it. |
| `D:/glance/glance-app/src/components/live-map.types.ts` | `LiveMapProps`: polygon, devices, selectedDeviceId, onDevicePress, editMode, previewVertices, onMapPress. Extend only for real presentation needs. |
| `D:/glance/glance-app/src/components/live-map.native.tsx` | MapLibre canvas currently 320 high; native gesture arbitration; saved/draft vector layers, markers, map press, camera recenter and map retry; uses OpenFreeMap liberty style and Android texture view. Preserve map interactions when making it full-bleed/adaptive. |
| `D:/glance/glance-app/src/components/live-map.geometry.ts`, `D:/glance/glance-app/src/components/live-map.tsx` | Longitude/latitude conversion and initial center; non-native fallback explicitly says native build required. Web is not native map proof. |
| `D:/glance/glance-app/src/components/tracking-ui.tsx`, `D:/glance/glance-app/src/tracking/colors.ts` | Existing Label/Button/Card/Field, font fallback, theme palette; reuse and adapt coherently. |
| `D:/glance/glance-app/src/tracking/provider.tsx` | `useTracking()` exposes entry, settings, connection, error, cacheError, alerts, loading, now, localHttpHost, configure, refresh, saveFence, dismissAlerts. `configure(ConnectionSettings)` stores SecureStore settings; `refresh(): Promise<Snapshot>`; `saveFence(Coordinate[], expectedVersion): Promise<Snapshot>`. Preserve lifecycle/cache/scoping implementation. |
| `D:/glance/glance-app/src/tracking/network.ts` | Bearer-authorized GET `/api/snapshot`, PUT `/api/geofence` with vertices/expectedVersion, `/api/live` URL; `FenceConflict`, `ServerConnectionError`; strict response parsing and useful errors. No new endpoints needed. |
| `D:/glance/glance-app/src/tracking/policy.ts` | `normalizeSettings`, `acceptsSnapshot`, `locationAge`, `safetyLabel`, `collectAlerts`; connection settings are serverUrl/ownerToken. Preserve HTTPS/trusted-local validation, freshness and alert baseline semantics. |
| `D:/glance/glance-app/src/tracking/presentation.ts` | `HISTORY_PAGE_SIZE = 5`, `historyPage` sorts descending incident ID and clamps pages; `clientTimeZone` and `formatLocalTimestamp` use device-local time. Filter selected device BEFORE pagination. |
| `D:/glance/glance-app/src/tracking/cache.ts`, `D:/glance/glance-app/src/db/schema.ts`, `D:/glance/glance-app/src/db/cache-query.ts` | Existing confirmed snapshot persistence; outside redesign ownership. |
| `D:/glance/shared/protocol.ts`, `D:/glance/shared/geofence.ts` | Contract types/parsers and existing polygon validation; reuse without changing domain rules. |

## Implement these four surfaces

1. **Main Map (MAP-PNG):** Map occupies the primary canvas; safe-area header, truthful connection/selected-tracker status pills, foreground alert banner when actual alerts exist, right-side working controls, and selected-tracker inspector above floating Map/Setup navigation. Keep coordinate/time alternatives, refresh loading/failure, attribution and both-device selection accessible. Preserve map pan/zoom across ordinary updates and opening/closing details; overlays must not steal gestures. Recenter is map framing, not phone GPS. Do not request phone-location permission for remote tracking.
2. **Selected-node history sheet (HISTORY-PNG):** Open from selected tracker's History action over map context; show that tracker identity, dynamic snapshot episode count and five items per page. Filter by `incident.deviceId` first; keep selection/page/expansion isolated between devices and connection scopes, clamp pages when data changes, and make sheet dismissal/back return to map. Rows start collapsed until tapped, overriding the screenshot's initially expanded example. Expand to actual outside coordinates/timestamp, resolution and return fields when present. Use local timezone explicitly. Preserve `fence_changed` as closed because fence changed, never returned. Label counts as current snapshot history, not all-time server totals; do not use MAP-HTML's fake minute-by-minute coordinate drawer or draw a trail.
3. **Setup (SETUP-PNG):** Clear connection summary/edit flow with masked owner credential and truthful connection state, singleton confirmed fence summary/version/vertex count and actual map preview, Create/Edit fence CTA, and existing font-license disclosure. Retain usable first-run credential entry and validation/errors. Use existing Bearer/first-frame WebSocket auth truth, not generated `mTLS Active`, `ED25519-SIG`, `SYSTEM NOMINAL`, `NODE-781A`, `Config v2` or fixed port claims. Omit area/perimeter and HTML's spherical geodesy/millimetric buffering claim: existing validation is local planar polygon logic, not that advertised system.
4. **Separate fence create/edit screen (FENCE-PNG):** Navigate from Setup into its own Expo Router route with safe back/cancel and explicit Save fence. Reuse current initial saved vertices/version, map taps, dashed draft, numbered vertices, undo, manual coordinate entry/edit/remove, validation, add-coordinate and reload-keep-draft actions. Distinguish saved outline from local draft. Two distinct vertices need one more distinct point, not three additional corners; enforce the existing full validation, not count alone. Retain draft on failures/timeouts/409, block unsafe duplicate saves, reload latest expected version without replacing the draft, and require review plus explicit resave. Preserve replacement warning and success only after server acknowledgement. Guard header back, Android hardware back, gestures and any other route exit against silent draft loss; Keep editing/Discard must work. FENCE-HTML initially says Done and then script changes it to Cancel: safe cancel and explicit Save govern rather than copying this inconsistency.

For each new/changed app route, document a working navigation usage example and verify navigation end-to-end. This does not authorize changing a server public API. Keep Map/Setup icon navigation functional while structuring the separate editor stack; do not accidentally expose every file in a Tabs navigator.

## Product truth and preserved states

- Two configured tracker identities remain `prototype-001` and `slave-02`; display real IDs or a clear truthful mapping, never replace them with invented backend identities. One owner, one server-authoritative singleton polygon/version; independent per-device positions, freshness and episodes.
- Connected means authenticated live socket (`connection === 'live'` without current error), not merely saved credentials or an HTTP result. Inside/outside must come from the selected device and existing freshness/policy checks; stale/disconnected/no-fix means current safety unknown while retaining last-known coordinates/time.
- Upload cadence remains 5 seconds and stale threshold 15 seconds for observation/receipt age. No UI timer may reset age just because Refresh was tapped. Keep unknown-after-fence-replacement until the next accepted observation.
- Initial outside opens one episode; repeats do not duplicate it; a fresh return resolves only that tracker. Fence replacement closes active episodes as `fence_changed`. Cached data never proves the fence is currently active or that offline evaluation is authoritative.
- MAP-PNG shows an alert while inside: a prior foreground event can coexist with a later inside status. Do not fabricate a live breach or connect banner state to marker decoration. Preserve foreground-only deduplication and no replayed alerts on reconnect. Existing alerts are strings; do not invent structured episode routing by assuming a missing provider API.
- Preserve unconfigured, cache-loading/cache-error, no-fix, no-fence, unknown-evaluation, stale, connecting, reconnecting, background, invalid-response, refresh-error, authorization-error, map-failure/retry, empty history, invalid draft, saving, conflict, failed-save and confirmed-save states.
- Keep owner credentials masked and in existing secure storage; never log them or put them in URLs. Cloud HTTPS/wss with certificate verification remains required; trusted-local exception is the existing narrowly configured development host only. No TLS bypass or global cleartext changes.

## Native implementation and proof

- Preparation declarations: Expo `~57.0.26`, RN `0.86.3`, React `19.2.3`, Expo Router `~57.0.24`, MapLibre `11.4.0`, NativeWind `4.2.7`, Reanimated `4.5.1`, Gesture Handler `~2.32.0`; installed `expo-glass-effect` and `@expo/ui`. Re-read `D:/glance/glance-app/package.json` and lockfile before deciding compatibility.
- Use existing package-lock/npm workflow. Before Expo/RN/EAS API changes, read matching SDK docs at `https://docs.expo.dev/versions/v57.0.0/` (adjust only if actual major changed), plus the specific API docs. Use SDK-compatible `npx expo install` only when a dependency is demonstrably necessary. Prefer installed packages/native primitives; no new sheet/blur/shader system by default.
- MapLibre needs a native development build; Expo Go and web previews are insufficient. Do not hand-edit generated Android/iOS directories. Preserve the default Android script `expo run:android` and Expo's default device-selection behavior; do not hardwire an old device or special build path.
- From assigned `glance-app`, run `npm run lint`, `npm run typecheck`, and `npm run check:tracking`. Add the smallest relevant headless regression evidence for changed nontrivial history filtering/pagination/selection or draft/navigation behavior; do not broaden into unrelated suites. No `any`, unused declarations or inline code comments; use precise types and explicit return types.
- Non-interactive checks are authorized. Interactive QA is NOT authorized by any earlier session's device permissions. Ask directly in chat whether the shared Android device/emulator is available, then read `C:/Users/ajapa/.agents/skills/android-cli/SKILL.md`, identify the exact device serial with Android CLI/adb, and stay within Glance. Use Android CLI for build/run/layout/screenshots and adb for interaction. Do not mutate cloud fences or access credentials to stage QA; use isolated labelled fixtures/local test services where needed.
- If web UI QA is useful, obtain shared-browser confirmation, read `C:/Users/ajapa/.codex/plugins/cache/openai-bundled/computer-use/26.1021.31345/skills/computer-use/SKILL.md`, identify the exact Chrome session, and keep that QA scoped. Web checks cannot certify native MapLibre/glass/gesture behavior.
- Exercise map pan/zoom/recenter/selection, Map/Setup navigation, selected-device sheet filtering and page boundaries, collapsed/expanded rows, all three episode resolutions, local time, stale/no-fix/reconnect/errors, fence create/edit/manual entry/undo/validation, draft-retaining reload/conflict/save failures, replacement acknowledgement and all cancel/back paths. Check safe areas, keyboard, large text, labels/focus, reduced motion and Android solid fallback. Label synthetic evidence and do not claim it proves hardware GPS or cloud behavior.

## Lead acceptance and return

Review actual changed source, checks, native screenshots and exercised behavior against each reference ID; a worker summary or successful build alone is insufficient. Use Impeccable's bounded pass policy: one batched visual inspection, one consolidated fix batch, at most one confirmation round. Return concrete corrections to the same Astra worker, carrying the full manifest and constraints; follow the lead skill's maximum three rejected revisions before escalation.

Report changed paths, reference-to-implementation correspondence, intentional deviations (including font/material/token adaptations and removed fake claims), actual command results, tested device/session and screenshot evidence, exercised flows, pre-existing failures and remaining unverified behavior. If shared-resource access is unavailable, complete authorized headless work and clearly identify native visual/interaction verification as pending; do not label it visually verified.

Do not commit, push, merge, create a PR, delete branches or remove worktrees without user selection. If implementation used a worktree and required checks pass, read `C:/Users/ajapa/.agents/skills/finishing-a-development-branch/SKILL.md`, return its concrete integration choices to the user and wait. For a GitHub feature-parent branch, check the parent's open PR and ask about targeting that parent as a stacked PR only if PR creation is selected.

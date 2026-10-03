# Glance agent instructions

## Read first

- Identify the repository root before planning or editing.
- Read applicable `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`/`design.md`, and `CONTEXT.md`, including narrower copies along the target path.
- Root `design.md` is the design reference when present; preserve scoped instructions, especially `glance-app/AGENTS.md` and `glance-app/CLAUDE.md`.
- Surface material instruction or source conflicts; do not silently choose an interpretation.
- When root `.codegraph/` exists, use `codegraph_explore` or `codegraph explore "<question or symbols>"` before code search or opening source. Otherwise skip it; do not index without a request.

## Requirements and ownership

These are user-established targets, not claims that every component is implemented.

| Directory | Responsibility |
| --- | --- |
| `glance-prototype/` | GPS + WiFi single-node demonstration for Monday October 5, 2026. |
| `glance-master/` | No GPS; WiFi uplink for the master role. |
| `glance-slave/` | GPS + LoRa tracker role. |
| `glance-server/` | Fastify, PostgreSQL, and Drizzle; development Docker runs the database only, production includes the server. |
| `glance-app/` | Expo mobile app with SQLite, Drizzle, and MapLibre. |

- Firmware uses the Arduino core for ESP32-C3; hardware/Arduino CLI milestone is Sunday October 4, 2026.
- Reuse actual ownership and existing code; do not duplicate scaffolding or create parallel implementations of the same responsibility.
- Accepted Round 1 scope/authority: `docs/adr/0001-prototype-geofence-authority.md`; transport/access: `docs/adr/0002-prototype-transport-and-access.md`; power gate: `docs/adr/0003-usb-demo-and-power-deferral.md`.
- Monday requires live GPS position and working geofence violation/return reporting; labelled synthetic fixtures may supplement difficult movement tests, not replace live GPS.
- Prototype geofence authority is the server; SQLite is a local cache. This deliberately diverges from thesis master-side evaluation; offline master authority is not promised.
- Use HTTP(S) POST uploads and RFC6455 WebSockets, configured single-owner/device identity, and separate pre-shared device-upload/owner credentials; the owner can read/subscribe and edit its singleton fence. No registration or third secret.
- Cleartext HTTP/ws is only an explicit trusted-local-development exception exposing tokens to network observers; cloud requires HTTPS/wss with certificate verification. Never use `setInsecure` or global cleartext/TLS weakening.
- Use verified USB demo power; defer battery/solar integration. User-reported 1000mAh inventory does not validate ratings, wiring, weight, or runtime.
- Accepted Round 2 lifecycle/cadence/access is `docs/adr/0004-prototype-lifecycle-and-contract.md`; exact shared types and API are `shared/protocol.ts` and `docs/protocol.md`. Initial outside opens one episode; boundary is inside; return resolves it; replacement closes it as `fence_changed`.
- Upload every 5 seconds; stale after 15 seconds without accepted fresh data. Retain last coordinates and episode history, not a GPS trail; foreground alerts only. GPS jitter calibration, production LoRa band/pins, and native/hardware compatibility remain verification or later-decision work.
- Separate observed implementation facts, user requirements, proposals, and accepted decisions.
- Do not invent glossary entries or accepted ADRs; record resolved terminology/decisions only after confirmation.

## Source references

- `docs/specs/proposed-parts.md`: proposed hardware and estimated weight, energy, runtime, and dimensions; not measured or validated inventory.
- `docs/specs/color-and-font.md`: palette and typography reference; its Next.js sample does not select the app framework.
- `docs/schematic-draft.jpg`: schematic draft, not a confirmed wiring or pin contract.
- `glance-app/package.json` and `glance-server/package.json`: installed dependency declarations and available scripts.
- `docs/research/thesis.md`, `docs/research/thesis-review.md`, and `docs/research/hardware-review.md`: source/review evidence, not automatic architecture acceptance.
- Preserve user changes, including untracked `docs/specs/color-and-font.md`; do not duplicate thesis material or old prototype reviews.

## Ponytail workflow

- Invoke `ponytail:ponytail` for code/design/dependency changes: understand the real flow first, then choose the simplest working solution.
- Reuse existing code, standard libraries, native capabilities, and installed dependencies before adding custom code.
- Avoid speculative abstractions, future-proof scaffolding, and unrelated refactors; fix root causes with focused changes.
- Simplicity never removes required validation, security, data-loss protection, error handling, accessibility, or verification.
- Add no inline code comments unless the user requests them; report deliberate limitations outside code when needed.

## App design and implementation

- Follow root `design.md` when present and the source palette/typography reference; resolve gaps rather than inventing accepted design decisions.
- Invoke `apple-design`, `mobile-native`, and `emil-design-eng` for relevant app UI work; invoke `animate-expo` for app motion.
- Preserve scoped Expo instructions: read the installed Expo major and matching versioned documentation before Expo/React Native/EAS API changes.
- Use Expo Router and SDK-compatible `expo install`; follow the existing package manager and scoped command conventions.
- Do not hand-edit generated native directories; configure native behavior through app configuration/plugins.
- Verify native dependency build requirements; do not assume Expo Go supports added native modules.
- Run app lint and TypeScript checks before declaring app implementation complete.

## TypeScript and routes

- Never use `any`; use `unknown` with guards at uncertain boundaries.
- Prefer `const`, explicit return types, no unused declarations, and `satisfies` for checked literals.
- Use precise discriminated unions and utility types when helpful; avoid advanced types without a clear benefit.
- Every added or changed public route needs a working usage example and end-to-end verification.

## Validation and collaboration

- Ask questions directly in chat, not question popups.
- Run relevant non-interactive unit, integration, static, and headless checks without additional confirmation.
- Before graphical QA, ask whether the shared browser/emulator/device is available; identify the exact session/device and stay within the assigned app.
- For web UI QA, invoke the computer-use skill and use Chrome. For Android UI QA, invoke `android-cli`; use its build/inspection tools and `adb` for interaction.
- Report exercised flows, evidence, failures, and unverified behavior; do not claim completion from a successful build alone.
- Before conflicting parallel implementation, invoke `using-git-worktrees`; give each task an isolated branch/worktree and record its parent branch.
- Do not nest worktrees when already isolated. Read-only or clearly non-conflicting work needs no worktree.
- After worktree implementation and required tests, invoke `finishing-a-development-branch`; present integration choices and wait for selection.
- Do not autonomously merge, push, create a PR, delete a branch, or remove a worktree. Do not commit unless requested.
- For a GitHub feature-parent branch, check for its open PR; if PR creation is selected, ask whether to target that parent as a stacked PR.

## Agent skills

### Issue tracker
Use local Markdown under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels
Use the five default labels. See `docs/agents/triage-labels.md`.

### Domain docs
Use root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.

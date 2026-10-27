---
name: Glance Native iOS Liquid Glass
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c8c6c5'
  on-secondary: '#303030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#ffffff'
  on-tertiary: '#002c70'
  tertiary-container: '#d9e2ff'
  on-tertiary-container: '#005dd9'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#d9e2ff'
  tertiary-fixed-dim: '#b1c6ff'
  on-tertiary-fixed: '#001946'
  on-tertiary-fixed-variant: '#00419d'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.01em
  button:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: -0.005em
  label-mono:
    fontFamily: Space Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-mono-sm:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.02em
  caption:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system establishes a high-precision, utilitarian aesthetic tailored for mobile outdoor telemetry, polygon geofencing, and livestock tracking. Designed natively for iOS and Android under React Native and MapLibre, the visual language balances pure technical legibility with iOS "Liquid Glass" optical materials.

### Brand Personality & Emotional Tenor
- **Hyper-Precise & Uncluttered:** Eliminates visual noise over dense cartographic layers. Controls and spatial metrics float weightlessly without obscuring high-resolution pasture imagery or polygon vectors.
- **Durable & Field-Tested:** Evokes the operational confidence of aerospace telemetry and precision ranch management. Crisp typography and immediate visual signifiers convey real-time safety, breach alerts, and battery status under direct sunlight.
- **Restrained Materiality:** Exploits real-time hardware shaders, static backdrop blurs, and specular edge reflections. Rather than generic blur sheets, components behave like optical quartz glass—refracting underlying map topography while maintaining WCAG AAA legibility.

### Core Visual Direction
A hybrid of **Liquid Glass Translucency** and **Technical Brutalist Precision**:
- Precision 1px inner hairline borders simulating directional glass refractive bevels.
- Monochromatic monochrome core with high-visibility functional signals: high-luminance amber for pasture boundaries and breaches, vibrant cobalt for active herd telemetry markers.
- Graceful degradation: An automatic fallback architecture for Android devices and reduced-transparency accessibility modes that converts glass overlays into solid architectural panels.

## Colors

The palette is derived from exact gamut-mapped OKLCH targets translated into sRGB spaces, engineered specifically for high-contrast visibility against dynamic satellite tiles, vector polygons, and tactical outdoor interfaces.

### Mode Configurations

#### Light Mode
- **Canvas / Background:** `#fcfcfc`
- **Foreground / Primary Content:** `#000000`
- **Surface / Card (Solid Fallback):** `#ffffff`
- **Liquid Glass Overlay:** `rgba(255, 255, 255, 0.72)` with hairline border `rgba(0, 0, 0, 0.08)`
- **Popover & Floats:** `#fcfcfc`
- **Primary Interactive:** `#000000` (Text: `#ffffff`)
- **Secondary Interactive:** `#ebebeb` (Text: `#000000`)
- **Muted / Inactive Surfaces:** `#f5f5f5` (Muted Text: `#525252`)
- **Border / Structural Stroke:** `#e4e4e4`
- **Input Fields:** `#ebebeb`
- **Focus Ring:** `#000000`
- **Tracker Marker (Telemetry Signal):** `#2d62ef`

#### Dark Mode (Default)
- **Canvas / Background:** `#000000`
- **Foreground / Primary Content:** `#ffffff`
- **Surface / Card (Solid Fallback):** `#090909`
- **Liquid Glass Overlay:** `rgba(18, 18, 18, 0.78)` with specular border `rgba(255, 255, 255, 0.12)`
- **Popover & Floats:** `#121212`
- **Primary Interactive:** `#ffffff` (Text: `#000000`)
- **Secondary Interactive:** `#222222` (Text: `#ffffff`)
- **Muted / Inactive Surfaces:** `#1d1d1d` (Muted Text: `#a4a4a4`)
- **Border / Structural Stroke:** `#242424`
- **Input Fields:** `#333333`
- **Focus Ring:** `#a4a4a4`
- **Tracker Marker (Telemetry Signal):** `#2671f4`

### Semantic & Spatial Signaling
- **Caution / Geofence Polygon Vector:** `#ffaf0b` (Amber). Used as a 2px stroke with dynamic alpha fills (`rgba(255, 175, 11, 0.14)`) for interior zone bounding.
- **Destructive / Perimeter Breach:** `#e54b4f` (Light) / `#ff5b5b` (Dark).
- **Accessibility & Android Solid Fallback:** Solid `#ffffff` (Light) or `#090909` (Dark) with 1px solid high-contrast borders (`#e4e4e4` / `#242424`), disabling optical blur shaders entirely.

## Typography

The typographic hierarchy uses **Geist** for crisp structural reading and **Space Mono** (serving as the monospace tier for Geist Mono environments) for strict tabular tracking metrics, hardware UUIDs, timestamps, and GPS coordinates.

### Typographic Hierarchy Rules
- **Headline Large (Screen / Sheet Titles):** 28px size, 34px line height, semibold (600). Used exclusively for sheet titles and primary telemetry modals.
- **Headline Medium (Section Headers):** 20px size, 26px line height, semibold (600). Used for segment dividers, geofence zone titles, and livestock cluster groups.
- **Body & Inputs:** 16px size, 24px line height. Regular (400) for general prose and descriptions; Medium (500) for interactive form field values and active filter states. Prevents automatic iOS Safari / WebKit auto-zooming by never falling below 16px in editable fields.
- **Button Action Labels:** 16px size, 22px line height, medium (500). Optical optical centering across 44pt/48dp target blocks.
- **Monospace Coordinates & Telemetry:** Space Mono at 14px/20px and 12px/16px. Enforces strict tabular alignment for latitude/longitude, battery percentages, and RF signal decibels (`-84 dBm`), preventing jitter during real-time GPS stream re-renders.

## Layout & Spacing

Layout geometry follows an exact 4pt mathematical base grid (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`).

### Spatial Hierarchy & Grid Constraints
- **Screen Margins & Gutters:** A consistent `16px` (`1rem`) outer margin anchors all floating capsules and edge-pinned controls from the device physical viewport edges and Dynamic Island / Home Indicator safe areas.
- **Component Padding Scale:**
  - `space-xs` (4px): Inner badge padding, micro status dot offsets.
  - `space-sm` (8px): Icon-to-text gaps, chip vertical insets, compact control spacing.
  - `space-md` (12px): Standard form element vertical insets, card sub-element gaps.
  - `space-lg` (16px): Structural internal padding for cards, bottom sheet root containers, floating tab bar insets.
  - `space-xl` (24px): Vertical spacing between distinct functional groups within sheets and forms.

### Interactive Touch Real Estate
- **iOS Standard Targets:** Minimum `44 × 44 pt` touch target bound for all map overlays, floating action triggers, and capsule icons.
- **Android Target Overrides:** Scale up touch targets to `48 × 48 dp` for Android compilation targets.

## Elevation & Depth

Elevation is achieved through optical refractive layering (Liquid Glass) rather than traditional drop shadows. Visual depth is articulated by stacked surface transparencies, backdrop blur materials, and micro-thin specular edge boundaries.

### Material Stack & Tiers

1. **Tier 0: Cartographic Base Layer (MapLibre)**
   - Raw full-bleed vector / satellite map canvas. Zero blur, pure pixel rendering.

2. **Tier 1: Tactical Map Overlays & Floating Pills**
   - Translucent glass layer (`rgba(18, 18, 18, 0.78)` dark, `rgba(255, 255, 255, 0.72)` light).
   - Backdrop filter: `blur(20px) saturate(180%)`.
   - Structural Border: 1px uniform perimeter stroke (`rgba(255, 255, 255, 0.12)` in dark, `rgba(0, 0, 0, 0.08)` in light).
   - Ambient Shadow: `0px 8px 32px rgba(0, 0, 0, 0.24)` with tinted dark penumbra for optical isolation above high-frequency map data.

3. **Tier 2: Bottom Sheets & Interactive Drawers**
   - Near-opaque structural backings (`rgba(18, 18, 18, 0.94)` in dark mode) ensuring high-speed readability and zero visual conflict when complex polygon borders pass underneath.
   - 1px top border simulating upward specular reflection.
   - Ambient Shadow: `0px -4px 24px rgba(0, 0, 0, 0.35)`.

4. **Tier 3: Critical Alert Modals & Breach Dialogs**
   - Solid backdrop dimmer: `rgba(0, 0, 0, 0.65)`.
   - Dialog body: Opaque `#121212` (dark) or `#fcfcfc` (light) with high-contrast perimeter highlight and `0px 16px 48px rgba(0, 0, 0, 0.5)`.

## Shapes

The design system adopts a Pill-Shaped (`roundedness: 3`) geometry for detached interactive controls, balanced by structured rounded rectangles for content panels.

### Geometric Application
- **Capsules & Status Pills:** Full continuous curve (`border-radius: 9999px`) applied to the floating primary bottom tab bar capsule, GPS tracking badges, and floating zoom/layer map buttons.
- **Cards, Drawers & Sheets:** Corner radius of `24px` (`rounded-xl`) on sheet tops and map panel overlays, echoing native iOS sheet ergonomics.
- **Form Fields & Small Overlays:** `12px` to `16px` corner curvature, presenting a softened tactile feel that distinguishes editable interactive inputs from the full-radius navigation capsules.

## Components

### Floating Tab Bar Capsule
- Floating pill positioned `16px` above the bottom safe area inset.
- Houses two primary operational views: **Map** and **Setup**.
- Layout: Height `56px`, horizontal padding `8px`, centered horizontally with fixed width or hugging content (`~220px`).
- Background: Liquid Glass material (`blur(24px)`).
- Active Item: High-contrast pill indicator (`#ffffff` with `#000000` icon/text in dark mode; `#000000` with `#ffffff` text in light mode) with spring-physics transition. Inactive items render with muted typography/icons (`#a4a4a4` dark / `#525252` light).

### Floating Status Pill
- Micro telemetry badge pinned to top safe area (underneath Dynamic Island).
- Geometry: Full capsule radius, height `36px`, padding horizontal `12px`.
- Content: Livestock tracker connectivity status dot (`6px` circle: `#2671f4` pulsating for active sync, `#ffaf0b` for weak link, `#ff5b5b` for geofence breach), followed by Geist Mono tabular string indicating active animals within fence (e.g., `48/48 SAFE`).

### Map Overlay Controls
- Floating cluster (Layer switcher, Recenter, Geofence Polygon Draw tool).
- Dimensions: `44 × 44 pt` (iOS) / `48 × 48 dp` (Android).
- Appearance: Liquid Glass squares with `14px` border radius or circular pills, equipped with 1px glass border, centering 20px vector icons. Pressed state applies a scale transform (`0.96`) and increases surface opacity by `15%`.

### Tactile Bottom Sheets
- Draggable drawer anchoring livestock rosters, geofence coordinate lists, or animal inspection profiles.
- Backing: Near-opaque frosted finish (`rgba(18, 18, 18, 0.94)` dark) to eliminate text collision with dynamic cartography beneath.
- Top Grabber: `36 × 5px` pill centered `8px` below top rim in `#333333` (dark) or `#e4e4e4` (light).
- Motion: Native spring sheet snapping across 3 detents: `Collapsed (88px)`, `Half (45%)`, `Expanded (90%)`.

### Form Inputs & Coordinate Cells
- Input Height: `48px` to ensure touch ergonomics.
- Background: `#1d1d1d` (dark) / `#ebebeb` (light).
- Borders: `1px` subtle outline (`#242424` dark), transitioning to `#a4a4a4` (or `#000000` in light) on active focus ring.
- Coordinate Display Items: Dual-column structured items showing Point ID, Northing/Easting or Lat/Long in Geist Mono 14px, accompanied by drag-to-reorder tactile handles for geofence vertex manipulation.

### Dialog Modals & Alerts
- For non-negotiable alerts (e.g., "Geofence Perimeter Breach - Sector 4").
- Border: `1.5px` accent highlight in `#ff5b5b` (destructive breach) or `#ffaf0b` (warning).
- Primary Button: Opaque high-contrast `#ffffff` (dark) with destructive alternate buttons utilizing `#e54b4f` / `#ff5b5b` text fills.
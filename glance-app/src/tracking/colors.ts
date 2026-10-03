type Oklch = readonly [lightness: number, chroma: number, hue: number];

function linearRgb([lightness, chroma, hue]: Oklch): number[] {
  const radians = hue * Math.PI / 180;
  const axisA = chroma * Math.cos(radians);
  const axisB = chroma * Math.sin(radians);
  const long = (lightness + 0.3963377774 * axisA + 0.2158037573 * axisB) ** 3;
  const medium = (lightness - 0.1055613458 * axisA - 0.0638541728 * axisB) ** 3;
  const short = (lightness - 0.0894841775 * axisA - 1.291485548 * axisB) ** 3;
  return [4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short];
}

export function nativeColor(source: Oklch): string {
  let rgb = linearRgb(source);
  if (rgb.some(channel => channel < -0.000001 || channel > 1.000001)) {
    let low = 0;
    let high = source[1];
    for (let index = 0; index < 24; index += 1) {
      const chroma = (low + high) / 2;
      const trial = linearRgb([source[0], chroma, source[2]]);
      if (trial.every(channel => channel >= 0 && channel <= 1)) low = chroma;
      else high = chroma;
    }
    rgb = linearRgb([source[0], low, source[2]]);
  }
  return '#' + rgb.map(channel => {
    const bounded = Math.max(0, Math.min(1, channel));
    const encoded = bounded <= 0.0031308 ? 12.92 * bounded : 1.055 * bounded ** (1 / 2.4) - 0.055;
    return Math.round(encoded * 255).toString(16).padStart(2, '0');
  }).join('');
}

const gray = (lightness: number): string => nativeColor([lightness, 0, 0]);

function palette(dark: boolean): Record<string, string> {
  const foreground = gray(dark ? 1 : 0);
  const background = gray(dark ? 0 : 0.99);
  const secondary = gray(dark ? 0.25 : 0.94);
  const accent = gray(dark ? 0.32 : 0.94);
  const ring = gray(dark ? 0.72 : 0);
  return {
    background, foreground, card: gray(dark ? 0.14 : 1), 'card-foreground': foreground,
    popover: gray(dark ? 0.18 : 0.99), 'popover-foreground': foreground,
    primary: foreground, 'primary-foreground': gray(dark ? 0 : 1),
    secondary, 'secondary-foreground': foreground, muted: gray(dark ? 0.23 : 0.97),
    'muted-foreground': gray(dark ? 0.72 : 0.44), accent, 'accent-foreground': foreground,
    destructive: nativeColor(dark ? [0.69, 0.2, 23.91] : [0.63, 0.19, 23.03]),
    'destructive-foreground': gray(dark ? 0 : 1), border: gray(dark ? 0.26 : 0.92),
    input: accent, ring, 'chart-1': nativeColor([0.81, 0.17, 75.35]),
    'chart-2': nativeColor(dark ? [0.58, 0.21, 260.84] : [0.55, 0.22, 264.53]),
    'chart-3': gray(dark ? 0.56 : 0.72), 'chart-4': gray(dark ? 0.44 : 0.92),
    'chart-5': gray(dark ? 0.92 : 0.56), sidebar: gray(dark ? 0.18 : 0.99),
    'sidebar-foreground': foreground, 'sidebar-primary': foreground,
    'sidebar-primary-foreground': gray(dark ? 0 : 1), 'sidebar-accent': accent,
    'sidebar-accent-foreground': foreground, 'sidebar-border': accent, 'sidebar-ring': ring,
  };
}

export const palettes = { light: palette(false), dark: palette(true) };

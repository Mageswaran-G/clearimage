/**
 * Approved ClearImage design tokens.
 * This is the single source of truth for brand colors used outside CSS
 * (for example: canvas drawing, chart colors, inline SVG).
 * For styling in components, prefer the Tailwind utility classes defined
 * from these same values in `src/app/globals.css` (e.g. `bg-background`,
 * `text-graphite`, `border-border`).
 *
 * Do not change these values without design approval.
 */

export const colors = {
  background: "#F3F7F6",
  graphite: "#0B1114",
  workspaceDark: "#11191D",
  tealClear: "#00A6A6",
  tealDeep: "#087C7C",
  textSecondary: "#657074",
  borderLight: "#D9E4E1",
  success: "#2E8B68",
  warning: "#C58A27",
  error: "#C95858",
} as const;

export type ColorToken = keyof typeof colors;

export const fonts = {
  display: "var(--font-manrope)",
  body: "var(--font-public-sans)",
  mono: "var(--font-ibm-plex-mono)",
} as const;

export type FontToken = keyof typeof fonts;

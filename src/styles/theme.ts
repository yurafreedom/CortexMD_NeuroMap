export const theme = {
  colors: {
    bgDeep: "#080b12",
    bgBase: "#0d1117",
    bgElevated: "#141820",
    bgSurface: "#1a1f2e",

    glass: "rgba(255,255,255,0.03)",
    glassHover: "rgba(255,255,255,0.06)",
    glassBorder: "rgba(255,255,255,0.08)",
    glassBorderHover: "rgba(255,255,255,0.15)",

    textPrimary: "#f0f2f5",
    textSecondary: "#9ba3b5",
    textMuted: "#5a6478",

    accent: "#60a5fa",
    accentDim: "rgba(96,165,250,0.12)",
    accentGlow: "rgba(96,165,250,0.25)",
    accentBlue: "#818cf8",
    accentBlueDim: "rgba(129,140,248,0.15)",

    statusOptimal: "#22c55e",
    statusWarning: "#f59e0b",
    statusDanger: "#ef4444",
  },

  shadows: {
    sm: "0 2px 8px rgba(0,0,0,0.3)",
    md: "0 8px 32px rgba(0,0,0,0.4)",
  },

  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
  },

  ease: "cubic-bezier(0.32,0.72,0,1)",
  dur: "0.25s",

  fonts: {
    display: "'Outfit', -apple-system, sans-serif",
    head: "'Outfit', -apple-system, sans-serif",
    body: "'Plus Jakarta Sans', -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
} as const;

export type Theme = typeof theme;
export default theme;

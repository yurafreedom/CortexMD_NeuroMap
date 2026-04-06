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

    accent: "#6ee7b7",
    accentDim: "rgba(110,231,183,0.15)",
    accentGlow: "rgba(110,231,183,0.08)",
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

  ease: "cubic-bezier(0.4,0,0.2,1)",
  dur: "0.25s",

  fonts: {
    head: "'Outfit', sans-serif",
    body: "'DM Sans', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
} as const;

export type Theme = typeof theme;
export default theme;

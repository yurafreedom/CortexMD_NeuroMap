/**
 * Centralised z-index hierarchy for CortexMD.
 *
 * Layers (low → high):
 *   canvas  →  panels  →  controls  →  overlays  →  modals  →  chat
 *
 * Every z-index in the app must reference this file.
 */

export const Z = {
  /** WebGL canvas & its decorative pseudo-elements */
  canvas: 1,
  canvasPseudo: 2,
  canvasElement: 3,

  /** Top bar (above canvas, below panels) */
  topbar: 5,

  /** Left panel (drug list, deficits) */
  leftPanel: 10,

  /** Bottom bar indicators */
  bottomBar: 20,

  /** Zone popup (click a brain region) */
  zonePopup: 20,

  /** Tooltip (hover label on brain region) */
  tooltip: 25,

  /** Right panel (region detail) */
  rightPanel: 25,
  rightPanelToggle: 26,

  /** AI chat FAB button */
  chatFab: 40,

  /** Hover tooltip label */
  hoverLabel: 50,

  /** Full-screen overlays (Sigma-1, Glutamate, Indicator popups) */
  overlay: 100,
  overlayClose: 101,
  overlayTooltip: 102,

  /** Modals (drug catalog modal, preset modals) */
  modal: 1000,

  /** AI chat panel (topmost interactive layer) */
  chat: 1000,
} as const;

export type ZLayer = keyof typeof Z;

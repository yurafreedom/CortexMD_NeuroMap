# CortexMD design system: UX/UI standards for data-heavy 3D medical dashboards

**A neuropharmacological 3D brain map demands an interface that balances clinical precision with cognitive accessibility — serving psychiatrists who need receptor-level data density and patients with ADHD who need radical simplicity.** This report synthesizes 2024–2026 best practices across dashboard architecture, 3D web visualization, medical UX compliance, accessibility, data visualization, interaction patterns, and dark interface design into a concrete, implementation-ready specification for CortexMD. Every recommendation includes specific values (px, ms, hex, opacity), anti-patterns, and references to proven products like Linear, Figma, BioDigital Human, and Allen Brain Atlas.

The core architectural insight: CortexMD should use a **hub-and-spoke layout** with the 3D brain as the central hub, a collapsible sidebar (240px/56px) for navigation, and a detail panel (320px) for pharmacological data — following Figma's three-panel canvas pattern but adapted for medical 3D visualization. Dark mode is the primary theme (`#0A0E17` base, not pure black), with a strict three-tier progressive disclosure system to prevent cognitive overload.

---

## 1. Dashboard UX patterns that scale with clinical complexity

### Progressive disclosure in three layers

Research shows progressive disclosure **reduces cognitive load by 40%** and **error rates by 89%**. CortexMD should implement exactly three disclosure levels — more overwhelms users; fewer starves clinicians of data:

- **Level 1 (Glanceable):** 3D brain model with color-coded regions showing overall status. Four to five KPI cards (brain volume, asymmetry index, risk score, medication count, last scan date). This is all a patient sees by default.
- **Level 2 (Actionable):** Click a brain region → side panel slides in with receptor density, active medications affecting the region, interaction warnings. This is the psychiatrist's working view.
- **Level 3 (Deep dive):** Click a metric → full pharmacokinetic chart, half-life curves, titration history, confidence intervals. This is on-demand detail that never clutters the default view.

Triggers should follow established timing: **hover tooltips at 400ms delay** (first occurrence; 0ms for subsequent), **click for panel expansion** (200ms ease-out transition), and scroll for lazy reveal of below-fold content. Figma's UI3 redesign explored hover-to-reveal UI but abandoned it as "too unstable" — click-to-expand is safer for medical contexts where accidental reveals could be distracting.

```css
/* Panel slide-in from right */
.detail-panel {
  transform: translateX(100%);
  transition: transform 200ms cubic-bezier(0.32, 0.72, 0, 1);
}
.detail-panel.open {
  transform: translateX(0);
}
```

**Anti-pattern:** Showing all pharmacological data — medications, interactions, side effects, half-lives, titration schedules — simultaneously in a single view. This is exactly what Epic and Cerner do, and it contributes to **10–20% of clinician burnout**.

### Information hierarchy through typography scale

Use a **Major Third ratio (1.25)** built on a 14px base for dense medical data:

| Level | Size | Weight | Line-height | CortexMD use |
|-------|------|--------|-------------|--------------|
| Display | 32px | 700 | 40px | KPI values (brain volume, risk score) |
| H1 | 24px | 600 | 32px | Panel titles ("Brain Analysis") |
| H2 | 20px | 600 | 28px | Card titles, region names |
| Body | 16px | 400 | 24px | Descriptions, paragraphs |
| UI label | 14px | 500 | 20px | Form labels, table headers |
| Caption | 12px | 400 | 16px | Timestamps, chart axes, drug dosages |
| Overline | 11px | 600 | 16px | Badges, status indicators |

All line-heights are multiples of 4px (conforming to the **8px grid system**). For fluid scaling: `font-size: clamp(1rem, 0.9rem + 0.5vw, 1.125rem)`. Minimum body text is **14px** per WCAG. WCAG contrast ratios: **4.5:1** for normal text, **3:1** for 18px+ or 14px bold.

### Hub-and-spoke layout with an 8px grid

**Hub-and-spoke is the optimal pattern** for CortexMD. The 3D brain sits center as the "hub" (≥50% viewport width), surrounded by "spoke" panels that update contextually. This is superior to the F-pattern (better for text-heavy list views) or Z-pattern (marketing pages). The architecture maps to a 12-column grid:

```
┌────────────────────────────────────────────────────┐
│  Top Bar (56px) — Patient │ Scan Date │ Actions    │
├──────────┬─────────────────────┬───────────────────┤
│ Sidebar  │                     │  Detail Panel     │
│ 3 cols   │   3D Brain Canvas   │  3 cols (320px)   │
│ 240px    │   6 cols (hub)      │  Collapsible      │
│          │                     │                   │
│ Collapsed│   KPI Row (4-5      │  Region metrics   │
│ = 56px   │   cards below)      │  Accordions       │
│          │                     │  Drug data        │
└──────────┴─────────────────────┴───────────────────┘
```

Responsive breakpoints: **768px** (tablet — sidebar collapses), **1024px** (laptop — detail panel overlays), **1280px** (desktop — full three-panel), **1536px** (large desktop — wider canvas). Store sidebar collapse preference in `localStorage`; default collapsed on screens below 1280px.

### Sidebar: 240px expanded, 56px collapsed

Left sidebar is the correct pattern for CortexMD. Research confirms sidebars work best for complex apps with **5+ navigation items and deep hierarchy**. The sidebar should contain: patient list, scan history, brain region tree, medication library, and settings — maximum **5–7 top-level items**.

```css
.sidebar {
  width: 240px;
  height: 100vh;
  position: fixed;
  transition: width 200ms cubic-bezier(0.32, 0.72, 0, 1);
}
.sidebar.collapsed {
  width: 56px; /* Icon-only with tooltips on hover */
}
```

Linear uses an "inverted L-shape" navigation (sidebar + top bar). Figma's UI3 uses collapsible left sidebar + right inspector + bottom toolbar. Both keep panels **docked, not floating** — Figma tried floating panels and reverted after user backlash. Professional users prefer predictable, anchored panels.

**Anti-pattern:** Sidebar with more than 7 top-level items without grouping, no tooltips on collapsed icon-only state, resetting collapse preference on page load, or using sidebar on mobile (switch to off-canvas drawer).

### Card-based UI with 16px gaps

KPI cards should follow a strict size system on the **8px grid**:

| Card size | Width | Use case |
|-----------|-------|----------|
| Small (KPI) | 200–280px | Single metric + sparkline |
| Medium | 300–400px | Summary card, chart card |
| Large | 500px+ | 3D viewer, detailed data table |

Standard card gap: **16px** between cards, **24px** between card groups, **12px** internal padding for compact cards, **16–20px** for standard cards. Border-radius: **12px** (8–16px common range). Limit KPI rows to **4–6 cards** — beyond 6, cards get too narrow at 1280px canvas width.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}
.card {
  background: var(--surface-01);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 16px;
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
```

**Anti-pattern:** Multiple primary actions per card (limit to 1 CTA), uneven content lengths without truncation, forcing cards for dense tabular data (use tables instead), or more than one card type per visual row.

---

## 2. Fusing 3D brain visualization with 2D clinical panels

### Three.js/R3F performance targets for a brain model

Target **60fps** for interactive scenes, **30fps** acceptable during complex transitions. Keep the brain model under **500K triangles** for broad device compatibility (mobile: halve this). Use three LOD variants:

```jsx
import { Detailed } from '@react-three/drei';
<Detailed distances={[0, 50, 100]}>
  <HighPolyBrain />   {/* <50 units: ~100K tri */}
  <MediumPolyBrain /> {/* 50-100 units: ~30K tri */}
  <LowPolyBrain />    {/* >100 units: ~5K tri */}
</Detailed>
```

Critical R3F performance rules: use **on-demand rendering** (`frameloop="demand"`) when the brain is at rest — never render continuously for a static model. Mutate transforms in `useFrame` via refs, never via `setState` (which triggers React re-renders every frame). Use **Draco** or **Meshopt** for geometry compression (90%+ reduction). Compress textures with **KTX2/Basis Universal**. Keep draw calls under 100 per frame.

```jsx
// Adaptive quality based on device capability
const [dpr, setDpr] = useState(1.5);
<Canvas dpr={dpr} frameloop="demand">
  <PerformanceMonitor
    onIncline={() => setDpr(2)}
    onDecline={() => setDpr(1)}
    flipflops={3}
    onFallback={() => setDpr(0.75)}
  />
```

For progressive loading, use nested Suspense: show a low-poly brain immediately while the high-poly version loads in the background. Use `useGLTF.preload('/brain-high.glb')` to start background loading.

### HTML overlay architecture for 2D/3D fusion

The recommended approach is **Drei's `<Html>` component** for labels and tooltips — it renders full CSS-styled, accessible HTML that tracks 3D object positions. This outperforms CSS3DRenderer (complex, performance-heavy with many elements) and texture-based UI (blurry, not accessible, limited styling).

```
┌─────────────────────────────────────────────┐
│ z-index: 1000 — Modal Layer (React portals) │
├─────────────────────────────────────────────┤
│ z-index: 100  — Toolbar/Controls (HTML)     │
├─────────────────────────────────────────────┤
│ z-index: 10   — Labels/Tooltips (Drei Html) │
├─────────────────────────────────────────────┤
│ z-index: 1    — 3D Canvas (WebGL)           │
└─────────────────────────────────────────────┘
```

Set `pointerEvents: 'none'` on the overlay container, then selectively enable `pointerEvents: 'auto'` on interactive elements. This lets clicks pass through to the 3D scene where needed. BioDigital Human uses this exact pattern — their information panel is docked as a separate HTML panel, never overlaid on the 3D model. Figma's canvas interaction model also follows this: pan (space+drag), zoom (pinch/scroll), and selection (click) are all scoped to the canvas element.

**Anti-patterns:** Rendering UI text as 3D textures (not crisp, not accessible), showing more than **20–30 HTML overlay labels** simultaneously (causes layout thrashing), mixing CSS3DRenderer with CSS2DRenderer, or forgetting `pointer-events: none` on overlay containers.

### 3D navigation tuned for medical precision

Use the **camera-controls** library (yomotsu) over standard OrbitControls — it supports `lerpLookAt()`, `fitToBox()`, and proper dolly vs. zoom distinction, which are essential for a brain viewer.

```jsx
<OrbitControls
  enableDamping={true}
  dampingFactor={0.05}      // 0.01-0.25; lower = smoother
  rotateSpeed={0.5}         // Slower than default 1.0 for precision
  minDistance={2}            // Prevent clipping into brain
  maxDistance={50}           // Prevent losing the model
  minPolarAngle={0.1}       // Prevent gimbal lock
  maxPolarAngle={Math.PI - 0.1}
  zoomToCursor={true}       // Zoom toward cursor position
/>
```

Camera transition durations: **600–800ms** for region focus (power2.inOut easing), **500–700ms** for reset view, **400–600ms** for zoom to detail. Implement preset view buttons — "Frontal," "Sagittal," "Dorsal," "Limbic" — following the Allen Brain Atlas's bookmark pattern.

**Critical rule:** Never hijack page scroll for 3D zoom. Only capture scroll/wheel events when the cursor is over the 3D canvas. Always provide explicit zoom buttons (+/−) as an alternative.

### Floating labels that track brain regions

Limit visible labels to **5–8 at a time** using distance-based filtering. Implement a priority system: selected region > hovered > nearby > distant. Labels should use a zoom-level strategy:

- **Zoomed out** (whole brain): Only major region labels (6–8), 14px font
- **Mid zoom** (lobe level): Sub-region labels, 13px font
- **Zoomed in** (structure level): Full tooltips with receptor data, 13–14px body

```css
.brain-label {
  font-family: 'Inter', -apple-system, sans-serif;
  color: #f1f5f9;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  max-width: 240px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}
```

For occlusion, Drei's `<Html occlude>` uses depth buffer comparison. For label collision avoidance, implement simple repulsion — if two labels overlap in screen space, offset them vertically. Allen Brain Atlas uses a hierarchical ontology tree to organize hundreds of regions; BioDigital Human allows draggable labels so users can reposition annotations that occlude important anatomy.

### Learning from Allen Brain Atlas and BioDigital Human

**Allen Brain Atlas** is the gold standard for brain region organization: a hierarchical ontology tree (Cortex → Frontal → Prefrontal → DLPFC) with toggle columns showing different data layers, multi-pane views (3D + coronal/sagittal/horizontal cross-sections), and bookmarkable views. Its weakness: a dated, research-grade interface with a steep learning curve. CortexMD must be dramatically simpler.

**BioDigital Human** provides the best interaction verb set: **Select** (click), **Isolate** (show only selected), **Fade** (dim others), **Fly To** (animated zoom). Their navigation controls are collapsed by default into a single icon — progressive disclosure at work. Their chapter/tour system enables guided walkthroughs, which CortexMD should adapt for patient consultations.

**Visible Body** contributes the "adjustable depth" annotation concept (drawing at specific brain layers) and "Quick Views" (preset orientations mapped to textbook standards). Both are directly applicable.

---

## 3. Medical interface standards where errors cost lives

### WCAG 2.2 and regulatory compliance

CortexMD falls under multiple regulatory frameworks. The **HHS Section 504 update (May 2024)** explicitly mandates WCAG 2.1 Level AA for any healthcare organization receiving federal funding. The **European Accessibility Act** has been in force since June 28, 2025. For SaMD classification, **IEC 62366-1:2015** requires usability engineering with minimum **15 participants per user group** for summative testing — both psychiatrists and patients must be separately validated.

Critical WCAG 2.2 requirements for CortexMD:

- **SC 1.4.1 (Use of Color):** Color must **never** be the sole means of conveying information. Every brain region status encoded in color must also have a distinct shape, pattern, or text label. This is non-negotiable: **8% of males** have color vision deficiency.
- **SC 2.4.11 (Focus Not Obscured):** When keyboard focus lands on an element, it must not be hidden by sticky headers or the 3D canvas overlay.
- **SC 2.5.8 (Target Size):** Touch targets must be at least **24×24 CSS pixels**, or have 24px spacing between targets.
- **SC 1.4.3/1.4.6:** Minimum **4.5:1** contrast for normal text, **3:1** for large text. AAA: **7:1** for normal, **4.5:1** for large.

Every 3D visualization needs comprehensive alt text and `aria-label` attributes. Use `aria-live="polite"` for real-time dashboard updates. Test with NVDA and VoiceOver — automated tools detect only **30–40%** of accessibility issues.

### Displaying pharmacological data with clinical precision

Follow strict formatting conventions: **always use leading zeros** (0.5 mg, not .5 mg), **never trailing zeros** (5 mg, not 5.0 mg). Display generic name first with brand in parentheses: "sertraline (Zoloft) 100 mg." Group medications by drug class (SSRIs together, mood stabilizers together), maximum **4–5 per visible group** before scrolling.

Drug interaction display should follow tiered severity from clinical decision support research. A study across 19 EHR implementations found no system alerted on ALL tested drug pairs — **58% of DDI pairs** produced interruptive alerts, only **12%** produced passive alerts. CortexMD should contextualize interactions using patient-specific parameters (renal function, age, concurrent medications).

### Color coding that survives color blindness

The traffic light convention (red/yellow/green) is ubiquitous but dangerous: it fails for the **300+ million** people worldwide with color vision deficiency. Every status must combine color with a **unique shape**:

| Status | Color | Shape | CortexMD use |
|--------|-------|-------|--------------|
| Critical | `#FF3838` | Octagon/X | SSRI + MAOI interaction |
| Serious | `#FFB302` | Diamond | Dose exceeding recommended max |
| Caution | `#FCE83A` | Triangle | Minor interaction, monitor |
| Normal | `#56F000` | Circle | Medication within therapeutic range |
| Standby | `#2DCCFF` | Square | Medication not yet active |

Use the **blue-orange palette** as a colorblind-safe alternative to red-green for the 3D brain heatmap. Test all color combinations through CVD simulators (Sim Daltonism, Color Oracle). For the brain visualization specifically, use **luminance differences** (not just hue) to indicate activation regions — this ensures the map remains readable in any form of color blindness.

### Defeating alert fatigue with tiered severity

Override rates for clinical decision support alerts run **77–96%** across US healthcare. Only **7.3%** of alerts were clinically appropriate in one study. CortexMD must avoid the "boy who cried wolf" effect with strict tiering:

| Tier | Presentation | Dismissal | CortexMD example |
|------|-------------|-----------|-------------------|
| **Critical** | Full-screen modal, hard stop | Cannot dismiss without action + documented reason | SSRI + MAOI, lithium toxicity risk |
| **Serious** | Modal with override option | Override with documented reason | Serotonin syndrome potential |
| **Warning** | Persistent banner at top | Acknowledge and continue | Mild QT prolongation additive |
| **Info** | Inline annotation on 3D brain | Auto-dismiss or manual close | Known mild side effect |

Provide **shortcuts for corrective actions** directly in the alert ("Switch to alternative" button). Reduce within-patient repeats — never re-alert for the same known condition on every session. Context-driven alerts using patient-specific parameters are the only approach shown to reliably increase prescriber acceptance.

### Two interfaces, one product

Patient and clinician views must differ fundamentally:

| Aspect | Patient view | Clinician view |
|--------|-------------|----------------|
| Reading level | 6th–8th grade | Professional/technical |
| Terminology | "Mood center," "focus area" | "DLPFC," "5-HT2A receptor" |
| Information density | 1–3 key points per view | Comprehensive data |
| Navigation | Linear, ≤3 levels, guided | Multi-panel, keyboard shortcuts |
| Data display | Simple icons, progress bars | Detailed charts, numeric values |
| Emotional tone | Reassuring, warm | Clinical, efficient |

Only **12% of US adults** have proficient health literacy. Standard patient education materials from EHRs average **9.2 grade level** — far too high. CortexMD's patient view should always lead with a **plain-language summary** above any visualization: "Your serotonin medication is working well in the mood center of your brain" — following Apple Health's text-first, chart-second pattern.

---

## 4. Reducing cognitive load for clinicians with ADHD

### ADHD-aware interface design

With **4–5% of adults globally** affected by ADHD (8 million in the US alone), designing for ADHD is designing for a significant user segment — especially among patients on complex pharmacological regimens. The core challenge is an **interest-based nervous system**: tasks must be novel, interesting, challenging, or urgent to engage attention.

Concrete ADHD design strategies for CortexMD:

- **Visual timers** that show time as physical quantity (shrinking disc, progress bar) instead of abstract countdown numbers — ADHD users experience "time blindness" as a neurological trait.
- **"Focus mode" toggle**: Strips the interface to essential elements — fewer colors, larger targets, hidden non-critical panels, reduced animation. Think of it as a prefers-reduced-distraction mode.
- **Micro-task breakdown**: Multi-step medication reviews should show progress indicators (Step 2 of 5) with clear completion states. Each step should feel independently achievable.
- **Gamification with restraint**: Streak indicators for medication adherence, subtle completion celebrations, achievement markers — but never flashy or distracting.
- **Gentle interruptions**: Checkpoint notifications at intervals during extended sessions. Never force abrupt interruptions — use gentle chimes, not jarring alerts.
- **Notification management**: User-controlled frequency with a "Do not disturb" mode that queues non-critical items. Distinguish critical (immediate) from routine (batched).

**Anti-patterns for ADHD users:** Auto-playing animations, walls of text without visual hierarchy, hidden navigation requiring memory recall, time-limited interactions without warnings, and lack of undo functionality.

### Working memory limits shape dashboard layout

**Cowan's updated finding (2001)** puts working memory at **4±1 chunks** — lower than Miller's classic 7±2, and lower still for users under cognitive load (including ADHD). Gobet and Clarkson found over half of memory recall conditions yielded only about **2 chunks**.

Dashboard implications: maximum **4–5 simultaneously visible data categories** for patients, **5–7 top-level navigation items** for clinicians, **4–6 dashboard cards** visible at once, and no more than **3–4 simultaneously highlighted brain regions**. Group medications by class with max 4–5 per visible group. A drug name like "sertraline" is one chunk for a psychiatrist but multiple phonetic chunks for a patient — expertise changes chunk boundaries.

### Motion design: when to animate, when to stop

| Animation type | Duration | Easing | CSS |
|---------------|----------|--------|-----|
| Button press | 50–100ms | ease-out | `transition: transform 100ms ease-out` |
| Hover state, tooltip | 100–200ms | ease-out | `transition: opacity 150ms ease-out` |
| Tab switch, card expand | 150–300ms | ease-out | `transition: max-height 300ms ease-out` |
| Panel slide, modal | 200–400ms | cubic-bezier(0.32, 0.72, 0, 1) | See above |
| Camera transition | 400–800ms | power2.inOut | GSAP |

Use **ease-out** for entrances (starts fast, ends slow — feels responsive), **ease-in** for exits (starts slow, ends fast), and **ease-in-out** for point-to-point movements. Exit animations should be faster than entrances (200ms enter → 150ms exit). Never exceed **500ms** for UI animations. Only animate `transform` and `opacity` — they're GPU-accelerated and don't trigger layout shifts.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

No animation should flash more than 3 times per second (WCAG 2.3.1). Avoid parallax effects entirely — they trigger dizziness and nausea in users with vestibular disorders.

---

## 5. Visualizing pharmacological data on a brain heatmap

### Progress bars, gauges, and status dots

```css
.progress-bar {
  height: 6px;          /* 4px for inline/table, 8px for hero metrics */
  border-radius: 3px;
  background: rgba(255,255,255,0.08);
}
.gauge {
  width: 96px; height: 96px;   /* range: 80-120px */
  stroke-width: 6px;
  stroke-linecap: round;
}
.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 6px currentColor; /* subtle glow on dark bg */
}
```

Vercel's Geist design system provides the model: **status dots** (green: ready, amber: building, red: error) for deployment states map directly to medication status (active, tapering, discontinued, contraindicated). Center gauge values inside circular gauges at **20–28px** font size; place labels beneath, not inside, for medical clarity. Use segmented progress bars for discrete steps (medication titration stages) with 2px gaps between segments.

### Sparklines following Tufte's principles

Maximize the data-ink ratio. On sparklines: **no axes**, **no gridlines**, show only the endpoint dot (radius 2–3px) and optionally min/max dots. Place the current value as a number adjacent to the sparkline, never inside it.

```css
.sparkline {
  width: 100px;          /* range: 80-120px */
  height: 28px;          /* range: 24-32px */
  stroke-width: 1.5px;   /* range: 1.5-2px */
  fill: none;
}
.sparkline-area {
  fill: rgba(99, 102, 241, 0.15);
  stroke: #818CF8;
}
```

Bank the aspect ratio to approximately **45°** slopes (typically 3:1 to 4:1 width:height) for optimal perception. Show axes only when sparklines exceed 200px wide and are used as standalone mini-charts. For grouped sparklines (multiple brain region metrics in a table), normalize the vertical scale across the group so comparisons are meaningful.

### Colorblind-safe heatmaps for brain data

Never use the jet/rainbow colormap — studies show physicians using jet make **significantly more diagnostic errors**. Use perceptually uniform, colorblind-safe palettes:

**Cividis** (recommended default — optimized for ALL forms of CVD):
```css
--cividis: linear-gradient(90deg, #00224E, #123570, #406E89, #8C9E3F, #FDE724);
```

**Viridis** (best general-purpose):
```css
--viridis: linear-gradient(90deg, #440154, #3B528B, #21918C, #5EC962, #FDE725);
```

**Plasma** (high-contrast alerting):
```css
--plasma: linear-gradient(90deg, #0D0887, #7E03A8, #CC4778, #F89441, #F0F921);
```

For brain region overlays, use `mix-blend-mode: screen` (works well on dark backgrounds) with opacity **0.85**. Map receptor occupancy or drug concentration to the heatmap gradient — cividis for default view, plasma when highlighting alerts.

### Communicating uncertainty in treatment data

Drug efficacy is inherently uncertain. Show ranges rather than false precision:

```css
.confidence-band {
  fill: rgba(99, 102, 241, 0.15);   /* 95% CI */
}
.confidence-band--inner {
  fill: rgba(99, 102, 241, 0.30);   /* 68% CI / 1σ */
}
.prediction-line {
  stroke: #818CF8;
  stroke-width: 2px;
  stroke-dasharray: 6 4;            /* dashed for predicted values */
}
```

Display ranges when uncertainty exceeds 10%: "72–86%" rather than "79%." For brain region scores, show the measurement inline with its error: `Score: 0.82 ± 0.07`. Use gradient opacity bands on sparklines for uncertain trailing data. For the patient view, translate this to plain language: "Your response is between good and very good."

Real-time value changes should animate over **300ms** with Material easing (`cubic-bezier(0.4, 0, 0.2, 1)`). Use skeleton screens during data loads:

```css
.skeleton {
  background: linear-gradient(90deg,
    rgba(255,255,255,0.04) 25%,
    rgba(255,255,255,0.08) 50%,
    rgba(255,255,255,0.04) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

Mark stale data with reduced opacity (0.5) and a dashed amber border (`1px dashed rgba(245, 158, 11, 0.4)`).

---

## 6. Interaction patterns for drug configuration workflows

### Drag-and-drop for drug assignment

Use **dnd-kit** (not @hello-pangea/dnd) — its framework-agnostic core and customizable collision detection algorithms are essential for dragging drug cards onto 3D brain region targets. Always provide a **button/keyboard alternative** — DnD must never be the only path.

Keyboard activation: `Space`/`Enter` to pick up, **arrow keys** to navigate, `Space`/`Enter` to confirm, `Escape` to cancel. ARIA: `role="button"`, `aria-roledescription="draggable"`, `aria-live="polite"` announcements on drop ("Fluoxetine 20mg assigned to Prefrontal Cortex").

```css
/* Drop zone states */
.drop-zone { border: 2px dashed rgba(255,255,255,0.15); border-radius: 8px; }
.drop-zone--active { border-color: #3B82F6; background: rgba(59,130,246,0.08); }
.drop-zone--invalid { border-color: #EF4444; opacity: 0.5; cursor: not-allowed; }

/* Drag ghost */
.drag-ghost { opacity: 0.6; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transform: scale(1.05); }
```

Brain regions should glow blue for valid receptor targets and red for contraindicated regions during drag. Transition duration for state changes: **200–300ms** ease-in-out. Drag handles must be at least **44×44px** on touch.

### Slider UX for precise medical dosages

**Always pair sliders with an editable numeric input field** — this is non-negotiable in medical contexts. Clinicians need exact precision, not approximate dragging. Use discrete/snapped steps matching FDA-approved increments (e.g., Fluoxetine: 10mg steps → 10, 20, 40, 60, 80mg).

```css
/* Slider dimensions */
.slider-thumb { width: 28px; height: 28px; }      /* 24-32px desktop */
.slider-track { height: 6px; border-radius: 3px; } /* 4-8px */
```

The slider track should show color-coded zones: **green** (therapeutic range), **yellow** (approaching limits), **red** (exceeding recommended max). `aria-valuetext` must be human-readable: "Fluoxetine, 20 milligrams per day, within therapeutic range." Live preview should update the 3D brain's receptor occupancy heatmap as the slider moves. Never auto-apply dosage changes — require explicit confirmation.

### Search and filter for large drug libraries

For a client-side drug list of 50–200 items: **1 character minimum**, **200ms debounce**, fuzzy matching. For server-side search: 2–3 character minimum, 300ms debounce. Show results in a dropdown with max **7–10 visible items**, highlight matching characters in bold, group by category (SSRIs, SNRIs, Atypical Antipsychotics).

Faceted filters: Drug Class, Primary Receptor, Brain Region Affinity, Interaction Risk. Display as checkboxes for multi-select with live result counts. Show applied filters as removable chips: `[SSRI ✕] [Serotonin ✕] [Clear All]`. Use virtual scrolling for 50+ items to reduce DOM nodes.

The **Cmd+K command palette** (Raycast pattern) is essential for power users: search across brain regions, medications, patients, and receptor types from a single entry point. Linear, Figma, and Raycast all demonstrate that a well-implemented command palette dramatically accelerates expert workflows.

### Undo/redo with a three-layer system

Implement the **command pattern** — each action (assign drug, change dosage, modify region) is encapsulated as a reversible command with `do()` and `undo()` methods. This is superior to state snapshots for CortexMD because it handles side effects (3D rendering updates, interaction recalculations) explicitly.

- **Layer 1 — Keyboard:** `Cmd+Z` / `Cmd+Shift+Z` as the primary undo/redo mechanism.
- **Layer 2 — Toast:** On destructive actions, show a snackbar with an Undo button for **8–10 seconds** (extended from the standard 5–6 seconds for medical safety). Pause timer on hover. Position: bottom-center. Use `role="status"` with `aria-live="polite"`.
- **Layer 3 — History panel:** Chronological action log with timestamps ("10:42 — Assigned Fluoxetine 20mg to PFC"). Click any entry to restore that state. "Create Checkpoint" button for marking baseline configurations. History depth: **100 actions per session**.

**Anti-pattern:** Auto-dismissing undo toasts for destructive medical actions, allowing undo to bypass safety confirmations, or saving undo history across sessions (creates audit confusion).

---

## 7. Dark UI that serves clinical readability

### Surface elevation palette — never pure black

Pure `#000000` creates excessive contrast, prevents shadow-based depth cues, and causes eye strain. Material Design recommends `#121212` as the canonical dark surface. For CortexMD, add a subtle blue tint for a medical/tech feel:

```css
:root {
  --bg-base:      #0A0E17;   /* Near-black with blue tint */
  --bg-surface:   #111827;   /* 1dp - cards at rest */
  --bg-elevated:  #1F2937;   /* 2dp - panels, sidebars */
  --bg-active:    #374151;   /* 3dp - active elements, menus */
  --bg-overlay:   rgba(17, 24, 39, 0.75);  /* Glass panels */
}
```

Material Design's elevation overlay system uses increasing white opacity on `#121212`: **5%** at 1dp, **7%** at 2dp, **8%** at 3dp, **9%** at 4dp, **11%** at 6dp, **12%** at 8dp, **14%** at 12dp, **15%** at 16dp, **16%** at 24dp (dialogs). Higher surfaces appear lighter, creating depth without shadows.

Linear uses **LCH color space** for perceptual uniformity — only 3 input variables (base color, accent, contrast) generate ~98 design tokens. This is ideal for CortexMD: perceptual uniformity means a red region and a blue region at the same "intensity" appear equally intense, critical for neuropharmacological overlays.

### Glassmorphism for brain overlay panels

```css
.glass-panel {
  background: rgba(17, 24, 39, 0.75);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
}

/* Performance fallback */
@supports not (backdrop-filter: blur(16px)) {
  .glass-panel {
    background: rgba(17, 24, 39, 0.92);
  }
}
```

Glassmorphism works when the background content (the 3D brain scene) provides visual context through the blur. It fails for dense data tables, long-form text, nested glass panels (glass-on-glass kills contrast), and low-end mobile devices. Never animate `backdrop-filter` — it's GPU-intensive. Animate `opacity` or `transform` instead.

### Glow effects with restraint

Glow effects are powerful for highlighting active brain regions but toxic when overused. Follow the **one-glow-per-viewport-section** rule:

```css
/* Brain region selection glow */
.brain-region--active {
  box-shadow:
    0 0 8px rgba(99, 102, 241, 0.4),
    0 0 24px rgba(99, 102, 241, 0.2),
    0 0 48px rgba(99, 102, 241, 0.1);
}

/* Critical metric text glow */
.metric-critical {
  color: #F87171;
  text-shadow:
    0 0 7px rgba(248, 113, 113, 0.5),
    0 0 20px rgba(248, 113, 113, 0.2);
}
```

**Overuse warning signs:** More than 2 glowing elements visible simultaneously, glows interfering with data readability, performance degradation from multiple animated glows, and glowing borders on every card. If everything glows, nothing stands out.

### Typography adjustments for dark mode

Light text on dark backgrounds appears optically bolder (halation effect). Reduce font weight by ~100, increase letter-spacing, and always enable antialiased rendering:

```css
body.dark-mode {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.body-text {
  font-weight: 350;              /* Down from 400 in light mode */
  letter-spacing: 0.02em;        /* +0.015-0.025em for dark */
  line-height: 1.6;              /* 1.5-1.7; dark needs more air */
  color: rgba(255,255,255, 0.87); /* High emphasis, NOT pure white */
}
.text-secondary { color: rgba(255,255,255, 0.60); }
.text-disabled  { color: rgba(255,255,255, 0.38); }
```

For variable fonts (Inter Variable), use the grade axis: `font-variation-settings: "GRAD" -25` to lighten without changing text width, avoiding layout reflow. Font recommendations: **Inter** for body (used by Linear), **Geist Mono** or **JetBrains Mono** for pharmacological data (dosages, concentrations, lab values). Avoid thin weights below 300 on dark backgrounds.

### Borders and separators using opacity

```css
.border-subtle  { border: 1px solid rgba(255,255,255, 0.06); } /* Dividers */
.border-default { border: 1px solid rgba(255,255,255, 0.10); } /* Cards, panels */
.border-strong  { border: 1px solid rgba(255,255,255, 0.16); } /* Inputs, focused */

/* Interactive card pattern */
.card {
  border: 1px solid rgba(255,255,255, 0.06);
  transition: border-color 200ms ease;
}
.card:hover { border-color: rgba(255,255,255, 0.12); }
.card:focus-within {
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}
```

Use **borders** (`rgba(255,255,255,0.06–0.12)`) for cards, panels, and section dividers. Use **shadows** (`box-shadow: 0 4px 12px rgba(0,0,0,0.5)`) for floating elements like dropdowns and modals. Use **background-color changes** (`rgba(255,255,255,0.04)` → `0.08` on hover) for hover states and selected rows. Vercel/Geist relies heavily on spacing and background-color changes over explicit borders. For decorative separators, use a 1px-tall `div` with `background` rather than CSS `border`.

---

## 8. What CortexMD should steal from each reference product

### Linear → theming architecture and keyboard-first design

Linear's **LCH color system** (3 inputs generate 98 tokens) is the ideal foundation for CortexMD's theme engine. Their 2025 refresh moved to higher-contrast text and warmer neutral grays, proving that cool blue-toned medical dashboards should warm up slightly for readability. Adopt their **Cmd+K command palette** and keyboard-first philosophy — every action accessible without a mouse. Their sidebar + tabs + header "inverted L" navigation is proven for complex project data.

### Figma → three-panel canvas layout with docked panels

Figma's **left panel → canvas → right inspector** layout maps directly to CortexMD: brain region tree → 3D brain → pharmacological detail panel. Their critical lesson: **keep panels docked, not floating**. The UI3 redesign experimented with floating panels and reverted after user backlash. Their properties panel pattern (component controls above attributes) should inform CortexMD's detail panel (drug effects above receptor-level data).

### Vercel → design token system and status visualization

Geist's **10-step color scale** per semantic type is the right granularity for medical status colors. Their **Status Dot** pattern maps to medication status; their **Gauge** component is perfect for receptor occupancy visualization (e.g., "D2 receptor 65% occupied"). Geist Mono for pharmacological data display. Their skeleton loading pattern for 3D model load states.

### Raycast → command palette excellence

Raycast's "**Search → Act → Done**" model eliminates context switching. Type "amygdala" → immediate actions: View receptor density, Compare with baseline, Add annotation, Share with patient. Support **aliases** so clinicians can type "ssri" to see all SSRIs mapped to brain regions. The non-activating panel behavior (doesn't steal focus from the EMR) is critical when CortexMD runs alongside Epic.

### Apple Health → patient-facing data wisdom

Apple Health's **text-first, chart-second** approach is the model for CortexMD's patient view: "During the last month, your medication improved activity in the mood center by 15%" appears above the brain visualization. Their consistent category colors (Activity = orange, Heart = red, Sleep = blue) should inform CortexMD's fixed drug class colors. Their known UX problems (tappable-looking elements that aren't interactive) are the anti-pattern: if a brain region glows, clicking it must do something.

### Epic/Cerner → what not to do (and SMART on FHIR integration)

EHRs contribute to clinician burnout through excessive information density, multi-click workflows, and **77–96% alert override rates**. CortexMD must solve what Epic cannot: **one screen, one patient**, with all brain map data visible without tab-switching. Integrate via **SMART on FHIR** to launch within Epic/Cerner, receiving patient context automatically. But never try to replicate their general-purpose approach — specialize relentlessly for psychiatry.

---

## CortexMD complete design token reference

```css
:root {
  /* Surfaces */
  --bg-base:       #0A0E17;
  --bg-surface:    #111827;
  --bg-elevated:   #1F2937;
  --bg-overlay:    rgba(17, 24, 39, 0.75);

  /* Text */
  --text-primary:   rgba(255,255,255, 0.87);
  --text-secondary: rgba(255,255,255, 0.60);
  --text-tertiary:  rgba(255,255,255, 0.38);

  /* Borders */
  --border-subtle:  rgba(255,255,255, 0.06);
  --border-default: rgba(255,255,255, 0.10);
  --border-strong:  rgba(255,255,255, 0.16);

  /* Accent */
  --accent:      #6366F1;
  --accent-glow: rgba(99, 102, 241, 0.3);

  /* Semantic status */
  --critical: #FF3838;
  --serious:  #FFB302;
  --caution:  #FCE83A;
  --normal:   #56F000;
  --standby:  #2DCCFF;

  /* Typography */
  --font-body: 'Inter', -apple-system, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', monospace;
  --line-height: 1.6;
  --letter-spacing: 0.02em;

  /* Animation */
  --ease-out: cubic-bezier(0.32, 0.72, 0, 1);
  --ease-material: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;

  /* Glass */
  --glass-blur: 16px;
  --glass-bg: rgba(17, 24, 39, 0.75);
  --glass-border: rgba(255,255,255, 0.06);

  /* Heatmaps */
  --heatmap-cividis: linear-gradient(90deg, #00224E, #123570, #406E89, #8C9E3F, #FDE724);
  --heatmap-viridis: linear-gradient(90deg, #440154, #3B528B, #21918C, #5EC962, #FDE725);
  --heatmap-plasma:  linear-gradient(90deg, #0D0887, #7E03A8, #CC4778, #F89441, #F0F921);

  /* Layout */
  --sidebar-expanded: 240px;
  --sidebar-collapsed: 56px;
  --topbar-height: 56px;
  --detail-panel: 320px;
  --card-gap: 16px;
  --card-radius: 12px;
  --grid-base: 8px;
}
```

## Conclusion

CortexMD sits at the intersection of three hard design problems — **3D visualization**, **medical safety**, and **cognitive accessibility** — each of which alone demands specialized expertise. The key insight from this research is that these constraints actually reinforce each other when addressed through a unified progressive disclosure architecture.

The hub-and-spoke layout with the 3D brain as the central hub is not just a spatial arrangement — it is the information architecture itself. Every interaction flows from or to the brain visualization. The three-layer disclosure system (glanceable → actionable → deep dive) serves both the time-pressured psychiatrist and the cognitively overloaded patient. The dark interface with brand-tinted surfaces (`#0A0E17`) naturally foregrounds the luminous 3D brain model.

Two architectural decisions will disproportionately determine CortexMD's success. First, **implementing the patient/clinician mode switch** not as a cosmetic reskin but as a fundamentally different information architecture — different chunk sizes, different vocabulary, different disclosure levels from the same underlying data. Second, **defeating alert fatigue** through spatial alerts on the 3D brain (region-specific color changes and annotations) rather than modal interruptions — letting the brain itself become the alert system. The research is unambiguous: modal alerts are overridden 77–96% of the time, but spatial encoding on a familiar visualization is processed preattentively and does not interrupt workflow.

The recommended technology stack — React Three Fiber with Drei for 3D, camera-controls for navigation, dnd-kit for drug configuration, and an LCH-based color system for perceptual uniformity — is battle-tested across the reference products analyzed and optimized for the specific constraints of a medical 3D dashboard.
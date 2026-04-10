/**
 * Glutamate cascade nodes and edges for visualization.
 * Follows the same interface pattern as sigma1Cascade.ts.
 *
 * Layout: top-down flow, NMDA/AMPA at top → Ca²⁺ → kinases → transcription → plasticity.
 * Shared nodes with σ1 cascade: TrkB, mTORC1, eEF2K (marked with shared flag).
 */

export interface GluCascadeNode {
  id: string;
  l: string;       // label
  d: string;       // description
  x: number;
  y: number;
  w: number;       // width
  shared?: boolean; // shared with σ1 cascade
}

export const GLU_NODES: GluCascadeNode[] = [
  // Row 1: Receptors (y=40)
  { id: 'nmdar', l: 'NMDA-R', d: 'NMDA-рецептор (GluN2A/2B). Потенциал-зависимый, пропускает Ca²⁺. Кетамин блокирует.', x: 300, y: 40, w: 65 },
  { id: 'ampar', l: 'AMPA-R', d: 'AMPA-рецептор. Быстрая глутаматная передача. Деполяризация снимает Mg²⁺-блок NMDA.', x: 500, y: 40, w: 65 },

  // Row 2: Ca²⁺ (y=120)
  { id: 'ca', l: 'Ca²⁺', d: 'Внутриклеточный кальций. Ключевой второй мессенджер для LTP/LTD.', x: 400, y: 120, w: 50 },

  // Row 3: Kinases / phosphatases (y=200)
  { id: 'camkii', l: 'CaMKII', d: 'Ca²⁺/кальмодулин-зависимая киназа II. Высокий Ca²⁺ → LTP.', x: 300, y: 200, w: 60 },
  { id: 'calcineurin', l: 'Кальцинеурин', d: 'Фосфатаза PP2B. Низкий/тонический Ca²⁺ → LTD. Противовес CaMKII.', x: 520, y: 200, w: 80 },

  // Row 4: Transcription (y=290)
  { id: 'creb', l: 'CREB', d: 'Транскрипционный фактор. CaMKII фосфорилирует → активация. Кальцинеурин дефосфорилирует → инактивация.', x: 400, y: 290, w: 55 },

  // Row 5: Neurotrophins (y=370)
  { id: 'bdnf', l: 'BDNF', d: 'Brain-derived neurotrophic factor. Продукт CREB-транскрипции.', x: 300, y: 370, w: 55 },
  { id: 'trkb', l: 'TrkB', d: 'Рецептор BDNF. Запускает PI3K/Akt → mTOR.', x: 200, y: 420, w: 55, shared: true },
  { id: 'mtor', l: 'mTORC1', d: 'Финальный путь синтеза синаптических белков. Общий узел с σ1-каскадом.', x: 300, y: 460, w: 65, shared: true },

  // Row 5 alt: eEF2K branch (right side)
  { id: 'eef2k', l: 'eEF2K', d: 'Elongation factor 2 kinase. NMDA-блокада (кетамин) → ингибирование eEF2K → де-репрессия локального синтеза белков.', x: 600, y: 120, w: 55, shared: true },

  // Row 6: Output (y=460-500)
  { id: 'synprot', l: 'Синапт. белки', d: 'PSD-95, GluA1 (AMPAR trafficking), Arc, Homer. Структурная основа синапса.', x: 500, y: 460, w: 80 },

  // Row 7: Outcome (y=510)
  { id: 'ltpltd', l: 'LTP / LTD', d: 'Долговременная потенциация (обучение) и депрессия (забывание). Баланс определяет пластичность.', x: 400, y: 510, w: 70 },
];

// Edge types for glutamate cascade
export type GluEdgeType = 'ion' | 'act' | 'inh' | 'prod' | 'neg';

export interface GluCascadeEdge {
  f: string;          // from node id
  t: string;          // to node id
  tp: GluEdgeType;    // type
  l?: string;         // label
}

export const GLU_EDGES: GluCascadeEdge[] = [
  // Receptors → Ca²⁺
  { f: 'nmdar', t: 'ca', tp: 'ion', l: 'Ионный ток' },
  { f: 'ampar', t: 'ca', tp: 'ion', l: 'Деполяризация → VGCC' },

  // Ca²⁺ → kinases
  { f: 'ca', t: 'camkii', tp: 'act', l: 'Высокий Ca²⁺' },
  { f: 'ca', t: 'calcineurin', tp: 'act', l: 'Тонический Ca²⁺' },

  // Kinases → CREB
  { f: 'camkii', t: 'creb', tp: 'act', l: 'Фосфорилирование' },
  { f: 'calcineurin', t: 'creb', tp: 'neg', l: 'Дефосфорилирование' },

  // CREB → BDNF
  { f: 'creb', t: 'bdnf', tp: 'prod', l: 'Транскрипция' },

  // BDNF → TrkB → mTOR → synaptic proteins
  { f: 'bdnf', t: 'trkb', tp: 'act', l: 'Активация' },
  { f: 'trkb', t: 'mtor', tp: 'act', l: 'PI3K/Akt' },
  { f: 'mtor', t: 'synprot', tp: 'prod', l: 'Синтез' },

  // eEF2K branch (ketamine mechanism)
  { f: 'eef2k', t: 'synprot', tp: 'inh', l: 'Ингибирование синтеза' },
  { f: 'nmdar', t: 'eef2k', tp: 'inh', l: 'Блокада → dis-inhibition' },

  // Outcome
  { f: 'camkii', t: 'ltpltd', tp: 'act', l: 'LTP' },
  { f: 'calcineurin', t: 'ltpltd', tp: 'act', l: 'LTD' },
];

// Edge type labels for legend
export const GLU_EDGE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  ion: { label: 'Ионный ток', color: '#60a5fa' },
  act: { label: 'Активация', color: '#22c55e' },
  inh: { label: 'Ингибирование', color: '#ef4444' },
  prod: { label: 'Продукция/синтез', color: '#a78bfa' },
  neg: { label: 'Негативный контроль', color: '#f59e0b' },
};

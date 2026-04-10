// Sigma-1 cascade nodes
export interface Sigma1Node {
  id: string;   // unique identifier
  l: string;    // label
  d: string;    // description
  x: number;    // x position
  y: number;    // y position
  w: number;    // width
}

export const S1N: Sigma1Node[] = [
  { id: 's1r', l: 'σ1R', d: 'Сигма-1 рецептор на мембране ЭР (MAM). При покое связан с BiP.', x: 400, y: 40, w: 60 },
  { id: 'bip', l: 'BiP', d: 'Шаперон BiP/GRP78. В покое держит σ1R неактивным.', x: 250, y: 40, w: 50 },
  { id: 'ip3r3', l: 'IP3R3', d: 'Кальциевый канал на ЭР. σ1R стабилизирует → Ca²⁺.', x: 540, y: 40, w: 55 },
  { id: 'ca', l: 'Ca²⁺', d: 'Ионы кальция. Триггер киназных каскадов и АТФ.', x: 660, y: 90, w: 50 },
  { id: 'mito', l: 'Мито', d: 'Митохондрия. Ca²⁺ → производство АТФ.', x: 750, y: 40, w: 50 },
  { id: 'atp', l: 'АТФ', d: 'Энергия для синаптической пластичности и LTP.', x: 750, y: 130, w: 50 },
  { id: 'camk', l: 'CaMKII', d: 'Кальций-кальмодулин киназа II/IV.', x: 550, y: 170, w: 60 },
  { id: 'erk', l: 'ERK1/2', d: 'MAP-киназа. Передаёт сигнал к CREB.', x: 450, y: 240, w: 60 },
  { id: 'creb', l: 'CREB', d: 'Транскрипционный фактор. CREB → BDNF.', x: 400, y: 330, w: 55 },
  { id: 'bdnf', l: 'BDNF', d: 'Нейротрофический фактор. Нейрогенез, пластичность, реконсолидация.', x: 400, y: 420, w: 55 },
  { id: 'ire1', l: 'IRE1', d: 'σ1R стабилизирует IRE1 → XBP1. Альт. путь к BDNF.', x: 250, y: 170, w: 50 },
  { id: 'xbp1', l: 'XBP1', d: 'Транскрипционный фактор. Доп. путь к BDNF.', x: 250, y: 280, w: 55 },
  { id: 'sk', l: 'SK-кан.', d: 'SK калиевые каналы. σ1R ингибирует → потенцирование NMDA.', x: 660, y: 210, w: 60 },
  { id: 'nmda', l: 'NMDA-R', d: 'NMDA-рецептор. Потенцирование = основа LTP.', x: 700, y: 300, w: 65 },
  { id: 'glun', l: 'GluN2A/2B', d: 'σ1R → трафик субъединиц к мембране.', x: 600, y: 340, w: 70 },
  { id: 'psd', l: 'PSD-95', d: 'Скаффолд. Организует рецепторы в постсинапсе.', x: 650, y: 400, w: 60 },
  { id: 'ltp', l: 'LTP', d: 'Долговременная потенциация. Обучение, память.', x: 600, y: 470, w: 50 },
  { id: 'recon', l: 'Реконсол.', d: 'Реконсолидация травматических воспоминаний (EMDR/PE).', x: 500, y: 500, w: 70 },
  // Phase 7: extended cascade nodes
  { id: 'trkb', l: 'TrkB', d: 'Tropomyosin receptor kinase B — рецептор BDNF. Запускает PI3K/Akt → mTOR сигналинг.', x: 320, y: 470, w: 55 },
  { id: 'mtor', l: 'mTORC1', d: 'Mechanistic target of rapamycin — финальный путь синтеза синаптических белков.', x: 400, y: 500, w: 65 },
  { id: 'eef2k', l: 'eEF2K', d: 'Eukaryotic elongation factor 2 kinase. Кетамин блокирует NMDA → ингибирует eEF2K → де-репрессия синтеза белков.', x: 760, y: 380, w: 55 },
];

// Sigma-1 cascade edges
export type Sigma1EdgeType = 'inh' | 'stab' | 'act' | 'prod';

export interface Sigma1Edge {
  f: string;            // from node id
  t: string;            // to node id
  tp: Sigma1EdgeType;   // type: inhibition, stabilization, activation, production
  l?: string;           // optional label
}

export const S1E: Sigma1Edge[] = [
  { f: 's1r', t: 'bip', tp: 'inh', l: 'Диссоциация' },
  { f: 's1r', t: 'ip3r3', tp: 'stab', l: 'Стабилизация' },
  { f: 'ip3r3', t: 'ca', tp: 'act', l: 'Ca²⁺ выброс' },
  { f: 'ca', t: 'mito', tp: 'act' },
  { f: 'mito', t: 'atp', tp: 'prod' },
  { f: 'ca', t: 'camk', tp: 'act' },
  { f: 'camk', t: 'erk', tp: 'act' },
  { f: 'erk', t: 'creb', tp: 'act' },
  { f: 'creb', t: 'bdnf', tp: 'prod', l: 'Транскрипция' },
  { f: 's1r', t: 'ire1', tp: 'stab', l: 'Стабилизация' },
  { f: 'ire1', t: 'xbp1', tp: 'act' },
  { f: 'xbp1', t: 'bdnf', tp: 'prod', l: 'Доп. BDNF' },
  { f: 's1r', t: 'sk', tp: 'inh', l: 'Ингибиция SK' },
  { f: 'sk', t: 'nmda', tp: 'act', l: 'NMDA потенц.' },
  { f: 's1r', t: 'glun', tp: 'act', l: 'Трафик' },
  { f: 'glun', t: 'psd', tp: 'act', l: '+PSD-95' },
  { f: 'nmda', t: 'ltp', tp: 'act' },
  { f: 'psd', t: 'ltp', tp: 'act' },
  { f: 'bdnf', t: 'recon', tp: 'act' },
  { f: 'ltp', t: 'recon', tp: 'act' },
  // Phase 7: extended cascade edges
  { f: 'bdnf', t: 'trkb', tp: 'act', l: 'Активация' },
  { f: 'trkb', t: 'mtor', tp: 'act', l: 'PI3K/Akt' },
  { f: 'mtor', t: 'psd', tp: 'prod', l: 'Синтез белков' },
  { f: 'nmda', t: 'eef2k', tp: 'inh', l: 'Dis-inhibition' },
];

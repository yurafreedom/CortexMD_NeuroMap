// Neurotransmitter colors
export interface NeurotransmitterColors {
  [key: string]: string;
}

export const NTC: NeurotransmitterColors = {
  '5-HT': '#60a5fa',
  DA: '#fbbf24',
  NA: '#34d399',
  ACh: '#c084fc',
  s1: '#f472b6',
  D3: '#f87171',
  Glu: '#e879f9',
};

// Zone receptors
export interface ZoneReceptorEntry {
  [receptor: string]: number | string;
  note: string;
}

export interface ZoneReceptors {
  [zoneId: string]: ZoneReceptorEntry;
}

export const ZR: ZoneReceptors = {
  dlPFC: { SERT: 2, NET: 3, DAT: 0, D1: 3, D2: 1, D3: 0, '5HT1A': 3, '5HT2A': 3, '5HT2C': 1, '5HT3': 2, '5HT7': 2, a2A: 3, s1: 2, NMDA: 3, GABAA: 2, note: 'DAT отсутствует! NET убирает и NA и DA.' },
  vmPFC: { SERT: 2, NET: 2, DAT: 0, D1: 2, D2: 1, '5HT1A': 3, '5HT2A': 2, a2A: 2, s1: 2, NMDA: 2, GABAA: 2, note: 'Самореференция и эмоциональная регуляция' },
  ofc: { SERT: 2, NET: 2, DAT: 0, D1: 2, D2: 2, '5HT2A': 2, '5HT2C': 2, a2A: 1, s1: 1, GABAA: 2, note: 'D2 выше чем в длПФК' },
  acc: { SERT: 2, NET: 2, DAT: 1, D1: 2, D2: 2, '5HT1A': 2, '5HT2A': 2, '5HT7': 3, a2A: 2, NMDA: 3, GABAA: 2, note: '5-HT7 высокая - вортиоксетин ключевой' },
  insula: { SERT: 1, NET: 3, a2A: 2, '5HT1A': 2, s1: 1, NMDA: 2, GABAA: 2, note: 'NET высокая - NA критичен для интероцепции' },
  nac: { SERT: 2, DAT: 3, NET: 1, D1: 3, D2: 3, D3: 3, '5HT2C': 2, '5HT1B': 2, GABAA: 2, NMDA: 2, note: 'Core=D1 Shell=D3. DAT основной клиренс DA' },
  vta: { D2: 3, D3: 3, '5HT2C': 3, '5HT1A': 2, GABAA: 3, note: 'D2/D3 АУТО. 5HT2C на ГАМК = серотониновый потолок DA' },
  lc: { a2A: 3, NET: 2, '5HT1A': 1, GABAA: 2, note: 'a2A ауторецепторы контролируют NA-выброс' },
  amygdala: { SERT: 3, NET: 2, '5HT1A': 3, '5HT2C': 2, D1: 1, D2: 2, a2A: 2, s1: 2, NMDA: 3, GABAA: 3, note: 'SERT высокая - SSRI эффективны. NMDA - реконсолидация (EMDR)' },
  hippo: { SERT: 3, NET: 2, '5HT1A': 3, '5HT3': 2, '5HT4': 2, s1: 3, NMDA: 3, a2A: 2, GABAA: 2, note: 's1 ВЫСОКАЯ! s1->BDNF->LTP. NMDA->обучение' },
  parietal: { NET: 2, a2A: 3, D1: 1, '5HT2A': 2, NMDA: 2, note: 'a2A - пространственное внимание' },
  cerebellum: { NET: 2, D2: 1, GABAA: 3, NMDA: 2, note: 'Пуркинье ГАМК. Тайминг' },
  brainstem: { NET: 2, SERT: 2, '5HT1A': 2, a2A: 2, GABAA: 2, note: 'Вегетативка' },
  raphe: { SERT: 3, '5HT1A': 3, '5HT1B': 2, note: 'Источник 5-HT. SERT на соме' },
  spinal: { SERT: 2, NET: 3, '5HT1A': 2, a2A: 2, NMDA: 2, note: 'Нисходящее торможение боли NA+5-HT' },
};

// Brain region data
export interface BrainRegion {
  n: string;    // short name
  f: string;    // full name
  fn: string;   // function description
  p: [number, number, number]; // position [x, y, z]
  c: string;    // color hex
}

export interface BrainRegions {
  [regionId: string]: BrainRegion;
}

export const RG: BrainRegions = {
  dlPFC: { n: 'длПФК', f: 'Дорсолатеральная ПФК', fn: 'Рабочая память, фокус, планирование', p: [0.15, 0.45, 0.35], c: '#60a5fa' },
  vmPFC: { n: 'вмПФК', f: 'Вентромедиальная ПФК', fn: 'Эмоц. регуляция, самореференция', p: [0, 0.15, 0.4], c: '#818cf8' },
  ofc: { n: 'оПФК', f: 'Орбитофронтальная кора', fn: 'Вознаграждение, импульсы', p: [0, -0.05, 0.4], c: '#a78bfa' },
  acc: { n: 'ACC', f: 'Передняя поясная кора', fn: 'Мониторинг ошибок, гибкость', p: [0, 0.28, 0.15], c: '#c084fc' },
  insula: { n: 'Инсула', f: 'Островковая кора', fn: 'Интероцепция, ощущение тела', p: [0.3, 0.08, 0.08], c: '#22d3ee' },
  nac: { n: 'NAc', f: 'Nucleus Accumbens', fn: 'Core=D1 делаю | Shell=D3 хочу', p: [0.08, -0.05, 0.2], c: '#fbbf24' },
  vta: { n: 'VTA', f: 'Вентральная тегментальная обл.', fn: 'Источник DA для NAc и ПФК', p: [0, -0.2, -0.1], c: '#f59e0b' },
  lc: { n: 'LC', f: 'Locus Coeruleus', fn: 'Источник NA для всего мозга', p: [0.05, -0.25, -0.2], c: '#34d399' },
  amygdala: { n: 'Амигдала', f: 'Миндалевидное тело', fn: 'Страх, угроза, эмоц. память', p: [0.2, -0.1, 0.05], c: '#f87171' },
  hippo: { n: 'Гиппокамп', f: 'Гиппокамп', fn: 'Память, нейрогенез, BDNF, LTP', p: [0.22, -0.08, -0.12], c: '#fb923c' },
  parietal: { n: 'Теменная', f: 'Теменная кора', fn: 'Простр. внимание, координация', p: [0.2, 0.5, -0.15], c: '#2dd4bf' },
  cerebellum: { n: 'Мозжечок', f: 'Мозжечок', fn: 'Тайминг, точность', p: [0, -0.3, -0.42], c: '#a3e635' },
  brainstem: { n: 'Ствол', f: 'Ствол мозга', fn: 'Вегетативка: дыхание, сердце', p: [0, -0.45, -0.25], c: '#64748b' },
  raphe: { n: 'Шов', f: 'Ядра шва', fn: 'Источник 5-HT', p: [0, -0.32, -0.18], c: '#60a5fa' },
  spinal: { n: 'Спин.', f: 'Спинной мозг', fn: 'Нисходящее торможение боли', p: [0, -0.65, -0.28], c: '#94a3b8' },
};

// Tracts (neural pathways)
export interface Tract {
  f: string;  // from region id
  t: string;  // to region id
  nt: string; // neurotransmitter
}

export const TR: Tract[] = [
  { f: 'vta', t: 'nac', nt: 'DA' },
  { f: 'vta', t: 'dlPFC', nt: 'DA' },
  { f: 'lc', t: 'dlPFC', nt: 'NA' },
  { f: 'lc', t: 'amygdala', nt: 'NA' },
  { f: 'lc', t: 'insula', nt: 'NA' },
  { f: 'lc', t: 'parietal', nt: 'NA' },
  { f: 'raphe', t: 'dlPFC', nt: '5-HT' },
  { f: 'raphe', t: 'amygdala', nt: '5-HT' },
  { f: 'raphe', t: 'hippo', nt: '5-HT' },
  { f: 'raphe', t: 'vta', nt: '5-HT' },
  { f: 'dlPFC', t: 'amygdala', nt: 'NA' },
];

// Neurotransmitter to receptor mapping
export interface NtReceptorMap {
  [nt: string]: string[];
}

export const NT_REC: NtReceptorMap = {
  DA: ['DAT', 'D3', 'D2'],
  NA: ['NET', 'a2A', 'alpha1'],
  '5-HT': ['SERT', '5HT3', '5HT1A', '5HT7', '5HT1B'],
  s1: ['s1'],
  D3: ['D3', 'D2'],
  Glu: ['NMDA'],
  ACh: ['AChE', '5HT3'],
};

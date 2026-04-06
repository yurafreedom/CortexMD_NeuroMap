export type ConflictSeverity = 'critical' | 'serious' | 'warning';

export interface ConflictRule {
  id: string;
  drugs: string[];
  conflictsWith: string[];
  severity: ConflictSeverity;
  title: string;
  description: string;
  zones: string[];
}

export const CONFLICT_RULES: ConflictRule[] = [
  // MAOi + серотонинергик = серотониновый синдром
  {
    id: 'maoi_serotonin',
    drugs: ['selegiline_oral'],
    conflictsWith: [
      'sertraline', 'fluoxetine', 'fluvoxamine', 'escitalopram',
      'venlafaxine', 'duloxetine', 'vortioxetine', 'dextromethorphan',
    ],
    severity: 'critical',
    title: 'Серотониновый синдром',
    description: 'MAOi + серотонинергик = потенциально смертельная комбинация',
    zones: ['brainstem', 'hippo'],
  },

  // DXM + SSRI/SNRI = серотониновый синдром
  {
    id: 'dxm_ssri',
    drugs: ['dextromethorphan', 'auvelity'],
    conflictsWith: [
      'sertraline', 'escitalopram', 'fluoxetine', 'fluvoxamine',
      'duloxetine', 'venlafaxine', 'desvenlafaxine', 'milnacipran', 'levomilnacipran',
    ],
    severity: 'critical',
    title: 'DXM + SSRI/SNRI',
    description: 'Серотониновый синдром! DXM нельзя с серотонинергиками',
    zones: ['brainstem', 'hippo', 'raphe'],
  },

  // Селегилин + DXM
  {
    id: 'selegiline_dxm',
    drugs: ['selegiline_oral'],
    conflictsWith: ['dextromethorphan', 'auvelity'],
    severity: 'critical',
    title: 'Селегилин + DXM',
    description: 'ПРОТИВОПОКАЗАНО: MAOi + NMDA/серотонинергик',
    zones: ['brainstem', 'vta'],
  },

  // Мукуна + MAOi
  {
    id: 'mucuna_maoi',
    drugs: ['mucuna'],
    conflictsWith: ['selegiline_oral'],
    severity: 'critical',
    title: 'L-DOPA + ИМАО',
    description: 'Мукуна (L-DOPA) + ИМАО = гипертонический криз',
    zones: ['vta', 'nac', 'brainstem'],
  },

  // Угнетение дыхания: бензо + опиоиды
  {
    id: 'benzo_opioid',
    drugs: ['diazepam', 'clonazepam', 'alprazolam'],
    conflictsWith: ['tramadol'],
    severity: 'critical',
    title: 'Угнетение дыхания',
    description: 'Бензодиазепин + опиоид = риск остановки дыхания',
    zones: ['brainstem'],
  },

  // QT-пролонгация
  {
    id: 'qt_prolongation',
    drugs: ['escitalopram'],
    conflictsWith: ['quetiapine'],
    severity: 'serious',
    title: 'QT-пролонгация',
    description: 'Оба препарата удлиняют QT интервал. Риск аритмии. ЭКГ-контроль.',
    zones: ['brainstem'],
  },

  // Двойная SERT-блокада
  {
    id: 'double_sert',
    drugs: ['sertraline', 'fluoxetine', 'fluvoxamine', 'escitalopram'],
    conflictsWith: ['venlafaxine', 'duloxetine', 'desvenlafaxine'],
    severity: 'warning',
    title: 'Избыточная SERT-блокада',
    description: 'Два мощных SERT-блокатора. Рассмотреть замену одного.',
    zones: ['brainstem', 'hippo', 'amygdala'],
  },

  // Серт + бупропион (5HT2C потолок)
  {
    id: 'sert_bupropion',
    drugs: ['sertraline'],
    conflictsWith: ['bupropion'],
    severity: 'warning',
    title: 'Серотониновый потолок DA',
    description: 'Серт 5HT2C → DA VTA вниз 30-42%. Бупропион не компенсирует.',
    zones: ['vta', 'nac'],
  },

  // Прамипексол + карипразин — D3 конкуренция
  {
    id: 'pram_cariprazine',
    drugs: ['pramipexole'],
    conflictsWith: ['cariprazine'],
    severity: 'warning',
    title: 'D3-конкуренция',
    description: 'Прам (полный D3 агонист) + карипразин (парц. D3) = конкуренция за рецепторы',
    zones: ['nac', 'vta'],
  },

  // Бупропион + арипипразол/брексипразол — CYP2D6
  {
    id: 'bup_aripiprazole',
    drugs: ['bupropion'],
    conflictsWith: ['aripiprazole', 'brexpiprazole'],
    severity: 'warning',
    title: 'CYP2D6 ингибирование',
    description: 'С бупропионом: ПОЛОВИННАЯ доза арипипразола/брексипразола (CYP2D6)',
    zones: ['nac', 'dlPFC'],
  },

  // Модафинил + карипразин — CYP3A4
  {
    id: 'modafinil_cariprazine',
    drugs: ['modafinil'],
    conflictsWith: ['cariprazine'],
    severity: 'warning',
    title: 'CYP3A4 индукция',
    description: 'Модафинил CYP3A4 индуктор → снижает уровень карипразина',
    zones: ['nac', 'vta'],
  },

  // Флувоксамин + ламотриджин/дулоксетин — CYP1A2/2C19
  {
    id: 'fluvoxamine_cyp',
    drugs: ['fluvoxamine'],
    conflictsWith: ['lamotrigine', 'duloxetine'],
    severity: 'warning',
    title: 'CYP1A2/2C19 ингибирование',
    description: 'Флувоксамин повышает уровень ламотриджина/дулоксетина',
    zones: ['dlPFC', 'hippo'],
  },

  // SAMe + SSRI
  {
    id: 'same_ssri',
    drugs: ['same'],
    conflictsWith: ['sertraline', 'fluoxetine', 'fluvoxamine', 'escitalopram', 'venlafaxine', 'duloxetine'],
    severity: 'warning',
    title: 'SAMe + серотонинергик',
    description: 'SAMe+SSRI: редкий риск серотонинового синдрома',
    zones: ['brainstem', 'raphe'],
  },

  // Флуоксетин — длинный Т½
  {
    id: 'fluoxetine_long',
    drugs: ['fluoxetine'],
    conflictsWith: [],  // Special: warn if fluoxetine + 2+ other drugs
    severity: 'warning',
    title: 'Длинный Т½ флуоксетина',
    description: 'Флуоксетин: Т½ очень длинный, мощный CYP2D6 ингибитор. Взаимодействия сохраняются неделями.',
    zones: ['dlPFC', 'vta'],
  },
];

/**
 * Detect active conflicts given a set of active drugs.
 */
export function detectConflicts(activeDrugs: Record<string, number>): ConflictRule[] {
  const activeIds = Object.keys(activeDrugs);
  if (activeIds.length < 2 && !activeIds.includes('fluoxetine')) return [];

  const triggered: ConflictRule[] = [];

  for (const rule of CONFLICT_RULES) {
    // Special case: fluoxetine warns if it's active with 2+ other drugs
    if (rule.id === 'fluoxetine_long') {
      if (activeDrugs.fluoxetine !== undefined && activeIds.length > 2) {
        triggered.push(rule);
      }
      continue;
    }

    const hasDrug = rule.drugs.some((d) => activeDrugs[d] !== undefined);
    const hasConflict = rule.conflictsWith.some((d) => activeDrugs[d] !== undefined);

    if (hasDrug && hasConflict) {
      triggered.push(rule);
    }
  }

  return triggered;
}

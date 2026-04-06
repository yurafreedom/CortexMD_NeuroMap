// Preset drug combinations
export interface Preset {
  l: string;                        // label
  d: { [drugId: string]: number };  // drug id -> dose
}

export interface Presets {
  [presetId: string]: Preset;
}

export const PRESETS: Presets = {
  golden: { l: 'Золотая ($2k)', d: { sertraline: 100, bupropion: 225, atomoxetine: 10, vortioxetine: 10 } },
  current: { l: 'Текущая (6шт)', d: { sertraline: 100, bupropion: 225, atomoxetine: 10, vortioxetine: 10, pramipexole: 0.125, duloxetine: 30 } },
  clean: { l: 'Чистая CYP', d: { vortioxetine: 10, atomoxetine: 10, cariprazine: 1.5, dhea: 50 } },
  optimal: { l: 'Оптимальная', d: { vortioxetine: 15, atomoxetine: 10, bupropion: 225, cariprazine: 1.5, dhea: 50 } },
  esci: { l: 'σ1-агонист', d: { escitalopram: 10, vortioxetine: 10, atomoxetine: 10, cariprazine: 1.5, dhea: 50 } },
  sigma1max: { l: 'σ1 макс', d: { fluvoxamine: 100, donepezil: 5, dhea: 50, atomoxetine: 10, cariprazine: 1.5 } },
  auvelity_combo: { l: 'Auvelity+', d: { auvelity: 1, atomoxetine: 10, cariprazine: 1.5, dhea: 50 } },
  tca_combo: { l: 'ТЦА+SSRI', d: { sertraline: 100, nortriptyline: 25, vortioxetine: 10, cariprazine: 1.5 } },
};

// Drug categories
export interface DrugCategory {
  l: string;     // label
  d?: string[];  // drug ids (absent for "all")
}

export interface DrugCategories {
  [categoryId: string]: DrugCategory;
}

export const DCAT: DrugCategories = {
  all: { l: 'Все' },
  ssri: { l: 'SSRI', d: ['sertraline', 'escitalopram', 'fluoxetine', 'fluvoxamine'] },
  snri: { l: 'SNRI', d: ['duloxetine', 'venlafaxine', 'desvenlafaxine', 'milnacipran', 'levomilnacipran'] },
  nri: { l: 'NRI/NDRI', d: ['atomoxetine', 'reboxetine', 'bupropion'] },
  tca: { l: 'ТЦА', d: ['desipramine', 'nortriptyline', 'protriptyline', 'amitriptyline', 'opipramol'] },
  drpa: { l: 'D2/D3', d: ['cariprazine', 'aripiprazole', 'brexpiprazole', 'pramipexole', 'amisulpride_low'] },
  stim: { l: 'Стимул.', d: ['methylphenidate', 'lisdexamfetamine', 'modafinil', 'selegiline_oral', 'levodopa'] },
  other: { l: 'Другие Rx', d: ['quetiapine', 'lamotrigine', 'guanfacine', 'ketamine', 'dextromethorphan', 'auvelity', 'ifenprodil', 'progesterone'] },
  sigma: { l: 'σ1', d: ['donepezil', 'opipramol', 'fluvoxamine', 'escitalopram', 'fluoxetine', 'dhea', 'pregnenolone', 'ifenprodil', 'dextromethorphan', 'auvelity'] },
  suppl: { l: 'Добавки', d: ['dhea', 'nac_supp', 'pregnenolone', 'same', 'omega3', 'rhodiola', 'curcumin', 'b_vitamins', 'l_tyrosine', 'lions_mane', 'magnesium_threonate', 'pea_um', 'mucuna', 'vitamin_d'] },
};

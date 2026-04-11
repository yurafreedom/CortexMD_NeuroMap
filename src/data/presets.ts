// Preset interface (used by user_presets from Supabase)
export interface Preset {
  id: string;
  name: string;
  drugs: { [drugId: string]: number };
  created_at: string;
}

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
  tca: { l: 'ТЦА', d: ['desipramine', 'nortriptyline', 'protriptyline', 'amitriptyline', 'opipramol', 'clomipramine', 'imipramine', 'doxepin', 'trimipramine', 'maprotiline'] },
  maoi: { l: 'ИМАО', d: ['phenelzine', 'tranylcypromine', 'isocarboxazid', 'moclobemide', 'selegiline_oral'] },
  atypical_ad: { l: 'Атип. АД', d: ['mirtazapine', 'trazodone', 'nefazodone', 'agomelatine', 'vilazodone', 'tianeptine', 'mianserin', 'vortioxetine'] },
  drpa: { l: 'D2/D3', d: ['cariprazine', 'aripiprazole', 'brexpiprazole', 'pramipexole', 'amisulpride_low'] },
  atyp_ap: { l: 'Атип. АП', d: ['quetiapine', 'olanzapine', 'risperidone', 'paliperidone', 'ziprasidone', 'lurasidone', 'clozapine', 'iloperidone', 'asenapine', 'cariprazine', 'aripiprazole', 'brexpiprazole'] },
  typ_ap: { l: 'Тип. АП', d: ['haloperidol', 'chlorpromazine', 'fluphenazine', 'perphenazine', 'thioridazine', 'loxapine', 'pimozide', 'zuclopenthixol', 'flupentixol'] },
  mood: { l: 'Стабилиз.', d: ['lithium', 'valproate', 'carbamazepine', 'oxcarbazepine', 'lamotrigine', 'topiramate'] },
  benzo: { l: 'Бензо', d: ['diazepam', 'lorazepam', 'clonazepam', 'alprazolam', 'midazolam', 'chlordiazepoxide', 'oxazepam', 'temazepam', 'triazolam', 'clobazam', 'nitrazepam'] },
  zdrug: { l: 'Z/Габа', d: ['zolpidem', 'zopiclone', 'eszopiclone', 'zaleplon', 'pregabalin', 'gabapentin', 'mirogabalin'] },
  stim: { l: 'Стимул.', d: ['methylphenidate', 'lisdexamfetamine', 'modafinil', 'selegiline_oral', 'levodopa'] },
  other: { l: 'Другие Rx', d: ['lamotrigine', 'guanfacine', 'ketamine', 'dextromethorphan', 'auvelity', 'ifenprodil', 'progesterone', 'memantine', 'buspirone', 'riluzole', 'hydroxyzine', 'suvorexant', 'propranolol', 'clonidine', 'prazosin', 'pridopidine'] },
  sigma: { l: 'σ1', d: ['donepezil', 'opipramol', 'fluvoxamine', 'escitalopram', 'fluoxetine', 'dhea', 'pregnenolone', 'ifenprodil', 'dextromethorphan', 'auvelity'] },
  suppl: { l: 'Добавки', d: ['dhea', 'nac_supp', 'pregnenolone', 'same', 'omega3', 'rhodiola', 'curcumin', 'b_vitamins', 'l_tyrosine', 'lions_mane', 'magnesium_threonate', 'pea_um', 'mucuna', 'vitamin_d'] },
};

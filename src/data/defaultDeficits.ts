export type DeficitStatus = 'critical' | 'working' | 'resolved';

export interface DeficitDefinition {
  zone: string;
  nt: string;
  mech: string;
  src: string;
}

export interface DeficitNeed {
  target: string;
  coveredBy: string[];
  blockedBy: string[];
  desc: string;
}

export interface Deficit {
  id: string;
  title: string;
  st: string;           // short title / subtitle
  icon: string;
  status: DeficitStatus;
  desc: string;
  zones: string[];
  defs: DeficitDefinition[];
  needs: DeficitNeed[];
}

export const DEFICITS: Deficit[] = [
  {
    id: 'working_memory',
    title: 'Не удерживаю контекст',
    st: 'Рабочая память',
    icon: '\u{1F9E9}',
    status: 'critical',
    desc: 'Читаю абзац — к концу страницы первый стёрся. Не могу удержать несколько параметров задачи одновременно.',
    zones: ['dlPFC', 'hippo', 'acc'],
    defs: [
      { zone: 'dlPFC', nt: 'NA', mech: 'α2A-рецепторы на дендритных шипиках: NA через α2A закрывает HCN-каналы → шипик удерживает информацию. Без NA — информация входит, но не удерживается.', src: 'Arnsten 2009, 2011' },
      { zone: 'dlPFC', nt: 'DA', mech: 'DA через D1 фильтрует сигнал от шума. Серотониновый потолок (5-HT2C→↓DA в VTA на 30-42%) снижает DA в ПФК.', src: 'Vijayraghavan 2007' },
      { zone: 'hippo', nt: 's1', mech: 'LTP через NMDA нужен для консолидации. Сертралин как σ1 инверсный агонист ПОДАВЛЯЕТ LTP.', src: 'Ishima 2014, Izumi 2023' },
    ],
    needs: [
      { target: 'NET в ПФК', coveredBy: ['atomoxetine'], blockedBy: [], desc: 'NET-блокада → ↑NA+DA в ПФК (нет DAT в ПФК, NET убирает оба)' },
      { target: 'σ1 агонизм', coveredBy: ['fluvoxamine', 'dhea', 'donepezil'], blockedBy: ['sertraline'], desc: 'σ1 агонист → BiP→IP3R3→Ca²⁺→CaMKII→CREB→BDNF→LTP' },
      { target: 'DA в ПФК', coveredBy: ['atomoxetine', 'vortioxetine', 'bupropion'], blockedBy: [], desc: 'Три независимых источника DA в ПФК' },
    ],
  },
  {
    id: 'priority_sense',
    title: 'Не чувствую что важно',
    st: 'Приоритизация',
    icon: '\u{1F3AF}',
    status: 'critical',
    desc: 'Все варианты одинаково серые. Каждый день переобдумываю из пустоты. Нет эмоциональной метки «это важно».',
    zones: ['vmPFC', 'insula', 'ofc'],
    defs: [
      { zone: 'vmPFC', nt: 'DA', mech: 'вмПФК присваивает эмоциональную метку каждому варианту. Без DA — нет критерия выбора.', src: 'Damasio somatic marker' },
      { zone: 'insula', nt: 'NA', mech: 'Инсула поставляет вмПФК данные от тела. При диссоциации — вмПФК не получает сырьё для маркировки.', src: 'Craig 2009' },
      { zone: 'ofc', nt: 'DA', mech: 'OFC считает выгоду/стоимость. Серотониновый потолок давит DA-сигнал в OFC.', src: '' },
    ],
    needs: [
      { target: 'DA в вмПФК/OFC', coveredBy: ['cariprazine', 'vortioxetine'], blockedBy: ['sertraline'], desc: 'Снятие серотонинового потолка + D3 дезингибирование VTA' },
      { target: 'NA в инсуле', coveredBy: ['atomoxetine', 'duloxetine'], blockedBy: [], desc: 'NET в инсуле → интероцепция' },
      { target: 'Инсула→вмПФК контур', coveredBy: [], blockedBy: [], desc: 'EMDR с соматическим фокусом (не фарма)' },
    ],
  },
  {
    id: 'time_perception',
    title: 'Время плоское',
    st: 'Восприятие времени',
    icon: '⏳',
    status: 'working',
    desc: 'Дни сливаются. Нет ощущения «вчера было давно» или «дедлайн через три дня = скоро». Время сжатое.',
    zones: ['insula', 'acc', 'hippo'],
    defs: [
      { zone: 'insula', nt: '5-HT', mech: 'Инсула генерирует «моменты осознания» из которых складывается субъективное время.', src: 'Craig 2009' },
      { zone: 'acc', nt: 'DA', mech: 'ACC помечает события как значимые. Без DA — не чувствуешь что событие важное.', src: '' },
    ],
    needs: [
      { target: 'SERT в инсуле', coveredBy: ['sertraline', 'duloxetine', 'escitalopram'], blockedBy: [], desc: 'Мощная SERT-блокада в инсуле → «густое» время' },
      { target: 'DA в ACC', coveredBy: ['vortioxetine', 'atomoxetine'], blockedBy: ['sertraline'], desc: 'Вортиоксетин 5-HT7→когнитивная гибкость в ACC' },
    ],
  },
  {
    id: 'boundaries',
    title: 'Не чувствую границы',
    st: 'Границы/агрессия',
    icon: '🛡️',
    status: 'critical',
    desc: 'Freeze блокирует контур злость→действие. Либо молчу (недобор), либо взрываю (перебор). Нет среднего.',
    zones: ['vmPFC', 'amygdala', 'ofc', 'insula'],
    defs: [
      { zone: 'amygdala', nt: 'NA', mech: 'Миндалина генерирует «вторжение→злость», но freeze перехватывает: злость→freeze→подавление.', src: '' },
      { zone: 'ofc', nt: 'DA', mech: 'OFC калибрует «сколько агрессии уместно». Без DA = плохая калибровка.', src: '' },
      { zone: 'insula', nt: 'NA', mech: 'Не чувствуешь нарастание злости до момента взрыва (интероцепция отключена).', src: '' },
    ],
    needs: [
      { target: 'Разморозка freeze', coveredBy: [], blockedBy: [], desc: 'EMDR + TFP: миндалина должна научиться что злость ≠ смерть. Не фарма.' },
      { target: 'D3 в NAc shell', coveredBy: ['cariprazine', 'pramipexole'], blockedBy: [], desc: 'D3→«хочу»→энергия на действие вместо freeze' },
      { target: 'α2A снижение гиперароузала', coveredBy: ['guanfacine'], blockedBy: [], desc: 'Миндалина не прыгает в freeze при каждом конфликте' },
    ],
  },
  {
    id: 'emotional_range',
    title: 'Эмоции сжаты',
    st: 'Амплитуда эмоций',
    icon: '\u{1F4AB}',
    status: 'critical',
    desc: 'Снизу: не замечаю слабые эмоции (алекситимия). Сверху: сильные запускают freeze. Диапазон узкий.',
    zones: ['nac', 'vta', 'insula', 'amygdala'],
    defs: [
      { zone: 'nac', nt: 'DA', mech: 'DA в NAc shell = «это интересно». Серотониновый потолок давит shell через 5-HT2C. D3-рецепторы не покрыты.', src: '' },
      { zone: 'vta', nt: 'DA', mech: 'VTA заторможена 5-HT2C от сертралина. DA-выброс ↓30-42%.', src: '' },
      { zone: 'insula', nt: 'NA', mech: 'Инсула отключена → не замечаешь эмоции в теле.', src: '' },
    ],
    needs: [
      { target: 'D3 в NAc shell', coveredBy: ['cariprazine', 'pramipexole'], blockedBy: [], desc: 'D3 обходит серотониновый потолок → shell оживает' },
      { target: 'Снятие 5-HT2C потолка', coveredBy: [], blockedBy: ['sertraline', 'escitalopram', 'fluoxetine'], desc: 'Убрать/заменить SSRI → VTA разблокируется' },
      { target: 'Расширение окна толерантности', coveredBy: [], blockedBy: [], desc: 'EMDR: разморозка freeze → можно выдерживать сильные эмоции. Не фарма.' },
    ],
  },
  {
    id: 'psychomotor',
    title: 'Тело медленное',
    st: 'Моторика',
    icon: '\u{1F422}',
    status: 'working',
    desc: 'Психомоторная ретардация. Иду физически медленно. Хочу ускориться — тело не выполняет.',
    zones: ['brainstem', 'cerebellum'],
    defs: [
      { zone: 'brainstem', nt: '5-HT', mech: 'Серотонин в стволе → нисходящий моторный тонус через ядра шва → спинной мозг.', src: '' },
      { zone: 'brainstem', nt: 'NA', mech: 'NA тонус бодрствования. Бупро NET метаболит обеспечивает.', src: '' },
      { zone: 'cerebellum', nt: 'DA', mech: 'DA в стриатуме → скорость инициации движения.', src: '' },
    ],
    needs: [
      { target: '5-HT в стволе', coveredBy: ['sertraline', 'duloxetine', 'vortioxetine'], blockedBy: [], desc: 'SERT-блокада в стволе → моторный тонус' },
      { target: 'NA тонус', coveredBy: ['bupropion', 'atomoxetine'], blockedBy: [], desc: 'NET → бодрость' },
      { target: 'DA в стриатуме', coveredBy: ['bupropion', 'methylphenidate'], blockedBy: [], desc: 'DAT-блокада для моторной инициации' },
    ],
  },
];

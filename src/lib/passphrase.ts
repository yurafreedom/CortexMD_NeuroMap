const WORDS = [
  'atlas', 'brain', 'coral', 'delta', 'ember', 'frost', 'grove', 'haven',
  'ivory', 'jasper', 'karma', 'lunar', 'maple', 'nexus', 'orbit', 'prism',
  'quartz', 'ridge', 'solar', 'tidal', 'ultra', 'vivid', 'wisp', 'xenon',
  'yield', 'zenith', 'amber', 'blaze', 'cedar', 'drift', 'epoch', 'flare',
  'glyph', 'haze', 'inlet', 'jade', 'kite', 'latch', 'mesa', 'noble',
  'opal', 'peak', 'quest', 'raven', 'spark', 'torch', 'umbra', 'vault',
  'aegis', 'bloom', 'crest', 'dune', 'elixir', 'forge', 'glint', 'helix',
  'icon', 'jewel', 'knoll', 'lyric', 'myth', 'neon', 'onyx', 'plume',
  'reign', 'sage', 'terra', 'unity', 'veil', 'wave', 'zeal', 'aura',
  'bolt', 'cipher', 'dusk', 'echo', 'fable', 'grain', 'hymn', 'isle',
  'joust', 'kelp', 'loom', 'mist', 'null', 'omen', 'pyre', 'quill',
  'rift', 'shard', 'tide', 'urge', 'vine', 'wren', 'yoke', 'zinc',
  'arch', 'brine', 'cloak', 'dawn', 'edge', 'flux', 'grit', 'husk',
  'iron', 'jinx', 'knot', 'lance', 'mote', 'nave', 'oath', 'pulse',
  'realm', 'stone', 'thorn', 'umber', 'vigor', 'warp', 'yarn', 'zone',
  'apex', 'birch', 'chalk', 'dew', 'ether', 'fern', 'gale', 'helm',
  'ink', 'jolt', 'keen', 'lore', 'moss', 'node', 'ore', 'pact',
  'rune', 'silk', 'turf', 'vale', 'weld', 'apex', 'bask', 'cove',
];

export function generatePassphrase(wordCount: number = 4): string {
  const indices = new Uint32Array(wordCount);
  crypto.getRandomValues(indices);
  return Array.from(indices)
    .map((i) => WORDS[i % WORDS.length])
    .join('-');
}

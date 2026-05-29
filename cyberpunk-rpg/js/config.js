/* global CONFIG */
const CONFIG = {

  COLORS: {
    neonGold:    0xffd700,
    neonCyan:    0x00ffff,
    neonMagenta: 0xff00cc,
    neonPurple:  0x9966ff,
    neonGreen:   0x00ff88,
    corpRed:     0xff3333,
    darkVoid:    0x0a0a1a,
    darkPanel:   0x0d1028,
    white:       0xffffff,
  },

  SAVE_KEY: 'ubuntu_protocol_save',

  // ─── Scene ───────────────────────────────────────────────
  WORLD_TILES:     20,
  TILE_SIZE:        2,
  PLAYER_MOVE_SPEED: 5,   // lerp factor per second
  CAMERA_LERP:      4,

  BATTLE_TURN_DELAY_MS:  700,
  BATTLE_ANIM_MS:        500,
  BASE_FLEE_CHANCE:      0.45,

  // ─── Party base stats ─────────────────────────────────────
  PARTY: {
    kwame: {
      id: 'kwame', name: 'Kwame-X',
      role: 'Griot-Hacker',
      maxHp: 120, maxMp: 80,
      atk: 28, def: 18, spd: 22,
      color: 0xffd700,
      skills: ['dataSpear', 'ancestorsCall', 'griotsWail'],
    },
    adaeze: {
      id: 'adaeze', name: 'Adaeze',
      role: 'Tech-Striker',
      maxHp: 100, maxMp: 70,
      atk: 38, def: 14, spd: 28,
      color: 0x00ffcc,
      skills: ['nanoBlade', 'systemBreach', 'firewall'],
    },
    babakweku: {
      id: 'babakweku', name: 'Baba Kweku',
      role: 'Spirit Sage',
      maxHp: 90, maxMp: 110,
      atk: 22, def: 20, spd: 16,
      color: 0xcc66ff,
      skills: ['spiritStrike', 'ubuntuPulse', 'ancestralFury'],
    },
  },

  // ─── Skills ───────────────────────────────────────────────
  SKILLS: {
    dataSpear: {
      id: 'dataSpear', name: 'Data Spear', mpCost: 12,
      type: 'damage', target: 'single_enemy', power: 1.8,
      effect: null,
      desc: 'Pierce digital armor with ancestral data.',
      effectColor: 0xffd700,
    },
    ancestorsCall: {
      id: 'ancestorsCall', name: "Ancestor's Call", mpCost: 22,
      type: 'buff', target: 'all_party', power: 0,
      effect: { id: 'atkUp', stat: 'atk', mult: 1.3, duration: 3 },
      desc: 'Summon ancestral spirits to empower the party.',
      effectColor: 0x9966ff,
    },
    griotsWail: {
      id: 'griotsWail', name: "Griot's Wail", mpCost: 28,
      type: 'damage', target: 'all_enemies', power: 1.2,
      effect: { id: 'stun', duration: 1 },
      desc: 'A resonant cry that stuns all enemies.',
      effectColor: 0x00ffff,
    },
    nanoBlade: {
      id: 'nanoBlade', name: 'Nano Blade', mpCost: 18,
      type: 'damage', target: 'single_enemy', power: 2.4,
      effect: null,
      desc: 'Supercharged nanotech blade strike.',
      effectColor: 0x00ffcc,
    },
    systemBreach: {
      id: 'systemBreach', name: 'System Breach', mpCost: 14,
      type: 'debuff', target: 'single_enemy', power: 0,
      effect: { id: 'defDown', stat: 'def', mult: 0.6, duration: 3 },
      desc: 'Exploit a weakness, reducing enemy defense.',
      effectColor: 0xff6600,
    },
    firewall: {
      id: 'firewall', name: 'Firewall', mpCost: 20,
      type: 'buff', target: 'all_party', power: 0,
      effect: { id: 'shield', dmgReduction: 0.5, duration: 2 },
      desc: 'Erect a digital shield absorbing incoming damage.',
      effectColor: 0x0066ff,
    },
    spiritStrike: {
      id: 'spiritStrike', name: 'Spirit Strike', mpCost: 10,
      type: 'damage_heal', target: 'single_enemy', power: 1.4,
      effect: { id: 'selfHeal', amount: 15 },
      desc: 'Channel ancestor energy to strike and heal self.',
      effectColor: 0xcc66ff,
    },
    ubuntuPulse: {
      id: 'ubuntuPulse', name: 'Ubuntu Pulse', mpCost: 30,
      type: 'heal', target: 'all_party', power: 0,
      effect: { id: 'healAll', amount: 40 },
      desc: '"I am because we are." Restore all party HP.',
      effectColor: 0x00ff88,
    },
    ancestralFury: {
      id: 'ancestralFury', name: 'Ancestral Fury', mpCost: 35,
      type: 'damage', target: 'all_enemies', power: 1.6,
      effect: { id: 'armorPierce' },
      desc: 'Unleash ancestor spirits — bypasses all armor.',
      effectColor: 0xffa500,
    },
  },

  // ─── Status Effects ───────────────────────────────────────
  STATUS: {
    stun:    { id: 'stun',    label: 'STUN',    color: 0xffff00 },
    atkUp:   { id: 'atkUp',   label: 'ATK↑',   color: 0xff6600 },
    defDown: { id: 'defDown', label: 'DEF↓',   color: 0xff3333 },
    shield:  { id: 'shield',  label: 'SHIELD',  color: 0x0066ff },
    dodge:   { id: 'dodge',   label: 'DODGE',   color: 0x00ffcc },
  },

  // ─── Enemies ──────────────────────────────────────────────
  ENEMIES: {
    omniDrone: {
      id: 'omniDrone', name: 'Omni-Drone',
      maxHp: 55, atk: 18, def: 8, spd: 35,
      color: 0xff3333, accentColor: 0xff6600,
      xp: 30,
      ai: 'debuffer',
    },
    corpEnforcer: {
      id: 'corpEnforcer', name: 'Corp Enforcer',
      maxHp: 140, atk: 32, def: 22, spd: 14,
      color: 0x666688, accentColor: 0xaaaacc,
      xp: 60,
      ai: 'tank',
    },
    corruptedSpirit: {
      id: 'corruptedSpirit', name: 'Corrupted Spirit',
      maxHp: 80, atk: 26, def: 10, spd: 20,
      color: 0x660066, accentColor: 0xff00cc,
      xp: 50,
      ai: 'mage',
    },
    dataWraith: {
      id: 'dataWraith', name: 'Data Wraith',
      maxHp: 65, atk: 24, def: 12, spd: 30,
      color: 0x003333, accentColor: 0x00ffff,
      xp: 45,
      ai: 'evasive',
    },
    nullAlgorithm: {
      id: 'nullAlgorithm', name: 'The Null Algorithm',
      maxHp: 350, atk: 45, def: 30, spd: 18,
      color: 0x111111, accentColor: 0xff0000,
      xp: 0,
      ai: 'boss',
      phase2Threshold: 0.5,
    },
  },

  // ─── Enemy groups per encounter ───────────────────────────
  ENCOUNTERS: {
    patrol_drones:    [{ id: 'omniDrone', count: 3 }],
    slum_patrol:      [{ id: 'omniDrone', count: 2 }, { id: 'corpEnforcer', count: 1 }],
    corp_security:    [{ id: 'corruptedSpirit', count: 2 }],
    data_fortress:    [{ id: 'dataWraith', count: 2 }, { id: 'omniDrone', count: 2 }],
    final_guard:      [{ id: 'dataWraith', count: 2 }, { id: 'corruptedSpirit', count: 1 }],
    boss_null:        [{ id: 'nullAlgorithm', count: 1 }],
    optional_patrol:  [{ id: 'corpEnforcer', count: 1 }, { id: 'corruptedSpirit', count: 1 }],
  },

  // ─── Chapters ─────────────────────────────────────────────
  CHAPTERS: ['prologue', 'chapter1', 'chapter2', 'chapter3', 'chapter4', 'chapter4_bad'],
};

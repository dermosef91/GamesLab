// ============================================================
// AFROFUTURISM SURVIVORS — CONFIG
// All tunable game constants in one place
// ============================================================

const CONFIG = {
  // Canvas / Display
  TARGET_FPS: 60,
  WORLD_WIDTH: 3000,
  WORLD_HEIGHT: 3000,
  CANVAS_BG: '#0d0515',

  // Player
  PLAYER_BASE_SPEED: 180,
  PLAYER_BASE_HP: 100,
  PLAYER_INVINCIBLE_MS: 800,
  PLAYER_SIZE: 18,
  XP_MAGNET_BASE_RADIUS: 60,

  // XP / Leveling
  XP_PER_LEVEL_BASE: 20,
  XP_SCALING: 1.35,

  // Run
  RUN_DURATION_MS: 20 * 60 * 1000, // 20 min
  BOSS_TIMES_MS: [5, 10, 15, 20].map(m => m * 60 * 1000),

  // Enemy Scaling (per wave tick at 30s intervals)
  WAVE_HP_MULT: 1.10,
  WAVE_SPEED_MULT: 1.025,
  WAVE_COUNT_ADD: 1,       // additional enemy spawn per group after each tick
  BASE_ENEMY_COUNT: 3,

  // Essence
  ESSENCE_ON_DEATH: 0.5,  // fraction kept after dying

  // Particles
  PARTICLE_POOL_SIZE: 600,
  XP_GEM_RADIUS: 6,
  XP_GEM_MAGNET_SPEED: 260,

  // Colors (Afrofuturism palette)
  COLORS: {
    gold: '#ffd700',
    neonGreen: '#39ff14',
    electricBlue: '#00ffff',
    deepPurple: '#1a0a2e',
    hotPink: '#ff00cc',
    amber: '#ffb347',
    crimson: '#dc143c',
    void: '#2d0050',
    starWhite: '#e8e0ff',
    sunOrange: '#ff6600',
    xpGem: '#00ffcc',
  },

  // Weapon base stats
  WEAPONS: {
    ancestralSpear: {
      id: 'ancestralSpear',
      name: 'Ancestral Spear',
      icon: '🏹',
      desc: 'Hurls energy spears that pierce enemies',
      baseDamage: 18,
      baseCooldown: 800,
      baseCount: 1,
      basePierce: 1,
      baseSpeed: 380,
      color: '#ffd700',
    },
    thunderDrum: {
      id: 'thunderDrum',
      name: 'Thunder Drum',
      icon: '🥁',
      desc: 'Releases radial shockwaves from the player',
      baseDamage: 12,
      baseCooldown: 2000,
      baseRadius: 110,
      baseStunMs: 400,
      color: '#ff6600',
    },
    kente: {
      id: 'kente',
      name: 'Quantum Kente',
      icon: '🕸️',
      desc: 'Weaves sticky energy zones that slow and damage',
      baseDamage: 8,
      baseCooldown: 3000,
      baseZones: 1,
      baseDuration: 4000,
      baseSlowFactor: 0.4,
      color: '#00ffcc',
    },
    solarOrbs: {
      id: 'solarOrbs',
      name: 'Solar Orbs',
      icon: '☀️',
      desc: 'Orbiting spheres that burn on contact',
      baseDamage: 10,
      baseCount: 2,
      baseOrbitRadius: 80,
      baseOrbitSpeed: 1.8, // rad/s
      baseBurnDps: 4,
      baseBurnDuration: 2000,
      color: '#ff6600',
    },
    voidBlades: {
      id: 'voidBlades',
      name: 'Void Blades',
      icon: '⚔️',
      desc: 'Spinning blades encircle the player',
      baseDamage: 14,
      baseCount: 3,
      baseOrbitRadius: 55,
      baseOrbitSpeed: 2.5,
      color: '#a020f0',
    },
    nanoSwarm: {
      id: 'nanoSwarm',
      name: 'Nano Swarm',
      icon: '🦋',
      desc: 'Auto-homing nanobots seek out enemies',
      baseDamage: 9,
      baseCooldown: 1500,
      baseCount: 3,
      baseSpeed: 220,
      color: '#39ff14',
    },
    gravitonStaff: {
      id: 'gravitonStaff',
      name: 'Graviton Staff',
      icon: '🌀',
      desc: 'Pulls enemies inward then detonates',
      baseDamage: 35,
      baseCooldown: 4500,
      baseRadius: 130,
      basePullForce: 180,
      basePullDuration: 1200,
      color: '#00ffff',
    },
    ancestorVoice: {
      id: 'ancestorVoice',
      name: "Ancestor's Voice",
      icon: '✨',
      desc: 'Protective aura heals and emits damage pulses',
      baseDamage: 8,
      baseCooldown: 2500,
      baseRadius: 95,
      baseHeal: 3,
      color: '#ffd700',
    },
  },

  // Characters
  CHARACTERS: {
    anansi: {
      id: 'anansi',
      name: 'Anansi the Weaver',
      title: 'Master of the Web',
      icon: '🕷️',
      color: '#00ffcc',
      passiveDesc: 'Web traps slow enemies by 50%',
      startWeapon: 'kente',
      passive: { slowBonus: 0.5 },
    },
    nzinga: {
      id: 'nzinga',
      name: 'Queen Nzinga',
      title: 'Warrior of the Stars',
      icon: '👸',
      color: '#ffd700',
      passiveDesc: '+20% Armor, spears knock back enemies',
      startWeapon: 'ancestralSpear',
      passive: { armorBonus: 0.20, knockback: 80 },
    },
    kwame: {
      id: 'kwame',
      name: 'Kwame the Griot',
      title: 'Voice of the Ancestors',
      icon: '🎵',
      color: '#ff6600',
      passiveDesc: '+25% XP gain, damage aura always active',
      startWeapon: 'thunderDrum',
      passive: { xpBonus: 0.25, damageAura: true, damageAuraRadius: 60, damageAuraDps: 5 },
    },
  },
};

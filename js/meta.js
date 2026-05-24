// ============================================================
// META — Essence currency & Ancestral Boons persistent tree
// ============================================================

const BOONS = [
  { id: 'hp',       name: 'Ancestral Vitality', icon: '💖', desc: 'Start each run with +20 HP',          maxTier: 5, cost: [40, 80, 140, 220, 320], effect: { bonusHp: 20 } },
  { id: 'xp',       name: 'Griot\'s Wisdom',    icon: '📚', desc: 'Gain +5% XP each run',                maxTier: 5, cost: [35, 70, 120, 200, 300], effect: { bonusXp: 0.05 } },
  { id: 'speed',    name: 'Ancestor\'s Stride',  icon: '👟', desc: 'Start with +6% movement speed',       maxTier: 4, cost: [50, 110, 200, 340],      effect: { bonusSpeed: 0.06 } },
  { id: 'armor',    name: 'Iron Spirit',          icon: '🛡️', desc: 'Start with 5% damage reduction',      maxTier: 3, cost: [80, 160, 280],           effect: { bonusArmor: 0.05 } },
  { id: 'magnet',   name: 'Star Collector',       icon: '⭐', desc: 'XP magnet radius +25% permanently',   maxTier: 3, cost: [60, 130, 230],           effect: { bonusMagnet: 0.25 } },
  { id: 'nzinga',   name: 'Unlock Queen Nzinga',  icon: '👸', desc: 'Unlock warrior hero Queen Nzinga',    maxTier: 1, cost: [100],                    effect: { unlockChar: 'nzinga' } },
  { id: 'kwame',    name: 'Unlock Kwame the Griot',icon: '🎵', desc: 'Unlock the sonic warrior Kwame',     maxTier: 1, cost: [150],                    effect: { unlockChar: 'kwame' } },
];

class MetaProgression {
  constructor() {
    this._load();
  }

  _load() {
    try {
      const saved = JSON.parse(localStorage.getItem('afrofuturism_meta') || '{}');
      this.totalEssence = saved.totalEssence || 0;
      this.spentEssence = saved.spentEssence || 0;
      this.boonLevels = saved.boonLevels || {};
      this.unlockedChars = new Set(saved.unlockedChars || ['anansi']);
      this.bestTime = saved.bestTime || 0;
      this.runsCompleted = saved.runsCompleted || 0;
      this.totalKills = saved.totalKills || 0;
    } catch (e) {
      this.totalEssence = 0;
      this.spentEssence = 0;
      this.boonLevels = {};
      this.unlockedChars = new Set(['anansi']);
      this.bestTime = 0;
      this.runsCompleted = 0;
      this.totalKills = 0;
    }
  }

  save() {
    const data = {
      totalEssence: this.totalEssence,
      spentEssence: this.spentEssence,
      boonLevels: this.boonLevels,
      unlockedChars: [...this.unlockedChars],
      bestTime: this.bestTime,
      runsCompleted: this.runsCompleted,
      totalKills: this.totalKills,
    };
    try { localStorage.setItem('afrofuturism_meta', JSON.stringify(data)); } catch (e) {}
  }

  get availableEssence() {
    return this.totalEssence - this.spentEssence;
  }

  addEssence(amount) {
    this.totalEssence += amount;
    this.save();
  }

  recordRunEnd(essenceEarned, survived, kills, runTimeMs) {
    this.totalKills += kills;
    this.runsCompleted++;
    if (survived) {
      this.addEssence(essenceEarned);
      if (runTimeMs > this.bestTime) this.bestTime = runTimeMs;
    } else {
      // On death: keep only half
      this.addEssence(Math.floor(essenceEarned * CONFIG.ESSENCE_ON_DEATH));
    }
    this.save();
  }

  canPurchase(boonId) {
    const boon = BOONS.find(b => b.id === boonId);
    if (!boon) return false;
    const tier = this.boonLevels[boonId] || 0;
    if (tier >= boon.maxTier) return false;
    return this.availableEssence >= boon.cost[tier];
  }

  purchase(boonId) {
    if (!this.canPurchase(boonId)) return false;
    const boon = BOONS.find(b => b.id === boonId);
    const tier = this.boonLevels[boonId] || 0;
    this.spentEssence += boon.cost[tier];
    this.boonLevels[boonId] = tier + 1;
    if (boon.effect.unlockChar) this.unlockedChars.add(boon.effect.unlockChar);
    this.save();
    return true;
  }

  // Build meta stats object to apply to the player at run start
  buildMetaStats() {
    const stats = { bonusHp: 0, bonusXp: 0, bonusSpeed: 0, bonusArmor: 0, bonusMagnet: 0 };
    for (const boon of BOONS) {
      const tier = this.boonLevels[boon.id] || 0;
      if (tier === 0) continue;
      for (let t = 0; t < tier; t++) {
        if (boon.effect.bonusHp)     stats.bonusHp     += boon.effect.bonusHp;
        if (boon.effect.bonusXp)     stats.bonusXp     += boon.effect.bonusXp;
        if (boon.effect.bonusSpeed)  stats.bonusSpeed  += boon.effect.bonusSpeed;
        if (boon.effect.bonusArmor)  stats.bonusArmor  += boon.effect.bonusArmor;
        if (boon.effect.bonusMagnet) stats.bonusMagnet += boon.effect.bonusMagnet;
      }
    }
    return stats;
  }

  isCharUnlocked(charId) {
    return this.unlockedChars.has(charId);
  }
}

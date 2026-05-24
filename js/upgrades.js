// ============================================================
// UPGRADES — catalog, level-up option builder
// ============================================================

const PASSIVE_UPGRADES = {
  vitality: {
    id: 'vitality',
    name: 'Vitality',
    icon: '❤️',
    desc: 'Max HP +15% and heal for the bonus',
    color: '#ff4444',
    maxLevel: 6,
  },
  swiftness: {
    id: 'swiftness',
    name: 'Swiftness',
    icon: '💨',
    desc: 'Movement speed +8%',
    color: '#00ffff',
    maxLevel: 5,
  },
  magnet: {
    id: 'magnet',
    name: 'Essence Magnet',
    icon: '🧲',
    desc: 'XP pickup radius +30%',
    color: '#00ffcc',
    maxLevel: 4,
  },
  armor: {
    id: 'armor',
    name: 'Ancestral Armor',
    icon: '🛡️',
    desc: 'Reduce incoming damage by 8%',
    color: '#888888',
    maxLevel: 5,
  },
  cooldown: {
    id: 'cooldown',
    name: 'Cooldown Reduction',
    icon: '⚡',
    desc: 'All weapon cooldowns -10%',
    color: '#ffff00',
    maxLevel: 5,
  },
  area: {
    id: 'area',
    name: 'Area Expansion',
    icon: '🌐',
    desc: 'All AoE weapon radii +15%',
    color: '#aa00ff',
    maxLevel: 4,
  },
};

const WEAPON_UPGRADE_DESC = {
  ancestralSpear: ['Spear damage +25%', 'Launch one more spear', '+1 pierce through enemy', 'Damage +30%, speed +15%', 'Spears +1, pierce +1'],
  thunderDrum:    ['Shockwave radius +20%', 'Drum damage +30%', 'Stun duration +50%', 'Radius +25%, damage +20%', 'Cooldown -25%, damage +40%'],
  kente:          ['Web damage +30%', 'Place one more web zone', 'Web duration +40%', 'Slow factor improved, damage +20%', 'Zones +1, damage +35%'],
  solarOrbs:      ['+1 orbiting orb', 'Burn DPS ×1.5', 'Orbit radius +20%', 'Orbs +1, damage +25%', 'Orbit speed +30%, burn ×1.5'],
  voidBlades:     ['Blade damage +25%', '+1 void blade', 'Orbit radius +25%', 'Orbit speed +20%, damage +20%', '+2 void blades'],
  nanoSwarm:      ['+1 nanobot per release', 'Nanobot damage +35%', 'Nanobot speed +20%', '+2 nanobots per release', 'Damage +40%, speed +25%'],
  gravitonStaff:  ['Pull radius +20%', 'Explosion damage +30%', 'Pull force +40%', 'Radius +15%, damage +25%', 'Cooldown -25%, damage +40%'],
  ancestorVoice:  ['Heal amount ×1.5', 'Pulse damage +30%', 'Aura radius +25%', 'Heal ×1.5, damage +25%', 'Cooldown -30%'],
};

class UpgradeSystem {
  constructor() {}

  // Build a list of 3 upgrade options for the player to choose from
  buildChoices(player, count = 3) {
    const pool = [];

    // ── Weapon upgrades ──────────────────────────────────
    for (const w of player.weapons) {
      if (w.upgradeLevel < 5) {
        const descArr = WEAPON_UPGRADE_DESC[w.id] || [];
        const descText = descArr[w.upgradeLevel] || 'Upgrade weapon';
        pool.push({
          type: 'weapon',
          weaponId: w.id,
          weapon: w,
          name: `${w.def.name} Lv.${w.upgradeLevel + 2}`,
          icon: w.def.icon,
          desc: descText,
          color: w.def.color,
        });
      }
    }

    // ── New weapon (if slot free) ─────────────────────────
    const allWeaponIds = Object.keys(CONFIG.WEAPONS);
    const ownedIds = new Set(player.weapons.map(w => w.id));
    const maxWeapons = player.charDef.passive ? (player.passiveUpgrades.extraSlot ? 5 : 4) : 4;
    if (player.weapons.length < maxWeapons) {
      for (const wid of allWeaponIds) {
        if (!ownedIds.has(wid)) {
          const def = CONFIG.WEAPONS[wid];
          pool.push({
            type: 'newWeapon',
            weaponId: wid,
            name: `New: ${def.name}`,
            icon: def.icon,
            desc: def.desc,
            color: def.color,
          });
        }
      }
    }

    // ── Passive upgrades ──────────────────────────────────
    for (const [id, def] of Object.entries(PASSIVE_UPGRADES)) {
      const currentLevel = player.passiveUpgrades[id] || 0;
      if (currentLevel < def.maxLevel) {
        pool.push({
          type: 'passive',
          passiveId: id,
          name: `${def.name} Lv.${currentLevel + 1}`,
          icon: def.icon,
          desc: def.desc,
          color: def.color,
        });
      }
    }

    // Shuffle and pick
    return Utils.pickN(pool, count);
  }

  // Apply the chosen upgrade to the player
  applyChoice(choice, player) {
    switch (choice.type) {
      case 'weapon':
        choice.weapon.upgrade();
        break;
      case 'newWeapon':
        const w = WeaponFactory.create(choice.weaponId);
        w.applyCooldownMult(player.cooldownMult);
        player.weapons.push(w);
        break;
      case 'passive':
        player.applyPassive(choice.passiveId);
        break;
    }
  }
}

# ✦ Ancestors: Awakening ✦
### An Afrofuturism Roguelite Survivors Game

A mobile-first browser game inspired by Vampire Survivors, set in an Afrofuturist universe of ancestral spirits, cosmic warriors, and corrupted digital entities.

---

## 🎮 How to Play

**Open `index.html`** in any modern browser — no server required, no dependencies to install.

### Controls
| Platform | Move | Pause |
|----------|------|-------|
| **Mobile** | Virtual joystick (left thumb area) | ⏸ button (top-right) |
| **Desktop** | WASD / Arrow keys | P or Escape |

All weapons **auto-fire** — just survive!

---

## 🌍 Heroes

| Hero | Passive Ability | Starting Weapon |
|------|----------------|-----------------|
| 🕷️ **Anansi the Weaver** | Web traps slow enemies by 50% | Quantum Kente Web |
| 👸 **Queen Nzinga** | +20% Armor, spears knock back | Ancestral Spear |
| 🎵 **Kwame the Griot** | +25% XP gain, damage aura | Thunder Drum |

> Nzinga and Kwame must be unlocked via Ancestral Boons.

---

## ⚔️ Weapons (8 total)

| Weapon | Type | Description |
|--------|------|-------------|
| 🏹 Ancestral Spear | Projectile | Piercing energy spears |
| 🥁 Thunder Drum | AoE | Radial shockwave that stuns |
| 🕸️ Quantum Kente | Zone | Sticky web zones slow & damage |
| ☀️ Solar Orbs | Orbital | Orbiting suns that burn enemies |
| ⚔️ Void Blades | Orbital | Spinning blades around player |
| 🦋 Nano Swarm | Homing | Auto-targeting nanobots |
| 🌀 Graviton Staff | AoE | Pull → massive explosion |
| ✨ Ancestor's Voice | AoE + Heal | Heals player, damages enemies |

Each weapon has **5 upgrade tiers** selectable on level-up.

---

## 🎯 Roguelite Progression

### During a Run
- Kill enemies → collect **XP gems** (teal) → level up
- On level-up: choose 1 of 3 random upgrades
- Survive **20 minutes** to win

### Meta-Progression (Ancestral Boons)
- Kill enemies → collect **Essence orbs** (purple) → persistent currency
- Spend Essence between runs on **permanent boons**: bonus HP, XP, speed, armor, new heroes
- Death: keep 50% of Essence earned that run

### Enemy Waves
- Wave strength increases every 30 seconds
- Bosses appear at: 5, 10, 15, 20 minute marks
  - **The Null King** — fires 8-way laser spreads
  - **Entropy Drake** — triple-shot spread attacks

---

## 🎨 Technical Details

- Pure **HTML5 Canvas + Vanilla JavaScript** — zero dependencies
- ~2,600 lines of game code across 10 files
- Designed for **mobile-first** at 375px+ viewport
- Persistent progress via **localStorage**
- Canvas uses `devicePixelRatio` scaling for crisp rendering on Retina/OLED displays

---

## 🗂️ File Structure

```
index.html          Entry point
css/style.css       Mobile-first layout + loading screen
js/
  config.js         All tunable constants
  utils.js          Math helpers, collision, object pool
  particles.js      XP gems, explosions, trails, text pops
  enemies.js        5 enemy types + 2 bosses + spawner
  weapons.js        8 weapons with full upgrade trees
  upgrades.js       Level-up catalog + passive upgrades
  meta.js           Essence currency + Boons tree
  player.js         Player entity, stats, touch input
  ui.js             HUD, menus, level-up cards
  main.js           Game loop, state machine, input
```

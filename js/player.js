// ============================================================
// PLAYER — entity, stats, movement, virtual joystick, touch
// ============================================================

class Player {
  constructor(characterId, metaStats = {}) {
    const charDef = CONFIG.CHARACTERS[characterId];
    this.characterId = characterId;
    this.charDef = charDef;

    // Position (world center start)
    this.x = CONFIG.WORLD_WIDTH / 2;
    this.y = CONFIG.WORLD_HEIGHT / 2;

    // Stats (meta bonuses applied)
    this.baseMaxHp = CONFIG.PLAYER_BASE_HP + (metaStats.bonusHp || 0);
    this.maxHp = this.baseMaxHp;
    this.hp = this.maxHp;
    this.speed = CONFIG.PLAYER_BASE_SPEED * (1 + (metaStats.bonusSpeed || 0));
    this.xpMult = 1 + (metaStats.bonusXp || 0) + (charDef.passive.xpBonus || 0);
    this.armor = charDef.passive.armorBonus || 0;
    this.magnetRadius = CONFIG.XP_MAGNET_BASE_RADIUS;
    this.cooldownMult = 1;
    this.areaMultiplier = 1;

    // Facing direction (for non-omnidirectional weapons)
    this.facingX = 1;
    this.facingY = 0;

    // Movement input
    this.dx = 0;
    this.dy = 0;

    // Sprite animation state
    this.spriteDir   = 'front';   // 'front'|'side'|'sideLeft'|'back'
    this.walkFrame   = 'idle';    // 'idle'|'walk1'|'walk2'
    this.walkTimer   = 0;

    // Invincibility after hit
    this.invincibleTimer = 0;
    this.invincibleFlash = 0;

    // XP / leveling
    this.xp = 0;
    this.level = 1;
    this.xpToNext = CONFIG.XP_PER_LEVEL_BASE;

    // Essence collected this run
    this.essenceCollected = 0;

    // Screen shake
    this.shakeX = 0;
    this.shakeY = 0;

    // Active weapons (list of weapon instances)
    this.weapons = [];

    // Passive stat upgrade counts
    this.passiveUpgrades = {
      vitality: 0,
      swiftness: 0,
      magnet: 0,
      armor: 0,
      cooldown: 0,
      area: 0,
    };

    // Damage aura (Kwame)
    this.damageAuraTimer = 0;
    this.damageAuraDps = charDef.passive.damageAuraDps || 0;
    this.damageAuraRadius = charDef.passive.damageAuraRadius || 0;
    this.damageAuraActive = !!charDef.passive.damageAura;
  }

  // ── Touch / Keyboard Input ─────────────────────────────
  setInput(dx, dy) {
    this.dx = dx;
    this.dy = dy;
    if (dx !== 0 || dy !== 0) {
      this.facingX = dx;
      this.facingY = dy;
    }
  }

  // ── Per-frame update ──────────────────────────────────
  update(dt, enemies, particles, game) {
    // Movement
    const len = Math.sqrt(this.dx * this.dx + this.dy * this.dy) || 1;
    const ndx = this.dx === 0 && this.dy === 0 ? 0 : this.dx / len;
    const ndy = this.dx === 0 && this.dy === 0 ? 0 : this.dy / len;

    const spd = this.speed;
    this.x = Utils.clamp(this.x + ndx * spd * dt, 0, CONFIG.WORLD_WIDTH);
    this.y = Utils.clamp(this.y + ndy * spd * dt, 0, CONFIG.WORLD_HEIGHT);

    // ── Sprite animation ──────────────────────────────────
    const moving = Math.abs(this.dx) + Math.abs(this.dy) > 0.05;
    if (moving) {
      this.walkTimer += dt;
      this.walkFrame = (this.walkTimer % 0.6) < 0.3 ? 'walk1' : 'walk2';
      // Choose view direction from facing vector
      if (Math.abs(this.facingX) > Math.abs(this.facingY) * 1.2) {
        this.spriteDir = this.facingX > 0 ? 'side' : 'sideLeft';
      } else {
        this.spriteDir = this.facingY >= 0 ? 'front' : 'back';
      }
    } else {
      this.walkFrame = 'idle';
      this.walkTimer = 0;
    }

    // Invincibility timer
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt * 1000;
    this.invincibleFlash = (this.invincibleFlash + dt * 20) % (Math.PI * 2);

    // Screen shake decay
    this.shakeX *= 0.85;
    this.shakeY *= 0.85;
    if (Math.abs(this.shakeX) < 0.1) this.shakeX = 0;
    if (Math.abs(this.shakeY) < 0.1) this.shakeY = 0;

    // XP magnets
    particles.magnetGems(this.x, this.y, this.magnetRadius, CONFIG.XP_GEM_MAGNET_SPEED);

    // Collect gems
    const collected = particles.collectGems(this.x, this.y, 20);
    for (const c of collected) {
      if (c.isEssence) {
        this.essenceCollected += c.value;
      } else {
        this.gainXP(c.value * this.xpMult, particles, game);
      }
    }

    // Damage aura (Kwame passive)
    if (this.damageAuraActive) {
      for (const e of enemies) {
        if (!e.active) continue;
        const d = Utils.dist(this.x, this.y, e.x, e.y);
        if (d < this.damageAuraRadius) {
          e.takeDamage(this.damageAuraDps * dt, this, particles);
        }
      }
    }

    // Update weapons
    for (const w of this.weapons) {
      w.update(dt, this, enemies, particles, game);
    }
  }

  // ── Take damage ───────────────────────────────────────
  takeDamage(amount, particles) {
    if (this.invincibleTimer > 0) return;
    const mitigated = amount * (1 - this.armor);
    this.hp = Math.max(0, this.hp - mitigated);
    this.invincibleTimer = CONFIG.PLAYER_INVINCIBLE_MS;
    this.shakeX += Utils.rand(-8, 8);
    this.shakeY += Utils.rand(-8, 8);
    particles.spark(this.x, this.y - 10, '#ff0000', 6);
    particles.popText(this.x, this.y - 30, `-${Math.ceil(mitigated)}`, '#ff4444', 16);
  }

  // ── Heal ─────────────────────────────────────────────
  heal(amount, particles) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    particles.heal(this.x, this.y);
  }

  // ── Gain XP ──────────────────────────────────────────
  gainXP(amount, particles, game) {
    this.xp += amount;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.levelUp(game);
    }
  }

  levelUp(game) {
    this.level++;
    this.xpToNext = Math.floor(CONFIG.XP_PER_LEVEL_BASE * Math.pow(CONFIG.XP_SCALING, this.level - 1));
    if (game) game.triggerLevelUp();
  }

  // ── Apply passive upgrade ─────────────────────────────
  applyPassive(upgradeId) {
    this.passiveUpgrades[upgradeId] = (this.passiveUpgrades[upgradeId] || 0) + 1;
    switch (upgradeId) {
      case 'vitality':
        const hpBonus = this.maxHp * 0.15;
        this.maxHp += hpBonus;
        this.hp = Math.min(this.hp + hpBonus, this.maxHp);
        break;
      case 'swiftness':
        this.speed *= 1.08;
        break;
      case 'magnet':
        this.magnetRadius *= 1.30;
        break;
      case 'armor':
        this.armor = Math.min(0.75, this.armor + 0.08);
        break;
      case 'cooldown':
        this.cooldownMult *= 0.90;
        // Recalculate weapon cooldowns
        for (const w of this.weapons) w.applyCooldownMult(this.cooldownMult);
        break;
      case 'area':
        this.areaMultiplier *= 1.15;
        break;
    }
  }

  // ── Draw ──────────────────────────────────────────────
  draw(ctx) {
    const { x, y } = this;

    // Invincibility flash
    if (this.invincibleTimer > 0 && Math.sin(this.invincibleFlash) < 0) return;

    // Damage aura glow (Kwame)
    if (this.damageAuraActive) {
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.shadowBlur = 20;
      ctx.shadowColor = CONFIG.COLORS.amber;
      ctx.fillStyle = CONFIG.COLORS.amber;
      ctx.beginPath();
      ctx.arc(x, y, this.damageAuraRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const color = this.charDef.color;
    const r = CONFIG.PLAYER_SIZE;

    // Outer glow
    ctx.save();
    ctx.shadowBlur = 22;
    ctx.shadowColor = color;

    // Body — hexagonal shape for Afrofuturism feel
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
      const fx = x + Math.cos(a) * r;
      const fy = y + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(fx, fy) : ctx.lineTo(fx, fy);
    }
    ctx.closePath();
    ctx.fillStyle = CONFIG.COLORS.deepPurple;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // Hero sprite (with animation direction and walk frame)
    ctx.save();
    Sprites.drawHero(ctx, this.characterId, x, y, r * 0.75, color, this.spriteDir, this.walkFrame);
    ctx.restore();

    // Facing direction indicator
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    const norm = Utils.normalize(this.facingX, this.facingY);
    ctx.moveTo(x + norm.x * r, y + norm.y * r);
    ctx.lineTo(x + norm.x * (r + 10), y + norm.y * (r + 10));
    ctx.stroke();
    ctx.restore();
  }
}

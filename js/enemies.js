// ============================================================
// ENEMIES — types, spawner, AI, bosses
// ============================================================

// ── Enemy Definitions ─────────────────────────────────────
const ENEMY_DEFS = {
  voidCrawler: {
    id: 'voidCrawler',
    name: 'Void Crawler',
    icon: '👾',
    baseHp: 25,
    baseSpeed: 75,
    baseDamage: 8,
    size: 14,
    color: '#7700cc',
    xpDrop: 1,
    essenceDrop: 0,
    ai: 'chase',
    draw(ctx, e) { drawEnemyHex(ctx, e, e.color, e.icon); },
  },
  dataWraith: {
    id: 'dataWraith',
    name: 'Data Wraith',
    icon: '👻',
    baseHp: 20,
    baseSpeed: 55,
    baseDamage: 5,
    size: 12,
    color: '#00bbff',
    xpDrop: 2,
    essenceDrop: 0,
    ai: 'ranged',
    shootCooldown: 2200,
    projectileDamage: 7,
    projectileSpeed: 160,
    draw(ctx, e) { drawEnemyHex(ctx, e, e.color, e.icon); },
  },
  chronoGolem: {
    id: 'chronoGolem',
    name: 'Chrono Golem',
    icon: '🗿',
    baseHp: 140,
    baseSpeed: 32,
    baseDamage: 18,
    size: 22,
    color: '#888888',
    xpDrop: 4,
    essenceDrop: 2,
    ai: 'chase',
    draw(ctx, e) { drawEnemyHex(ctx, e, e.color, e.icon); },
  },
  soulHarvester: {
    id: 'soulHarvester',
    name: 'Soul Harvester',
    icon: '💀',
    baseHp: 35,
    baseSpeed: 68,
    baseDamage: 4,
    size: 13,
    color: '#ff3366',
    xpDrop: 2,
    essenceDrop: 1,
    ai: 'gemStealer',
    draw(ctx, e) { drawEnemyHex(ctx, e, e.color, e.icon); },
  },
  corruptedDjinn: {
    id: 'corruptedDjinn',
    name: 'Corrupted Djinn',
    icon: '🧞',
    baseHp: 45,
    baseSpeed: 130,
    baseDamage: 12,
    size: 15,
    color: '#ff9900',
    xpDrop: 3,
    essenceDrop: 1,
    ai: 'teleporter',
    teleportCooldown: 3500,
    draw(ctx, e) { drawEnemyHex(ctx, e, e.color, e.icon); },
  },
  // BOSSES
  nullKing: {
    id: 'nullKing',
    name: 'The Null King',
    icon: '👑',
    baseHp: 1800,
    baseSpeed: 45,
    baseDamage: 22,
    size: 38,
    color: '#aa00ff',
    xpDrop: 30,
    essenceDrop: 15,
    ai: 'boss_nullKing',
    isBoss: true,
    draw(ctx, e) { drawBoss(ctx, e, e.color, e.icon); },
  },
  entropyDrake: {
    id: 'entropyDrake',
    name: 'Entropy Drake',
    icon: '🐉',
    baseHp: 3500,
    baseSpeed: 60,
    baseDamage: 30,
    size: 44,
    color: '#cc2200',
    xpDrop: 50,
    essenceDrop: 25,
    ai: 'boss_drake',
    isBoss: true,
    draw(ctx, e) { drawBoss(ctx, e, e.color, e.icon); },
  },
};

function drawEnemyHex(ctx, e, color, icon) {
  const { x, y, size } = e;
  const r = size;
  ctx.save();
  ctx.shadowBlur = 14;
  ctx.shadowColor = color;

  // HP flash
  if (e.hitFlash > 0) {
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 22;
  }

  // Hex body
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const fx = x + Math.cos(a) * r;
    const fy = y + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(fx, fy) : ctx.lineTo(fx, fy);
  }
  ctx.closePath();
  ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : '#100020';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Sprite (with animation direction and walk frame)
  Sprites.drawEnemy(ctx, e.id, x, y, r * 0.62, color, e.spriteDir || 'front', e.walkFrame || 'idle');

  // HP bar
  if (e.hp < e.maxHp) {
    const barW = r * 2.5;
    ctx.fillStyle = '#330000';
    ctx.fillRect(x - barW / 2, y - r - 8, barW, 4);
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(x - barW / 2, y - r - 8, barW * (e.hp / e.maxHp), 4);
  }

  ctx.restore();
}

function drawBoss(ctx, e, color, icon) {
  const { x, y, size } = e;
  ctx.save();
  ctx.shadowBlur = 30;
  ctx.shadowColor = color;

  // Pulsing outer ring
  const pulse = Math.sin(e.pulseTimer || 0) * 0.15 + 0.9;
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size * 1.6 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Octagon body
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const fx = x + Math.cos(a) * size;
    const fy = y + Math.sin(a) * size;
    i === 0 ? ctx.moveTo(fx, fy) : ctx.lineTo(fx, fy);
  }
  ctx.closePath();
  ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : '#150025';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Sprite (with animation direction and walk frame)
  Sprites.drawEnemy(ctx, e.id, x, y, size * 0.58, color, e.spriteDir || 'front', e.walkFrame || 'idle');

  // Boss HP bar (full width at bottom)
  ctx.restore();
}


// ── Enemy Entity ──────────────────────────────────────────
class Enemy {
  constructor(def, x, y, waveMultHp = 1, waveMultSpeed = 1) {
    this.defId = def.id;
    this.def = def;
    this.x = x;
    this.y = y;
    this.maxHp = def.baseHp * waveMultHp;
    this.hp = this.maxHp;
    this.speed = def.baseSpeed * waveMultSpeed;
    this.damage = def.baseDamage;
    this.size = def.size;
    this.color = def.color;
    this.icon = def.icon;
    this.xpDrop = def.xpDrop;
    this.essenceDrop = def.essenceDrop;
    this.isBoss = !!def.isBoss;
    this.active = true;
    this.ai = def.ai;
    this.hitFlash = 0;
    this.stunTimer = 0;
    this.slowTimer = 0;
    this.slowFactor = 1;
    this.burnDamage = 0;
    this.burnTimer = 0;
    this.pulseTimer = 0;

    // AI-specific state
    this.shootTimer = def.shootCooldown || 0;
    this.teleportTimer = 0;
    this.bossPhase = 0;
    this.bossActionTimer = 0;
    this.bossLaserTimer = 0;

    // Sprite animation state
    this.spriteDir  = 'front';  // 'front'|'side'|'sideLeft'|'back'
    this.walkFrame  = 'idle';   // 'idle'|'walk1'|'walk2'
    this.walkTimer  = 0;
    this._prevX     = x;
    this._prevY     = y;
  }

  takeDamage(amount, player, particles) {
    this.hp -= amount;
    this.hitFlash = 0.12;
    if (particles && amount > 0) {
      particles.spark(this.x, this.y, this.color, 4);
      if (amount >= 10) particles.popText(this.x, this.y - this.size - 5, `-${Math.ceil(amount)}`, this.color, 14);
    }
    // Knockback (Nzinga passive)
    if (player && player.charDef.passive.knockback) {
      const angle = Utils.angle(player.x, player.y, this.x, this.y);
      this.x += Math.cos(angle) * player.charDef.passive.knockback;
      this.y += Math.sin(angle) * player.charDef.passive.knockback;
    }
    return this.hp <= 0;
  }

  applyBurn(dps, duration) {
    this.burnDamage = Math.max(this.burnDamage, dps);
    this.burnTimer = Math.max(this.burnTimer, duration);
  }

  applySlow(factor, duration) {
    if (factor < this.slowFactor) this.slowFactor = factor;
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  applyStun(duration) {
    this.stunTimer = Math.max(this.stunTimer, duration);
  }

  update(dt, player, particles, projectiles) {
    if (!this.active) return;

    this.pulseTimer += dt * 3;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    // Status effects
    if (this.stunTimer > 0) {
      this.stunTimer -= dt * 1000;
      return; // Stunned: skip movement/attacks
    }

    if (this.slowTimer > 0) {
      this.slowTimer -= dt * 1000;
      if (this.slowTimer <= 0) this.slowFactor = 1;
    }

    if (this.burnTimer > 0) {
      this.burnTimer -= dt * 1000;
      this.takeDamage(this.burnDamage * dt, null, particles);
      if (this.burnTimer <= 0) this.burnDamage = 0;
    }

    const effectiveSpeed = this.speed * this.slowFactor;

    this._prevX = this.x;
    this._prevY = this.y;

    switch (this.ai) {
      case 'chase':     this._aiChase(dt, player, effectiveSpeed); break;
      case 'ranged':    this._aiRanged(dt, player, effectiveSpeed, projectiles, particles); break;
      case 'teleporter':this._aiTeleporter(dt, player, effectiveSpeed); break;
      case 'gemStealer':this._aiGemStealer(dt, player, particles, effectiveSpeed); break;
      case 'boss_nullKing': this._aiBossNullKing(dt, player, projectiles, particles, effectiveSpeed); break;
      case 'boss_drake': this._aiBossDrake(dt, player, projectiles, particles, effectiveSpeed); break;
    }

    // ── Sprite animation ──────────────────────────────────
    const mvx = this.x - this._prevX;
    const mvy = this.y - this._prevY;
    const moved = Math.abs(mvx) + Math.abs(mvy) > 0.005;
    if (moved) {
      this.walkTimer += dt;
      this.walkFrame = (this.walkTimer % 0.5) < 0.25 ? 'walk1' : 'walk2';
      if (Math.abs(mvx) > Math.abs(mvy) * 1.2) {
        this.spriteDir = mvx > 0 ? 'side' : 'sideLeft';
      } else {
        this.spriteDir = mvy >= 0 ? 'front' : 'back';
      }
    } else {
      this.walkFrame = 'idle';
      this.walkTimer = 0;
    }

    // Touch damage
    const d2 = Utils.dist2(this.x, this.y, player.x, player.y);
    if (d2 < (this.size + CONFIG.PLAYER_SIZE) * (this.size + CONFIG.PLAYER_SIZE)) {
      player.takeDamage(this.damage * dt * 2, particles);
    }
  }

  _aiChase(dt, player, speed) {
    const norm = Utils.normalize(player.x - this.x, player.y - this.y);
    this.x += norm.x * speed * dt;
    this.y += norm.y * speed * dt;
  }

  _aiRanged(dt, player, speed, projectiles, particles) {
    const d = Utils.dist(this.x, this.y, player.x, player.y);
    const idealDist = 220;
    if (d < idealDist - 20) {
      // Back away
      const norm = Utils.normalize(this.x - player.x, this.y - player.y);
      this.x += norm.x * speed * dt;
      this.y += norm.y * speed * dt;
    } else if (d > idealDist + 20) {
      this._aiChase(dt, player, speed);
    }
    // Shoot
    this.shootTimer -= dt * 1000;
    if (this.shootTimer <= 0) {
      this.shootTimer = this.def.shootCooldown;
      const norm = Utils.normalize(player.x - this.x, player.y - this.y);
      if (projectiles) {
        projectiles.push({
          x: this.x, y: this.y,
          vx: norm.x * this.def.projectileSpeed,
          vy: norm.y * this.def.projectileSpeed,
          damage: this.def.projectileDamage,
          life: 3000,
          color: this.color,
          size: 6,
          isEnemy: true,
          active: true,
        });
      }
      if (particles) particles.spark(this.x, this.y, this.color, 3);
    }
  }

  _aiTeleporter(dt, player, speed) {
    this._aiChase(dt, player, speed);
    this.teleportTimer += dt * 1000;
    if (this.teleportTimer >= this.def.teleportCooldown) {
      this.teleportTimer = 0;
      // Teleport near player
      const angle = Math.random() * Math.PI * 2;
      const dist = Utils.rand(50, 100);
      this.x = player.x + Math.cos(angle) * dist;
      this.y = player.y + Math.sin(angle) * dist;
    }
  }

  _aiGemStealer(dt, player, particles, speed) {
    // Try to target nearest XP gem
    this._aiChase(dt, player, speed);
    if (particles) {
      for (const g of particles.xpGems) {
        if (!g.active || g.collected) continue;
        const d = Utils.dist(this.x, this.y, g.x, g.y);
        if (d < this.size + g.size) {
          g.active = false; // steal!
          g.collected = true;
          particles.spark(g.x, g.y, '#ff3366', 5);
          break;
        }
      }
    }
  }

  _aiBossNullKing(dt, player, projectiles, particles, speed) {
    this._aiChase(dt, player, speed);
    this.bossActionTimer -= dt * 1000;
    if (this.bossActionTimer <= 0) {
      this.bossActionTimer = 2500;
      // Laser sweep: fire 8 projectiles in a circle
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        projectiles.push({
          x: this.x, y: this.y,
          vx: Math.cos(a) * 200,
          vy: Math.sin(a) * 200,
          damage: 12, life: 2500, color: '#aa00ff', size: 8,
          isEnemy: true, active: true,
        });
      }
      if (particles) particles.burst(this.x, this.y, '#aa00ff', 12, 80, 600);
    }
  }

  _aiBossDrake(dt, player, projectiles, particles, speed) {
    this._aiChase(dt, player, speed * 1.4);
    this.bossActionTimer -= dt * 1000;
    if (this.bossActionTimer <= 0) {
      this.bossActionTimer = 3500;
      // Fire 3-shot spread at player
      const baseAngle = Utils.angle(this.x, this.y, player.x, player.y);
      for (let i = -1; i <= 1; i++) {
        const a = baseAngle + i * 0.35;
        projectiles.push({
          x: this.x, y: this.y,
          vx: Math.cos(a) * 220,
          vy: Math.sin(a) * 220,
          damage: 18, life: 3000, color: '#cc2200', size: 10,
          isEnemy: true, active: true,
        });
      }
      if (particles) particles.burst(this.x, this.y, '#cc2200', 10, 60, 500);
    }
  }

  draw(ctx) {
    this.def.draw(ctx, this);
  }
}


// ── Enemy Spawner ─────────────────────────────────────────
class EnemySpawner {
  constructor() {
    this.waveHpMult = 1;
    this.waveSpeedMult = 1;
    this.waveCount = CONFIG.BASE_ENEMY_COUNT;
    this.waveTimer = 0;
    this.waveTick = 0;
    this.spawnQueue = [];
    this.spawnInterval = 1200; // ms between individual spawns
    this.spawnTimer = 0;
    this.bossSpawned = new Set();
  }

  update(dt, runTimeMs, player, enemies, particles) {
    this.waveTimer += dt * 1000;
    this.spawnTimer += dt * 1000;

    // Wave scaling every 30 seconds
    if (this.waveTimer >= 30000) {
      this.waveTimer = 0;
      this.waveTick++;
      this.waveHpMult *= CONFIG.WAVE_HP_MULT;
      this.waveSpeedMult *= CONFIG.WAVE_SPEED_MULT;
      this.waveCount = Math.min(this.waveCount + CONFIG.WAVE_COUNT_ADD, 20);
      this._queueWave(player);
    }

    // Initial wave at t=0
    if (this.waveTick === 0 && this.spawnQueue.length === 0 && enemies.length === 0) {
      this._queueWave(player);
      this.waveTick = 1;
    }

    // Boss spawning
    for (const bossTimeMs of CONFIG.BOSS_TIMES_MS) {
      if (!this.bossSpawned.has(bossTimeMs) && runTimeMs >= bossTimeMs) {
        this.bossSpawned.add(bossTimeMs);
        const bossId = bossTimeMs <= 600000 ? 'nullKing' : 'entropyDrake';
        const pos = Utils.offscreenSpawn(player.x, player.y, 800, 600);
        enemies.push(new Enemy(ENEMY_DEFS[bossId], pos.x, pos.y, 1, 1));
        if (particles) particles.popText(player.x, player.y - 60, '!! BOSS INCOMING !!', '#ff0000', 22);
      }
    }

    // Spawn queued enemies
    if (this.spawnQueue.length > 0 && this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      const spawnData = this.spawnQueue.shift();
      const pos = Utils.offscreenSpawn(player.x, player.y, 800, 600);
      enemies.push(new Enemy(ENEMY_DEFS[spawnData.id], pos.x, pos.y, this.waveHpMult, this.waveSpeedMult));
    }

    // Always maintain minimum enemy count
    if (enemies.filter(e => e.active).length < 5 && this.spawnQueue.length === 0) {
      this._queueWave(player);
    }
  }

  _queueWave(player) {
    const elapsed = (this.waveTick || 0);
    // Pick enemy types based on wave
    const pool = [];
    pool.push('voidCrawler', 'voidCrawler', 'voidCrawler'); // always common
    if (elapsed >= 2) pool.push('dataWraith', 'dataWraith');
    if (elapsed >= 4) pool.push('chronoGolem');
    if (elapsed >= 5) pool.push('soulHarvester');
    if (elapsed >= 8) pool.push('corruptedDjinn', 'corruptedDjinn');

    for (let i = 0; i < this.waveCount; i++) {
      this.spawnQueue.push({ id: Utils.randFrom(pool) });
    }
  }
}

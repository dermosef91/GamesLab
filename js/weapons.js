// ============================================================
// WEAPONS — all 8 weapon types, projectiles, attack logic
// ============================================================

// ── Base Weapon class ─────────────────────────────────────
class Weapon {
  constructor(id) {
    this.id = id;
    this.def = CONFIG.WEAPONS[id];
    this.upgradeLevel = 0; // 0 = base, max 5
    // Copy base stats
    this.damage = this.def.baseDamage || 10;
    this.cooldown = this.def.baseCooldown || 2000;
    this.cooldownMult = 1;
    this.timer = 0;
    this.projectiles = []; // local projectile list (shared via game)
    this.webs = []; // for kente
    this.nanobots = []; // for nano swarm
    this.orbitAngle = 0; // for solar orbs / void blades
  }

  applyCooldownMult(mult) {
    this.cooldownMult = mult;
  }

  // Called each frame
  update(dt, player, enemies, particles, game) {
    this.timer += dt * 1000;
    const cd = this.cooldown * this.cooldownMult;
    if (this.timer >= cd) {
      this.timer = 0;
      this.fire(player, enemies, particles, game);
    }
    this.updateProjectiles(dt, player, enemies, particles, game);
    this.updateOrbitals(dt, player, enemies, particles, game);
  }

  fire(player, enemies, particles, game) {} // override in subclasses
  updateProjectiles(dt, player, enemies, particles, game) {}
  updateOrbitals(dt, player, enemies, particles, game) {}

  draw(ctx, player) {}

  upgrade() {
    this.upgradeLevel = Math.min(this.upgradeLevel + 1, 5);
    this._applyUpgrade();
  }

  _applyUpgrade() {} // override
}


// ── Ancestral Spear ───────────────────────────────────────
class WeaponAncestralSpear extends Weapon {
  constructor() {
    super('ancestralSpear');
    this.count = this.def.baseCount;
    this.pierce = this.def.basePierce;
    this.projSpeed = this.def.baseSpeed;
    this.projectiles = [];
  }

  fire(player, enemies, particles, game) {
    const spread = this.count > 1 ? 0.25 : 0;
    for (let i = 0; i < this.count; i++) {
      const baseAngle = Math.atan2(player.facingY, player.facingX);
      const angle = baseAngle + (i - (this.count - 1) / 2) * spread;
      this.projectiles.push({
        x: player.x, y: player.y,
        vx: Math.cos(angle) * this.projSpeed,
        vy: Math.sin(angle) * this.projSpeed,
        damage: this.damage,
        pierce: this.pierce,
        life: 2000,
        color: this.def.color,
        size: 7,
        active: true,
        hitEnemies: new Set(),
      });
    }
    particles.trail(player.x, player.y, this.def.color, 5);
  }

  updateProjectiles(dt, player, enemies, particles, game) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 1000;
      particles.trail(p.x, p.y, p.color, 3);

      for (const e of enemies) {
        if (!e.active || p.hitEnemies.has(e)) continue;
        if (Utils.circleOverlap(p.x, p.y, p.size, e.x, e.y, e.size)) {
          p.hitEnemies.add(e);
          const killed = e.takeDamage(p.damage, player, particles);
          if (killed) { e.active = false; game.onEnemyDeath(e, particles); }
          p.pierce--;
          if (p.pierce < 0) { p.active = false; break; }
        }
      }
      if (!p.active || p.life <= 0) this.projectiles.splice(i, 1);
    }
  }

  draw(ctx, player) {
    for (const p of this.projectiles) {
      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = p.color;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      const len = 20;
      const norm = Utils.normalize(p.vx, p.vy);
      ctx.beginPath();
      ctx.moveTo(p.x - norm.x * len / 2, p.y - norm.y * len / 2);
      ctx.lineTo(p.x + norm.x * len / 2, p.y + norm.y * len / 2);
      ctx.stroke();
      // Spear tip triangle
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x + norm.x * len / 2, p.y + norm.y * len / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _applyUpgrade() {
    switch (this.upgradeLevel) {
      case 1: this.damage *= 1.25; break;
      case 2: this.count++; break;
      case 3: this.pierce++; break;
      case 4: this.damage *= 1.30; this.projSpeed *= 1.15; break;
      case 5: this.count++; this.pierce++; break;
    }
  }
}


// ── Thunder Drum ──────────────────────────────────────────
class WeaponThunderDrum extends Weapon {
  constructor() {
    super('thunderDrum');
    this.radius = this.def.baseRadius;
    this.stunMs = this.def.baseStunMs;
    this.shockwaves = [];
  }

  fire(player, enemies, particles, game) {
    const r = this.radius * (player.areaMultiplier || 1);
    this.shockwaves.push({ x: player.x, y: player.y, radius: r, life: 350, maxLife: 350, damage: this.damage });
    particles.burst(player.x, player.y, this.def.color, 14, 100, 400, 3, 7);
    // Deal damage immediately
    for (const e of enemies) {
      if (!e.active) continue;
      if (Utils.dist(e.x, e.y, player.x, player.y) < r + e.size) {
        const killed = e.takeDamage(this.damage, player, particles);
        if (killed) { e.active = false; game.onEnemyDeath(e, particles); }
        e.applyStun(this.stunMs);
      }
    }
  }

  updateProjectiles(dt) {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      this.shockwaves[i].life -= dt * 1000;
      if (this.shockwaves[i].life <= 0) this.shockwaves.splice(i, 1);
    }
  }

  draw(ctx, player) {
    for (const sw of this.shockwaves) {
      const progress = 1 - sw.life / sw.maxLife;
      const alpha = (1 - progress) * 0.6;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = this.def.color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = this.def.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius * progress, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  _applyUpgrade() {
    switch (this.upgradeLevel) {
      case 1: this.radius *= 1.20; break;
      case 2: this.damage *= 1.30; break;
      case 3: this.stunMs *= 1.50; break;
      case 4: this.radius *= 1.25; this.damage *= 1.20; break;
      case 5: this.cooldown *= 0.75; this.damage *= 1.40; break;
    }
  }
}


// ── Quantum Kente Web ─────────────────────────────────────
class WeaponKente extends Weapon {
  constructor() {
    super('kente');
    this.maxZones = this.def.baseZones;
    this.duration = this.def.baseDuration;
    this.slowFactor = this.def.baseSlowFactor;
    this.webs = [];
  }

  fire(player, enemies, particles, game) {
    // Remove oldest if at max
    if (this.webs.length >= this.maxZones) this.webs.shift();
    const areaR = 60 * (player.areaMultiplier || 1);
    // Anansi passive: extra slow
    const slow = player.charDef.passive.slowBonus
      ? this.slowFactor * player.charDef.passive.slowBonus
      : this.slowFactor;
    this.webs.push({
      x: player.x, y: player.y,
      radius: areaR,
      life: this.duration, maxLife: this.duration,
      damage: this.damage,
      slowFactor: slow,
      pulse: 0,
    });
    particles.burst(player.x, player.y, this.def.color, 8, 50, 600, 2, 4);
  }

  updateProjectiles(dt, player, enemies, particles, game) {
    for (let i = this.webs.length - 1; i >= 0; i--) {
      const w = this.webs[i];
      w.life -= dt * 1000;
      w.pulse += dt * 3;
      // Damage & slow enemies in zone
      for (const e of enemies) {
        if (!e.active) continue;
        if (Utils.dist(w.x, w.y, e.x, e.y) < w.radius + e.size) {
          const killed = e.takeDamage(w.damage * dt, player, particles);
          if (killed) { e.active = false; game.onEnemyDeath(e, particles); }
          e.applySlow(w.slowFactor, 300);
        }
      }
      if (w.life <= 0) this.webs.splice(i, 1);
    }
  }

  draw(ctx, player) {
    for (const w of this.webs) {
      const alpha = (w.life / w.maxLife) * 0.55;
      const pulse = Math.sin(w.pulse) * 0.1 + 0.9;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = this.def.color;
      ctx.shadowBlur = 18;
      ctx.shadowColor = this.def.color;

      // Kente grid pattern
      const r = w.radius * pulse;
      ctx.lineWidth = 1.5;
      // Concentric hexagons
      for (let ring = 1; ring <= 3; ring++) {
        const rr = (r / 3) * ring;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const fx = w.x + Math.cos(a) * rr;
          const fy = w.y + Math.sin(a) * rr;
          i === 0 ? ctx.moveTo(fx, fy) : ctx.lineTo(fx, fy);
        }
        ctx.closePath();
        ctx.stroke();
      }
      // Radial lines
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(w.x, w.y);
        ctx.lineTo(w.x + Math.cos(a) * r, w.y + Math.sin(a) * r);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _applyUpgrade() {
    switch (this.upgradeLevel) {
      case 1: this.damage *= 1.30; break;
      case 2: this.maxZones++; break;
      case 3: this.duration *= 1.40; break;
      case 4: this.slowFactor *= 0.8; this.damage *= 1.20; break; // slow more
      case 5: this.maxZones++; this.damage *= 1.35; break;
    }
  }
}


// ── Solar Orbs ────────────────────────────────────────────
class WeaponSolarOrbs extends Weapon {
  constructor() {
    super('solarOrbs');
    this.count = this.def.baseCount;
    this.orbitRadius = this.def.baseOrbitRadius;
    this.orbitSpeed = this.def.baseOrbitSpeed;
    this.burnDps = this.def.baseBurnDps;
    this.burnDuration = this.def.baseBurnDuration;
    this.orbitAngle = 0;
    this.cooldown = 0; // always active, no cooldown needed
  }

  update(dt, player, enemies, particles, game) {
    this.orbitAngle += this.orbitSpeed * dt;
    const r = this.orbitRadius * (player.areaMultiplier || 1);
    for (let i = 0; i < this.count; i++) {
      const a = this.orbitAngle + (i / this.count) * Math.PI * 2;
      const ox = player.x + Math.cos(a) * r;
      const oy = player.y + Math.sin(a) * r;
      for (const e of enemies) {
        if (!e.active) continue;
        if (Utils.dist(ox, oy, e.x, e.y) < 14 + e.size) {
          const killed = e.takeDamage(this.damage * dt * 3, player, particles);
          if (killed) { e.active = false; game.onEnemyDeath(e, particles); }
          e.applyBurn(this.burnDps, this.burnDuration);
          particles.trail(ox, oy, this.def.color, 4);
        }
      }
    }
  }

  draw(ctx, player) {
    const r = this.orbitRadius * (player.areaMultiplier || 1);
    // Orbit trail ring
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = this.def.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < this.count; i++) {
      const a = this.orbitAngle + (i / this.count) * Math.PI * 2;
      const ox = player.x + Math.cos(a) * r;
      const oy = player.y + Math.sin(a) * r;
      Utils.glowCircle(ctx, ox, oy, 9, this.def.color, 18);
      // Inner bright core
      ctx.save();
      ctx.fillStyle = '#fff8e1';
      ctx.beginPath();
      ctx.arc(ox, oy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _applyUpgrade() {
    switch (this.upgradeLevel) {
      case 1: this.count++; break;
      case 2: this.burnDps *= 1.5; break;
      case 3: this.orbitRadius *= 1.20; break;
      case 4: this.count++; this.damage *= 1.25; break;
      case 5: this.orbitSpeed *= 1.30; this.burnDps *= 1.50; break;
    }
  }
}


// ── Void Blades ───────────────────────────────────────────
class WeaponVoidBlades extends Weapon {
  constructor() {
    super('voidBlades');
    this.count = this.def.baseCount;
    this.orbitRadius = this.def.baseOrbitRadius;
    this.orbitSpeed = this.def.baseOrbitSpeed;
    this.orbitAngle = 0;
    this.cooldown = 0;
  }

  update(dt, player, enemies, particles, game) {
    this.orbitAngle += this.orbitSpeed * dt;
    const r = this.orbitRadius * (player.areaMultiplier || 1);
    for (let i = 0; i < this.count; i++) {
      const a = this.orbitAngle + (i / this.count) * Math.PI * 2;
      const ox = player.x + Math.cos(a) * r;
      const oy = player.y + Math.sin(a) * r;
      for (const e of enemies) {
        if (!e.active) continue;
        if (Utils.dist(ox, oy, e.x, e.y) < 12 + e.size) {
          const killed = e.takeDamage(this.damage * dt * 4, player, particles);
          if (killed) { e.active = false; game.onEnemyDeath(e, particles); }
          particles.trail(ox, oy, this.def.color, 3);
        }
      }
    }
  }

  draw(ctx, player) {
    const r = this.orbitRadius * (player.areaMultiplier || 1);
    for (let i = 0; i < this.count; i++) {
      const a = this.orbitAngle + (i / this.count) * Math.PI * 2;
      const ox = player.x + Math.cos(a) * r;
      const oy = player.y + Math.sin(a) * r;
      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = this.def.color;
      ctx.translate(ox, oy);
      ctx.rotate(this.orbitAngle * 3);
      ctx.fillStyle = this.def.color;
      // Blade shape (rotated rect)
      ctx.fillRect(-10, -3, 20, 6);
      ctx.restore();
    }
  }

  _applyUpgrade() {
    switch (this.upgradeLevel) {
      case 1: this.damage *= 1.25; break;
      case 2: this.count++; break;
      case 3: this.orbitRadius *= 1.25; break;
      case 4: this.orbitSpeed *= 1.20; this.damage *= 1.20; break;
      case 5: this.count += 2; break;
    }
  }
}


// ── Nano Swarm ────────────────────────────────────────────
class WeaponNanoSwarm extends Weapon {
  constructor() {
    super('nanoSwarm');
    this.count = this.def.baseCount;
    this.nanoSpeed = this.def.baseSpeed;
    this.nanobots = [];
  }

  fire(player, enemies, particles, game) {
    for (let i = 0; i < this.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const offset = Utils.rand(10, 30);
      this.nanobots.push({
        x: player.x + Math.cos(angle) * offset,
        y: player.y + Math.sin(angle) * offset,
        vx: 0, vy: 0,
        target: null,
        damage: this.damage,
        life: 4000,
        active: true,
        trail: [],
      });
    }
  }

  updateProjectiles(dt, player, enemies, particles, game) {
    for (let i = this.nanobots.length - 1; i >= 0; i--) {
      const nb = this.nanobots[i];
      nb.life -= dt * 1000;
      if (nb.life <= 0) { this.nanobots.splice(i, 1); continue; }

      // Find nearest active enemy
      let nearest = null, nearestD2 = Infinity;
      for (const e of enemies) {
        if (!e.active) continue;
        const d2 = Utils.dist2(nb.x, nb.y, e.x, e.y);
        if (d2 < nearestD2) { nearestD2 = d2; nearest = e; }
      }

      if (nearest) {
        const norm = Utils.normalize(nearest.x - nb.x, nearest.y - nb.y);
        nb.vx = norm.x * this.nanoSpeed;
        nb.vy = norm.y * this.nanoSpeed;
        nb.x += nb.vx * dt;
        nb.y += nb.vy * dt;
        particles.trail(nb.x, nb.y, this.def.color, 2);

        if (Utils.dist(nb.x, nb.y, nearest.x, nearest.y) < 10 + nearest.size) {
          const killed = nearest.takeDamage(nb.damage, player, particles);
          if (killed) { nearest.active = false; game.onEnemyDeath(nearest, particles); }
          this.nanobots.splice(i, 1);
        }
      } else {
        // Float near player
        const angle = (i / this.count) * Math.PI * 2 + Date.now() * 0.001;
        nb.x = Utils.lerp(nb.x, player.x + Math.cos(angle) * 35, dt * 3);
        nb.y = Utils.lerp(nb.y, player.y + Math.sin(angle) * 35, dt * 3);
      }
    }
  }

  draw(ctx, player) {
    for (const nb of this.nanobots) {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.def.color;
      ctx.fillStyle = this.def.color;
      ctx.beginPath();
      ctx.arc(nb.x, nb.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _applyUpgrade() {
    switch (this.upgradeLevel) {
      case 1: this.count++; break;
      case 2: this.damage *= 1.35; break;
      case 3: this.nanoSpeed *= 1.20; break;
      case 4: this.count += 2; break;
      case 5: this.damage *= 1.40; this.nanoSpeed *= 1.25; break;
    }
  }
}


// ── Graviton Staff ────────────────────────────────────────
class WeaponGravitonStaff extends Weapon {
  constructor() {
    super('gravitonStaff');
    this.radius = this.def.baseRadius;
    this.pullForce = this.def.basePullForce;
    this.pullDuration = this.def.basePullDuration;
    this.blasts = [];
  }

  fire(player, enemies, particles, game) {
    const r = this.radius * (player.areaMultiplier || 1);
    const blast = { x: player.x, y: player.y, radius: r, pullTimer: this.pullDuration, phase: 'pull', damage: this.damage };
    this.blasts.push(blast);
    particles.burst(player.x, player.y, this.def.color, 10, 60, 500, 3, 6);
  }

  updateProjectiles(dt, player, enemies, particles, game) {
    for (let i = this.blasts.length - 1; i >= 0; i--) {
      const b = this.blasts[i];
      b.pullTimer -= dt * 1000;

      if (b.phase === 'pull') {
        // Pull enemies in radius
        for (const e of enemies) {
          if (!e.active) continue;
          const d = Utils.dist(b.x, b.y, e.x, e.y);
          if (d < b.radius) {
            const norm = Utils.normalize(b.x - e.x, b.y - e.y);
            e.x += norm.x * this.pullForce * dt;
            e.y += norm.y * this.pullForce * dt;
          }
        }
        if (b.pullTimer <= 0) {
          b.phase = 'explode';
          b.explodeLife = 300;
          // Explosion damage
          for (const e of enemies) {
            if (!e.active) continue;
            const d = Utils.dist(b.x, b.y, e.x, e.y);
            if (d < b.radius * 0.8 + e.size) {
              const killed = e.takeDamage(b.damage, player, particles);
              if (killed) { e.active = false; game.onEnemyDeath(e, particles); }
            }
          }
          particles.burst(b.x, b.y, this.def.color, 20, 160, 500, 4, 9);
          // Screen shake
          if (player) { player.shakeX += Utils.rand(-10, 10); player.shakeY += Utils.rand(-10, 10); }
        }
      } else {
        b.explodeLife -= dt * 1000;
        if (b.explodeLife <= 0) this.blasts.splice(i, 1);
      }
    }
  }

  draw(ctx, player) {
    for (const b of this.blasts) {
      ctx.save();
      if (b.phase === 'pull') {
        const alpha = (b.pullTimer / this.pullDuration) * 0.35;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = this.def.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 22;
        ctx.shadowColor = this.def.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.stroke();
        // Inner spiral effect
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      } else if (b.phase === 'explode') {
        const p = b.explodeLife / 300;
        ctx.globalAlpha = p * 0.8;
        ctx.fillStyle = this.def.color;
        ctx.shadowBlur = 35;
        ctx.shadowColor = this.def.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * (1 - p) + 20, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _applyUpgrade() {
    switch (this.upgradeLevel) {
      case 1: this.radius *= 1.20; break;
      case 2: this.damage *= 1.30; break;
      case 3: this.pullForce *= 1.40; break;
      case 4: this.radius *= 1.15; this.damage *= 1.25; break;
      case 5: this.cooldown *= 0.75; this.damage *= 1.40; break;
    }
  }
}


// ── Ancestor's Voice ──────────────────────────────────────
class WeaponAncestorVoice extends Weapon {
  constructor() {
    super('ancestorVoice');
    this.radius = this.def.baseRadius;
    this.healAmount = this.def.baseHeal;
    this.pulses = [];
  }

  fire(player, enemies, particles, game) {
    const r = this.radius * (player.areaMultiplier || 1);
    player.heal(this.healAmount, particles);
    this.pulses.push({ x: player.x, y: player.y, radius: r, life: 400, maxLife: 400, damage: this.damage });
    // Damage enemies in radius
    for (const e of enemies) {
      if (!e.active) continue;
      if (Utils.dist(e.x, e.y, player.x, player.y) < r + e.size) {
        const killed = e.takeDamage(this.damage, player, particles);
        if (killed) { e.active = false; game.onEnemyDeath(e, particles); }
      }
    }
    particles.burst(player.x, player.y, this.def.color, 8, 70, 400, 2, 5);
    particles.heal(player.x, player.y);
  }

  updateProjectiles(dt) {
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      this.pulses[i].life -= dt * 1000;
      if (this.pulses[i].life <= 0) this.pulses.splice(i, 1);
    }
  }

  draw(ctx, player) {
    // Ambient aura
    ctx.save();
    ctx.globalAlpha = 0.08 + Math.sin(Date.now() * 0.003) * 0.04;
    ctx.fillStyle = this.def.color;
    ctx.shadowBlur = 25;
    ctx.shadowColor = this.def.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, this.radius * (player.areaMultiplier || 1), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Pulse rings
    for (const p of this.pulses) {
      const progress = 1 - p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = (1 - progress) * 0.5;
      ctx.strokeStyle = this.def.color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = this.def.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * progress, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  _applyUpgrade() {
    switch (this.upgradeLevel) {
      case 1: this.healAmount *= 1.5; break;
      case 2: this.damage *= 1.30; break;
      case 3: this.radius *= 1.25; break;
      case 4: this.healAmount *= 1.5; this.damage *= 1.25; break;
      case 5: this.cooldown *= 0.70; break;
    }
  }
}


// ── Weapon Factory ────────────────────────────────────────
const WeaponFactory = {
  create(id) {
    switch (id) {
      case 'ancestralSpear': return new WeaponAncestralSpear();
      case 'thunderDrum':    return new WeaponThunderDrum();
      case 'kente':          return new WeaponKente();
      case 'solarOrbs':      return new WeaponSolarOrbs();
      case 'voidBlades':     return new WeaponVoidBlades();
      case 'nanoSwarm':      return new WeaponNanoSwarm();
      case 'gravitonStaff':  return new WeaponGravitonStaff();
      case 'ancestorVoice':  return new WeaponAncestorVoice();
      default: throw new Error(`Unknown weapon: ${id}`);
    }
  },
};

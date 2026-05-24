// ============================================================
// PARTICLES — XP gems, explosions, hit sparks, trails, healing
// ============================================================

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.xpGems = [];
    this.textPops = [];
  }

  // ── Burst ──────────────────────────────────────────────
  burst(x, y, color, count = 8, speed = 120, life = 500, sizeMin = 2, sizeMax = 5) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Utils.rand(-0.3, 0.3);
      const s = Utils.rand(speed * 0.5, speed);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * s,
        vy: Math.sin(angle) * s,
        life, maxLife: life,
        size: Utils.rand(sizeMin, sizeMax),
        color,
        active: true,
        alpha: 1,
      });
    }
  }

  // ── Spark (hit feedback) ───────────────────────────────
  spark(x, y, color = '#fff', count = 5) {
    this.burst(x, y, color, count, 90, 300, 1, 3);
  }

  // ── Heal particles ─────────────────────────────────────
  heal(x, y) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + Utils.rand(-12, 12),
        y: y + Utils.rand(-12, 12),
        vx: Utils.rand(-20, 20),
        vy: Utils.rand(-60, -20),
        life: 700, maxLife: 700,
        size: Utils.rand(3, 6),
        color: '#39ff14',
        active: true,
        alpha: 1,
      });
    }
  }

  // ── Trail (weapon projectile) ──────────────────────────
  trail(x, y, color, size = 3) {
    this.particles.push({
      x, y,
      vx: Utils.rand(-15, 15),
      vy: Utils.rand(-15, 15),
      life: 200, maxLife: 200,
      size,
      color,
      active: true,
      alpha: 0.7,
    });
  }

  // ── XP Gem spawn ───────────────────────────────────────
  spawnGem(x, y, value = 1) {
    this.xpGems.push({
      x, y,
      vx: Utils.rand(-50, 50),
      vy: Utils.rand(-50, 50),
      value,
      collected: false,
      active: true,
      pulse: Math.random() * Math.PI * 2,
      collectTimer: 0,
      size: value > 3 ? 9 : 6,
      color: value > 3 ? '#ffd700' : '#00ffcc',
    });
  }

  // ── Floating text ──────────────────────────────────────
  popText(x, y, text, color = '#fff', size = 18) {
    this.textPops.push({
      x, y,
      vy: -60,
      text, color, size,
      life: 900, maxLife: 900,
      active: true,
    });
  }

  // ── Essence orb ───────────────────────────────────────
  spawnEssence(x, y, value = 1) {
    this.xpGems.push({
      x, y,
      vx: Utils.rand(-50, 50),
      vy: Utils.rand(-50, 50),
      value,
      isEssence: true,
      collected: false,
      active: true,
      pulse: Math.random() * Math.PI * 2,
      collectTimer: 0,
      size: 7,
      color: '#a020f0',
    });
  }

  // ── Update ─────────────────────────────────────────────
  update(dt) {
    const gravity = 180; // gem gravity

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += gravity * 0.3 * dt;
      p.life -= dt * 1000;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // XP Gems — scatter then settle in place (top-down, no gravity)
    for (let i = 0; i < this.xpGems.length; i++) {
      const g = this.xpGems[i];
      if (!g.active) continue;
      if (!g.magnetTarget) {
        g.x += g.vx * dt;
        g.y += g.vy * dt;
        // Friction: velocity decays to zero quickly
        g.vx *= (1 - dt * 6);
        g.vy *= (1 - dt * 6);
        g.pulse += dt * 4;
      }
    }

    // Text pops
    for (let i = this.textPops.length - 1; i >= 0; i--) {
      const t = this.textPops[i];
      t.y += t.vy * dt;
      t.vy += 20 * dt;
      t.life -= dt * 1000;
      if (t.life <= 0) this.textPops.splice(i, 1);
    }
  }

  // ── Magnet gems toward player ─────────────────────────
  magnetGems(px, py, radius, speed) {
    for (const g of this.xpGems) {
      if (!g.active || g.collected) continue;
      const d2 = Utils.dist2(g.x, g.y, px, py);
      if (d2 < radius * radius) {
        g.magnetTarget = true;
        const d = Math.sqrt(d2) || 1;
        const pullSpeed = Math.max(speed, speed * (1 - d / radius) + 80);
        g.x += ((px - g.x) / d) * pullSpeed * (1 / 60);
        g.y += ((py - g.y) / d) * pullSpeed * (1 / 60);
      }
    }
  }

  // Check gem collection, returns [{value, isEssence}]
  collectGems(px, py, collectRadius = 16) {
    const collected = [];
    for (const g of this.xpGems) {
      if (!g.active || g.collected) continue;
      if (Utils.dist2(g.x, g.y, px, py) < collectRadius * collectRadius) {
        g.collected = true;
        g.active = false;
        collected.push({ value: g.value, isEssence: !!g.isEssence });
      }
    }
    this.xpGems = this.xpGems.filter(g => g.active);
    return collected;
  }

  // ── Draw ───────────────────────────────────────────────
  draw(ctx) {
    // Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // XP Gems
    for (const g of this.xpGems) {
      if (!g.active) continue;
      const pulse = Math.sin(g.pulse) * 0.3 + 0.85;
      const r = g.size * pulse;
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = g.color;
      ctx.fillStyle = g.color;
      // Diamond shape
      ctx.beginPath();
      ctx.moveTo(g.x, g.y - r);
      ctx.lineTo(g.x + r * 0.7, g.y);
      ctx.lineTo(g.x, g.y + r);
      ctx.lineTo(g.x - r * 0.7, g.y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Text pops
    for (const t of this.textPops) {
      const alpha = t.life / t.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = t.color;
      ctx.font = `bold ${t.size}px 'Courier New', monospace`;
      ctx.textAlign = 'center';
      ctx.shadowBlur = 10;
      ctx.shadowColor = t.color;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }
}

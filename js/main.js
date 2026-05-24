// ============================================================
// MAIN — Game loop, state machine, input handling
// States: 'menu' | 'charSelect' | 'run' | 'levelUp' | 'paused' | 'gameOver' | 'victory' | 'boons'
// ============================================================

class Game {
  constructor() {
    // Canvas setup
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.state = 'menu';
    this.lastTime = 0;

    // Game objects
    this.player = null;
    this.enemies = [];
    this.projectiles = []; // enemy projectiles
    this.spawner = null;
    this.particles = null;
    this.upgradeSystem = null;
    this.meta = new MetaProgression();
    this.ui = null;

    // Run stats
    this.runTimeMs = 0;
    this.kills = 0;
    this.levelUpChoices = [];
    this.selectedCharId = 'anansi';
    this.hoverIdx = -1;
    this.paused = false;

    // Touch / joystick
    this.joystick = {
      active: false,
      touchId: null,
      baseX: 0, baseY: 0,
      stickX: 0, stickY: 0,
      maxRadius: 55,
      dx: 0, dy: 0,
    };

    // Background pattern (drawn once)
    this.bgPattern = null;
    this.bgTime = 0;

    this._bindEvents();
    this._resize();
    window.requestAnimationFrame(ts => this._loop(ts));
  }

  // ── Resize ────────────────────────────────────────────
  _resize() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    this.canvas.width = W * this.dpr;
    this.canvas.height = H * this.dpr;
    this.canvas.style.width = W + 'px';
    this.canvas.style.height = H + 'px';
    this.ctx.scale(this.dpr, this.dpr);
    this.viewW = W;
    this.viewH = H;
    if (this.ui) this.ui.resize(W, H);
  }

  // ── Start a run ───────────────────────────────────────
  startRun(charId) {
    this.selectedCharId = charId;
    const metaStats = this.meta.buildMetaStats();
    this.player = new Player(charId, metaStats);
    // Apply meta armor
    if (metaStats.bonusArmor) this.player.armor = Math.min(0.75, this.player.armor + metaStats.bonusArmor);
    // Apply meta magnet
    if (metaStats.bonusMagnet) this.player.magnetRadius *= (1 + metaStats.bonusMagnet);

    // Give starting weapon
    const w = WeaponFactory.create(this.player.charDef.startWeapon);
    this.player.weapons.push(w);

    this.enemies = [];
    this.projectiles = [];
    this.particles = new ParticleSystem();
    this.spawner = new EnemySpawner();
    this.upgradeSystem = new UpgradeSystem();
    this.runTimeMs = 0;
    this.kills = 0;
    this.state = 'run';
    this.ui = new UI(this.canvas, this);
    this._resize();
  }

  // ── Main Loop ─────────────────────────────────────────
  _loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.viewW, this.viewH);
    ctx.restore();

    ctx.save();
    ctx.scale(1 / this.dpr, 1 / this.dpr);
    ctx.scale(this.dpr, this.dpr);

    switch (this.state) {
      case 'menu':       this._updateMenu(dt, ctx);       break;
      case 'charSelect': this._updateCharSelect(dt, ctx); break;
      case 'run':        this._updateRun(dt, ctx);        break;
      case 'levelUp':    this._updateLevelUp(dt, ctx);    break;
      case 'paused':     this._updatePaused(dt, ctx);     break;
      case 'gameOver':   this._updateGameOver(dt, ctx);   break;
      case 'victory':    this._updateVictory(dt, ctx);    break;
      case 'boons':      this._updateBoons(dt, ctx);      break;
    }

    ctx.restore();
    window.requestAnimationFrame(ts => this._loop(ts));
  }

  // ── Menu ──────────────────────────────────────────────
  _updateMenu(dt, ctx) {
    if (!this.ui) { this.ui = new UI(this.canvas, this); this._resize(); }
    this.ui.drawMainMenu(ctx, this.meta);
  }

  // ── Char Select ───────────────────────────────────────
  _updateCharSelect(dt, ctx) {
    this.ui.drawCharSelect(ctx, this.meta, this.hoverIdx);
  }

  // ── Run ───────────────────────────────────────────────
  _updateRun(dt, ctx) {
    this.runTimeMs += dt * 1000;
    this.bgTime += dt;

    // Update joystick input
    this.player.setInput(this.joystick.dx, this.joystick.dy);

    // Camera (centered on player)
    const camX = this.player.x;
    const camY = this.player.y;
    const offX = this.viewW / 2 - camX + this.player.shakeX;
    const offY = this.viewH / 2 - camY + this.player.shakeY;

    // Draw world
    ctx.save();
    ctx.translate(offX, offY);

    // Background
    this._drawWorld(ctx, camX, camY);

    // Particle effects (behind enemies)
    this.particles.draw(ctx);

    // Enemies
    for (const e of this.enemies) {
      if (e.active) e.draw(ctx);
    }

    // Enemy projectiles
    this._updateEnemyProjectiles(dt, ctx);

    // Weapons (drawn in world space)
    for (const w of this.player.weapons) {
      w.draw(ctx, this.player);
    }

    // Player
    this.player.draw(ctx);

    ctx.restore();

    // Update logic
    this.particles.update(dt);
    for (const e of this.enemies) {
      if (e.active) e.update(dt, this.player, this.particles, this.projectiles);
    }
    this.enemies = this.enemies.filter(e => e.active);

    // Spawner
    this.spawner.update(dt, this.runTimeMs, this.player, this.enemies, this.particles);

    // Player (weapons update inside)
    this.player.update(dt, this.enemies, this.particles, this);

    // HUD
    this.ui.drawHUD(ctx, this.player, this.runTimeMs, CONFIG.RUN_DURATION_MS, this.enemies);

    // Joystick
    this.ui.drawJoystick(ctx, this.joystick, this.viewW, this.viewH);

    // Win condition
    if (this.runTimeMs >= CONFIG.RUN_DURATION_MS) {
      this._endRun(true);
    }

    // Death
    if (this.player.hp <= 0) {
      this._endRun(false);
    }
  }

  _endRun(survived) {
    const kills = this.kills;
    const runTime = this.runTimeMs;
    const essence = this.player.essenceCollected;
    this.meta.recordRunEnd(essence, survived, kills, runTime);
    this.state = survived ? 'victory' : 'gameOver';
  }

  // ── Level Up ──────────────────────────────────────────
  _updateLevelUp(dt, ctx) {
    // Freeze run visually
    this._renderRunBackground(ctx);
    this.ui.drawLevelUpCards(ctx, this.levelUpChoices, this.hoverIdx);
  }

  _renderRunBackground(ctx) {
    const camX = this.player.x;
    const camY = this.player.y;
    const offX = this.viewW / 2 - camX;
    const offY = this.viewH / 2 - camY;
    ctx.save();
    ctx.translate(offX, offY);
    this._drawWorld(ctx, camX, camY);
    this.particles.draw(ctx);
    for (const e of this.enemies) { if (e.active) e.draw(ctx); }
    for (const w of this.player.weapons) { w.draw(ctx, this.player); }
    this.player.draw(ctx);
    ctx.restore();
    this.ui.drawHUD(ctx, this.player, this.runTimeMs, CONFIG.RUN_DURATION_MS, this.enemies);
  }

  // ── Paused ────────────────────────────────────────────
  _updatePaused(dt, ctx) {
    this._renderRunBackground(ctx);
    const W = this.viewW, H = this.viewH;
    ctx.save();
    ctx.fillStyle = '#0d0515';
    ctx.globalAlpha = 0.75;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = CONFIG.COLORS.gold;
    ctx.globalAlpha = 1;
    ctx.font = `bold ${Math.min(W * 0.1, 42)}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.shadowBlur = 20;
    ctx.shadowColor = CONFIG.COLORS.gold;
    ctx.fillText('PAUSED', W / 2, H * 0.45);
    ctx.restore();
    this.ui._drawButton(ctx, W / 2, H * 0.58, 180, 48, '▶ RESUME', CONFIG.COLORS.gold, '#1a0a2e');
    this.ui._drawButton(ctx, W / 2, H * 0.70, 180, 48, '🏠 MENU', CONFIG.COLORS.electricBlue, '#1a0a2e');
  }

  // ── Game Over ─────────────────────────────────────────
  _updateGameOver(dt, ctx) {
    this.ui.drawGameOver(ctx, this.player, this.runTimeMs, this.kills, false);
  }

  // ── Victory ───────────────────────────────────────────
  _updateVictory(dt, ctx) {
    this.ui.drawGameOver(ctx, this.player, this.runTimeMs, this.kills, true);
  }

  // ── Boons ─────────────────────────────────────────────
  _updateBoons(dt, ctx) {
    this.ui.drawBoonsScreen(ctx, this.meta, this.hoverIdx);
  }

  // ── World Drawing ─────────────────────────────────────
  _drawWorld(ctx, camX, camY) {
    // Background fill
    ctx.fillStyle = CONFIG.CANVAS_BG;
    ctx.fillRect(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);

    // Kente-cloth grid pattern
    const t = this.bgTime;
    ctx.save();
    ctx.globalAlpha = 0.06;
    const gridSize = 80;
    const colors = [CONFIG.COLORS.gold, CONFIG.COLORS.electricBlue, CONFIG.COLORS.neonGreen, CONFIG.COLORS.hotPink];

    // View-relative culling
    const startX = Math.floor((camX - this.viewW) / gridSize) * gridSize;
    const endX = camX + this.viewW;
    const startY = Math.floor((camY - this.viewH) / gridSize) * gridSize;
    const endY = camY + this.viewH;

    for (let gx = startX; gx < endX; gx += gridSize) {
      for (let gy = startY; gy < endY; gy += gridSize) {
        const ci = (Math.floor(gx / gridSize) + Math.floor(gy / gridSize)) % colors.length;
        ctx.strokeStyle = colors[ci];
        ctx.lineWidth = 0.5;
        ctx.strokeRect(gx, gy, gridSize, gridSize);
        // Diagonal cross
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + gridSize, gy + gridSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(gx + gridSize, gy);
        ctx.lineTo(gx, gy + gridSize);
        ctx.stroke();
      }
    }
    ctx.restore();

    // World border glow
    ctx.save();
    ctx.strokeStyle = CONFIG.COLORS.gold;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 18;
    ctx.shadowColor = CONFIG.COLORS.gold;
    ctx.globalAlpha = 0.4;
    ctx.strokeRect(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
    ctx.restore();
  }

  // ── Enemy projectile update ───────────────────────────
  _updateEnemyProjectiles(dt, ctx) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.active) { this.projectiles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 1000;

      // Draw
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Hit player
      if (Utils.dist(p.x, p.y, this.player.x, this.player.y) < p.size + CONFIG.PLAYER_SIZE) {
        this.player.takeDamage(p.damage, this.particles);
        p.active = false;
      }

      if (p.life <= 0) p.active = false;
    }
    this.projectiles = this.projectiles.filter(p => p.active);
  }

  // ── Enemy death callback ──────────────────────────────
  onEnemyDeath(enemy, particles) {
    this.kills++;
    particles.burst(enemy.x, enemy.y, enemy.color, 10, 100, 500, 3, 8);

    // XP gems
    const xpVal = enemy.xpDrop || 1;
    particles.spawnGem(enemy.x, enemy.y, xpVal);
    if (xpVal > 2) particles.spawnGem(enemy.x, enemy.y, 1);

    // Essence
    if (enemy.essenceDrop > 0) {
      for (let i = 0; i < enemy.essenceDrop; i++) {
        particles.spawnEssence(enemy.x + Utils.rand(-15, 15), enemy.y + Utils.rand(-15, 15), 1);
      }
    }
  }

  // ── Level-up trigger ─────────────────────────────────
  triggerLevelUp() {
    if (this.state !== 'run') return;
    this.levelUpChoices = this.upgradeSystem.buildChoices(this.player, 3);
    this.hoverIdx = -1;
    this.ui.cardAnim = 0;
    this.state = 'levelUp';
  }

  // ── Input binding ─────────────────────────────────────
  _bindEvents() {
    window.addEventListener('resize', () => this._resize());

    // ── Touch ────────────────────────────────────────────
    this.canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      for (const touch of e.changedTouches) this._onTouchStart(touch);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const touch of e.changedTouches) this._onTouchMove(touch);
    }, { passive: false });

    this.canvas.addEventListener('touchend', e => {
      e.preventDefault();
      for (const touch of e.changedTouches) this._onTouchEnd(touch);
    }, { passive: false });

    // ── Mouse (desktop) ───────────────────────────────────
    this.canvas.addEventListener('mousedown', e => this._onPointerDown(e.clientX, e.clientY));
    this.canvas.addEventListener('mousemove', e => this._onPointerMove(e.clientX, e.clientY));
    this.canvas.addEventListener('mouseup', e => this._onPointerUp(e.clientX, e.clientY));

    // ── Keyboard ──────────────────────────────────────────
    window.addEventListener('keydown', e => this._onKey(e));
    window.addEventListener('keyup', e => this._onKeyUp(e));

    this._keyState = {};
  }

  // Touch delegation
  _onTouchStart(touch) {
    const x = touch.clientX;
    const y = touch.clientY;
    // Joystick zone: left half, bottom 60% of screen
    if (x < this.viewW * 0.55 && y > this.viewH * 0.35 && (this.state === 'run' || this.state === 'paused')) {
      if (this.joystick.touchId === null) {
        this.joystick.touchId = touch.identifier;
        this.joystick.active = true;
        this.joystick.baseX = x;
        this.joystick.baseY = y;
        this.joystick.stickX = x;
        this.joystick.stickY = y;
      }
    } else {
      this._onPointerDown(x, y, touch.identifier);
    }
  }

  _onTouchMove(touch) {
    if (touch.identifier === this.joystick.touchId) {
      const dx = touch.clientX - this.joystick.baseX;
      const dy = touch.clientY - this.joystick.baseY;
      const len = Math.sqrt(dx * dx + dy * dy);
      const clamped = Math.min(len, this.joystick.maxRadius);
      const nx = len > 0 ? dx / len : 0;
      const ny = len > 0 ? dy / len : 0;
      this.joystick.stickX = this.joystick.baseX + nx * clamped;
      this.joystick.stickY = this.joystick.baseY + ny * clamped;
      this.joystick.dx = nx * (clamped / this.joystick.maxRadius);
      this.joystick.dy = ny * (clamped / this.joystick.maxRadius);
    }
  }

  _onTouchEnd(touch) {
    if (touch.identifier === this.joystick.touchId) {
      this.joystick.active = false;
      this.joystick.touchId = null;
      this.joystick.dx = 0;
      this.joystick.dy = 0;
    } else {
      this._onPointerUp(touch.clientX, touch.clientY);
    }
  }

  // Pointer down (tap / click)
  _onPointerDown(x, y, touchId) {
    const W = this.viewW, H = this.viewH;
    switch (this.state) {
      case 'menu':
        if (this.ui.hitTestPlayBtn(x, y, W, H)) {
          this.state = 'charSelect';
          this.hoverIdx = -1;
        } else if (this.ui.hitTestBoonsBtn(x, y, W, H)) {
          this._prevState = 'menu';
          this.state = 'boons';
          this.hoverIdx = -1;
        }
        break;

      case 'charSelect': {
        const chars = Object.values(CONFIG.CHARACTERS);
        for (let i = 0; i < chars.length; i++) {
          if (this.ui.hitTestCharCard(x, y, W, H, i)) {
            if (this.meta.isCharUnlocked(chars[i].id)) {
              this.startRun(chars[i].id);
            }
          }
        }
        break;
      }

      case 'run':
        if (this.ui.hitTestPauseBtn(x, y)) {
          this.state = 'paused';
        }
        break;

      case 'paused': {
        const resumeHit = Math.abs(x - W / 2) < 90 && Math.abs(y - H * 0.58) < 24;
        const menuHit   = Math.abs(x - W / 2) < 90 && Math.abs(y - H * 0.70) < 24;
        if (resumeHit) this.state = 'run';
        if (menuHit)   { this.state = 'menu'; this.player = null; }
        break;
      }

      case 'levelUp': {
        for (let i = 0; i < this.levelUpChoices.length; i++) {
          if (this.ui.hitTestUpgradeCard(x, y, W, H, i, this.levelUpChoices.length)) {
            this.upgradeSystem.applyChoice(this.levelUpChoices[i], this.player);
            this.levelUpChoices = [];
            this.state = 'run';
            break;
          }
        }
        break;
      }

      case 'gameOver':
      case 'victory':
        if (this.ui.hitTestPlayAgainBtn(x, y, W, H)) {
          this.state = 'charSelect';
          this.hoverIdx = -1;
        } else if (this.ui.hitTestGameOverBoonsBtn(x, y, W, H)) {
          this._prevState = 'gameOver';
          this.state = 'boons';
          this.hoverIdx = -1;
        }
        break;

      case 'boons': {
        if (this.ui.hitTestBackBtn(x, y, W, H)) {
          this.state = this._prevState === 'gameOver' ? 'menu' : 'menu';
          this.hoverIdx = -1;
        } else {
          for (let i = 0; i < BOONS.length; i++) {
            if (this.ui.hitTestBoonCard(x, y, W, H, i)) {
              this.meta.purchase(BOONS[i].id);
              break;
            }
          }
        }
        break;
      }
    }
  }

  _onPointerMove(x, y) {
    // Mouse desktop joystick
    if (this._mouseDown && (this.state === 'run') && x < this.viewW * 0.55 && y > this.viewH * 0.35) {
      if (!this.joystick.active) {
        this.joystick.active = true;
        this.joystick.baseX = x;
        this.joystick.baseY = y;
      }
      const dx = x - this.joystick.baseX;
      const dy = y - this.joystick.baseY;
      const len = Math.sqrt(dx * dx + dy * dy);
      const clamped = Math.min(len, this.joystick.maxRadius);
      const nx = len > 0 ? dx / len : 0;
      const ny = len > 0 ? dy / len : 0;
      this.joystick.stickX = this.joystick.baseX + nx * clamped;
      this.joystick.stickY = this.joystick.baseY + ny * clamped;
      this.joystick.dx = nx * (clamped / this.joystick.maxRadius);
      this.joystick.dy = ny * (clamped / this.joystick.maxRadius);
    }
  }

  _onPointerUp(x, y) {
    this._mouseDown = false;
    if (this.joystick.active && this.joystick.touchId === null) {
      this.joystick.active = false;
      this.joystick.dx = 0;
      this.joystick.dy = 0;
    }
  }

  // Keyboard input (WASD / arrow keys for desktop)
  _onKey(e) {
    this._keyState[e.code] = true;
    this._updateKeyboardInput();

    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (this.state === 'run') this.state = 'paused';
      else if (this.state === 'paused') this.state = 'run';
    }
  }

  _onKeyUp(e) {
    this._keyState[e.code] = false;
    this._updateKeyboardInput();
  }

  _updateKeyboardInput() {
    const k = this._keyState;
    let dx = 0, dy = 0;
    if (k['ArrowLeft']  || k['KeyA']) dx -= 1;
    if (k['ArrowRight'] || k['KeyD']) dx += 1;
    if (k['ArrowUp']    || k['KeyW']) dy -= 1;
    if (k['ArrowDown']  || k['KeyS']) dy += 1;
    // Only override joystick if not actively touching
    if (!this.joystick.active || this.joystick.touchId === null) {
      if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        this.joystick.dx = dx / len;
        this.joystick.dy = dy / len;
      } else {
        this.joystick.dx = 0;
        this.joystick.dy = 0;
      }
    }
  }
}

// Boot!
window.addEventListener('DOMContentLoaded', () => {
  window._game = new Game();
});

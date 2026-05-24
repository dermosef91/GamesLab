// ============================================================
// UI — HUD, menus, level-up cards, meta screen
// All drawn on a separate overlay canvas so they sit on top
// ============================================================

class UI {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.width = canvas.width;
    this.height = canvas.height;

    // Level-up card animation
    this.cardAnim = 0;

    // Touch zones
    this.pauseBtn = { x: 0, y: 0, w: 60, h: 44 };
    this.bossHpVisible = false;
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
  }

  // ── Main Menu ──────────────────────────────────────────
  drawMainMenu(ctx, meta) {
    const { width: W, height: H } = this;
    this._drawStarfieldBg(ctx, W, H);

    // Title
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowBlur = 30;
    ctx.shadowColor = CONFIG.COLORS.gold;
    ctx.fillStyle = CONFIG.COLORS.gold;
    ctx.font = `bold ${Math.min(W * 0.1, 52)}px 'Courier New', monospace`;
    ctx.fillText('ANCESTORS', W / 2, H * 0.20);
    ctx.font = `bold ${Math.min(W * 0.065, 34)}px 'Courier New', monospace`;
    ctx.fillStyle = CONFIG.COLORS.electricBlue;
    ctx.shadowColor = CONFIG.COLORS.electricBlue;
    ctx.fillText('AWAKENING', W / 2, H * 0.20 + Math.min(W * 0.11, 58));
    ctx.restore();

    // Subtitle
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = CONFIG.COLORS.starWhite;
    ctx.globalAlpha = 0.75;
    ctx.font = `${Math.min(W * 0.035, 16)}px 'Courier New', monospace`;
    ctx.fillText('An Afrofuturist Survivors Roguelite', W / 2, H * 0.36);
    ctx.restore();

    // Play button
    this._drawButton(ctx, W / 2, H * 0.52, 200, 52, 'PLAY', CONFIG.COLORS.gold, '#1a0a2e');

    // Ancestral Boons button
    this._drawButton(ctx, W / 2, H * 0.65, 200, 52, `BOONS  ✦${meta.availableEssence}`, CONFIG.COLORS.electricBlue, '#1a0a2e');

    // Bottom stats
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = CONFIG.COLORS.starWhite;
    ctx.globalAlpha = 0.5;
    ctx.font = `${Math.min(W * 0.03, 13)}px 'Courier New', monospace`;
    ctx.fillText(`Runs: ${meta.runsCompleted}  |  Kills: ${meta.totalKills}  |  Best: ${Utils.formatTime(meta.bestTime)}`, W / 2, H * 0.92);
    ctx.restore();
  }

  // ── Character Select ───────────────────────────────────
  drawCharSelect(ctx, meta, hoverIdx) {
    const { width: W, height: H } = this;
    this._drawStarfieldBg(ctx, W, H);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = CONFIG.COLORS.gold;
    ctx.font = `bold ${Math.min(W * 0.065, 30)}px 'Courier New', monospace`;
    ctx.shadowBlur = 18;
    ctx.shadowColor = CONFIG.COLORS.gold;
    ctx.fillText('CHOOSE YOUR ANCESTOR', W / 2, H * 0.10);
    ctx.restore();

    const chars = Object.values(CONFIG.CHARACTERS);
    const cardW = Math.min(W * 0.28, 160);
    const cardH = Math.min(H * 0.45, 260);
    const gap = (W - chars.length * cardW) / (chars.length + 1);

    chars.forEach((c, i) => {
      const cx = gap + i * (cardW + gap) + cardW / 2;
      const cy = H * 0.52;
      const unlocked = meta.isCharUnlocked(c.id);
      const hover = hoverIdx === i;
      this._drawCharCard(ctx, cx, cy, cardW, cardH, c, unlocked, hover);
    });

    // Hint
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = CONFIG.COLORS.starWhite;
    ctx.globalAlpha = 0.5;
    ctx.font = `${Math.min(W * 0.03, 13)}px 'Courier New', monospace`;
    ctx.fillText('Tap a hero to begin', W / 2, H * 0.92);
    ctx.restore();
  }

  _drawCharCard(ctx, cx, cy, w, h, charDef, unlocked, hover) {
    const alpha = unlocked ? 1 : 0.4;
    ctx.save();
    ctx.globalAlpha = alpha;

    // Card bg
    const grd = ctx.createRadialGradient(cx, cy - h * 0.1, 10, cx, cy, w * 0.8);
    grd.addColorStop(0, '#1a0a2e');
    grd.addColorStop(1, '#0d0515');
    ctx.fillStyle = grd;
    ctx.strokeStyle = hover ? CONFIG.COLORS.gold : charDef.color;
    ctx.lineWidth = hover ? 3 : 1.5;
    ctx.shadowBlur = hover ? 22 : 10;
    ctx.shadowColor = hover ? CONFIG.COLORS.gold : charDef.color;
    this._roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 12);
    ctx.fill();
    ctx.stroke();

    // Icon
    ctx.font = `${Math.min(w * 0.4, 52)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 20;
    ctx.shadowColor = charDef.color;
    ctx.fillStyle = '#fff';
    ctx.fillText(charDef.icon, cx, cy - h * 0.22);

    // Name
    ctx.font = `bold ${Math.min(w * 0.14, 14)}px 'Courier New', monospace`;
    ctx.fillStyle = charDef.color;
    ctx.shadowBlur = 8;
    ctx.fillText(charDef.name.split(' ')[0], cx, cy + h * 0.02);
    ctx.font = `${Math.min(w * 0.12, 11)}px 'Courier New', monospace`;
    ctx.fillStyle = CONFIG.COLORS.starWhite;
    ctx.shadowBlur = 0;
    ctx.globalAlpha = alpha * 0.85;

    // Passive desc (wrap)
    const words = charDef.passiveDesc.split(' ');
    let line = '';
    let lineY = cy + h * 0.17;
    const lineH = Math.min(w * 0.13, 13);
    for (const word of words) {
      const test = line + (line ? ' ' : '') + word;
      if (ctx.measureText(test).width > w - 10) {
        ctx.fillText(line, cx, lineY);
        lineY += lineH;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, cx, lineY);

    // Lock overlay
    if (!unlocked) {
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#000';
      this._roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 12);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.font = '28px sans-serif';
      ctx.fillText('🔒', cx, cy);
      ctx.fillStyle = CONFIG.COLORS.starWhite;
      ctx.font = `${Math.min(w * 0.1, 10)}px 'Courier New', monospace`;
      ctx.fillText('Unlock in Boons', cx, cy + 26);
    }

    ctx.restore();
  }

  // ── HUD ───────────────────────────────────────────────
  drawHUD(ctx, player, runTimeMs, runDuration, enemies) {
    const { width: W, height: H } = this;

    // Timer
    const remaining = Math.max(0, runDuration - runTimeMs);
    const timerColor = remaining < 60000 ? '#ff4444' : CONFIG.COLORS.electricBlue;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = timerColor;
    ctx.shadowBlur = 12;
    ctx.shadowColor = timerColor;
    ctx.font = `bold ${Math.min(W * 0.055, 26)}px 'Courier New', monospace`;
    ctx.fillText(Utils.formatTime(remaining), W / 2, 36);
    ctx.restore();

    // HP bar
    const hpBarW = Math.min(W * 0.55, 260);
    const hpBarH = 14;
    const hpX = 16, hpY = 16;
    this._drawBar(ctx, hpX, hpY, hpBarW, hpBarH, player.hp / player.maxHp, '#ff3333', '#330000', '❤');

    // XP bar
    const xpBarW = Math.min(W * 0.55, 260);
    const xpBarH = 8;
    const xpX = 16, xpY = hpY + hpBarH + 6;
    this._drawBar(ctx, xpX, xpY, xpBarW, xpBarH, player.xp / player.xpToNext, CONFIG.COLORS.electricBlue, '#001122', '');

    // Level label
    ctx.save();
    ctx.fillStyle = CONFIG.COLORS.gold;
    ctx.font = `bold ${Math.min(W * 0.038, 15)}px 'Courier New', monospace`;
    ctx.textAlign = 'left';
    ctx.shadowBlur = 6;
    ctx.shadowColor = CONFIG.COLORS.gold;
    ctx.fillText(`LV ${player.level}`, xpX + xpBarW + 6, xpY + xpBarH);
    ctx.restore();

    // Essence collected
    ctx.save();
    ctx.fillStyle = '#a020f0';
    ctx.font = `${Math.min(W * 0.033, 13)}px 'Courier New', monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`✦ ${player.essenceCollected}`, xpX, xpY + xpBarH + 18);
    ctx.restore();

    // Weapon icons (bottom bar)
    this._drawWeaponBar(ctx, player, W, H);

    // Boss HP bar
    const boss = enemies.find(e => e.active && e.isBoss);
    if (boss) {
      this._drawBossHPBar(ctx, boss, W, H);
    }

    // Pause button (top right)
    this.pauseBtn = { x: W - 54, y: 8, w: 46, h: 34 };
    this._drawButton(ctx, W - 31, 25, 46, 32, '⏸', '#555', '#1a0a2e', 11);
  }

  _drawBar(ctx, x, y, w, h, ratio, fillColor, bgColor, icon) {
    ctx.save();
    ctx.fillStyle = bgColor;
    this._roundRect(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.fillStyle = fillColor;
    ctx.shadowBlur = 6;
    ctx.shadowColor = fillColor;
    this._roundRect(ctx, x, y, w * Math.max(0, Math.min(1, ratio)), h, 4);
    ctx.fill();
    if (icon) {
      ctx.font = `${h + 4}px sans-serif`;
      ctx.fillText(icon, x - 16, y + h * 0.8);
    }
    ctx.restore();
  }

  _drawWeaponBar(ctx, player, W, H) {
    const iconSize = Math.min(W * 0.1, 44);
    const gap = 6;
    const totalW = player.weapons.length * (iconSize + gap);
    let startX = (W - totalW) / 2;
    const barY = H - iconSize - 16;

    player.weapons.forEach((w, i) => {
      const x = startX + i * (iconSize + gap);
      ctx.save();
      ctx.fillStyle = '#0d0515cc';
      ctx.strokeStyle = w.def.color;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = w.def.color;
      this._roundRect(ctx, x, barY, iconSize, iconSize, 8);
      ctx.fill();
      ctx.stroke();

      // Icon
      ctx.font = `${iconSize * 0.55}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(w.def.icon, x + iconSize / 2, barY + iconSize * 0.42);

      // Level pips
      ctx.fillStyle = w.def.color;
      for (let l = 0; l <= w.upgradeLevel; l++) {
        ctx.beginPath();
        ctx.arc(x + 4 + l * 7, barY + iconSize - 6, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cooldown overlay
      const cdProgress = w.cooldown > 0 ? Math.max(0, 1 - w.timer / (w.cooldown * w.cooldownMult)) : 0;
      if (cdProgress > 0.05) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + iconSize / 2, barY + iconSize / 2, iconSize / 2, -Math.PI / 2, -Math.PI / 2 + cdProgress * Math.PI * 2);
        ctx.lineTo(x + iconSize / 2, barY + iconSize / 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    });
  }

  _drawBossHPBar(ctx, boss, W, H) {
    const barW = Math.min(W * 0.7, 340);
    const barH = 18;
    const barX = (W - barW) / 2;
    const barY = H - 80;
    ctx.save();
    ctx.fillStyle = '#1a0a2e';
    this._roundRect(ctx, barX - 2, barY - 2, barW + 4, barH + 4, 5);
    ctx.fill();
    this._drawBar(ctx, barX, barY, barW, barH, boss.hp / boss.maxHp, boss.color, '#1a0000', '');
    // Boss name
    ctx.fillStyle = boss.color;
    ctx.font = `bold 13px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.shadowBlur = 10;
    ctx.shadowColor = boss.color;
    ctx.fillText(`⚔ ${boss.def.name} ⚔`, W / 2, barY - 6);
    ctx.restore();
  }

  // ── Level-Up Cards ─────────────────────────────────────
  drawLevelUpCards(ctx, choices, hoverIdx) {
    const { width: W, height: H } = this;
    this.cardAnim = Math.min(1, this.cardAnim + 0.08);

    // Dim overlay
    ctx.save();
    ctx.fillStyle = '#0d0515';
    ctx.globalAlpha = 0.82 * this.cardAnim;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Header
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = CONFIG.COLORS.gold;
    ctx.font = `bold ${Math.min(W * 0.065, 28)}px 'Courier New', monospace`;
    ctx.shadowBlur = 20;
    ctx.shadowColor = CONFIG.COLORS.gold;
    ctx.globalAlpha = this.cardAnim;
    ctx.fillText(`⚡ LEVEL ${this.game.player ? this.game.player.level : ''} ⚡`, W / 2, H * 0.15);
    ctx.fillStyle = CONFIG.COLORS.starWhite;
    ctx.globalAlpha = this.cardAnim * 0.7;
    ctx.font = `${Math.min(W * 0.035, 15)}px 'Courier New', monospace`;
    ctx.fillText('Choose an upgrade', W / 2, H * 0.22);
    ctx.restore();

    const cardW = Math.min(W * 0.82, 320);
    const cardH = Math.min(H * 0.16, 90);
    const gap = Math.min(H * 0.025, 16);
    const totalH = choices.length * cardH + (choices.length - 1) * gap;
    let startY = (H - totalH) / 2 + H * 0.05;

    choices.forEach((choice, i) => {
      const cx = W / 2;
      const cy = startY + i * (cardH + gap) + cardH / 2;
      const hover = hoverIdx === i;
      this._drawUpgradeCard(ctx, cx, cy, cardW, cardH, choice, hover, this.cardAnim);
    });
  }

  _drawUpgradeCard(ctx, cx, cy, w, h, choice, hover, anim) {
    ctx.save();
    ctx.globalAlpha = anim;
    const brd = hover ? 3 : 1.5;
    ctx.shadowBlur = hover ? 28 : 12;
    ctx.shadowColor = choice.color;
    ctx.strokeStyle = choice.color;
    ctx.lineWidth = brd;
    const grd = ctx.createLinearGradient(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
    grd.addColorStop(0, hover ? '#1a0a2e' : '#100020');
    grd.addColorStop(1, '#0d0515');
    ctx.fillStyle = grd;
    this._roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 14);
    ctx.fill();
    ctx.stroke();

    // Icon
    ctx.font = `${h * 0.5}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(choice.icon, cx - w / 2 + 16, cy);

    // Name
    ctx.fillStyle = choice.color;
    ctx.font = `bold ${Math.min(h * 0.22, 16)}px 'Courier New', monospace`;
    ctx.textAlign = 'left';
    ctx.shadowBlur = 6;
    ctx.shadowColor = choice.color;
    ctx.fillText(choice.name, cx - w / 2 + h * 0.65, cy - h * 0.15);

    // Desc
    ctx.fillStyle = CONFIG.COLORS.starWhite;
    ctx.font = `${Math.min(h * 0.17, 12)}px 'Courier New', monospace`;
    ctx.globalAlpha = anim * 0.8;
    ctx.shadowBlur = 0;
    ctx.fillText(choice.desc, cx - w / 2 + h * 0.65, cy + h * 0.15);

    ctx.restore();
  }

  // ── Game Over / Victory ────────────────────────────────
  drawGameOver(ctx, player, runTimeMs, kills, won) {
    const { width: W, height: H } = this;
    ctx.save();
    ctx.fillStyle = '#0d0515';
    ctx.globalAlpha = 0.90;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    const title = won ? '✨ VICTORY ✨' : '💀 FALLEN 💀';
    const titleColor = won ? CONFIG.COLORS.gold : '#ff3333';
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowBlur = 28;
    ctx.shadowColor = titleColor;
    ctx.fillStyle = titleColor;
    ctx.font = `bold ${Math.min(W * 0.1, 48)}px 'Courier New', monospace`;
    ctx.fillText(title, W / 2, H * 0.22);

    ctx.fillStyle = CONFIG.COLORS.starWhite;
    ctx.font = `${Math.min(W * 0.042, 18)}px 'Courier New', monospace`;
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.85;
    ctx.fillText(`Time: ${Utils.formatTime(runTimeMs)}`, W / 2, H * 0.36);
    ctx.fillText(`Enemies killed: ${kills}`, W / 2, H * 0.44);
    ctx.fillText(`Level reached: ${player.level}`, W / 2, H * 0.52);

    ctx.fillStyle = '#a020f0';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#a020f0';
    const essenceKept = won ? player.essenceCollected : Math.floor(player.essenceCollected * CONFIG.ESSENCE_ON_DEATH);
    ctx.fillText(`Essence earned: ✦ ${essenceKept}`, W / 2, H * 0.62);
    ctx.restore();

    this._drawButton(ctx, W / 2, H * 0.76, 200, 52, 'PLAY AGAIN', CONFIG.COLORS.gold, '#1a0a2e');
    this._drawButton(ctx, W / 2, H * 0.88, 200, 52, 'BOONS', CONFIG.COLORS.electricBlue, '#1a0a2e');
  }

  // ── Ancestral Boons Screen ────────────────────────────
  drawBoonsScreen(ctx, meta, hoverIdx) {
    const { width: W, height: H } = this;
    this._drawStarfieldBg(ctx, W, H);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = CONFIG.COLORS.gold;
    ctx.font = `bold ${Math.min(W * 0.075, 32)}px 'Courier New', monospace`;
    ctx.shadowBlur = 20;
    ctx.shadowColor = CONFIG.COLORS.gold;
    ctx.fillText('ANCESTRAL BOONS', W / 2, H * 0.10);

    ctx.fillStyle = '#a020f0';
    ctx.shadowColor = '#a020f0';
    ctx.font = `bold ${Math.min(W * 0.045, 20)}px 'Courier New', monospace`;
    ctx.fillText(`✦ ${meta.availableEssence} Essence`, W / 2, H * 0.17);
    ctx.restore();

    const cardW = Math.min(W * 0.88, 340);
    const cardH = Math.min(H * 0.09, 64);
    const gap = 8;
    let startY = H * 0.22;

    BOONS.forEach((boon, i) => {
      const cx = W / 2;
      const cy = startY + i * (cardH + gap) + cardH / 2;
      const tier = meta.boonLevels[boon.id] || 0;
      const maxed = tier >= boon.maxTier;
      const canBuy = meta.canPurchase(boon.id);
      const hover = hoverIdx === i;

      ctx.save();
      ctx.shadowBlur = hover ? 22 : 8;
      const c = maxed ? '#888' : (canBuy ? CONFIG.COLORS.gold : '#444');
      ctx.shadowColor = c;
      ctx.strokeStyle = c;
      ctx.lineWidth = hover ? 2.5 : 1.5;
      ctx.fillStyle = hover ? '#1a0a2e' : '#0d0515';
      this._roundRect(ctx, cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10);
      ctx.fill();
      ctx.stroke();

      // Icon
      ctx.font = `${cardH * 0.55}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(boon.icon, cx - cardW / 2 + 12, cy);

      // Name
      ctx.fillStyle = maxed ? '#aaa' : CONFIG.COLORS.starWhite;
      ctx.font = `bold ${Math.min(cardH * 0.25, 15)}px 'Courier New', monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(boon.name, cx - cardW / 2 + cardH * 0.75, cy - cardH * 0.2);

      // Desc
      ctx.font = `${Math.min(cardH * 0.2, 11)}px 'Courier New', monospace`;
      ctx.globalAlpha = 0.7;
      ctx.fillText(boon.desc, cx - cardW / 2 + cardH * 0.75, cy + cardH * 0.1);

      // Tier pips + cost
      ctx.globalAlpha = 1;
      for (let t = 0; t < boon.maxTier; t++) {
        ctx.fillStyle = t < tier ? CONFIG.COLORS.gold : '#333';
        ctx.beginPath();
        ctx.arc(cx + cardW / 2 - cardW * 0.28 + t * 14, cy + cardH * 0.25, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!maxed) {
        ctx.fillStyle = canBuy ? '#a020f0' : '#444';
        ctx.font = `bold ${Math.min(cardH * 0.22, 13)}px 'Courier New', monospace`;
        ctx.textAlign = 'right';
        ctx.fillText(`✦${boon.cost[tier]}`, cx + cardW / 2 - 10, cy + cardH * 0.25);
      } else {
        ctx.fillStyle = CONFIG.COLORS.gold;
        ctx.font = `${Math.min(cardH * 0.22, 12)}px 'Courier New', monospace`;
        ctx.textAlign = 'right';
        ctx.fillText('MAX', cx + cardW / 2 - 10, cy + cardH * 0.25);
      }
      ctx.restore();
    });

    // Back button
    this._drawButton(ctx, W / 2, H * 0.94, 160, 40, '← BACK', CONFIG.COLORS.electricBlue, '#1a0a2e');
  }

  // ── Helpers ────────────────────────────────────────────
  _drawButton(ctx, cx, cy, w, h, label, color, bg, fontSize) {
    const fs = fontSize || Math.min(w * 0.12, 16);
    ctx.save();
    ctx.shadowBlur = 14;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.fillStyle = bg;
    this._roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = `bold ${fs}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy);
    ctx.restore();
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  _drawStarfieldBg(ctx, W, H) {
    ctx.fillStyle = CONFIG.COLORS.deepPurple;
    ctx.fillRect(0, 0, W, H);
    // Static stars (seeded by position)
    ctx.save();
    for (let i = 0; i < 80; i++) {
      const sx = ((i * 137.508 + 42) % 1) * W;
      const sy = ((i * 97.31 + 17) % 1) * H;
      const sr = ((i * 53.1 + 3) % 1) * 1.5 + 0.3;
      const brightness = ((i * 71.3) % 1) * 0.6 + 0.4;
      ctx.globalAlpha = brightness;
      ctx.fillStyle = CONFIG.COLORS.starWhite;
      ctx.beginPath();
      ctx.arc(
        (((i * 137.508 + 42) % W + W) % W),
        (((i * 97.31 + 17) % H + H) % H),
        sr, 0, Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  }

  // ── Virtual Joystick ──────────────────────────────────
  drawJoystick(ctx, joystick, W, H) {
    if (!joystick.active) return;
    const { baseX, baseY, stickX, stickY } = joystick;
    ctx.save();
    ctx.globalAlpha = 0.35;
    // Base circle
    ctx.strokeStyle = CONFIG.COLORS.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(baseX, baseY, joystick.maxRadius, 0, Math.PI * 2);
    ctx.stroke();
    // Stick
    ctx.fillStyle = CONFIG.COLORS.gold;
    ctx.shadowBlur = 14;
    ctx.shadowColor = CONFIG.COLORS.gold;
    ctx.beginPath();
    ctx.arc(stickX, stickY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Hit test helpers for interaction
  hitTestPlayBtn(x, y, W, H) {
    return Math.abs(x - W / 2) < 100 && Math.abs(y - H * 0.52) < 26;
  }
  hitTestBoonsBtn(x, y, W, H) {
    return Math.abs(x - W / 2) < 100 && Math.abs(y - H * 0.65) < 26;
  }
  hitTestCharCard(x, y, W, H, idx) {
    const chars = Object.values(CONFIG.CHARACTERS);
    const cardW = Math.min(W * 0.28, 160);
    const cardH = Math.min(H * 0.45, 260);
    const gap = (W - chars.length * cardW) / (chars.length + 1);
    const cx = gap + idx * (cardW + gap) + cardW / 2;
    const cy = H * 0.52;
    return Math.abs(x - cx) < cardW / 2 && Math.abs(y - cy) < cardH / 2;
  }
  hitTestPauseBtn(x, y) {
    const b = this.pauseBtn;
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  }
  hitTestUpgradeCard(x, y, W, H, idx, total) {
    const cardW = Math.min(W * 0.82, 320);
    const cardH = Math.min(H * 0.16, 90);
    const gap = Math.min(H * 0.025, 16);
    const totalH = total * cardH + (total - 1) * gap;
    const startY = (H - totalH) / 2 + H * 0.05;
    const cy = startY + idx * (cardH + gap) + cardH / 2;
    return Math.abs(x - W / 2) < cardW / 2 && Math.abs(y - cy) < cardH / 2;
  }
  hitTestBoonCard(x, y, W, H, idx) {
    const cardW = Math.min(W * 0.88, 340);
    const cardH = Math.min(H * 0.09, 64);
    const gap = 8;
    const startY = H * 0.22;
    const cy = startY + idx * (cardH + gap) + cardH / 2;
    return Math.abs(x - W / 2) < cardW / 2 && Math.abs(y - cy) < cardH / 2;
  }
  hitTestBackBtn(x, y, W, H) {
    return Math.abs(x - W / 2) < 80 && Math.abs(y - H * 0.94) < 20;
  }
  hitTestPlayAgainBtn(x, y, W, H) {
    return Math.abs(x - W / 2) < 100 && Math.abs(y - H * 0.76) < 26;
  }
  hitTestGameOverBoonsBtn(x, y, W, H) {
    return Math.abs(x - W / 2) < 100 && Math.abs(y - H * 0.88) < 26;
  }
}

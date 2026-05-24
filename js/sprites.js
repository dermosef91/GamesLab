// ============================================================
// SPRITES — Custom canvas-drawn assets, no emoji
// All functions: (ctx, cx, cy, size, color)
// size = bounding radius; color = primary stroke/fill color
// ============================================================

const Sprites = {

  // ── Geometry helpers ──────────────────────────────────────
  _poly(ctx, cx, cy, r, sides, rot = 0) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 + rot;
      i === 0 ? ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
              : ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
  },

  _star(ctx, cx, cy, r1, r2, pts, rot = -Math.PI / 2) {
    ctx.beginPath();
    for (let i = 0; i < pts * 2; i++) {
      const r = i % 2 === 0 ? r1 : r2;
      const a = rot + (i / (pts * 2)) * Math.PI * 2;
      i === 0 ? ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
              : ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
  },

  _diamond(ctx, cx, cy, w, h) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - h);
    ctx.lineTo(cx + w, cy);
    ctx.lineTo(cx, cy + h);
    ctx.lineTo(cx - w, cy);
    ctx.closePath();
  },

  // ── HERO SPRITES ──────────────────────────────────────────

  hero_anansi(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowBlur = s * 0.7; ctx.shadowColor = color;

    // Web: 6 radial lines + 3 concentric hex rings
    ctx.globalAlpha = 0.35; ctx.strokeStyle = color; ctx.lineWidth = s * 0.045;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * s * 0.95, cy + Math.sin(a) * s * 0.95); ctx.stroke();
    }
    for (const rf of [0.32, 0.58, 0.85]) {
      this._poly(ctx, cx, cy, s * rf, 6); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 8 spider legs (4 pairs)
    ctx.lineWidth = s * 0.07;
    const legAngles = [-0.42, -0.88, -1.38, -1.85, 0.42, 0.88, 1.38, 1.85];
    for (const la of legAngles) {
      const bend = la > 0 ? 0.38 : -0.38;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(la) * s * 0.34, cy + Math.sin(la) * s * 0.34);
      ctx.quadraticCurveTo(
        cx + Math.cos(la) * s * 0.68, cy + Math.sin(la) * s * 0.68,
        cx + Math.cos(la + bend) * s * 0.96, cy + Math.sin(la + bend) * s * 0.82
      );
      ctx.stroke();
    }

    // Hex body
    this._poly(ctx, cx, cy, s * 0.38, 6);
    ctx.fillStyle = CONFIG.COLORS.deepPurple; ctx.fill();
    ctx.lineWidth = s * 0.09; ctx.stroke();

    // Glowing center eye
    ctx.shadowBlur = s * 1.2;
    ctx.fillStyle = color; ctx.beginPath();
    ctx.arc(cx, cy, s * 0.13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath();
    ctx.arc(cx, cy, s * 0.05, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  },

  hero_nzinga(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowBlur = s * 0.7; ctx.shadowColor = color;
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.08;

    // Crown: 3 spikes
    const spikeH = [s * 0.38, s * 0.26, s * 0.38];
    for (let i = -1; i <= 1; i++) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx + i * s * 0.29 - s * 0.085, cy - s * 0.44);
      ctx.lineTo(cx + i * s * 0.29 + s * 0.085, cy - s * 0.44);
      ctx.lineTo(cx + i * s * 0.29, cy - s * 0.44 - spikeH[i + 1]);
      ctx.closePath(); ctx.fill();
    }

    // Diamond shield body
    this._diamond(ctx, cx, cy + s * 0.05, s * 0.44, s * 0.52);
    ctx.fillStyle = CONFIG.COLORS.deepPurple; ctx.fill(); ctx.stroke();

    // Inner cross
    ctx.lineWidth = s * 0.055; ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.3); ctx.lineTo(cx, cy + s * 0.28);
    ctx.moveTo(cx - s * 0.26, cy + s * 0.05); ctx.lineTo(cx + s * 0.26, cy + s * 0.05);
    ctx.stroke(); ctx.globalAlpha = 1;

    // Center diamond accent
    this._diamond(ctx, cx, cy + s * 0.05, s * 0.1, s * 0.1);
    ctx.fillStyle = color; ctx.fill();

    ctx.restore();
  },

  hero_kwame(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowBlur = s * 0.6; ctx.shadowColor = color;
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.07;

    // Sound-wave arcs (left)
    ctx.globalAlpha = 0.45;
    for (const rf of [0.52, 0.7, 0.88]) {
      ctx.beginPath();
      ctx.arc(cx - s * 0.12, cy, s * rf, -Math.PI * 0.62, Math.PI * 0.62);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Circle body
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.COLORS.deepPurple; ctx.fill();
    ctx.lineWidth = s * 0.08; ctx.stroke();

    // EQ bars
    const bH = [0.55, 0.85, 1.0, 0.72, 0.45];
    ctx.lineCap = 'round'; ctx.lineWidth = s * 0.065;
    for (let i = 0; i < 5; i++) {
      const bx = cx - s * 0.17 + i * s * 0.085;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.7 + 0.3 * bH[i];
      ctx.beginPath();
      ctx.moveTo(bx, cy + s * 0.14);
      ctx.lineTo(bx, cy + s * 0.14 - s * 0.24 * bH[i]);
      ctx.stroke();
    }
    ctx.lineCap = 'butt'; ctx.globalAlpha = 1;

    // Top accent
    ctx.fillStyle = color; ctx.shadowBlur = s * 0.9;
    ctx.beginPath(); ctx.arc(cx, cy - s * 0.42, s * 0.1, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  },

  // ── ENEMY SPRITES ─────────────────────────────────────────

  enemy_voidCrawler(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowBlur = s * 0.6; ctx.shadowColor = color;
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.08;

    // 6 angular legs
    const legA = [-0.75, -1.25, Math.PI + 0.45, -1.85, 0.75, 1.25];
    for (const a of legA) {
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * s * 0.32, cy + Math.sin(a) * s * 0.32);
      ctx.lineTo(cx + Math.cos(a) * s * 0.62, cy + Math.sin(a) * s * 0.54);
      ctx.lineTo(cx + Math.cos(a + 0.48) * s * 0.9, cy + Math.sin(a + 0.48) * s * 0.74);
      ctx.stroke();
    }

    // Mandibles
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + side * s * 0.18, cy - s * 0.24);
      ctx.quadraticCurveTo(cx + side * s * 0.52, cy - s * 0.52, cx + side * s * 0.33, cy - s * 0.78);
      ctx.stroke();
    }

    // Pentagon body
    this._poly(ctx, cx, cy, s * 0.36, 5, -Math.PI / 2);
    ctx.fillStyle = '#100020'; ctx.fill(); ctx.stroke();

    // Eye
    ctx.shadowBlur = s; ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx, cy - s * 0.07, s * 0.11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy - s * 0.07, s * 0.04, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  },

  enemy_dataWraith(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowBlur = s * 0.5; ctx.shadowColor = color;
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.07;

    // Ghost silhouette
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.1, s * 0.38, Math.PI, 0);
    ctx.lineTo(cx + s * 0.38, cy + s * 0.32);
    const waves = 4;
    for (let i = waves; i >= 0; i--) {
      const wx = cx - s * 0.38 + (i / waves) * s * 0.76;
      const wy = cy + s * 0.32 + (i % 2 === 0 ? s * 0.11 : -s * 0.05);
      ctx.lineTo(wx, wy);
    }
    ctx.closePath();
    ctx.fillStyle = '#08081a'; ctx.fill(); ctx.stroke();

    // Scanlines
    ctx.globalAlpha = 0.45; ctx.lineWidth = s * 0.045;
    for (let i = 0; i < 4; i++) {
      const ly = cy - s * 0.22 + i * s * 0.12;
      const off = (i % 2) * s * 0.07;
      ctx.beginPath(); ctx.moveTo(cx - s * 0.26 + off, ly); ctx.lineTo(cx + s * 0.26 - off, ly); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Hollow eyes
    ctx.fillStyle = color; ctx.shadowBlur = s * 0.9;
    for (const ex of [-s * 0.12, s * 0.12]) {
      ctx.beginPath(); ctx.ellipse(cx + ex, cy - s * 0.17, s * 0.075, s * 0.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#08081a';
      ctx.beginPath(); ctx.ellipse(cx + ex, cy - s * 0.17, s * 0.035, s * 0.05, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color;
    }

    ctx.restore();
  },

  enemy_chronoGolem(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowBlur = s * 0.4; ctx.shadowColor = color;
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.065;

    // Gear body (octagon with notched teeth)
    ctx.beginPath();
    const teeth = 8;
    for (let i = 0; i < teeth * 2; i++) {
      const r = i % 2 === 0 ? s * 0.48 : s * 0.38;
      const a = (i / (teeth * 2)) * Math.PI * 2;
      i === 0 ? ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
              : ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = '#0a0a18'; ctx.fill(); ctx.stroke();

    // Clock ring
    ctx.globalAlpha = 0.5; ctx.lineWidth = s * 0.045;
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2); ctx.stroke();
    // 12 tick marks
    ctx.lineWidth = s * 0.055;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r1 = i % 3 === 0 ? s * 0.24 : s * 0.27;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * s * 0.3, cy + Math.sin(a) * s * 0.3); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Clock hands
    ctx.lineWidth = s * 0.075;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + s * 0.2, cy - s * 0.08); ctx.stroke();
    ctx.lineWidth = s * 0.055;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - s * 0.04, cy + s * 0.22); ctx.stroke();

    // Center dot
    ctx.fillStyle = color; ctx.shadowBlur = s * 0.6;
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.065, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  },

  enemy_soulHarvester(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowBlur = s * 0.5; ctx.shadowColor = color;
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.07;

    // Scythe
    ctx.beginPath();
    ctx.arc(cx + s * 0.28, cy - s * 0.38, s * 0.38, Math.PI * 0.72, Math.PI * 1.38);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.08, cy - s * 0.12);
    ctx.lineTo(cx + s * 0.52, cy - s * 0.72); ctx.stroke();

    // Hourglass body
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.28, cy - s * 0.4);
    ctx.lineTo(cx + s * 0.28, cy - s * 0.4);
    ctx.lineTo(cx + s * 0.07, cy);
    ctx.lineTo(cx + s * 0.28, cy + s * 0.4);
    ctx.lineTo(cx - s * 0.28, cy + s * 0.4);
    ctx.lineTo(cx - s * 0.07, cy);
    ctx.closePath();
    ctx.fillStyle = '#150010'; ctx.fill(); ctx.stroke();

    // Skull (top half circle)
    ctx.fillStyle = color; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(cx, cy - s * 0.22, s * 0.13, 0, Math.PI * 2); ctx.fill();
    // Eye sockets
    ctx.fillStyle = '#150010'; ctx.globalAlpha = 1;
    for (const ex of [-s * 0.05, s * 0.05]) {
      ctx.beginPath(); ctx.arc(cx + ex, cy - s * 0.23, s * 0.038, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
  },

  enemy_corruptedDjinn(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowBlur = s * 0.5; ctx.shadowColor = color;
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.07;

    // Flame body
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.52);
    ctx.quadraticCurveTo(cx + s * 0.42, cy - s * 0.18, cx + s * 0.32, cy + s * 0.22);
    ctx.quadraticCurveTo(cx + s * 0.14, cy + s * 0.42, cx, cy + s * 0.46);
    ctx.quadraticCurveTo(cx - s * 0.14, cy + s * 0.42, cx - s * 0.32, cy + s * 0.22);
    ctx.quadraticCurveTo(cx - s * 0.42, cy - s * 0.18, cx, cy - s * 0.52);
    ctx.fillStyle = '#100010'; ctx.fill(); ctx.stroke();

    // Corruption rectangles
    ctx.fillStyle = color; ctx.globalAlpha = 0.55;
    ctx.fillRect(cx - s * 0.24, cy - s * 0.1, s * 0.17, s * 0.1);
    ctx.fillRect(cx + s * 0.06, cy + s * 0.05, s * 0.15, s * 0.09);
    ctx.fillRect(cx - s * 0.1, cy - s * 0.3, s * 0.13, s * 0.08);
    ctx.globalAlpha = 1;

    // Eye slit
    ctx.fillStyle = color; ctx.shadowBlur = s * 0.9;
    ctx.beginPath();
    ctx.ellipse(cx, cy - s * 0.08, s * 0.15, s * 0.055, 0, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  },

  // ── BOSS SPRITES ──────────────────────────────────────────

  enemy_nullKing(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowBlur = s * 0.5; ctx.shadowColor = color;
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.055;

    // Void tendrils
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * s * 0.44, cy + Math.sin(a) * s * 0.44);
      ctx.lineTo(cx + Math.cos(a) * s * 0.82, cy + Math.sin(a) * s * 0.78); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Octagon body
    this._poly(ctx, cx, cy + s * 0.06, s * 0.43, 8);
    ctx.fillStyle = '#0d0020'; ctx.fill(); ctx.stroke();

    // 5 crown spikes
    const spH = [s * 0.38, s * 0.24, s * 0.42, s * 0.24, s * 0.38];
    for (let i = 0; i < 5; i++) {
      const bx = cx - s * 0.38 + i * s * 0.19;
      const by = cy - s * 0.32;
      ctx.fillStyle = color; ctx.beginPath();
      ctx.moveTo(bx - s * 0.065, by); ctx.lineTo(bx + s * 0.065, by);
      ctx.lineTo(bx, by - spH[i]); ctx.closePath(); ctx.fill();
    }

    // Void symbol (circle + cross)
    ctx.globalAlpha = 0.7; ctx.lineWidth = s * 0.06;
    ctx.beginPath(); ctx.arc(cx, cy + s * 0.08, s * 0.22, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.22, cy + s * 0.08); ctx.lineTo(cx + s * 0.22, cy + s * 0.08);
    ctx.moveTo(cx, cy - s * 0.14); ctx.lineTo(cx, cy + s * 0.3); ctx.stroke();
    ctx.globalAlpha = 1;

    // Eyes
    ctx.fillStyle = color; ctx.shadowBlur = s;
    for (const ex of [-s * 0.12, s * 0.12]) {
      ctx.beginPath(); ctx.arc(cx + ex, cy + s * 0.04, s * 0.075, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
  },

  enemy_entropyDrake(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowBlur = s * 0.5; ctx.shadowColor = color;
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.055;

    // Angular dragon head
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.44, cy + s * 0.16);
    ctx.lineTo(cx - s * 0.14, cy - s * 0.4);
    ctx.lineTo(cx + s * 0.1, cy - s * 0.46);
    ctx.lineTo(cx + s * 0.44, cy - s * 0.1);
    ctx.lineTo(cx + s * 0.46, cy + s * 0.22);
    ctx.lineTo(cx + s * 0.14, cy + s * 0.44);
    ctx.lineTo(cx - s * 0.22, cy + s * 0.44);
    ctx.closePath();
    ctx.fillStyle = '#140000'; ctx.fill(); ctx.stroke();

    // Crest spikes
    const crests = [[-s * 0.28, -s * 0.42, -s * 0.32, -s * 0.74], [-s * 0.04, -s * 0.46, -s * 0.01, -s * 0.78], [s * 0.14, -s * 0.4, s * 0.16, -s * 0.68]];
    ctx.fillStyle = color;
    for (const [bx, by, tx, ty] of crests) {
      ctx.beginPath();
      ctx.moveTo(cx + bx - s * 0.06, cy + by); ctx.lineTo(cx + bx + s * 0.06, cy + by);
      ctx.lineTo(cx + tx, cy + ty); ctx.closePath(); ctx.fill();
    }

    // Teeth
    ctx.globalAlpha = 0.6; ctx.lineWidth = s * 0.05;
    for (let i = 0; i < 3; i++) {
      const tx = cx + s * (0.14 + i * 0.1);
      ctx.beginPath(); ctx.moveTo(tx, cy + s * 0.28); ctx.lineTo(tx, cy + s * 0.44); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Eye slit
    ctx.fillStyle = color; ctx.shadowBlur = s;
    ctx.beginPath();
    ctx.ellipse(cx + s * 0.18, cy + s * 0.06, s * 0.13, s * 0.042, Math.PI * 0.18, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  },

  // ── WEAPON ICONS ──────────────────────────────────────────

  weapon_ancestralSpear(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowBlur = s * 0.6; ctx.shadowColor = color;
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.1; ctx.lineCap = 'round';

    // Shaft
    ctx.beginPath(); ctx.moveTo(cx - s * 0.48, cy + s * 0.48); ctx.lineTo(cx + s * 0.38, cy - s * 0.38); ctx.stroke();

    // Blade tip
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.36, cy - s * 0.36); ctx.lineTo(cx + s * 0.16, cy - s * 0.58);
    ctx.lineTo(cx + s * 0.58, cy - s * 0.54); ctx.closePath(); ctx.fill();

    // Crossguard
    ctx.lineWidth = s * 0.08;
    ctx.beginPath(); ctx.moveTo(cx - s * 0.1, cy + s * 0.1); ctx.lineTo(cx + s * 0.18, cy - s * 0.18); ctx.stroke();

    // Diamond pattern
    ctx.globalAlpha = 0.55; ctx.lineWidth = s * 0.06;
    this._diamond(ctx, cx - s * 0.12, cy + s * 0.12, s * 0.1, s * 0.1); ctx.stroke();

    ctx.lineCap = 'butt'; ctx.restore();
  },

  weapon_thunderDrum(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowBlur = s * 0.6; ctx.shadowColor = color;
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.09;

    // Sound wave rings
    ctx.globalAlpha = 0.35;
    for (const rf of [0.62, 0.78]) {
      ctx.beginPath(); ctx.arc(cx, cy, s * rf, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Drum circle
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.46, 0, Math.PI * 2); ctx.stroke();

    // Cross
    ctx.lineWidth = s * 0.08;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.38, cy); ctx.lineTo(cx + s * 0.38, cy);
    ctx.moveTo(cx, cy - s * 0.38); ctx.lineTo(cx, cy + s * 0.38); ctx.stroke();

    // Cardinal dots
    ctx.fillStyle = color;
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      ctx.beginPath(); ctx.arc(cx + dx * s * 0.28, cy + dy * s * 0.28, s * 0.08, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
  },

  weapon_kente(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowBlur = s * 0.6; ctx.shadowColor = color;
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.08;

    // Outer diamond
    this._diamond(ctx, cx, cy, s * 0.52, s * 0.52); ctx.stroke();

    // 3×3 inner diamond grid
    ctx.lineWidth = s * 0.055; ctx.globalAlpha = 0.65;
    const cell = s * 0.22;
    for (let row = -1; row <= 1; row++) {
      for (let col = -1; col <= 1; col++) {
        if (Math.abs(row) + Math.abs(col) <= 1) {
          this._diamond(ctx, cx + col * cell, cy + row * cell, cell * 0.38, cell * 0.38);
          if ((row + col) % 2 === 0) { ctx.fillStyle = color; ctx.globalAlpha = 0.38; ctx.fill(); ctx.globalAlpha = 0.65; }
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  },

  weapon_solarOrbs(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowBlur = s * 0.6; ctx.shadowColor = color;
    ctx.fillStyle = color;

    // 8 triangular rays
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.globalAlpha = i % 2 === 0 ? 0.9 : 0.5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * s * 0.3, cy + Math.sin(a) * s * 0.3);
      ctx.lineTo(cx + Math.cos(a - 0.22) * s * 0.56, cy + Math.sin(a - 0.22) * s * 0.56);
      ctx.lineTo(cx + Math.cos(a + 0.22) * s * 0.56, cy + Math.sin(a + 0.22) * s * 0.56);
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Inner circle
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.COLORS.deepPurple; ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.08; ctx.stroke();
    // Core dot
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx, cy, s * 0.1, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  },

  weapon_voidBlades(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowBlur = s * 0.6; ctx.shadowColor = color;
    ctx.fillStyle = color;

    // Two crossed blades
    for (const angle of [Math.PI / 4, -Math.PI / 4]) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
      // Blade rect
      ctx.fillRect(-s * 0.46, -s * 0.09, s * 0.92, s * 0.18);
      // Pointed tips
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * s * 0.46, -s * 0.09);
        ctx.lineTo(side * s * 0.62, 0);
        ctx.lineTo(side * s * 0.46, s * 0.09);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    // Center hole
    ctx.fillStyle = CONFIG.COLORS.deepPurple;
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.05;
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.11, 0, Math.PI * 2); ctx.stroke();

    ctx.restore();
  },

  weapon_nanoSwarm(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowBlur = s * 0.5; ctx.shadowColor = color;

    const pts = [[0,0],[0.36,-0.2],[-0.36,-0.2],[0.22,0.32],[-0.22,0.32],[0.52,0.1],[-0.52,0.1]];

    // Circuit lines
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.045; ctx.globalAlpha = 0.4;
    for (let i = 1; i < pts.length; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + pts[0][0] * s, cy + pts[0][1] * s);
      ctx.lineTo(cx + pts[i][0] * s, cy + pts[i][1] * s); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = color;
    for (let i = 0; i < pts.length; i++) {
      const r = i === 0 ? s * 0.1 : s * 0.07;
      ctx.beginPath(); ctx.arc(cx + pts[i][0] * s, cy + pts[i][1] * s, r, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
  },

  weapon_gravitonStaff(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowBlur = s * 0.6; ctx.shadowColor = color;
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.08;

    // Archimedean spiral
    ctx.beginPath();
    let first = true;
    for (let t = 0; t <= Math.PI * 3.6; t += 0.1) {
      const r = (t / (Math.PI * 3.6)) * s * 0.5;
      const px = cx + Math.cos(t) * r, py = cy + Math.sin(t) * r;
      first ? ctx.moveTo(px, py) : ctx.lineTo(px, py); first = false;
    }
    ctx.stroke();

    // Dot at spiral end
    const ea = Math.PI * 3.6, er = s * 0.5;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx + Math.cos(ea) * er, cy + Math.sin(ea) * er, s * 0.1, 0, Math.PI * 2); ctx.fill();
    // Center
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.09, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  },

  weapon_ancestorVoice(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.shadowBlur = s * 0.6; ctx.shadowColor = color;
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.08;

    // 3 concentric circles
    for (let i = 1; i <= 3; i++) {
      ctx.globalAlpha = 1 - (i - 1) * 0.26;
      ctx.beginPath(); ctx.arc(cx, cy, s * i * 0.18, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 6 radial accents (outer ring)
    ctx.lineWidth = s * 0.055;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * s * 0.38, cy + Math.sin(a) * s * 0.38);
      ctx.lineTo(cx + Math.cos(a) * s * 0.54, cy + Math.sin(a) * s * 0.54); ctx.stroke();
    }

    // 4-point center star
    ctx.fillStyle = color;
    this._star(ctx, cx, cy, s * 0.13, s * 0.07, 4); ctx.fill();

    ctx.restore();
  },

  // ── PASSIVE / BOON ICONS ──────────────────────────────────

  passive_vitality(ctx, cx, cy, s, color) {
    ctx.save(); ctx.fillStyle = color;
    ctx.shadowBlur = s * 0.6; ctx.shadowColor = color;
    // Two top diamonds + bottom triangle = geometric heart
    this._diamond(ctx, cx - s * 0.18, cy - s * 0.04, s * 0.22, s * 0.22); ctx.fill();
    this._diamond(ctx, cx + s * 0.18, cy - s * 0.04, s * 0.22, s * 0.22); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.38, cy + s * 0.04); ctx.lineTo(cx + s * 0.38, cy + s * 0.04);
    ctx.lineTo(cx, cy + s * 0.46); ctx.closePath(); ctx.fill();
    ctx.restore();
  },

  passive_swiftness(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.09; ctx.lineCap = 'round';
    ctx.shadowBlur = s * 0.5; ctx.shadowColor = color;
    for (let i = 0; i < 3; i++) {
      const ox = cx - s * 0.3 + i * s * 0.22;
      ctx.beginPath();
      ctx.moveTo(ox, cy - s * 0.3); ctx.lineTo(ox + s * 0.22, cy); ctx.lineTo(ox, cy + s * 0.3); ctx.stroke();
    }
    ctx.lineCap = 'butt'; ctx.restore();
  },

  passive_magnet(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.09;
    ctx.shadowBlur = s * 0.5; ctx.shadowColor = color;
    // Horseshoe
    ctx.beginPath(); ctx.arc(cx, cy - s * 0.04, s * 0.3, Math.PI, 0); ctx.lineTo(cx + s * 0.3, cy + s * 0.42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - s * 0.3, cy - s * 0.04); ctx.lineTo(cx - s * 0.3, cy + s * 0.42); ctx.stroke();
    // Poles
    ctx.lineWidth = s * 0.14; ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.3, cy + s * 0.28); ctx.lineTo(cx - s * 0.3, cy + s * 0.44);
    ctx.moveTo(cx + s * 0.3, cy + s * 0.28); ctx.lineTo(cx + s * 0.3, cy + s * 0.44); ctx.stroke();
    // Field dots
    ctx.globalAlpha = 0.45; ctx.fillStyle = color;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.arc(cx - s * 0.5 + i * s * 0.5, cy - s * 0.04, s * 0.045, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  },

  passive_armor(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.09;
    ctx.shadowBlur = s * 0.5; ctx.shadowColor = color;
    this._poly(ctx, cx, cy - s * 0.04, s * 0.46, 6);
    ctx.fillStyle = CONFIG.COLORS.deepPurple; ctx.fill(); ctx.stroke();
    ctx.lineWidth = s * 0.07; ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.32); ctx.lineTo(cx, cy + s * 0.26);
    ctx.moveTo(cx - s * 0.26, cy - s * 0.04); ctx.lineTo(cx + s * 0.26, cy - s * 0.04); ctx.stroke();
    ctx.restore();
  },

  passive_cooldown(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.08;
    ctx.shadowBlur = s * 0.5; ctx.shadowColor = color;
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.44, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = s * 0.06;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r1 = i % 3 === 0 ? s * 0.28 : s * 0.32;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * s * 0.4, cy + Math.sin(a) * s * 0.4); ctx.stroke();
    }
    // Lightning bolt overlay
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.06, cy - s * 0.26); ctx.lineTo(cx - s * 0.1, cy + s * 0.04);
    ctx.lineTo(cx + s * 0.04, cy + s * 0.04); ctx.lineTo(cx - s * 0.06, cy + s * 0.26);
    ctx.lineTo(cx + s * 0.14, cy - s * 0.04); ctx.lineTo(cx + s * 0.0, cy - s * 0.04);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  },

  passive_area(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.08;
    ctx.shadowBlur = s * 0.5; ctx.shadowColor = color;
    // Inner hex (semi-filled)
    this._poly(ctx, cx, cy, s * 0.3, 6);
    ctx.fillStyle = color; ctx.globalAlpha = 0.45; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
    // Outer hex (dashed)
    ctx.setLineDash([s * 0.09, s * 0.07]);
    this._poly(ctx, cx, cy, s * 0.5, 6); ctx.stroke();
    ctx.setLineDash([]);
    // 3 outward arrows
    ctx.lineWidth = s * 0.07;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 - Math.PI / 6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * s * 0.34, cy + Math.sin(a) * s * 0.34);
      ctx.lineTo(cx + Math.cos(a) * s * 0.54, cy + Math.sin(a) * s * 0.54); ctx.stroke();
    }
    ctx.restore();
  },

  // ── BOON-SPECIFIC ICONS ───────────────────────────────────

  boon_hp(ctx, cx, cy, s, color)     { this.passive_vitality(ctx, cx, cy, s, color); },
  boon_xp(ctx, cx, cy, s, color) {
    ctx.save(); ctx.shadowBlur = s * 0.6; ctx.shadowColor = color;
    this._star(ctx, cx, cy, s * 0.48, s * 0.2, 5);
    ctx.fillStyle = color; ctx.globalAlpha = 0.85; ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.06; ctx.globalAlpha = 1; ctx.stroke();
    ctx.restore();
  },
  boon_speed(ctx, cx, cy, s, color)  { this.passive_swiftness(ctx, cx, cy, s, color); },
  boon_armor(ctx, cx, cy, s, color)  { this.passive_armor(ctx, cx, cy, s, color); },
  boon_magnet(ctx, cx, cy, s, color) {
    ctx.save(); ctx.shadowBlur = s * 0.5; ctx.shadowColor = color;
    this._diamond(ctx, cx, cy, s * 0.3, s * 0.3);
    ctx.fillStyle = color; ctx.globalAlpha = 0.82; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.07;
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * s * 0.38, cy + Math.sin(a) * s * 0.38);
      ctx.lineTo(cx + Math.cos(a) * s * 0.55, cy + Math.sin(a) * s * 0.55); ctx.stroke();
    }
    ctx.restore();
  },
  boon_nzinga(ctx, cx, cy, s, color) { this.hero_nzinga(ctx, cx, cy, s * 0.82, color || CONFIG.COLORS.gold); },
  boon_kwame(ctx, cx, cy, s, color)  { this.hero_kwame(ctx, cx, cy, s * 0.82, color || CONFIG.COLORS.amber); },

  // ── HP BAR ICON ───────────────────────────────────────────
  hpIcon(ctx, cx, cy, s) { this.passive_vitality(ctx, cx, cy, s, '#ff3333'); },

  // ── DISPATCHERS ───────────────────────────────────────────
  // dir: 'front'|'side'|'sideLeft'|'back'   frame: 'idle'|'walk1'|'walk2'
  drawHero(ctx, id, cx, cy, size, color, dir = 'front', frame = 'idle') {
    // Try preloaded image sprite first
    if (typeof SpriteLoader !== 'undefined' && SpriteLoader.hasSheet(id)) {
      if (SpriteLoader.draw(ctx, id, dir, frame, cx, cy, size)) return;
    }
    // Canvas fallback
    const fn = this[`hero_${id}`]; if (fn) fn.call(this, ctx, cx, cy, size, color);
  },
  drawEnemy(ctx, id, cx, cy, size, color, dir = 'front', frame = 'idle') {
    // Try preloaded image sprite first
    if (typeof SpriteLoader !== 'undefined' && SpriteLoader.hasSheet(id)) {
      if (SpriteLoader.draw(ctx, id, dir, frame, cx, cy, size)) return;
    }
    // Canvas fallback
    const fn = this[`enemy_${id}`]; if (fn) fn.call(this, ctx, cx, cy, size, color);
  },
  drawWeapon(ctx, id, cx, cy, size, color) {
    const fn = this[`weapon_${id}`]; if (fn) fn.call(this, ctx, cx, cy, size, color);
  },
  drawPassive(ctx, id, cx, cy, size, color) {
    const fn = this[`passive_${id}`]; if (fn) fn.call(this, ctx, cx, cy, size, color);
  },
  drawBoon(ctx, id, cx, cy, size, color) {
    const fn = this[`boon_${id}`];
    if (fn) fn.call(this, ctx, cx, cy, size, color);
    else { this._diamond(ctx, cx, cy, size * 0.38, size * 0.38); ctx.fillStyle = color || '#fff'; ctx.fill(); }
  },
  drawChoice(ctx, choice, cx, cy, size) {
    if (choice.type === 'weapon' || choice.type === 'newWeapon') {
      this.drawWeapon(ctx, choice.weaponId, cx, cy, size, choice.color);
    } else if (choice.type === 'passive') {
      this.drawPassive(ctx, choice.passiveId, cx, cy, size, choice.color);
    }
  },
};

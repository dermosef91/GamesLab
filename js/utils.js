// ============================================================
// UTILS — Math helpers, collision, object pool
// ============================================================

const Utils = {
  // Random float in [min, max)
  rand(min, max) { return Math.random() * (max - min) + min; },
  randInt(min, max) { return Math.floor(this.rand(min, max + 1)); },
  randFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

  // Clamp
  clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },

  // Distance squared (cheaper)
  dist2(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
  },
  dist(ax, ay, bx, by) { return Math.sqrt(this.dist2(ax, ay, bx, by)); },

  // Normalize a vector
  normalize(dx, dy) {
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: dx / len, y: dy / len };
  },

  // Angle between two points (radians)
  angle(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); },

  // Lerp
  lerp(a, b, t) { return a + (b - a) * t; },

  // Degrees → radians
  toRad(deg) { return deg * Math.PI / 180; },

  // Pick N unique items from array
  pickN(arr, n) {
    const copy = [...arr];
    const result = [];
    for (let i = 0; i < n && copy.length > 0; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      result.push(copy.splice(idx, 1)[0]);
    }
    return result;
  },

  // Circle-circle collision
  circleOverlap(ax, ay, ar, bx, by, br) {
    return this.dist2(ax, ay, bx, by) < (ar + br) * (ar + br);
  },

  // Format time as MM:SS
  formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  },

  // Ease-out quad
  easeOut(t) { return 1 - (1 - t) * (1 - t); },

  // Get spawn position off-screen relative to camera
  offscreenSpawn(camX, camY, viewW, viewH, margin = 60) {
    const side = Math.floor(Math.random() * 4);
    switch (side) {
      case 0: return { x: Utils.rand(camX - viewW / 2 - margin, camX + viewW / 2 + margin), y: camY - viewH / 2 - margin };
      case 1: return { x: Utils.rand(camX - viewW / 2 - margin, camX + viewW / 2 + margin), y: camY + viewH / 2 + margin };
      case 2: return { x: camX - viewW / 2 - margin, y: Utils.rand(camY - viewH / 2 - margin, camY + viewH / 2 + margin) };
      default: return { x: camX + viewW / 2 + margin, y: Utils.rand(camY - viewH / 2 - margin, camY + viewH / 2 + margin) };
    }
  },

  // Draw a glowing circle on canvas context
  glowCircle(ctx, x, y, r, color, glowSize = 15) {
    ctx.save();
    ctx.shadowBlur = glowSize;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  },

  // HSL string
  hsl(h, s, l) { return `hsl(${h},${s}%,${l}%)`; },
};

// ============================================================
// Simple object pool
// ============================================================
class ObjectPool {
  constructor(factory, reset, initialSize = 50) {
    this._factory = factory;
    this._reset = reset;
    this._pool = [];
    for (let i = 0; i < initialSize; i++) {
      this._pool.push(factory());
    }
  }

  acquire(...args) {
    const obj = this._pool.length > 0 ? this._pool.pop() : this._factory();
    this._reset(obj, ...args);
    obj.active = true;
    return obj;
  }

  release(obj) {
    obj.active = false;
    this._pool.push(obj);
  }
}

/* global Utils, CONFIG */
const Utils = {

  rand(min, max) { return min + Math.random() * (max - min); },
  randInt(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); },
  randFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  clamp(v, min, max) { return Math.min(max, Math.max(min, v)); },
  lerp(a, b, t) { return a + (b - a) * t; },
  dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); },
  rollChance(pct) { return Math.random() < pct; },

  speedOrder(actors) {
    return [...actors].sort((a, b) => (b.spd || b.speed || 0) - (a.spd || a.speed || 0));
  },

  saveGame(state) {
    try {
      localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(state));
    } catch (_) {}
  },

  loadGame() {
    try {
      const raw = localStorage.getItem(CONFIG.SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  },

  clearSave() {
    try { localStorage.removeItem(CONFIG.SAVE_KEY); } catch (_) {}
  },

  hasSave() {
    return !!localStorage.getItem(CONFIG.SAVE_KEY);
  },

  typewriter(text, element, speed, onDone) {
    let i = 0;
    element.textContent = '';
    const interval = setInterval(() => {
      if (i < text.length) {
        element.textContent += text[i++];
      } else {
        clearInterval(interval);
        if (onDone) onDone();
      }
    }, speed);
    return { cancel: () => { clearInterval(interval); element.textContent = text; } };
  },

  // Snap text immediately (used when user taps during typewriter)
  snapTypewriter(handle, text, element) {
    if (handle) handle.cancel();
    element.textContent = text;
  },

  // Convert hex color int to CSS string
  hexToCss(hex) {
    return '#' + hex.toString(16).padStart(6, '0');
  },

  // Map a value 0–1 → 0–1 with easeOut
  easeOut(t) { return 1 - Math.pow(1 - t, 3); },

  formatHp(hp, maxHp) { return `${Math.max(0, Math.ceil(hp))}/${maxHp}`; },
};

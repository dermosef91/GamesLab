// ============================================================
// SPRITE LOADER — preloads all generated sprite sheets,
// exposes SpriteLoader.draw(ctx, charId, dir, frame, cx, cy, size)
// Returns true if drawn from image, false if image not ready.
// ============================================================

const SpriteLoader = (() => {
  // All character IDs that have sprite sheets in assets/sprites/
  const CHAR_IDS = [
    'anansi', 'nzinga', 'kwame',
    'voidCrawler', 'dataWraith', 'chronoGolem',
    'soulHarvester', 'corruptedDjinn',
    'nullKing', 'entropyDrake',
  ];

  // Sprite sheet grid layout
  // Columns: idle=0, walk1=1, walk2=2
  // Rows:    front=0, side=1, back=2
  const COL = { idle: 0, walk1: 1, walk2: 2 };
  const ROW = { front: 0, side: 1, sideLeft: 1, back: 2 };

  const _sheets = {};
  let _loaded = 0;
  let _total = 0;
  let _ready = false;

  function load(basePath = 'assets/sprites') {
    _total = CHAR_IDS.length;
    _loaded = 0;
    _ready = false;

    for (const id of CHAR_IDS) {
      const img = new Image();
      img.src = `${basePath}/${id}.png`;

      img.onload = () => {
        _loaded++;
        if (_loaded >= _total) {
          _ready = true;
          console.log(`SpriteLoader: all ${_total} sprite sheets loaded ✓`);
        } else {
          console.log(`SpriteLoader: ${_loaded}/${_total} loaded (${id})`);
        }
      };

      img.onerror = () => {
        // Not all sheets may exist during development — silently skip
        _loaded++;
        if (_loaded >= _total) {
          _ready = (_loaded === _total);
          const loaded = Object.values(_sheets).filter(i => i.complete && i.naturalWidth > 0).length;
          console.log(`SpriteLoader: ${loaded}/${_total} sheets available (canvas fallback for missing)`);
        }
      };

      _sheets[id] = img;
    }
  }

  /**
   * Draw a character sprite from the preloaded sheet.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} charId   — e.g. 'anansi', 'voidCrawler'
   * @param {string} dir      — 'front' | 'side' | 'sideLeft' | 'back'
   * @param {string} frame    — 'idle' | 'walk1' | 'walk2'
   * @param {number} cx       — center x in canvas coords
   * @param {number} cy       — center y in canvas coords
   * @param {number} size     — half-width of drawn sprite (sprite fills size*2 × size*2)
   * @returns {boolean}       — true if drawn, false if sheet not ready
   */
  function draw(ctx, charId, dir, frame, cx, cy, size) {
    const img = _sheets[charId];
    if (!img || !img.complete || img.naturalWidth === 0) return false;

    const col = COL[frame] ?? COL.idle;
    const row = ROW[dir]   ?? ROW.front;

    const cw = img.naturalWidth  / 3;
    const ch = img.naturalHeight / 3;

    const sx = col * cw;
    const sy = row * ch;
    const d  = size * 2;

    ctx.save();

    if (dir === 'sideLeft') {
      // Mirror horizontally for left-facing side sprites
      ctx.translate(cx, cy);
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, sy, cw, ch, -size, -size, d, d);
    } else {
      ctx.drawImage(img, sx, sy, cw, ch, cx - size, cy - size, d, d);
    }

    ctx.restore();
    return true;
  }

  /** True once all image load/error events have fired */
  function isReady() { return _ready; }

  /** True if at least one sheet for charId is usable */
  function hasSheet(charId) {
    const img = _sheets[charId];
    return !!(img && img.complete && img.naturalWidth > 0);
  }

  return { load, draw, isReady, hasSheet, CHAR_IDS };
})();

/* global UI, CONFIG, Utils */

class UI {
  constructor(game) {
    this.game       = game;
    this.hudCanvas  = document.getElementById('hudCanvas');
    this.hudCtx     = this.hudCanvas.getContext('2d');
    this.battleUI   = document.getElementById('battleUI');
    this.partyStatus = document.getElementById('partyStatus');
    this.battleLog  = document.getElementById('battleLog');
    this.actionMenu = document.getElementById('actionMenu');

    // Floating text queue
    this.floatingTexts = [];

    this._resizeHud();
    window.addEventListener('resize', () => this._resizeHud());
  }

  _resizeHud() {
    this.hudCanvas.width  = window.innerWidth  * (window.devicePixelRatio || 1);
    this.hudCanvas.height = window.innerHeight * (window.devicePixelRatio || 1);
    this.hudCanvas.style.width  = window.innerWidth  + 'px';
    this.hudCanvas.style.height = window.innerHeight + 'px';
    this.hudCtx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  }

  // ─── HUD Rendering ─────────────────────────────────────────────────────────

  renderHud(state, chapterTitle, locationName) {
    const ctx = this.hudCtx;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    if (state === 'explore') {
      this._drawWorldHud(ctx, chapterTitle, locationName);
    } else if (state === 'battle') {
      this._drawBattleHud(ctx);
    }

    this._updateFloatingTexts(ctx);
  }

  _drawWorldHud(ctx, chapterTitle, locationName) {
    ctx.save();
    // Chapter title (top center)
    ctx.font = 'bold 12px Courier New';
    ctx.fillStyle = 'rgba(0,255,255,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText(chapterTitle || '', window.innerWidth / 2, 22);

    ctx.font = '10px Courier New';
    ctx.fillStyle = 'rgba(153,102,255,0.6)';
    ctx.fillText(locationName || '', window.innerWidth / 2, 36);

    // Mini legend bottom-right
    ctx.font = '9px Courier New';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'right';
    ctx.fillText('TAP FLOOR TO MOVE', window.innerWidth - 12, window.innerHeight - 12);
    ctx.restore();
  }

  _drawBattleHud(ctx) {
    // Enemy HP bars drawn above enemy positions in 3D space (approximate screen positions)
    // We use fixed layout since Three.js projection would require extra setup
    const container = document.getElementById('gameContainer');
    const w = container.clientWidth;
    const h = container.clientHeight;
    const battleH = h * 0.60; // battle scene takes 60% of screen

    const enemyCount = this.game.battle.enemies.filter(e => e.isAlive || e.hp <= 0).length;
    const xPositions = enemyCount === 1 ? [w / 2] :
                       enemyCount === 2 ? [w * 0.3, w * 0.7] :
                       [w * 0.2, w * 0.5, w * 0.8];

    this.game.battle.enemies.forEach((enemy, i) => {
      const x  = xPositions[i] || w / 2;
      const y  = battleH * 0.32;
      const bw = Math.min(90, w / (enemyCount + 1));
      const bx = x - bw / 2;

      ctx.save();
      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(bx, y, bw, 14);

      // HP fill
      const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
      const hpCol = hpPct > 0.5 ? '#00ff88' : hpPct > 0.25 ? '#ffaa00' : '#ff3333';
      ctx.fillStyle = hpCol;
      ctx.fillRect(bx, y, bw * hpPct, 14);

      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, y, bw, 14);

      // Name
      ctx.font = '9px Courier New';
      ctx.fillStyle = enemy.isAlive ? '#ffffff' : '#444444';
      ctx.textAlign = 'center';
      ctx.fillText(enemy.isAlive ? enemy.name : '✗', x, y + 10);

      // Status icons
      if (enemy.statusEffects.length > 0) {
        ctx.font = '7px Courier New';
        ctx.fillStyle = '#ffff00';
        const labels = enemy.statusEffects.map(e => e.id.toUpperCase().slice(0, 3));
        ctx.fillText(labels.join(' '), x, y - 4);
      }
      ctx.restore();
    });

    this._updateFloatingTexts(ctx);
  }

  _updateFloatingTexts(ctx) {
    const now = performance.now();
    this.floatingTexts = this.floatingTexts.filter(ft => now - ft.start < ft.duration);

    for (const ft of this.floatingTexts) {
      const t   = (now - ft.start) / ft.duration;
      const alpha = 1 - t;
      const yOff  = -40 * Utils.easeOut(t);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${ft.size || 16}px Courier New`;
      ctx.fillStyle = ft.color || '#ffffff';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, ft.x, ft.y + yOff);
      ctx.fillText(ft.text, ft.x, ft.y + yOff);
      ctx.restore();
    }
  }

  _addFloatingText(text, x, y, color, size = 18, duration = 1200) {
    this.floatingTexts.push({ text, x, y, color, size, duration, start: performance.now() });
  }

  // ─── Battle UI DOM ─────────────────────────────────────────────────────────

  setupBattleUI() {
    this.battleUI.classList.remove('hidden');
    this.updatePartyBars();
  }

  hideBattleUI() {
    this.battleUI.classList.add('hidden');
    this.actionMenu.innerHTML = '';
    this.floatingTexts = [];
  }

  updatePartyBars() {
    this.partyStatus.innerHTML = '';
    for (const member of this.game.party.active) {
      const bar = document.createElement('div');
      bar.className = 'party-bar';
      bar.id        = `pbar-${member.id}`;

      const hpPct  = Math.max(0, member.hp / member.maxHp * 100);
      const mpPct  = Math.max(0, member.mp / member.maxMp * 100);
      const isLow  = member.hp / member.maxHp < 0.3;

      bar.innerHTML = `
        <div class="party-bar-name">${member.name}</div>
        <div class="party-bar-hp-wrap">
          <div class="party-bar-hp-fill ${isLow ? 'low' : ''}" style="width:${hpPct}%"></div>
        </div>
        <div class="party-bar-mp-wrap">
          <div class="party-bar-mp-fill" style="width:${mpPct}%"></div>
        </div>
        <div class="party-bar-vals">${Utils.formatHp(member.hp, member.maxHp)} HP</div>
      `;
      this.partyStatus.appendChild(bar);
    }
  }

  updateEnemyBars(enemies) {
    // Enemy HP info is drawn on HUD canvas in _drawBattleHud
    // Just trigger a HUD redraw by flagging (main loop calls renderHud each frame)
  }

  showBattleLog(text) {
    this.battleLog.textContent = text;
  }

  showDamageNumber(amount, isEnemy, idx) {
    const pos = this._getScreenPos(isEnemy, idx);
    this._addFloatingText(`-${amount}`, pos.x, pos.y, isEnemy ? '#ff4444' : '#ff8800', 20, 1100);
  }

  showHealNumber(amount, isEnemy, idx) {
    const pos = this._getScreenPos(isEnemy, idx);
    this._addFloatingText(`+${amount}`, pos.x, pos.y, '#00ff88', 18, 1000);
  }

  _getScreenPos(isEnemy, idx) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const battleH = h * 0.60;

    if (isEnemy) {
      const cnt = this.game.battle.enemies.length;
      const xs  = cnt === 1 ? [w/2] : cnt === 2 ? [w*0.3, w*0.7] : [w*0.2, w*0.5, w*0.8];
      return { x: xs[idx] || w/2, y: battleH * 0.28 };
    } else {
      const xs = [w*0.2, w*0.5, w*0.8];
      return { x: xs[idx] || w/2, y: battleH * 0.62 };
    }
  }

  // ─── Action Menu ──────────────────────────────────────────────────────────

  showActionMenu(member) {
    this.actionMenu.innerHTML = '';

    const label = document.createElement('div');
    label.className = 'action-label';
    label.textContent = `▶ ${member.name.toUpperCase()}`;
    this.actionMenu.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'action-grid';

    const btns = [
      { icon: '⚔', label: 'ATTACK', fn: () => this._onAttack(member) },
      { icon: '✦', label: 'SKILL',  fn: () => this._onSkillMenu(member) },
      { icon: '◇', label: 'WAIT',   fn: () => this._onWait(member) },
      { icon: '↩', label: 'FLEE',   fn: () => this._onFlee(member), cls: 'flee' },
    ];

    for (const b of btns) {
      const btn = document.createElement('button');
      btn.className = `action-btn ${b.cls || ''}`;
      btn.innerHTML = `${b.icon} ${b.label}`;
      btn.addEventListener('click',    () => b.fn());
      btn.addEventListener('touchend', e => { e.preventDefault(); b.fn(); }, { passive: false });
      grid.appendChild(btn);
    }

    this.actionMenu.appendChild(grid);
  }

  _onAttack(member) {
    this._showTargetSelect(member, (targetIdx) => {
      this.game.battle.onPlayerAction(member, 'attack', null, targetIdx);
    });
  }

  _onSkillMenu(member) {
    this.actionMenu.innerHTML = '';

    const backBtn = document.createElement('button');
    backBtn.className   = 'back-btn';
    backBtn.textContent = '← BACK';
    backBtn.addEventListener('click',    () => this.showActionMenu(member));
    backBtn.addEventListener('touchend', e  => { e.preventDefault(); this.showActionMenu(member); }, { passive: false });
    this.actionMenu.appendChild(backBtn);

    const label = document.createElement('div');
    label.className = 'action-label';
    label.textContent = 'SELECT SKILL';
    this.actionMenu.appendChild(label);

    const list = document.createElement('div');
    list.className = 'skill-list';

    for (const skillId of member.skills) {
      const skill = CONFIG.SKILLS[skillId];
      if (!skill) continue;
      const noMp  = member.mp < skill.mpCost;
      const btn   = document.createElement('button');
      btn.className = `skill-btn${noMp ? ' no-mp' : ''}`;
      btn.innerHTML = `<span>${skill.name}</span><span class="skill-mp">${skill.mpCost} MP</span>`;
      btn.title = skill.desc;

      btn.addEventListener('click',    () => this._onSkillSelected(member, skillId));
      btn.addEventListener('touchend', e  => { e.preventDefault(); this._onSkillSelected(member, skillId); }, { passive: false });
      list.appendChild(btn);
    }

    this.actionMenu.appendChild(list);
  }

  _onSkillSelected(member, skillId) {
    const skill = CONFIG.SKILLS[skillId];
    if (!skill) return;

    if (skill.target === 'single_enemy') {
      this._showTargetSelect(member, (targetIdx) => {
        this.game.battle.onPlayerAction(member, 'skill', skillId, targetIdx);
      });
    } else {
      // AoE or party target — no target selection needed
      this.game.battle.onPlayerAction(member, 'skill', skillId, 0);
    }
  }

  _onWait(member) {
    this.game.battle.onPlayerAction(member, 'wait', null, -1);
  }

  _onFlee(member) {
    this.game.battle.onPlayerAction(member, 'flee', null, -1);
  }

  _showTargetSelect(member, onSelect) {
    this.actionMenu.innerHTML = '';

    const label = document.createElement('div');
    label.className = 'action-label';
    label.textContent = 'SELECT TARGET';
    this.actionMenu.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'target-grid';

    const aliveEnemies = this.game.battle.getAliveEnemyIndices();

    for (const { enemy, idx } of aliveEnemies) {
      const btn = document.createElement('button');
      btn.className = `target-btn`;
      const hpPct = Math.round(enemy.hp / enemy.maxHp * 100);
      btn.innerHTML = `<div>${enemy.name}</div><div style="font-size:0.65rem;color:#aaa">${hpPct}% HP</div>`;
      this.scene && this.game.scene.highlightEnemy(idx, true);

      btn.addEventListener('click', () => {
        aliveEnemies.forEach(e => this.game.scene.highlightEnemy(e.idx, false));
        this.actionMenu.innerHTML = '';
        onSelect(idx);
      });
      btn.addEventListener('touchend', e => {
        e.preventDefault();
        aliveEnemies.forEach(e => this.game.scene.highlightEnemy(e.idx, false));
        this.actionMenu.innerHTML = '';
        onSelect(idx);
      }, { passive: false });

      grid.appendChild(btn);
    }

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'back-btn';
    cancelBtn.textContent = '← BACK';
    cancelBtn.style.marginTop = '0.4rem';
    cancelBtn.addEventListener('click', () => {
      aliveEnemies.forEach(e => this.game.scene.highlightEnemy(e.idx, false));
      this.showActionMenu(member);
    });
    cancelBtn.addEventListener('touchend', e => {
      e.preventDefault();
      aliveEnemies.forEach(e => this.game.scene.highlightEnemy(e.idx, false));
      this.showActionMenu(member);
    }, { passive: false });

    this.actionMenu.appendChild(grid);
    this.actionMenu.appendChild(cancelBtn);
  }
}

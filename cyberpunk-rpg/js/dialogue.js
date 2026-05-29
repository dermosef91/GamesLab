/* global DialogueSystem, DIALOGUES, Utils */

class DialogueSystem {
  constructor(game) {
    this.game         = game;
    this.active       = false;
    this.currentTree  = null;
    this.currentNode  = null;
    this.typingHandle = null;
    this.typingDone   = false;

    // DOM refs
    this.box      = document.getElementById('dialogueBox');
    this.speaker  = document.getElementById('dialogueSpeaker');
    this.textEl   = document.getElementById('dialogueText');
    this.choices  = document.getElementById('dialogueChoices');
    this.contHint = document.getElementById('dialogueContinue');
    this.portrait = document.getElementById('portraitCanvas');

    this.box.addEventListener('click',    () => this._onTap());
    this.box.addEventListener('touchend', e  => { e.preventDefault(); this._onTap(); }, { passive: false });
  }

  start(dialogueId) {
    const tree = DIALOGUES[dialogueId];
    if (!tree) { console.warn('Unknown dialogue:', dialogueId); return; }

    this.active      = true;
    this.currentTree = tree;
    this.box.classList.remove('hidden');
    this._renderNode(tree.nodes[tree.startNode]);
  }

  _renderNode(node) {
    if (!node) { this.end(); return; }
    this.currentNode = node;

    // Portrait
    this._drawPortrait(node.portrait);

    // Speaker name
    this.speaker.textContent = node.speaker || '';

    // If no text, just fire action
    if (!node.text) {
      this._fireAction(node.action);
      return;
    }

    // Typewriter
    this.typingDone = false;
    this.choices.classList.add('hidden');
    this.contHint.style.display = 'block';

    if (this.typingHandle) this.typingHandle.cancel();
    this.typingHandle = Utils.typewriter(node.text, this.textEl, 28, () => {
      this.typingDone = true;
      if (node.choices && node.choices.length > 0) {
        this._showChoices(node.choices);
        this.contHint.style.display = 'none';
      }
    });
  }

  _showChoices(choices) {
    this.choices.innerHTML = '';
    choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = choice.label;
      btn.addEventListener('click', e => { e.stopPropagation(); this._selectChoice(i); });
      btn.addEventListener('touchend', e => { e.preventDefault(); e.stopPropagation(); this._selectChoice(i); }, { passive: false });
      this.choices.appendChild(btn);
    });
    this.choices.classList.remove('hidden');
  }

  _selectChoice(idx) {
    const node    = this.currentNode;
    const choice  = node.choices[idx];
    if (!choice) return;

    // Set flag if any
    if (choice.flag) this.game.setFlag(choice.flag, true);

    // Advance to next node
    const next = this.currentTree.nodes[choice.next];
    this.choices.classList.add('hidden');
    this._renderNode(next);
  }

  _onTap() {
    if (!this.active) return;
    const node = this.currentNode;

    // Still typing — snap complete
    if (!this.typingDone) {
      if (this.typingHandle) this.typingHandle.cancel();
      this.textEl.textContent = node.text;
      this.typingDone = true;
      if (node.choices && node.choices.length > 0) {
        this._showChoices(node.choices);
        this.contHint.style.display = 'none';
      }
      return;
    }

    // Has choices — wait for selection
    if (node.choices && node.choices.length > 0) return;

    // Auto-advance or fire action
    if (node.action) {
      this._fireAction(node.action);
      return;
    }

    if (node.next) {
      this._renderNode(this.currentTree.nodes[node.next]);
    } else {
      this.end();
    }
  }

  _fireAction(action) {
    if (!action) { this.end(); return; }

    switch (action.type) {
      case 'endDialogue':
        this.end();
        if (this.game.onDialogueEvent) this.game.onDialogueEvent(action.event);
        break;
      case 'nextChapter':
        this.end();
        this.game.loadChapter(action.chapterId);
        break;
      default:
        this.end();
        if (this.game.onDialogueEvent) this.game.onDialogueEvent(action.event);
    }
  }

  end() {
    this.active = false;
    this.box.classList.add('hidden');
    this.choices.classList.add('hidden');
    this.choices.innerHTML = '';
    if (this.typingHandle) { this.typingHandle.cancel(); this.typingHandle = null; }
    if (this.game.onDialogueEnd) this.game.onDialogueEnd();
  }

  // ─── Procedural Portrait Drawing ─────────────────────────────────────────────

  _drawPortrait(key) {
    const ctx = this.portrait.getContext('2d');
    ctx.clearRect(0, 0, 80, 80);

    if (!key) {
      ctx.fillStyle = '#0d0d2e';
      ctx.fillRect(0, 0, 80, 80);
      return;
    }

    const portraits = {
      kwame:         this._drawKwame.bind(this),
      adaeze:        this._drawAdaeze.bind(this),
      babakweku:     this._drawBabaKweku.bind(this),
      ancestor:      this._drawAncestor.bind(this),
      nullAlgorithm: this._drawNullAlgorithm.bind(this),
    };

    const draw = portraits[key] || this._drawDefault.bind(this);
    draw(ctx);
  }

  _drawKwame(ctx) {
    ctx.fillStyle = '#0d0d2e'; ctx.fillRect(0, 0, 80, 80);
    // Head
    ctx.fillStyle = '#c87941';
    ctx.beginPath(); ctx.arc(40, 35, 22, 0, Math.PI * 2); ctx.fill();
    // Neural implant glow
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(55, 28, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,215,0,0.4)';
    ctx.beginPath(); ctx.arc(55, 28, 5, 0, Math.PI * 2); ctx.fill();
    // Eyes
    ctx.fillStyle = '#ffd700';
    ctx.beginPath(); ctx.arc(33, 33, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(47, 33, 3.5, 0, Math.PI * 2); ctx.fill();
    // Body
    ctx.fillStyle = '#1a1a3a';
    ctx.fillRect(20, 57, 40, 23);
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1;
    ctx.strokeRect(20, 57, 40, 23);
  }

  _drawAdaeze(ctx) {
    ctx.fillStyle = '#0a1a18'; ctx.fillRect(0, 0, 80, 80);
    ctx.fillStyle = '#7b4f2e';
    ctx.beginPath(); ctx.arc(40, 35, 22, 0, Math.PI * 2); ctx.fill();
    // Tech visor
    ctx.fillStyle = 'rgba(0,255,204,0.5)';
    ctx.fillRect(22, 27, 36, 10);
    ctx.strokeStyle = '#00ffcc'; ctx.lineWidth = 1.5;
    ctx.strokeRect(22, 27, 36, 10);
    // Eyes (glowing through visor)
    ctx.fillStyle = '#00ffcc';
    ctx.beginPath(); ctx.arc(32, 32, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(48, 32, 3, 0, Math.PI * 2); ctx.fill();
    // Neckline
    ctx.fillStyle = '#00ffcc'; ctx.lineWidth = 2;
    ctx.fillRect(20, 57, 40, 23);
    ctx.fillStyle = '#0a2a28';
    ctx.fillRect(22, 59, 36, 19);
    ctx.strokeStyle = '#00ffcc';
    ctx.strokeRect(20, 57, 40, 23);
  }

  _drawBabaKweku(ctx) {
    ctx.fillStyle = '#1a0a2e'; ctx.fillRect(0, 0, 80, 80);
    // Glow aura
    const grad = ctx.createRadialGradient(40, 35, 5, 40, 35, 35);
    grad.addColorStop(0, 'rgba(204,102,255,0.4)');
    grad.addColorStop(1, 'rgba(204,102,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 80, 80);
    // Head (semi-transparent, spirit-like)
    ctx.fillStyle = 'rgba(180,120,80,0.8)';
    ctx.beginPath(); ctx.arc(40, 35, 20, 0, Math.PI * 2); ctx.fill();
    // Eyes glowing
    ctx.fillStyle = '#cc66ff';
    ctx.shadowColor = '#cc66ff'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(33, 33, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(47, 33, 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Kente pattern accents on robe
    ctx.fillStyle = '#2a0a3e';
    ctx.fillRect(18, 57, 44, 23);
    const kente = ['#cc66ff', '#ffd700', '#00ff88'];
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = kente[i % 3];
      ctx.fillRect(20 + i * 5, 59, 3, 19);
    }
  }

  _drawAncestor(ctx) {
    ctx.fillStyle = '#050515'; ctx.fillRect(0, 0, 80, 80);
    // Fractal light patterns
    ctx.strokeStyle = '#9966ff'; ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(40, 40);
      ctx.lineTo(40 + Math.cos(angle) * 30, 40 + Math.sin(angle) * 30);
      ctx.stroke();
    }
    // Central orb
    const grad = ctx.createRadialGradient(40, 40, 2, 40, 40, 20);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#cc66ff');
    grad.addColorStop(1, 'rgba(153,102,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(40, 40, 20, 0, Math.PI * 2); ctx.fill();
    // Orbiting particles
    ctx.fillStyle = '#ffd700';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + performance.now() * 0.001;
      ctx.beginPath();
      ctx.arc(40 + Math.cos(a) * 28, 40 + Math.sin(a) * 28, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawNullAlgorithm(ctx) {
    ctx.fillStyle = '#030305'; ctx.fillRect(0, 0, 80, 80);
    // Glitch lines
    ctx.fillStyle = 'rgba(255,0,0,0.15)';
    for (let i = 0; i < 6; i++) {
      const y = Math.random() * 80;
      ctx.fillRect(0, y, 80, 1 + Math.random() * 2);
    }
    // Fragmented face
    ctx.fillStyle = '#111111';
    ctx.beginPath(); ctx.arc(40, 35, 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(40, 35, 20, 0, Math.PI * 2); ctx.stroke();
    // Red eyes
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(33, 32, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(47, 32, 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Glitch crack
    ctx.strokeStyle = '#ff3333'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 15); ctx.lineTo(38, 25); ctx.lineTo(44, 35);
    ctx.lineTo(37, 45); ctx.lineTo(42, 55);
    ctx.stroke();
  }

  _drawDefault(ctx) {
    ctx.fillStyle = '#0d0d2e'; ctx.fillRect(0, 0, 80, 80);
    ctx.strokeStyle = '#9966ff'; ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, 72, 72);
    ctx.fillStyle = '#9966ff';
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', 40, 40);
  }
}

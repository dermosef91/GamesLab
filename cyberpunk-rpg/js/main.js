/* global Game, Scene, Party, BattleSystem, DialogueSystem, UI, CONFIG, Utils, STORY */

class Game {
  constructor() {
    this.state         = 'loading';
    this.currentChapterId = null;
    this.flags         = {};
    this.visitedTiles  = new Set();
    this.firedEncounters = new Set();
    this.firedDialogues  = new Set();
    this.worldLayout   = null; // { offset, T, N }

    this.scene    = new Scene();
    this.party    = new Party();
    this.ui       = new UI(this);
    this.dialogue = new DialogueSystem(this);
    this.battle   = new BattleSystem(this.party, this.scene, this);

    this._pendingEncounter = null;
    this._pendingBattleChapterEvent = null;

    this._boot();
  }

  // ─── Boot ─────────────────────────────────────────────────────────────────

  _boot() {
    // Start the 3D render loop
    this.scene.startRenderLoop((dt) => this._onFrame(dt));

    // Animate loading bar
    const bar = document.getElementById('loadingBar');
    const steps = ['Connecting neural interface...', 'Loading ancestral archives...', 'Calibrating Griot signal...', 'Neo-Accra online.'];
    let pct = 0;
    let step = 0;
    const loadInterval = setInterval(() => {
      pct = Math.min(100, pct + Utils.randInt(12, 22));
      bar.style.width = pct + '%';
      if (step < steps.length) {
        document.getElementById('loadingStatus').textContent = steps[step++];
      }
      if (pct >= 100) {
        clearInterval(loadInterval);
        setTimeout(() => this._showTitle(), 600);
      }
    }, 280);
  }

  _showTitle() {
    const loading = document.getElementById('loadingScreen');
    loading.classList.add('hidden');

    const title = document.getElementById('titleScreen');
    title.classList.remove('hidden');

    // Show continue if save exists
    if (Utils.hasSave()) {
      document.getElementById('btnContinue').style.display = 'block';
    }

    document.getElementById('btnNewGame').addEventListener('click', () => this._startNewGame());
    document.getElementById('btnContinue').addEventListener('click', () => this._continueGame());
    document.getElementById('btnVictoryMenu').addEventListener('click', () => location.reload());
    document.getElementById('btnDefeatMenu').addEventListener('click', () => location.reload());
    document.getElementById('btnRetry').addEventListener('click', () => this._retryBattle());

    this.state = 'title';
  }

  _startNewGame() {
    Utils.clearSave();
    this.flags         = {};
    this.visitedTiles  = new Set();
    this.firedEncounters = new Set();
    this.firedDialogues  = new Set();

    this.party.restoreAll();
    this.party._activeIds = ['kwame']; // start with only Kwame

    document.getElementById('titleScreen').classList.add('hidden');
    this.loadChapter('prologue');
  }

  _continueGame() {
    const save = Utils.loadGame();
    if (!save) { this._startNewGame(); return; }

    this.flags             = save.flags || {};
    this.firedEncounters   = new Set(save.firedEncounters || []);
    this.firedDialogues    = new Set(save.firedDialogues || []);
    this.party.restore(save.party);

    document.getElementById('titleScreen').classList.add('hidden');
    this.loadChapter(save.chapterId || 'prologue');
  }

  _retryBattle() {
    document.getElementById('defeatScreen').classList.add('hidden');
    // Restore party HP then restart
    this.party.restoreAll();
    if (this._lastEncounterGroup) {
      this.battle.startBattle(this._lastEncounterGroup);
      this.state = 'battle';
    } else {
      this.loadChapter(this.currentChapterId || 'prologue');
    }
  }

  // ─── Chapter Management ───────────────────────────────────────────────────

  loadChapter(chapterId) {
    const chapterDef = STORY.chapters[chapterId];
    if (!chapterDef) { console.error('Unknown chapter:', chapterId); return; }

    this.currentChapterId = chapterId;
    this.visitedTiles     = new Set();
    this.scene.playerTile  = { x: 10, z: 10 };
    this.scene.playerTarget = { x: 10, z: 10 };

    // Build world
    this.worldLayout = this.scene.buildWorld(chapterDef);

    // Add NPC markers
    for (const npc of chapterDef.npcs) {
      // Skip if requires a flag that isn't set
      if (npc.requiresFlag && !this.flags[npc.requiresFlag]) continue;
      this.scene.addNpcMesh(npc, this.worldLayout.offset, this.worldLayout.T, this.worldLayout.N);
    }

    // Wire tile enter callback
    this.scene.setTileEnterCallback((tx, tz, npcId) => {
      this._onTileEnter(tx, tz, npcId, chapterDef);
    });

    // Chapter entry dialogue
    if (chapterDef.entryDialogue && !this.firedDialogues.has('entry_' + chapterId)) {
      this.firedDialogues.add('entry_' + chapterId);
      this.state = 'dialogue';
      setTimeout(() => this.dialogue.start(chapterDef.entryDialogue), 500);
      this.onDialogueEnd = () => { this.state = 'explore'; };
    } else {
      this.state = 'explore';
    }

    // Save on chapter load
    this._save();
  }

  // ─── Tile Enter Handler ───────────────────────────────────────────────────

  _onTileEnter(tx, tz, npcId, chapterDef) {
    if (this.state !== 'explore') return;

    const tileKey = `${tx},${tz}`;
    this.visitedTiles.add(tileKey);

    // NPC interaction
    if (npcId) {
      const npc = chapterDef.npcs.find(n => n.id === npcId);
      if (npc && npc.dialogue) {
        const fireKey = `npc_${npcId}`;
        if (npc.triggersOnce && this.firedDialogues.has(fireKey)) return;
        if (npc.triggersOnce) this.firedDialogues.add(fireKey);

        this.state = 'dialogue';
        this.dialogue.start(npc.dialogue);
        this.onDialogueEnd = () => { this.state = 'explore'; };
        return;
      }
    }

    // Check encounters
    for (const enc of chapterDef.encounters) {
      if (enc.tileX !== tx || enc.tileZ !== tz) continue;
      if (enc.once && this.firedEncounters.has(enc.id)) continue;
      if (enc.triggeredByEvent) continue; // event-triggered, not tile-triggered

      if (enc.once) this.firedEncounters.add(enc.id);
      this._triggerEncounter(enc);
      return;
    }
  }

  _triggerEncounter(enc) {
    this._lastEncounterGroup   = enc.group;
    this._pendingEncounterGroup = enc.group;

    if (enc.dialogueBefore && !this.firedDialogues.has('enc_before_' + enc.id)) {
      this.firedDialogues.add('enc_before_' + enc.id);
      this.state = 'dialogue';
      this.dialogue.start(enc.dialogueBefore);

      this.onDialogueEvent = (event) => {
        if (event && event.startsWith('start_battle')) {
          this._startEncounterBattle(this._pendingEncounterGroup, enc.isBoss);
        } else {
          this._startEncounterBattle(this._pendingEncounterGroup, enc.isBoss);
        }
      };
      this.onDialogueEnd = () => {
        if (this.state === 'dialogue') {
          this._startEncounterBattle(this._pendingEncounterGroup, enc.isBoss);
        }
      };
    } else {
      this._startEncounterBattle(enc.group, enc.isBoss);
    }
  }

  _startEncounterBattle(group, isBoss) {
    this.state   = 'battle';
    this._isBoss = isBoss;
    this.ui.hideBattleUI(); // reset
    this.battle.startBattle(group);
  }

  // ─── Dialogue Events ──────────────────────────────────────────────────────

  setFlag(key, value) {
    this.flags[key] = value;
    this._save();
  }

  onDialogueEvent(event) {
    if (this._onDialogueEventOverride) {
      const fn = this._onDialogueEventOverride;
      this._onDialogueEventOverride = null;
      fn(event);
      return;
    }
    this._handleStoryEvent(event);
  }

  _handleStoryEvent(event) {
    switch (event) {
      case 'prologue_meet_adaeze':
        // Just continue exploring, Adaeze NPC now appears
        this.state = 'explore';
        break;

      case 'prologue_complete':
        this.party.addMember('adaeze');
        this._save();
        this._transitionChapter('chapter1');
        break;

      case 'shrine_activated':
        this.setFlag('shrine_activated', true);
        // Re-add Baba Kweku NPC
        const chDef = STORY.chapters[this.currentChapterId];
        const babaNpc = chDef.npcs.find(n => n.id === 'baba_npc');
        if (babaNpc) {
          this.scene.addNpcMesh(babaNpc, this.worldLayout.offset, this.worldLayout.T, this.worldLayout.N);
        }
        this.state = 'explore';
        break;

      case 'baba_joins_party':
        this.party.addMember('babakweku');
        this._save();
        this.state = 'explore';
        break;

      case 'chapter1_complete':
        this._transitionChapter('chapter2');
        break;

      case 'chapter2_entry':
        this.state = 'explore';
        break;

      case 'chapter2_forward':
        this.state = 'explore';
        break;

      case 'ancestors_freed_buff':
        this.party.applyStatBuff(1.1);
        this.setFlag('ancestors_freed_early', true);
        this.ui.showBattleLog && this.ui.showBattleLog('Party +10% stats!');
        this.state = 'explore';
        break;

      case 'chapter2_complete':
        this._transitionChapter('chapter3');
        break;

      case 'final_guard_battle': {
        const chDef = STORY.chapters[this.currentChapterId];
        const enc   = chDef.encounters.find(e => e.triggeredByEvent === 'final_guard_battle');
        if (enc) {
          this.firedEncounters.add(enc.id);
          this._startEncounterBattle(enc.group, false);
        } else {
          this.state = 'explore';
        }
        break;
      }

      case 'chapter3_complete':
        if (this.flags.bad_ending) {
          this._transitionChapter('chapter4_bad');
        } else {
          this._transitionChapter('chapter4');
        }
        break;

      case 'bad_ending_chosen':
        this.setFlag('bad_ending', true);
        this.state = 'explore';
        this._handleStoryEvent('chapter3_complete');
        break;

      case 'boss_phase2_start':
        this.battle.continueRound();
        this.state = 'battle';
        break;

      case 'victory':
        this._showVictory();
        break;

      case 'bad_ending':
        this._showBadEnding();
        break;

      default:
        this.state = 'explore';
    }
  }

  // ─── Battle Events ────────────────────────────────────────────────────────

  onBattleEnd(result) {
    this.ui.hideBattleUI();
    this.scene.switchToWorld();

    if (result === 'victory') {
      const chapterId = this.currentChapterId;
      const chDef     = STORY.chapters[chapterId];

      // Rebuild world (reuse saved layout)
      this.scene.buildWorld(chDef);
      for (const npc of chDef.npcs) {
        if (npc.requiresFlag && !this.flags[npc.requiresFlag]) continue;
        if (npc.triggersOnce && this.firedDialogues.has('npc_' + npc.id)) continue;
        this.scene.addNpcMesh(npc, this.worldLayout.offset, this.worldLayout.T, this.worldLayout.N);
      }
      this.scene.setTileEnterCallback((tx, tz, npcId) => {
        this._onTileEnter(tx, tz, npcId, chDef);
      });

      this.state = 'explore';

      // Check chapter complete
      if (chapterId === 'chapter4') {
        // Boss fight victory → epilogue
        setTimeout(() => {
          this.state = 'dialogue';
          this.dialogue.start('victory_epilogue');
          this.onDialogueEnd = () => {};
        }, 1000);
      } else if (chapterId === 'chapter3' && this._isBoss) {
        this._transitionChapter('chapter4');
      } else {
        // Normal encounter victory - check if all required encounters done
        this._checkChapterComplete(chDef);
      }

    } else if (result === 'fled') {
      const chDef = STORY.chapters[this.currentChapterId];
      this.scene.buildWorld(chDef);
      this.scene.setTileEnterCallback((tx, tz, npcId) => {
        this._onTileEnter(tx, tz, npcId, chDef);
      });
      this.state = 'explore';

    } else if (result === 'defeat') {
      this.state = 'defeat';
      document.getElementById('defeatScreen').classList.remove('hidden');
    }
  }

  _checkChapterComplete(chDef) {
    const requiredEncounters = chDef.encounters.filter(e => e.once && !e.optional && !e.triggeredByEvent);
    const allDone = requiredEncounters.every(e => this.firedEncounters.has(e.id));

    if (allDone && chDef.nextChapter) {
      // Show a brief transition then load next chapter
      setTimeout(() => {
        if (chDef.id === 'chapter1') this._handleStoryEvent('chapter1_complete');
        else if (chDef.id === 'chapter2') this._transitionChapter('chapter3');
        else if (chDef.id === 'chapter3') {
          if (this.flags.bad_ending) this._transitionChapter('chapter4_bad');
          else this._transitionChapter('chapter4');
        }
      }, 1500);
    }
  }

  triggerBossPhase2() {
    this.state = 'dialogue';
    this.ui.hideBattleUI();
    setTimeout(() => {
      this.dialogue.start('boss_phase2_transition');
      this.onDialogueEnd = () => {
        this.state = 'battle';
        this.ui.setupBattleUI();
        this.battle.continueRound();
        this.battle._promptNextPartyMember();
      };
    }, 600);
  }

  // ─── Chapter Transitions ─────────────────────────────────────────────────

  _transitionChapter(chapterId) {
    this._save();
    // Simple fade via canvas
    const canvas = this.ui.hudCanvas;
    const ctx    = this.ui.hudCtx;
    let alpha    = 0;
    const fadeIn = () => {
      alpha = Math.min(1, alpha + 0.06);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = '#000000';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      // Chapter title
      if (alpha > 0.7) {
        const def = STORY.chapters[chapterId];
        ctx.globalAlpha = (alpha - 0.7) / 0.3;
        ctx.font = 'bold 18px Courier New';
        ctx.fillStyle   = '#ffd700';
        ctx.textAlign   = 'center';
        ctx.fillText(def ? def.title : '', window.innerWidth / 2, window.innerHeight / 2 - 14);
        ctx.font = '12px Courier New';
        ctx.fillStyle = '#9966ff';
        ctx.fillText(def ? def.subtitle : '', window.innerWidth / 2, window.innerHeight / 2 + 10);
      }
      ctx.restore();

      if (alpha < 1) { requestAnimationFrame(fadeIn); }
      else { setTimeout(() => { this.loadChapter(chapterId); this._fadeOut(); }, 1200); }
    };
    fadeIn();
  }

  _fadeOut() {
    const ctx   = this.ui.hudCtx;
    let alpha   = 1;
    const fade  = () => {
      alpha = Math.max(0, alpha - 0.05);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = '#000000';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.restore();
      if (alpha > 0) requestAnimationFrame(fade);
    };
    fade();
  }

  // ─── Victory / Defeat ────────────────────────────────────────────────────

  _showVictory() {
    this.state = 'victory';
    Utils.clearSave();

    const stats = document.getElementById('victoryStats');
    stats.innerHTML = `
      ANCESTORS FREED: 512<br>
      PARTY SURVIVED: ${this.party.alive.length}/${this.party.active.length}<br>
      UBUNTU PROTOCOL: ACTIVE<br>
      <br>
      <em style="color:#9966ff;font-size:0.85rem">"I am because we are."</em>
    `;

    document.getElementById('victoryScreen').classList.remove('hidden');
  }

  _showBadEnding() {
    this.state = 'defeat';
    Utils.clearSave();

    document.getElementById('defeatScreen').querySelector('.overlay-title').textContent = 'GRIOT-PRIME';
    document.getElementById('defeatScreen').querySelector('.overlay-sub').textContent =
      'You chose the corporation. The ancestors remain imprisoned.';
    document.getElementById('btnRetry').style.display = 'none';
    document.getElementById('defeatScreen').classList.remove('hidden');
  }

  // ─── Frame Update ─────────────────────────────────────────────────────────

  _onFrame(dt) {
    const chDef = STORY.chapters[this.currentChapterId];
    const title    = chDef ? chDef.title    : '';
    const subtitle = chDef ? chDef.subtitle : '';
    this.ui.renderHud(this.state, title, subtitle);
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  _save() {
    Utils.saveGame({
      chapterId:       this.currentChapterId,
      flags:           this.flags,
      firedEncounters: [...this.firedEncounters],
      firedDialogues:  [...this.firedDialogues],
      party:           this.party.serialize(),
    });
  }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
  window._game = new Game();
});

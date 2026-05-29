/* global BattleSystem, CONFIG, Utils */

class EnemyInstance {
  constructor(def) {
    this.id        = def.id;
    this.name      = def.name;
    this.maxHp     = def.maxHp;
    this.hp        = def.maxHp;
    this.atk       = def.atk;
    this.baseDef   = def.def;
    this.spd       = def.spd;
    this.ai        = def.ai;
    this.isAlive   = true;
    this.statusEffects = [];
    this.turnCount = 0;
    this.phase     = 1;
    // boss phase2 threshold
    this.phase2Threshold = def.phase2Threshold || null;
  }

  get def() {
    const d = this.statusEffects.find(e => e.id === 'defDown');
    return this.baseDef * (d ? d.mult : 1);
  }

  isStunned() { return this.statusEffects.some(e => e.id === 'stun'); }
  isDodging() { return this.statusEffects.some(e => e.id === 'dodge'); }

  addStatus(effectDef, duration) {
    const existing = this.statusEffects.find(e => e.id === effectDef.id);
    if (existing) { existing.duration = Math.max(existing.duration, duration); }
    else { this.statusEffects.push({ ...effectDef, duration }); }
  }

  tickStatusEffects() {
    this.statusEffects = this.statusEffects
      .map(e => ({ ...e, duration: e.duration - 1 }))
      .filter(e => e.duration > 0);
  }

  takeDamage(amount, pierceArmor = false) {
    if (this.isDodging() && Utils.rollChance(0.5)) return 0;
    let dmg = pierceArmor ? amount : Math.max(1, amount - this.def * 0.5);
    dmg = Math.ceil(dmg * Utils.rand(0.9, 1.1));
    this.hp = Math.max(0, this.hp - dmg);
    if (this.hp === 0) this.isAlive = false;
    return dmg;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class BattleSystem {
  constructor(party, scene, game) {
    this.party   = party;
    this.scene   = scene;
    this.game    = game;
    this.enemies = [];
    this.state   = 'idle'; // idle|selectAction|enemyDecide|executeRound|roundResult|checkEnd
    this.roundActions    = [];
    this.partyMemberIdx  = 0;
    this.pendingSkillId  = null;
    this.bossPhase2Triggered = false;
  }

  // ─── Start / End ──────────────────────────────────────────────────────────

  startBattle(encounterGroup) {
    const groupDef = CONFIG.ENCOUNTERS[encounterGroup];
    this.enemies = [];
    for (const entry of groupDef) {
      for (let i = 0; i < entry.count; i++) {
        this.enemies.push(new EnemyInstance(CONFIG.ENEMIES[entry.id]));
      }
    }
    // Cap at 3 enemies for UI
    this.enemies = this.enemies.slice(0, 3);

    this.roundActions        = [];
    this.partyMemberIdx      = 0;
    this.bossPhase2Triggered = false;
    this.state               = 'selectAction';

    this.scene.switchToBattle(this.enemies);
    this.game.ui.setupBattleUI();
    this.game.ui.updatePartyBars();
    this.game.ui.updateEnemyBars(this.enemies);
    this._promptNextPartyMember();
  }

  endBattle(result) {
    this.state = 'idle';
    this.game.onBattleEnd(result);
  }

  // ─── Player Action Collection ─────────────────────────────────────────────

  _promptNextPartyMember() {
    const alive = this.party.alive;
    if (this.partyMemberIdx >= alive.length) {
      this.state = 'enemyDecide';
      this._enemyDecideAndExecute();
      return;
    }
    this.state = 'selectAction';
    const member = alive[this.partyMemberIdx];
    this.game.ui.showActionMenu(member);
  }

  onPlayerAction(member, type, skillId, targetIdx) {
    this.roundActions.push({ actor: member, type, skillId, targetIdx, isParty: true });
    this.partyMemberIdx++;
    this._promptNextPartyMember();
  }

  // ─── Enemy AI ─────────────────────────────────────────────────────────────

  _enemyDecideAndExecute() {
    const partyAlive = this.party.alive;
    if (partyAlive.length === 0) { this.endBattle('defeat'); return; }

    for (const enemy of this.enemies.filter(e => e.isAlive)) {
      const action = this._aiDecide(enemy, partyAlive);
      this.roundActions.push({ actor: enemy, isParty: false, ...action });
      enemy.turnCount++;
    }

    this.state = 'executeRound';
    this._buildTurnOrderAndExecute();
  }

  _aiDecide(enemy, partyAlive) {
    const weakest  = partyAlive.reduce((a, b) => a.hp < b.hp ? a : b);
    const strongest = partyAlive.reduce((a, b) => a.atk > b.atk ? a : b);
    const random   = Utils.randFrom(partyAlive);

    switch (enemy.ai) {
      case 'debuffer':
        if (Utils.rollChance(0.65) && !partyAlive.some(m => m.statusEffects.some(e => e.id === 'atkDown'))) {
          return { type: 'debuff', skillName: 'Signal Jam', target: random,
                   effect: { id: 'defDown', stat: 'def', mult: 0.75 }, effectDuration: 2 };
        }
        return { type: 'attack', target: weakest };

      case 'tank':
        if (Utils.rollChance(0.25)) {
          return { type: 'heavy', skillName: 'Power Slam', target: strongest,
                   powerMult: 1.8, selfStun: true };
        }
        return { type: 'attack', target: strongest };

      case 'mage':
        if (enemy.hp < enemy.maxHp * 0.5 && Utils.rollChance(0.5)) {
          return { type: 'selfheal', amount: Math.round(enemy.maxHp * 0.2) };
        }
        return { type: 'aoe', skillName: 'Soul Scream', powerMult: 1.1 };

      case 'evasive':
        if (Utils.rollChance(0.4)) {
          return { type: 'buff', skillName: 'Phase Shift',
                   effect: { id: 'dodge' }, effectDuration: 2, self: true };
        }
        return { type: 'attack', target: random };

      case 'boss': {
        if (enemy.phase === 2) return this._bossPh2Action(enemy, partyAlive, strongest, random);
        const t = enemy.turnCount % 4;
        if (t === 0 || t === 2) {
          return { type: 'aoe', skillName: 'Data Purge', powerMult: 1.3 };
        }
        return { type: 'attack', target: strongest, powerMult: 1.5, skillName: 'Null Ray' };
      }

      default:
        return { type: 'attack', target: random };
    }
  }

  _bossPh2Action(enemy, partyAlive, strongest, random) {
    const t = enemy.turnCount % 3;
    if (t === 0) {
      // Memory Wipe: remove a random buff from target
      const target = Utils.randFrom(partyAlive);
      return { type: 'memorywipe', target, skillName: 'Memory Wipe' };
    }
    if (t === 1) {
      return { type: 'aoe', skillName: 'Data Purge Mk.II', powerMult: 1.6 };
    }
    return { type: 'attack', target: strongest, powerMult: 2.0, skillName: 'Null Strike' };
  }

  // ─── Turn Order & Execution ───────────────────────────────────────────────

  _buildTurnOrderAndExecute() {
    const allActors = [
      ...this.party.alive.map(m => ({ ref: m, spd: m.spd, isParty: true })),
      ...this.enemies.filter(e => e.isAlive).map(e => ({ ref: e, spd: e.spd, isParty: false })),
    ];
    const ordered = allActors.sort((a, b) => b.spd - a.spd);

    let idx = 0;
    const executeNext = () => {
      if (idx >= ordered.length) {
        this._roundResult();
        return;
      }
      const entry  = ordered[idx++];
      const action = this.roundActions.find(a => a.actor === entry.ref);
      if (!action) { executeNext(); return; }

      this._executeAction(entry.ref, action, entry.isParty, () => {
        setTimeout(executeNext, CONFIG.BATTLE_TURN_DELAY_MS);
      });
    };
    executeNext();
  }

  _executeAction(actor, action, isParty, done) {
    // Check stun
    if (actor.isStunned ? actor.isStunned() : false) {
      this.game.ui.showBattleLog(`${actor.name} is STUNNED!`);
      done(); return;
    }
    if (isParty && !actor.isAlive) { done(); return; }
    if (!isParty && !actor.isAlive) { done(); return; }

    if (isParty) {
      this._executePartyAction(actor, action, done);
    } else {
      this._executeEnemyAction(actor, action, done);
    }
  }

  _executePartyAction(member, action, done) {
    if (action.type === 'attack') {
      const target = this.enemies[action.targetIdx];
      if (!target || !target.isAlive) {
        // Redirect to first alive enemy
        const alt = this.enemies.find(e => e.isAlive);
        if (!alt) { done(); return; }
        action.targetIdx = this.enemies.indexOf(alt);
        action.targetRef = alt;
      }
      const tgt = this.enemies[action.targetIdx];
      const dmg = this._calcDamage(member.atk, tgt.def, 1.0);
      const dealt = tgt.takeDamage(dmg);
      this.scene.playHitEffect(true, action.targetIdx);
      this.game.ui.showDamageNumber(dealt, true, action.targetIdx);
      this.game.ui.showBattleLog(`${member.name} attacks ${tgt.name} for ${dealt} dmg!`);
      if (!tgt.isAlive) this.scene.playEnemyDeath(action.targetIdx);
    } else if (action.type === 'skill') {
      this._executeSkill(member, action.skillId, action.targetIdx, done);
      return;
    } else if (action.type === 'flee') {
      if (Utils.rollChance(CONFIG.BASE_FLEE_CHANCE)) {
        this.game.ui.showBattleLog('Escaped!');
        setTimeout(() => this.endBattle('fled'), 400);
      } else {
        this.game.ui.showBattleLog('Failed to flee!');
      }
    }
    this.game.ui.updatePartyBars();
    this.game.ui.updateEnemyBars(this.enemies);
    done();
  }

  _executeSkill(member, skillId, targetIdx, done) {
    const skill = CONFIG.SKILLS[skillId];
    if (!skill) { done(); return; }

    if (!member.spendMp(skill.mpCost)) {
      this.game.ui.showBattleLog(`${member.name} has no MP!`);
      done(); return;
    }

    const partyAlive  = this.party.alive;
    const enemyAlive  = this.enemies.filter(e => e.isAlive);
    const enemyTarget = this.enemies[targetIdx] || enemyAlive[0];

    this.scene.playSkillEffect(skillId, skill.target.includes('enemy'), targetIdx);
    this.game.ui.showBattleLog(`${member.name}: ${skill.name}!`);

    switch (skill.type) {
      case 'damage': {
        const pierce = skill.effect && skill.effect.id === 'armorPierce';
        const targets = skill.target === 'all_enemies' ? enemyAlive : [enemyTarget];
        for (const tgt of targets) {
          if (!tgt || !tgt.isAlive) continue;
          const dmg   = this._calcDamage(member.atk, tgt.def, skill.power, pierce);
          const dealt = tgt.takeDamage(dmg, pierce);
          const idx   = this.enemies.indexOf(tgt);
          this.scene.playHitEffect(true, idx);
          this.game.ui.showDamageNumber(dealt, true, idx);
          if (!tgt.isAlive) this.scene.playEnemyDeath(idx);
        }
        if (skill.effect && skill.effect.id === 'stun') {
          for (const tgt of (skill.target === 'all_enemies' ? enemyAlive : [enemyTarget])) {
            if (tgt && tgt.isAlive) tgt.addStatus(CONFIG.STATUS.stun, skill.effect.duration);
          }
        }
        break;
      }
      case 'damage_heal': {
        if (enemyTarget && enemyTarget.isAlive) {
          const dmg   = this._calcDamage(member.atk, enemyTarget.def, skill.power);
          const dealt = enemyTarget.takeDamage(dmg);
          const idx   = this.enemies.indexOf(enemyTarget);
          this.scene.playHitEffect(true, idx);
          this.game.ui.showDamageNumber(dealt, true, idx);
          if (!enemyTarget.isAlive) this.scene.playEnemyDeath(idx);
        }
        const healed = member.heal(skill.effect.amount);
        this.game.ui.showHealNumber(healed, false, this.party.active.indexOf(member));
        break;
      }
      case 'heal': {
        const results = this.party.healAll(skill.effect.amount);
        for (const r of results) {
          const idx = this.party.active.indexOf(r.member);
          this.game.ui.showHealNumber(r.amount, false, idx);
        }
        break;
      }
      case 'buff': {
        const targets = skill.target === 'all_party' ? partyAlive : [member];
        for (const tgt of targets) {
          tgt.addStatus(skill.effect, skill.effect.duration);
        }
        this.game.ui.showBattleLog(`${skill.name} applied!`);
        break;
      }
      case 'debuff': {
        if (enemyTarget && enemyTarget.isAlive) {
          enemyTarget.addStatus(skill.effect, skill.effect.duration);
          this.game.ui.showBattleLog(`${enemyTarget.name}: ${skill.effect.id}!`);
        }
        break;
      }
    }

    this.game.ui.updatePartyBars();
    this.game.ui.updateEnemyBars(this.enemies);
    done();
  }

  _executeEnemyAction(enemy, action, done) {
    const partyAlive = this.party.alive;
    if (partyAlive.length === 0) { done(); return; }

    switch (action.type) {
      case 'attack':
      case 'heavy': {
        const target = action.target && action.target.isAlive ? action.target : partyAlive[0];
        const idx    = this.party.active.indexOf(target);
        const power  = action.powerMult || 1.0;
        const dmg    = this._calcDamage(enemy.atk * power, target.def, 1.0);
        const dealt  = target.takeDamage(dmg);
        this.scene.playHitEffect(false, idx);
        this.game.ui.showDamageNumber(dealt, false, idx);
        const label = action.skillName ? `${enemy.name}: ${action.skillName}! ` : `${enemy.name} attacks!`;
        this.game.ui.showBattleLog(`${label} ${target.name} takes ${dealt}`);
        if (action.selfStun) enemy.addStatus(CONFIG.STATUS.stun, 1);
        break;
      }
      case 'aoe': {
        const power = action.powerMult || 1.0;
        this.game.ui.showBattleLog(`${enemy.name}: ${action.skillName || 'AOE'}!`);
        for (const member of partyAlive) {
          const idx   = this.party.active.indexOf(member);
          const dmg   = this._calcDamage(enemy.atk * power, member.def, 1.0);
          const dealt = member.takeDamage(dmg);
          this.scene.playHitEffect(false, idx);
          this.game.ui.showDamageNumber(dealt, false, idx);
        }
        break;
      }
      case 'debuff': {
        const target = action.target && action.target.isAlive ? action.target : partyAlive[0];
        target.addStatus(action.effect, action.effectDuration || 2);
        this.game.ui.showBattleLog(`${enemy.name}: ${action.skillName || 'Debuff'}!`);
        break;
      }
      case 'buff': {
        if (action.self) enemy.addStatus(action.effect, action.effectDuration || 2);
        this.game.ui.showBattleLog(`${enemy.name}: ${action.skillName}!`);
        break;
      }
      case 'selfheal': {
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + action.amount);
        this.game.ui.showBattleLog(`${enemy.name} recovers ${action.amount} HP!`);
        break;
      }
      case 'memorywipe': {
        const target = action.target && action.target.isAlive ? action.target : partyAlive[0];
        if (target.statusEffects.length > 0) {
          const removed = target.statusEffects.splice(
            Math.floor(Math.random() * target.statusEffects.length), 1
          );
          this.game.ui.showBattleLog(`${enemy.name}: Memory Wipe — ${target.name}'s ${removed[0]?.id} removed!`);
        } else {
          this.game.ui.showBattleLog(`${enemy.name}: Memory Wipe! ${target.name} resists.`);
        }
        break;
      }
    }

    this.game.ui.updatePartyBars();
    this.game.ui.updateEnemyBars(this.enemies);
    done();
  }

  _calcDamage(atk, def, power, pierce = false) {
    if (pierce) return Math.max(1, Math.round(atk * power));
    return Math.max(1, Math.round(atk * power - def * 0.5));
  }

  // ─── Round Wrap-up ────────────────────────────────────────────────────────

  _roundResult() {
    this.state = 'roundResult';
    this.party.tickStatusEffects();
    for (const e of this.enemies.filter(en => en.isAlive)) e.tickStatusEffects();

    this.game.ui.updatePartyBars();
    this.game.ui.updateEnemyBars(this.enemies);

    // Boss phase 2 check
    const boss = this.enemies.find(e => e.ai === 'boss' && e.isAlive);
    if (boss && !this.bossPhase2Triggered &&
        boss.hp / boss.maxHp <= (boss.phase2Threshold || 0.5)) {
      this.bossPhase2Triggered = true;
      boss.phase = 2;
      // Trigger mid-battle dialogue via game
      this.game.triggerBossPhase2();
      return; // game will call continueRound()
    }

    setTimeout(() => this._checkEnd(), 400);
  }

  continueRound() {
    setTimeout(() => this._checkEnd(), 400);
  }

  _checkEnd() {
    const allEnemiesDead = this.enemies.every(e => !e.isAlive);
    const partyWiped     = this.party.isWiped();

    if (allEnemiesDead) {
      this.endBattle('victory');
    } else if (partyWiped) {
      this.endBattle('defeat');
    } else {
      this.roundActions   = [];
      this.partyMemberIdx = 0;
      this.state          = 'selectAction';
      this._promptNextPartyMember();
    }
  }

  // ─── Targeting helpers for UI ─────────────────────────────────────────────

  getAliveEnemies() { return this.enemies.filter(e => e.isAlive); }
  getAliveEnemyIndices() {
    return this.enemies.map((e, i) => ({ enemy: e, idx: i })).filter(e => e.enemy.isAlive);
  }
}

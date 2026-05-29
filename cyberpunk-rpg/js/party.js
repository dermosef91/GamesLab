/* global PartyMember, Party, CONFIG, Utils */

class PartyMember {
  constructor(def) {
    this.id      = def.id;
    this.name    = def.name;
    this.role    = def.role;
    this.maxHp   = def.maxHp;
    this.maxMp   = def.maxMp;
    this.hp      = def.maxHp;
    this.mp      = def.maxMp;
    this.baseAtk = def.atk;
    this.baseDef = def.def;
    this.spd     = def.spd;
    this.skills  = def.skills.slice();
    this.color   = def.color;
    this.isAlive = true;
    this.statusEffects = [];   // [{ id, duration, ...data }]
    this.turnCount = 0;
    this.buffedAtk  = false;   // atkUp flag
    this.hasShield  = false;   // shield flag
    this.hasDodge   = false;   // dodge flag
  }

  get atk() {
    const atkEffect = this.statusEffects.find(e => e.id === 'atkUp');
    return this.baseAtk * (atkEffect ? atkEffect.mult : 1);
  }

  get def() {
    const defEffect = this.statusEffects.find(e => e.id === 'defDown');
    return this.baseDef * (defEffect ? defEffect.mult : 1);
  }

  isStunned()  { return this.statusEffects.some(e => e.id === 'stun'); }
  isShielded() { return this.statusEffects.some(e => e.id === 'shield'); }
  isDodging()  { return this.statusEffects.some(e => e.id === 'dodge'); }

  addStatus(effectDef, duration) {
    const existing = this.statusEffects.find(e => e.id === effectDef.id);
    if (existing) {
      existing.duration = Math.max(existing.duration, duration);
    } else {
      this.statusEffects.push({ ...effectDef, duration });
    }
  }

  tickStatusEffects() {
    this.statusEffects = this.statusEffects
      .map(e => ({ ...e, duration: e.duration - 1 }))
      .filter(e => e.duration > 0);
  }

  takeDamage(amount, pierceArmor = false) {
    if (this.isDodging() && Utils.rollChance(0.5)) return 0;
    let dmg = amount;
    if (!pierceArmor) {
      dmg = Math.max(1, amount - this.def * 0.5);
    }
    if (this.isShielded()) dmg = Math.ceil(dmg * 0.5);
    dmg = Math.ceil(dmg * Utils.rand(0.9, 1.1));
    this.hp = Math.max(0, this.hp - dmg);
    if (this.hp === 0) this.isAlive = false;
    return dmg;
  }

  heal(amount) {
    const prev = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - prev;
  }

  restoreMp(amount) {
    this.mp = Math.min(this.maxMp, this.mp + amount);
  }

  spendMp(amount) {
    if (this.mp < amount) return false;
    this.mp -= amount;
    return true;
  }

  revive() {
    this.hp = Math.ceil(this.maxHp * 0.3);
    this.isAlive = true;
    this.statusEffects = [];
  }

  serialize() {
    return { id: this.id, hp: this.hp, mp: this.mp, isAlive: this.isAlive };
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class Party {
  constructor() {
    this.members = [
      new PartyMember(CONFIG.PARTY.kwame),
      new PartyMember(CONFIG.PARTY.adaeze),
      new PartyMember(CONFIG.PARTY.babakweku),
    ];
    // Adaeze joins after prologue, Baba after ch1
    this.adaeze   = this.members[1];
    this.babakweku = this.members[2];
    // Initial roster: only Kwame
    this._activeIds = ['kwame'];
  }

  get active() {
    return this.members.filter(m => this._activeIds.includes(m.id));
  }

  get alive() {
    return this.active.filter(m => m.isAlive);
  }

  addMember(id) {
    if (!this._activeIds.includes(id)) this._activeIds.push(id);
  }

  isWiped() {
    return this.alive.length === 0;
  }

  applyStatBuff(mult) {
    for (const m of this.active) {
      m.baseAtk = Math.round(m.baseAtk * mult);
      m.maxHp   = Math.round(m.maxHp * mult);
      m.hp      = Math.min(m.hp, m.maxHp);
    }
  }

  tickStatusEffects() {
    for (const m of this.alive) m.tickStatusEffects();
  }

  healAll(amount) {
    const healed = [];
    for (const m of this.alive) {
      const gained = m.heal(amount);
      if (gained > 0) healed.push({ member: m, amount: gained });
    }
    return healed;
  }

  applyBuffToAll(effectDef, duration) {
    for (const m of this.alive) m.addStatus(effectDef, duration);
  }

  restoreAll() {
    for (const m of this.members) {
      m.hp = m.maxHp;
      m.mp = m.maxMp;
      m.statusEffects = [];
      m.isAlive = true;
    }
  }

  serialize() {
    return { members: this.members.map(m => m.serialize()), activeIds: this._activeIds };
  }

  restore(data) {
    if (!data) return;
    this._activeIds = data.activeIds || ['kwame'];
    for (const saved of data.members) {
      const m = this.members.find(x => x.id === saved.id);
      if (m) { m.hp = saved.hp; m.mp = saved.mp; m.isAlive = saved.isAlive; }
    }
  }
}

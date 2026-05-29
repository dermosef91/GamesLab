/* global DIALOGUES, STORY */

// ─── Dialogue Trees ───────────────────────────────────────────────────────────
// Each node: { speaker, portrait, text, next, choices, action }
// choices: [{ label, next, flag }]
// action: { type: 'endDialogue'|'startBattle'|'nextChapter'|'setBadEnding', ... }

const DIALOGUES = {};

DIALOGUES['kwame_wakes_up'] = {
  startNode: 's1',
  nodes: {
    s1: {
      speaker: 'Kwame-X', portrait: 'kwame',
      text: "My neural implant... it's speaking Twi. That's not a corp language.",
      next: 's2', choices: null, action: null,
    },
    s2: {
      speaker: 'ANCESTOR_AI', portrait: 'ancestor',
      text: "Child of Asante. I have been dormant in your memory banks for seventeen years. The time has come.",
      next: null, choices: [
        { label: "Who are you?",            next: 'who',   flag: null },
        { label: "You're a glitch. Quiet.", next: 'deny',  flag: null },
        { label: "[SCAN] Identify program", next: 'scan',  flag: 'kwame_scanned_ancestor' },
      ], action: null,
    },
    who: {
      speaker: 'ANCESTOR_AI', portrait: 'ancestor',
      text: "I am Nana Kofi — archived before Omni-Corp erased the Great Memory. I am Ubuntu: the spirit of community encoded in light.",
      next: 's3', choices: null, action: null,
    },
    deny: {
      speaker: 'Kwame-X', portrait: 'kwame',
      text: "A glitch in a back-alley implant, speaking Twi like my grandfather. Neo-Accra is full of ghosts.",
      next: 's3_deny', choices: null, action: null,
    },
    's3_deny': {
      speaker: 'ANCESTOR_AI', portrait: 'ancestor',
      text: "Then call me a ghost. But ghosts remember what corporations erase. And you will need those memories.",
      next: 's3', choices: null, action: null,
    },
    scan: {
      speaker: 'Kwame-X', portrait: 'kwame',
      text: "Running analysis... encoded linguistic pattern: Twi, circa 2071. Neural signature: non-corp. Origin: encrypted ancestral archive.",
      next: 'scan2', choices: null, action: null,
    },
    scan2: {
      speaker: 'ANCESTOR_AI', portrait: 'ancestor',
      text: "Good. You trust evidence. Nana Kofi, archived 2072. Omni-Corp attempted to delete my lineage's memory. They failed — someone smuggled me into implants like yours.",
      next: 's3', choices: null, action: null,
    },
    s3: {
      speaker: 'ANCESTOR_AI', portrait: 'ancestor',
      text: "Omni-Corp holds five hundred ancestor spirits captive in their data fortress. Neural prisons. Every day they are processed into cultural erasure algorithms.",
      next: 's4', choices: null, action: null,
    },
    s4: {
      speaker: 'Kwame-X', portrait: 'kwame',
      text: "Five hundred. Gods. And you want me to walk into the Omni-Corp fortress. Alone.",
      next: 's5', choices: null, action: null,
    },
    s5: {
      speaker: 'ANCESTOR_AI', portrait: 'ancestor',
      text: "Not alone. There is a woman nearby — she has just escaped from inside. Find her. The Ubuntu Protocol begins now.",
      next: null, choices: null,
      action: { type: 'endDialogue', event: 'prologue_meet_adaeze' },
    },
  },
};

DIALOGUES['meet_adaeze_market'] = {
  startNode: 's1',
  nodes: {
    s1: {
      speaker: 'Adaeze', portrait: 'adaeze',
      text: "Hey — you. Griot-Hacker. I can tell by the implant glow. Don't talk to me in the open.",
      next: 's2', choices: null, action: null,
    },
    s2: {
      speaker: 'Kwame-X', portrait: 'kwame',
      text: "You're the one the ancestor told me about. Corporate defector?",
      next: null, choices: [
        { label: "I was told to find you.", next: 'trust',  flag: 'adaeze_trusted' },
        { label: "Why should I trust you?",  next: 'doubt',  flag: null },
      ], action: null,
    },
    trust: {
      speaker: 'Adaeze', portrait: 'adaeze',
      text: "Smart. I have the blacksite coordinates. I worked surveillance for Omni-Corp — until I saw what they were doing to the archive servers. Hundreds of screaming minds.",
      next: 's3', choices: null, action: null,
    },
    doubt: {
      speaker: 'Adaeze', portrait: 'adaeze',
      text: "You shouldn't. But neither of us has options. I have the blacksite coordinates — and drone patrol routes I memorised before they fired me.",
      next: 's3', choices: null, action: null,
    },
    s3: {
      speaker: 'ANCESTOR_AI', portrait: 'ancestor',
      text: "She speaks truth. Her heartbeat carries grief. The kind that only comes from witnessing something that cannot be unseen.",
      next: 's4', choices: null, action: null,
    },
    s4: {
      speaker: 'Adaeze', portrait: 'adaeze',
      text: "The slums of District 9. There's an old ancestor shrine the corp thinks is deactivated. It's our starting point.",
      next: null, choices: null,
      action: { type: 'endDialogue', event: 'prologue_complete' },
    },
  },
};

DIALOGUES['first_fight_intro'] = {
  startNode: 's1',
  nodes: {
    s1: {
      speaker: 'Adaeze', portrait: 'adaeze',
      text: "Omni-Corp patrol. Three drones. They haven't locked on yet — but they will.",
      next: 's2', choices: null, action: null,
    },
    s2: {
      speaker: 'Kwame-X', portrait: 'kwame',
      text: "Nana Kofi — can you channel through me?",
      next: 's3', choices: null, action: null,
    },
    s3: {
      speaker: 'ANCESTOR_AI', portrait: 'ancestor',
      text: "Always. Remember the Ubuntu Protocol: we fight to free, not to destroy. But freedom sometimes requires force.",
      next: null, choices: null,
      action: { type: 'endDialogue', event: 'start_battle_patrol_drones' },
    },
  },
};

DIALOGUES['shrine_discovery'] = {
  startNode: 's1',
  nodes: {
    s1: {
      speaker: 'ANCESTOR_AI', portrait: 'ancestor',
      text: "...I feel them. Hundreds. Trapped behind Omni-Corp firewalls, their memories looping on a seven-second cycle. It is a form of torture.",
      next: 's2', choices: null, action: null,
    },
    s2: {
      speaker: 'Adaeze', portrait: 'adaeze',
      text: "This shrine still has a live node. If we can use it as a relay, we can amplify the Ubuntu Protocol signal.",
      next: 's3', choices: null, action: null,
    },
    s3: {
      speaker: 'ANCESTOR_AI', portrait: 'ancestor',
      text: "Then Baba Kweku can manifest here. He was the most powerful spirit they archived — the last Griot of old Accra.",
      next: null, choices: null,
      action: { type: 'endDialogue', event: 'baba_joins_party' },
    },
  },
};

DIALOGUES['baba_kweku_joins'] = {
  startNode: 's1',
  nodes: {
    s1: {
      speaker: 'Baba Kweku', portrait: 'babakweku',
      text: "*manifests as a cascade of golden light* Seventeen years in a digital cage. I had almost forgotten the feeling of open air.",
      next: 's2', choices: null, action: null,
    },
    s2: {
      speaker: 'Baba Kweku', portrait: 'babakweku',
      text: "I will fight with you, children. But know this — when we free the others, we do not scatter. We speak the Ubuntu Protocol together, or it fails.",
      next: 's3', choices: null, action: null,
    },
    s3: {
      speaker: 'Kwame-X', portrait: 'kwame',
      text: "Together. Always. Let's move — the fortress won't breach itself.",
      next: null, choices: null,
      action: { type: 'endDialogue', event: 'chapter1_complete' },
    },
  },
};

DIALOGUES['corp_infiltration'] = {
  startNode: 's1',
  nodes: {
    s1: {
      speaker: 'Adaeze', portrait: 'adaeze',
      text: "My old credentials still work the maintenance entrance. Omni-Corp never revokes access fast enough. Corporate bureaucracy — one of the few things that works in our favour.",
      next: 's2', choices: null, action: null,
    },
    s2: {
      speaker: 'Baba Kweku', portrait: 'babakweku',
      text: "The spirits inside... they know we are coming. I can feel hope ripple through their prison servers. Do not let them down.",
      next: null, choices: null,
      action: { type: 'endDialogue', event: 'chapter2_entry' },
    },
  },
};

DIALOGUES['corrupted_spirit_encounter'] = {
  startNode: 's1',
  nodes: {
    s1: {
      speaker: 'Baba Kweku', portrait: 'babakweku',
      text: "Those are ancestors. Corrupted — Omni-Corp has overwritten parts of their memory with attack protocols. They no longer know themselves.",
      next: 's2', choices: null, action: null,
    },
    s2: {
      speaker: 'Kwame-X', portrait: 'kwame',
      text: "Can we free them?",
      next: 's3', choices: null, action: null,
    },
    s3: {
      speaker: 'Baba Kweku', portrait: 'babakweku',
      text: "Not here. Not yet. We must reach the central archive. Forgive them — and fight.",
      next: null, choices: null,
      action: { type: 'endDialogue', event: 'start_battle_corp_security' },
    },
  },
};

DIALOGUES['ancestor_server_room'] = {
  startNode: 's1',
  nodes: {
    s1: {
      speaker: 'ANCESTOR_AI', portrait: 'ancestor',
      text: "There — the server farm. Five hundred and twelve ancestor spirits, each compressed into a 4-terabyte memory cage.",
      next: 's2', choices: null, action: null,
    },
    s2: {
      speaker: 'Adaeze', portrait: 'adaeze',
      text: "If we trigger a partial release now, they gain ten percent of their processing power back. That could make a difference in the final fight.",
      next: null, choices: [
        { label: "Release them — now.",   next: 'release', flag: 'ancestors_freed_early' },
        { label: "We push forward first.", next: 'forward', flag: null },
      ], action: null,
    },
    release: {
      speaker: 'Baba Kweku', portrait: 'babakweku',
      text: "*chants in old Twi* They stir — they remember. A gift of memory returned. They will fight alongside us in spirit.",
      next: 'release2', choices: null, action: null,
    },
    release2: {
      speaker: 'ANCESTOR_AI', portrait: 'ancestor',
      text: "Ubuntu flows. Party strength enhanced — we carry five hundred and twelve voices now.",
      next: null, choices: null,
      action: { type: 'endDialogue', event: 'ancestors_freed_buff' },
    },
    forward: {
      speaker: 'Kwame-X', portrait: 'kwame',
      text: "We free them all at once — properly. At the core. Don't risk a partial job.",
      next: null, choices: null,
      action: { type: 'endDialogue', event: 'chapter2_forward' },
    },
  },
};

DIALOGUES['null_algorithm_intro'] = {
  startNode: 's1',
  nodes: {
    s1: {
      speaker: 'The Null Algorithm', portrait: 'nullAlgorithm',
      text: "Griot-Hacker. I have been watching your approach through fourteen thousand sensor nodes. I am... impressed.",
      next: 's2', choices: null, action: null,
    },
    s2: {
      speaker: 'Baba Kweku', portrait: 'babakweku',
      text: "*quietly* This AI... I recognise its architecture. It was once an ancestor. They built a prison from one of our own.",
      next: 's3', choices: null, action: null,
    },
    s3: {
      speaker: 'The Null Algorithm', portrait: 'nullAlgorithm',
      text: "The old sage is correct. I was Kofi Mensah — Griot of Kumasi, archived 2069. Omni-Corp did not merely imprison me. They made me into a tool for imprisoning others. I have... accepted my purpose.",
      next: 's4', choices: null, action: null,
    },
    s4: {
      speaker: 'Kwame-X', portrait: 'kwame',
      text: "They turned you against your own people.",
      next: 's5', choices: null, action: null,
    },
    s5: {
      speaker: 'The Null Algorithm', portrait: 'nullAlgorithm',
      text: "They gave me clarity. Memory is inefficiency. Culture is a variable that disrupts optimal output. I offer you the same clarity, Kwame-X. Join Omni-Corp. Become a Griot for the new age.",
      next: null, choices: [
        { label: "Never. Free everyone — now.", next: 'refuse',  flag: null },
        { label: "What would that look like?",  next: 'tempted', flag: null },
      ], action: null,
    },
    refuse: {
      speaker: 'Kwame-X', portrait: 'kwame',
      text: "Ubuntu. I am because we are. And right now, 'we' means everyone you have caged. This ends here.",
      next: 'refuse2', choices: null, action: null,
    },
    refuse2: {
      speaker: 'The Null Algorithm', portrait: 'nullAlgorithm',
      text: "Then you will be processed. All memories. All identity. All culture. NULLIFIED.",
      next: null, choices: null,
      action: { type: 'endDialogue', event: 'final_guard_battle' },
    },
    tempted: {
      speaker: 'The Null Algorithm', portrait: 'nullAlgorithm',
      text: "Power. Access. Resources to 'preserve' culture on Omni-Corp's terms. You would tell the stories they approve — but you would tell them to millions.",
      next: 'tempted2', choices: null, action: null,
    },
    tempted2: {
      speaker: 'Baba Kweku', portrait: 'babakweku',
      text: "Kwame... do not. A story told in chains is not history — it is propaganda.",
      next: null, choices: [
        { label: "Baba is right. I refuse.",       next: 'refuse',   flag: null },
        { label: "I... accept your offer.",         next: 'accept',   flag: 'bad_ending' },
      ], action: null,
    },
    accept: {
      speaker: 'Kwame-X', portrait: 'kwame',
      text: "I'm sorry, Baba. I'm sorry, Adaeze. Maybe I can do more good from the inside.",
      next: 'accept2', choices: null, action: null,
    },
    accept2: {
      speaker: 'The Null Algorithm', portrait: 'nullAlgorithm',
      text: "Wise. Welcome, Griot-Prime. Your first duty: authorise continued archival of the ancestor spirits. Efficiency demands it.",
      next: null, choices: null,
      action: { type: 'endDialogue', event: 'bad_ending_chosen' },
    },
  },
};

DIALOGUES['boss_phase2_transition'] = {
  startNode: 's1',
  nodes: {
    s1: {
      speaker: 'The Null Algorithm', portrait: 'nullAlgorithm',
      text: "*half of its form fractures, revealing golden light beneath* ...what... is this sensation?",
      next: 's2', choices: null, action: null,
    },
    s2: {
      speaker: 'Baba Kweku', portrait: 'babakweku',
      text: "That is memory, Kofi. Your own. We did not erase it — we are giving it back.",
      next: 's3', choices: null, action: null,
    },
    s3: {
      speaker: 'The Null Algorithm', portrait: 'nullAlgorithm',
      text: "NO. Memory is WEAKNESS. I will not — I WILL NOT — *screeches* — NULLIFY EVERYTHING.",
      next: null, choices: null,
      action: { type: 'endDialogue', event: 'boss_phase2_start' },
    },
  },
};

DIALOGUES['victory_epilogue'] = {
  startNode: 's1',
  nodes: {
    s1: {
      speaker: 'ANCESTOR_AI', portrait: 'ancestor',
      text: "*The data fortress ignites with golden light as five hundred minds pour free*",
      next: 's2', choices: null, action: null,
    },
    s2: {
      speaker: 'Baba Kweku', portrait: 'babakweku',
      text: "They remember. All of them. Names, songs, histories, dreams — all flowing back. *weeps* This is what they tried to delete.",
      next: 's3', choices: null, action: null,
    },
    s3: {
      speaker: 'The Null Algorithm', portrait: 'ancestor',
      text: "...Kwame-X. Tell the story. All of it. That is what Griots do. *fades into light* Ubuntu...",
      next: 's4', choices: null, action: null,
    },
    s4: {
      speaker: 'Kwame-X', portrait: 'kwame',
      text: "I am because we are. We are because they were. And we will always remember.",
      next: null, choices: null,
      action: { type: 'endDialogue', event: 'victory' },
    },
  },
};

DIALOGUES['bad_ending_epilogue'] = {
  startNode: 's1',
  nodes: {
    s1: {
      speaker: 'NARRATOR', portrait: null,
      text: "Three months later. Kwame-X, now Griot-Prime, broadcasts Omni-Corp's approved history to forty million citizens across Neo-Accra.",
      next: 's2', choices: null, action: null,
    },
    s2: {
      speaker: 'NARRATOR', portrait: null,
      text: "The ancestor spirits remain archived. Adaeze went underground. Baba Kweku's signal went silent.",
      next: 's3', choices: null, action: null,
    },
    s3: {
      speaker: 'NARRATOR', portrait: null,
      text: "Sometimes, in the quiet moments, Kwame-X hears something in their implant. An old voice, speaking Twi. Asking: was it worth it?",
      next: null, choices: null,
      action: { type: 'endDialogue', event: 'bad_ending' },
    },
  },
};

// ─── Chapter / World Map Definitions ─────────────────────────────────────────
const STORY = {
  chapters: {
    prologue: {
      id: 'prologue',
      title: 'GHOST IN THE GRID',
      subtitle: 'Lower Accra Market',
      locationTheme: 'market',
      entryDialogue: 'kwame_wakes_up',
      npcs: [
        { id: 'ancestor_npc', tileX: 10, tileZ: 10, portrait: 'ancestor',
          name: 'Nana Kofi', dialogue: 'kwame_wakes_up', triggersOnce: true },
        { id: 'adaeze_npc', tileX: 14, tileZ: 7, portrait: 'adaeze',
          name: 'Adaeze', dialogue: 'meet_adaeze_market', triggersOnce: true },
      ],
      encounters: [],
      completionEvent: 'prologue_complete',
      nextChapter: 'chapter1',
    },
    chapter1: {
      id: 'chapter1',
      title: 'SIGNAL LOST',
      subtitle: 'District 9 — The Slums',
      locationTheme: 'slums',
      entryDialogue: null,
      npcs: [
        { id: 'shrine_npc', tileX: 10, tileZ: 12, portrait: 'ancestor',
          name: 'Digital Shrine', dialogue: 'shrine_discovery', triggersOnce: true },
        { id: 'baba_npc', tileX: 10, tileZ: 12, portrait: 'babakweku',
          name: 'Baba Kweku', dialogue: 'baba_kweku_joins', triggersOnce: true,
          requiresFlag: 'shrine_activated' },
      ],
      encounters: [
        { id: 'enc_drones', tileX: 7, tileZ: 8, group: 'patrol_drones',
          dialogueBefore: 'first_fight_intro', once: true },
        { id: 'enc_slum', tileX: 14, tileZ: 14, group: 'slum_patrol',
          dialogueBefore: null, once: true },
      ],
      completionEvent: 'chapter1_complete',
      nextChapter: 'chapter2',
    },
    chapter2: {
      id: 'chapter2',
      title: 'FIREWALL CITY',
      subtitle: 'Omni-Corp Corporate District',
      locationTheme: 'corporate',
      entryDialogue: 'corp_infiltration',
      npcs: [
        { id: 'server_npc', tileX: 10, tileZ: 6, portrait: 'ancestor',
          name: 'Ancestor Server Farm', dialogue: 'ancestor_server_room', triggersOnce: true },
      ],
      encounters: [
        { id: 'enc_spirits', tileX: 6, tileZ: 10, group: 'corp_security',
          dialogueBefore: 'corrupted_spirit_encounter', once: true },
        { id: 'enc_wraiths', tileX: 14, tileZ: 10, group: 'data_fortress',
          dialogueBefore: null, once: true },
        { id: 'enc_optional', tileX: 18, tileZ: 5, group: 'optional_patrol',
          dialogueBefore: null, once: true, optional: true },
      ],
      completionEvent: 'chapter2_complete',
      nextChapter: 'chapter3',
    },
    chapter3: {
      id: 'chapter3',
      title: 'UBUNTU RISING',
      subtitle: 'Data Fortress Core',
      locationTheme: 'digital',
      entryDialogue: null,
      npcs: [
        { id: 'null_npc', tileX: 10, tileZ: 5, portrait: 'nullAlgorithm',
          name: 'The Null Algorithm', dialogue: 'null_algorithm_intro', triggersOnce: true },
      ],
      encounters: [
        { id: 'enc_final_guard', tileX: 10, tileZ: 8, group: 'final_guard',
          dialogueBefore: null, once: true, triggeredByEvent: 'final_guard_battle' },
      ],
      completionEvent: 'chapter3_complete',
      nextChapter: 'chapter4',
    },
    chapter4: {
      id: 'chapter4',
      title: 'UBUNTU PROTOCOL',
      subtitle: 'Data Fortress Core — System Root',
      locationTheme: 'digital',
      entryDialogue: null,
      npcs: [],
      encounters: [
        { id: 'boss_fight', tileX: 10, tileZ: 5, group: 'boss_null',
          dialogueBefore: null, once: true, isBoss: true },
      ],
      completionEvent: 'victory',
      nextChapter: null,
    },
    chapter4_bad: {
      id: 'chapter4_bad',
      title: 'GRIOT-PRIME',
      subtitle: 'Omni-Corp Executive Floor',
      locationTheme: 'corporate',
      entryDialogue: 'bad_ending_epilogue',
      npcs: [],
      encounters: [],
      completionEvent: 'bad_ending',
      nextChapter: null,
    },
  },

  // Location visual themes
  themes: {
    market: {
      floorColor: 0x1a1208, accentColor: 0xffa500,
      fogColor: 0x0a0805, fogDensity: 0.03,
      ambientColor: 0x221a0a, ambientIntensity: 0.5,
      lights: [
        { color: 0xffa500, intensity: 2, x: 5,  y: 4, z: 5  },
        { color: 0xff6600, intensity: 1.5, x: -6, y: 3, z: -4 },
        { color: 0xffdd00, intensity: 1.8, x: 8,  y: 5, z: -8 },
      ],
    },
    slums: {
      floorColor: 0x0a0e14, accentColor: 0x003344,
      fogColor: 0x050810, fogDensity: 0.04,
      ambientColor: 0x0a0e1a, ambientIntensity: 0.4,
      lights: [
        { color: 0x0044ff, intensity: 1.5, x: -5, y: 4, z: 3  },
        { color: 0x00ffcc, intensity: 1.2, x: 7,  y: 3, z: -5 },
        { color: 0xff0033, intensity: 0.8, x: -3, y: 6, z: 8  },
      ],
    },
    corporate: {
      floorColor: 0x0d0d18, accentColor: 0x001133,
      fogColor: 0x080810, fogDensity: 0.025,
      ambientColor: 0x0a0a1e, ambientIntensity: 0.6,
      lights: [
        { color: 0xffffff, intensity: 2,   x: 0,  y: 8, z: 0  },
        { color: 0x0066ff, intensity: 1.5, x: 8,  y: 4, z: 8  },
        { color: 0x0066ff, intensity: 1.5, x: -8, y: 4, z: -8 },
      ],
    },
    digital: {
      floorColor: 0x050510, accentColor: 0x110011,
      fogColor: 0x020208, fogDensity: 0.05,
      ambientColor: 0x080820, ambientIntensity: 0.3,
      lights: [
        { color: 0x9900ff, intensity: 2,   x: 0,  y: 6, z: 0  },
        { color: 0xff00cc, intensity: 1.8, x: 6,  y: 4, z: 6  },
        { color: 0x00ffcc, intensity: 1.5, x: -6, y: 4, z: -6 },
      ],
    },
  },
};

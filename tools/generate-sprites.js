#!/usr/bin/env node
// ============================================================
// Sprite Generator — Ancestors: Awakening
// Generates Afrofuturist pixel art sprite sheets via OpenAI Image API
//
// Usage:
//   node tools/generate-sprites.js
//   node tools/generate-sprites.js --model=gpt-image-1
//   node tools/generate-sprites.js --key=sk-...
//   node tools/generate-sprites.js --skip-template
//   node tools/generate-sprites.js --only=anansi,nzinga
// ============================================================

'use strict';
const fs   = require('node:fs');
const path = require('node:path');

// ── CLI args ─────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => {
      const [k, ...v] = a.slice(2).split('=');
      return [k, v.join('=') || true];
    })
);

const API_KEY    = args.key || process.env.OPENAI_API_KEY || loadEnvKey();
const MODEL      = args.model || 'gpt-image-1';
const SKIP_TMPL  = !!args['skip-template'];
const ONLY       = args.only ? args.only.split(',') : null;
const OUT_DIR    = path.resolve(__dirname, '../assets/sprites');
const TMPL_PATH  = path.join(OUT_DIR, 'template.png');
const DELAY_MS   = 3500;  // stay inside RPM limits

function loadEnvKey() {
  const envFile = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envFile)) {
    const line = fs.readFileSync(envFile, 'utf8')
      .split('\n').find(l => l.startsWith('OPENAI_API_KEY='));
    if (line) return line.split('=').slice(1).join('=').trim();
  }
  return '';
}

if (!API_KEY) {
  console.error('ERROR: Set OPENAI_API_KEY env var or pass --key=<key>');
  process.exit(1);
}

// ── Style constants ───────────────────────────────────────────
const STYLE_BASE = [
  'pixel art game sprite sheet, Afrofuturist aesthetic, crisp pixel edges,',
  'three-quarter top-down RPG perspective (classic SNES/GBA style),',
  'vibrant neon colors on deep space background, no anti-aliasing, no gradients,',
  'bold geometric shapes inspired by African kente cloth and cosmic sci-fi technology,',
  'transparent background, PNG with alpha channel,',
  'consistent pixel proportions across all frames.',
].join(' ');

const LAYOUT_DESC = [
  'Exact 3-column × 3-row grid layout (9 equal cells):',
  '  Column 1 = IDLE (standing, neutral pose)',
  '  Column 2 = WALK-1 (left foot forward, mid-stride)',
  '  Column 3 = WALK-2 (right foot forward, opposite stride)',
  '  Row 1 = FRONT view (character faces the viewer)',
  '  Row 2 = SIDE view (right-profile, character faces right)',
  '  Row 3 = BACK view (character seen from behind)',
  'Each cell: 64×64 pixels. Thin grid lines separate cells.',
  'Characters centered within each cell, with ~4px padding.',
].join(' ');

const TEMPLATE_PROMPT = [
  STYLE_BASE,
  LAYOUT_DESC,
  'TEMPLATE: Draw a generic humanoid placeholder — neutral grey silhouette,',
  'no face or identity, just correct proportions (head, torso, legs, arms).',
  'Pixel-art style, approx. 48px tall in each cell, on dark purple (#0d0515) background.',
  'Use faint gold grid lines to mark the 3×3 cell boundaries.',
].join(' ');

// ── Character definitions ────────────────────────────────────
const CHARACTERS = [
  // ── HEROES ──────────────────────────────────────────────────
  {
    id: 'anansi',
    name: 'Anansi the Weaver',
    role: 'hero',
    colors: 'teal/cyan (#00ffcc) primary, deep purple (#1a0a2e) body, gold (#ffd700) accents',
    design: [
      'Slender spider-warrior in a teal geometric exosuit.',
      'Chest features a web-circuit emblem with concentric hexagons.',
      'Four thin energy spider-leg appendages fold from the back.',
      'Multi-lensed visor glows teal. Kente-cloth sash at the waist.',
      'Wrist-mounted web-shooter gauntlets. Bare feet with gold toe-rings.',
      'Cosmic totem mark on forehead.',
    ].join(' '),
  },
  {
    id: 'nzinga',
    name: 'Queen Nzinga',
    role: 'hero',
    colors: 'gold (#ffd700) primary, royal purple (#6600cc) cape, red (#ff4444) accent',
    design: [
      'Regal warrior-queen in golden geometric plate armor.',
      'Three-pointed crown of crackling energy spikes.',
      'Diamond-pattern breastplate with a central cross motif.',
      'Floating hexagonal shield orbiting her arm.',
      'Ancestral energy spear in hand. Royal star-cloth cape.',
      'Geometric face markings of gold and purple.',
    ].join(' '),
  },
  {
    id: 'kwame',
    name: 'Kwame the Griot',
    role: 'hero',
    colors: 'orange (#ff6600) primary, dark gold (#cc8800) secondary, electric yellow accent',
    design: [
      'Sonic-warrior griot with EQ-bar patterns across chest piece.',
      'Concentric sound-wave rings radiate as a constant aura.',
      'Tall West-African drummer hat with circuit overlay.',
      'Glowing drum gauntlets on both hands.',
      'Speaker-grill motifs on shoulder pads. Flowing griot robes with circuit patterns.',
      'Energy drumsticks holstered at each hip.',
    ].join(' '),
  },

  // ── ENEMIES ─────────────────────────────────────────────────
  {
    id: 'voidCrawler',
    name: 'Void Crawler',
    role: 'enemy',
    colors: 'dark purple (#7700cc) body, black void, white eye glow',
    design: [
      'Insectoid creature of corrupted void energy.',
      'Pentagon-shaped dark body with cracks of bright void-white.',
      'Six angular void-energy legs splaying outward.',
      'Twin curved mandibles. Single large glowing white eye.',
      'Digital corruption artifacts texture the carapace.',
      'Dark wisps trail from each limb.',
    ].join(' '),
  },
  {
    id: 'dataWraith',
    name: 'Data Wraith',
    role: 'enemy',
    colors: 'electric blue (#00bbff) translucent body, cyan glitch accents, black background',
    design: [
      'Ghost-like entity made of corrupted data streams.',
      'Semi-transparent torso with visible scanline texture.',
      'Wavy ghost-tail instead of legs, floating off ground.',
      'Two hollow eye sockets glowing electric blue.',
      'Pixelated glitch artifacts at edges of the form.',
      'Data-stream tendrils trailing behind.',
    ].join(' '),
  },
  {
    id: 'chronoGolem',
    name: 'Chrono Golem',
    role: 'enemy',
    colors: 'slate grey (#888888) stone, dark rust joints, gold clock face',
    design: [
      'Massive stone construct with gear-tooth armor plating.',
      'Clock face embedded in chest, hands ticking.',
      'Octagonal segmented body. Heavy armored pauldrons.',
      'Arms end in massive stone fists with gear decorations.',
      'Ancient African mask face with digital clock overlay.',
      'Slow, imposing stance, steam venting at joints.',
    ].join(' '),
  },
  {
    id: 'soulHarvester',
    name: 'Soul Harvester',
    role: 'enemy',
    colors: 'deep crimson (#ff3366) body, dark red shadows, ghostly white glints',
    design: [
      'Spectral reaper entity with an hourglass-shaped body.',
      'Flowing dark crimson robes tattered at the edges.',
      'Skull-motif hood with glowing red hollow eyes.',
      'Energy scythe weapon trailing dark wisps.',
      'Soul-orb collection pouch at the hip radiating stolen glow.',
      'Ghostly claw hands reaching forward.',
    ].join(' '),
  },
  {
    id: 'corruptedDjinn',
    name: 'Corrupted Djinn',
    role: 'enemy',
    colors: 'orange (#ff9900) fire body, corruption green (#39ff14) cracks, no legs',
    design: [
      'Djinn entity in corrupted flame form.',
      'Teardrop/flame silhouette: no legs, fire-tail base.',
      'Three rectangular corruption glitch marks on chest.',
      'Horizontal eye slit of blazing orange-white fire.',
      'Crackling energy aura around entire form.',
      'Jinn lamp corruption glyph on forehead.',
    ].join(' '),
  },

  // ── BOSSES ───────────────────────────────────────────────────
  {
    id: 'nullKing',
    name: 'The Null King',
    role: 'boss',
    colors: 'void-purple (#aa00ff) body, pure black void, white void-eye highlights',
    design: [
      'Massive royal boss twice the height of normal enemies.',
      'Five-spike crown of crackling void-energy.',
      'Octagonal body plating with circle-cross void symbol.',
      'Two enormous glowing void eyes.',
      'Eight dark energy tentacle wings spreading wide.',
      'Ancient African king regalia corrupted by void energy.',
      'Floating above a portal of absolute darkness.',
    ].join(' '),
  },
  {
    id: 'entropyDrake',
    name: 'Entropy Drake',
    role: 'boss',
    colors: 'deep red (#cc2200) scales, dark orange (#cc5500) energy, entropy green accent',
    design: [
      'Massive cosmic dragon entity, three times the size of normal enemies.',
      'Angular dragon head with geometric panel scales.',
      'Three tall entropy crest spikes on the skull.',
      'Serrated tooth-row along jaw. Eye slit glowing red.',
      'Circuit-scale patterns on serpentine body.',
      'Energy wings of fire and entropy spreading from shoulders.',
      'Reality-distortion aura — pixels glitch around the form.',
    ].join(' '),
  },
];

// ── API helpers ───────────────────────────────────────────────
async function apiGenerate(prompt) {
  const body = JSON.stringify({
    model: MODEL,
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    background: 'transparent',
    output_format: 'png',
  });

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }

  const json = await res.json();
  const item = json.data[0];

  if (item.b64_json) return Buffer.from(item.b64_json, 'base64');

  // URL response: download it
  const imgRes = await fetch(item.url);
  return Buffer.from(await imgRes.arrayBuffer());
}

async function apiEdit(imageBuffer, prompt) {
  const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
  const form = new FormData();
  form.append('model', MODEL);
  form.append('prompt', prompt);
  form.append('image', imageBlob, 'template.png');
  form.append('n', '1');
  form.append('size', '1024x1024');

  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Edit API ${res.status}: ${err}`);
  }

  const json = await res.json();
  const item = json.data[0];

  if (item.b64_json) return Buffer.from(item.b64_json, 'base64');

  const imgRes = await fetch(item.url);
  return Buffer.from(await imgRes.arrayBuffer());
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Prompt builder ────────────────────────────────────────────
function buildCharPrompt(char, isEdit) {
  const lines = [
    isEdit
      ? `Restyle this sprite sheet template as ${char.name} (${char.role}).`
      : `${STYLE_BASE} ${LAYOUT_DESC}`,
    `Character: ${char.name} — ${char.design}`,
    `Color palette: ${char.colors}.`,
    isEdit
      ? `Keep the exact 3×3 grid layout and pose structure from the template. Only change the visual design to match the character.`
      : '',
    'Every one of the 9 cells must show the character in the correct view/pose.',
    'No text, no labels, no extra decorations outside the character sprites.',
  ].filter(Boolean);
  return lines.join(' ');
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const filtered = ONLY
    ? CHARACTERS.filter(c => ONLY.includes(c.id))
    : CHARACTERS;

  // ── Step 1: Template ─────────────────────────────────────
  let templateBuf = null;

  if (!SKIP_TMPL && !fs.existsSync(TMPL_PATH)) {
    console.log('▶ Generating base template…');
    try {
      templateBuf = await apiGenerate(TEMPLATE_PROMPT);
      fs.writeFileSync(TMPL_PATH, templateBuf);
      console.log(`  ✓ Saved template.png (${(templateBuf.length / 1024).toFixed(1)} KB)`);
      await sleep(DELAY_MS);
    } catch (e) {
      console.warn(`  ✗ Template generation failed: ${e.message}`);
      console.warn('  Will use text-to-image for all characters instead.');
    }
  } else if (fs.existsSync(TMPL_PATH)) {
    templateBuf = fs.readFileSync(TMPL_PATH);
    console.log('▶ Using existing template.png as base');
  } else {
    console.log('▶ Skipping template (--skip-template)');
  }

  // ── Step 2: Characters ───────────────────────────────────
  let done = 0;
  for (const char of filtered) {
    const outPath = path.join(OUT_DIR, `${char.id}.png`);

    if (fs.existsSync(outPath)) {
      console.log(`  ↷ ${char.id}.png already exists, skipping`);
      done++;
      continue;
    }

    console.log(`\n▶ [${done + 1}/${filtered.length}] Generating ${char.name} (${char.role})…`);

    let buf = null;
    const useEdit = !!templateBuf;

    try {
      if (useEdit) {
        console.log('  → Using edit API (template → character)');
        buf = await apiEdit(templateBuf, buildCharPrompt(char, true));
      } else {
        console.log('  → Using generation API (text → sprite sheet)');
        buf = await apiGenerate(buildCharPrompt(char, false));
      }

      fs.writeFileSync(outPath, buf);
      console.log(`  ✓ Saved ${char.id}.png (${(buf.length / 1024).toFixed(1)} KB)`);
      done++;
    } catch (e) {
      console.error(`  ✗ Failed: ${e.message}`);

      // Retry with generation API if edit failed
      if (useEdit) {
        console.log('  → Retrying with generation API…');
        try {
          await sleep(DELAY_MS);
          buf = await apiGenerate(buildCharPrompt(char, false));
          fs.writeFileSync(outPath, buf);
          console.log(`  ✓ Saved ${char.id}.png (${(buf.length / 1024).toFixed(1)} KB)`);
          done++;
        } catch (e2) {
          console.error(`  ✗ Retry also failed: ${e2.message}`);
        }
      }
    }

    if (done < filtered.length) await sleep(DELAY_MS);
  }

  // ── Summary ──────────────────────────────────────────────
  const files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png'));
  console.log(`\n══════════════════════════════════`);
  console.log(`Done — ${files.length} sprite sheet(s) in assets/sprites/`);
  console.log(`Next: open index.html and verify sprites load in-game.`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

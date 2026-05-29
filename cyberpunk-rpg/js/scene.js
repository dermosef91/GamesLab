/* global Scene, THREE, CONFIG, Utils, STORY */

class Scene {
  constructor() {
    this.renderer = null;
    this.camera   = null;
    this.scene    = null;
    this.mode     = 'world'; // 'world' | 'battle'

    // World objects
    this.tiles       = [];
    this.buildings   = [];
    this.playerMesh  = null;
    this.npcMeshes   = {};
    this.playerTile  = { x: 10, z: 10 };
    this.playerTarget = { x: 10, z: 10 };
    this.playerPos   = { x: 0, y: 0, z: 0 };
    this.cameraTarget = { x: 0, z: 0 };

    // Battle objects
    this.enemyMeshes = [];
    this.partyMeshes = [];
    this.battleScene  = null;
    this.battleCamera = null;
    this.effects      = [];

    // Theme
    this.currentTheme = null;

    // Timing
    this._lastTime = 0;
    this._animFrame = null;
    this._onFrameCallback = null;

    this._init();
  }

  _init() {
    const container = document.getElementById('gameContainer');

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = false;
    container.appendChild(this.renderer.domElement);

    // World scene setup
    this.scene = new THREE.Scene();
    this._buildOrthoCam();

    // Handle resize
    window.addEventListener('resize', () => this._onResize());

    // Tap-to-move on world
    this.renderer.domElement.addEventListener('click',   e => this._onTap(e));
    this.renderer.domElement.addEventListener('touchend', e => {
      e.preventDefault();
      if (e.changedTouches.length > 0) {
        const t = e.changedTouches[0];
        this._onTap({ clientX: t.clientX, clientY: t.clientY, isTouchEvent: true });
      }
    }, { passive: false });
  }

  _buildOrthoCam() {
    const w = this.renderer.domElement.clientWidth;
    const h = this.renderer.domElement.clientHeight;
    const aspect = w / h;
    const frustum = 18;
    this.camera = new THREE.OrthographicCamera(
      -frustum * aspect, frustum * aspect,
       frustum, -frustum,
      0.1, 200
    );
    this.camera.position.set(15, 18, 15);
    this.camera.lookAt(0, 0, 0);
  }

  _onResize() {
    const container = document.getElementById('gameContainer');
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.renderer.setSize(w, h);

    if (this.mode === 'world') {
      const aspect = w / h;
      const frustum = 18;
      this.camera.left   = -frustum * aspect;
      this.camera.right  =  frustum * aspect;
      this.camera.top    =  frustum;
      this.camera.bottom = -frustum;
      this.camera.updateProjectionMatrix();
    } else if (this.battleCamera) {
      this.battleCamera.aspect = w / h;
      this.battleCamera.updateProjectionMatrix();
    }
  }

  // ─── World Building ─────────────────────────────────────────────────────────

  buildWorld(chapterDef) {
    this._clearWorld();
    const theme = STORY.themes[chapterDef.locationTheme];
    this.currentTheme = theme;

    const T = CONFIG.TILE_SIZE;
    const N = CONFIG.WORLD_TILES;
    const offset = (N / 2) * T;

    // Fog
    this.scene.fog = new THREE.FogExp2(theme.fogColor, theme.fogDensity);
    this.scene.background = new THREE.Color(theme.fogColor);

    // Ambient + directional light
    const ambient = new THREE.AmbientLight(theme.ambientColor, theme.ambientIntensity);
    this.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0x9966ff, 0.6);
    dirLight.position.set(10, 20, 10);
    this.scene.add(dirLight);

    // Neon point lights
    for (const l of theme.lights) {
      const pt = new THREE.PointLight(l.color, l.intensity, 20);
      pt.position.set(l.x, l.y, l.z);
      this.scene.add(pt);
    }

    // Floor tiles
    const floorGeo = new THREE.PlaneGeometry(T, T);
    const floorMatBase = new THREE.MeshLambertMaterial({ color: theme.floorColor });
    const floorMatAccent = new THREE.MeshLambertMaterial({
      color: theme.accentColor, emissive: new THREE.Color(theme.accentColor), emissiveIntensity: 0.4,
    });

    this.tiles = [];
    for (let tx = 0; tx < N; tx++) {
      for (let tz = 0; tz < N; tz++) {
        const isAccent = (tx + tz) % 5 === 0;
        const mesh = new THREE.Mesh(floorGeo, isAccent ? floorMatAccent : floorMatBase);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(tx * T - offset + T / 2, 0, tz * T - offset + T / 2);
        mesh.userData.tileX = tx;
        mesh.userData.tileZ = tz;
        mesh.userData.walkable = true;
        this.scene.add(mesh);
        this.tiles.push(mesh);
      }
    }

    // Buildings
    this._addBuildings(chapterDef.locationTheme, theme, offset, T, N);

    // Player avatar
    this.playerMesh = this._makePlayerMesh();
    const startPos = this._tileToWorld(this.playerTile.x, this.playerTile.z, offset, T, N);
    this.playerMesh.position.set(startPos.x, 0.6, startPos.z);
    this.playerPos = { x: startPos.x, y: 0.6, z: startPos.z };
    this.scene.add(this.playerMesh);

    // Camera position
    this.camera.position.set(
      startPos.x + 15, 18, startPos.z + 15
    );
    this.camera.lookAt(startPos.x, 0, startPos.z);
    this.cameraTarget = { x: startPos.x, z: startPos.z };

    return { offset, T, N };
  }

  _tileToWorld(tx, tz, offset, T, N) {
    return {
      x: tx * T - offset + T / 2,
      z: tz * T - offset + T / 2,
    };
  }

  addNpcMesh(npc, offset, T, N) {
    const pos = this._tileToWorld(npc.tileX, npc.tileZ, offset, T, N);

    // Glowing sphere NPC
    const geo  = new THREE.SphereGeometry(0.45, 12, 8);
    const mat  = new THREE.MeshStandardMaterial({
      color: 0x222244,
      emissive: new THREE.Color(CONFIG.COLORS.neonCyan),
      emissiveIntensity: 0.8,
      roughness: 0.3,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, 0.8, pos.z);
    mesh.userData.npcId  = npc.id;
    mesh.userData.tileX  = npc.tileX;
    mesh.userData.tileZ  = npc.tileZ;

    // Halo ring
    const ringGeo = new THREE.TorusGeometry(0.65, 0.04, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: CONFIG.COLORS.neonCyan });
    const ring    = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);

    // Mark tile as non-walkable
    const tile = this.tiles.find(t => t.userData.tileX === npc.tileX && t.userData.tileZ === npc.tileZ);
    if (tile) tile.userData.npcId = npc.id;

    this.scene.add(mesh);
    this.npcMeshes[npc.id] = mesh;
  }

  _makePlayerMesh() {
    const group = new THREE.Group();
    const bodyGeo = new THREE.CylinderGeometry(0.28, 0.35, 1.0, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: CONFIG.COLORS.neonGold,
      emissive: new THREE.Color(CONFIG.COLORS.neonGold),
      emissiveIntensity: 0.3,
      roughness: 0.4,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    group.add(body);

    const headGeo = new THREE.SphereGeometry(0.3, 10, 8);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xc87941,
      emissive: new THREE.Color(CONFIG.COLORS.neonGold),
      emissiveIntensity: 0.15,
      roughness: 0.6,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.22;
    group.add(head);

    return group;
  }

  _addBuildings(theme, themeData, offset, T, N) {
    const patterns = {
      market:    this._marketLayout(),
      slums:     this._slumsLayout(),
      corporate: this._corpLayout(),
      digital:   this._digitalLayout(),
    };
    const layout = patterns[theme] || patterns.market;

    const edgeMat = new THREE.LineBasicMaterial({
      color: themeData.accentColor, opacity: 0.7, transparent: true,
    });

    for (const b of layout) {
      const geo = new THREE.BoxGeometry(b.w * T, b.h, b.d * T);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e, roughness: 0.8, metalness: 0.3,
        emissive: new THREE.Color(themeData.accentColor),
        emissiveIntensity: 0.04,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const wx = b.tx * T - offset + (b.w * T) / 2;
      const wz = b.tz * T - offset + (b.d * T) / 2;
      mesh.position.set(wx, b.h / 2, wz);
      this.scene.add(mesh);
      this.buildings.push(mesh);

      // Neon edge outline
      const edges = new THREE.EdgesGeometry(geo);
      const wireframe = new THREE.LineSegments(edges, edgeMat.clone());
      mesh.add(wireframe);

      // Mark tiles as non-walkable
      for (let dx = 0; dx < b.w; dx++) {
        for (let dz = 0; dz < b.d; dz++) {
          const tile = this.tiles.find(t =>
            t.userData.tileX === b.tx + dx && t.userData.tileZ === b.tz + dz
          );
          if (tile) tile.userData.walkable = false;
        }
      }
    }
  }

  _marketLayout() {
    return [
      { tx: 0,  tz: 0,  w: 3, d: 3, h: 4 },
      { tx: 5,  tz: 1,  w: 2, d: 2, h: 6 },
      { tx: 0,  tz: 6,  w: 2, d: 3, h: 3 },
      { tx: 14, tz: 0,  w: 3, d: 2, h: 5 },
      { tx: 16, tz: 5,  w: 4, d: 4, h: 8 },
      { tx: 0,  tz: 14, w: 4, d: 3, h: 5 },
      { tx: 14, tz: 14, w: 3, d: 3, h: 4 },
      { tx: 8,  tz: 17, w: 2, d: 3, h: 6 },
      { tx: 17, tz: 17, w: 3, d: 3, h: 7 },
    ];
  }

  _slumsLayout() {
    return [
      { tx: 0,  tz: 0,  w: 2, d: 2, h: 3 },
      { tx: 3,  tz: 0,  w: 3, d: 2, h: 5 },
      { tx: 8,  tz: 0,  w: 2, d: 3, h: 4 },
      { tx: 0,  tz: 4,  w: 2, d: 3, h: 6 },
      { tx: 16, tz: 0,  w: 4, d: 3, h: 7 },
      { tx: 15, tz: 5,  w: 5, d: 4, h: 9 },
      { tx: 0,  tz: 15, w: 3, d: 5, h: 8 },
      { tx: 5,  tz: 16, w: 2, d: 4, h: 5 },
      { tx: 14, tz: 15, w: 6, d: 5, h: 11 },
    ];
  }

  _corpLayout() {
    return [
      { tx: 0,  tz: 0,  w: 4, d: 4, h: 12 },
      { tx: 6,  tz: 0,  w: 3, d: 3, h: 10 },
      { tx: 0,  tz: 6,  w: 3, d: 4, h: 9  },
      { tx: 14, tz: 0,  w: 6, d: 5, h: 14 },
      { tx: 14, tz: 7,  w: 6, d: 6, h: 16 },
      { tx: 0,  tz: 14, w: 5, d: 6, h: 13 },
      { tx: 7,  tz: 15, w: 4, d: 5, h: 10 },
      { tx: 14, tz: 15, w: 6, d: 5, h: 15 },
    ];
  }

  _digitalLayout() {
    return [
      { tx: 0,  tz: 0,  w: 3, d: 3, h: 6  },
      { tx: 5,  tz: 2,  w: 2, d: 2, h: 10 },
      { tx: 0,  tz: 7,  w: 3, d: 3, h: 8  },
      { tx: 16, tz: 0,  w: 4, d: 4, h: 12 },
      { tx: 15, tz: 6,  w: 5, d: 5, h: 14 },
      { tx: 0,  tz: 15, w: 4, d: 5, h: 10 },
      { tx: 6,  tz: 16, w: 3, d: 4, h: 7  },
      { tx: 15, tz: 14, w: 5, d: 6, h: 16 },
    ];
  }

  _clearWorld() {
    for (const obj of [...this.tiles, ...this.buildings, ...Object.values(this.npcMeshes)]) {
      this.scene.remove(obj);
    }
    if (this.playerMesh) this.scene.remove(this.playerMesh);
    // Remove all non-persistent scene objects
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
    this.tiles = [];
    this.buildings = [];
    this.npcMeshes = {};
    this.playerMesh = null;
  }

  // ─── Tap to Move ────────────────────────────────────────────────────────────

  _onTap(e) {
    if (this.mode !== 'world') return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
    const y = ((e.clientY - rect.top)  / rect.height) * -2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
    const hits = raycaster.intersectObjects(this.tiles);
    if (hits.length === 0) return;

    const tile = hits[0].object;
    if (!tile.userData.walkable) return;

    const tx = tile.userData.tileX;
    const tz = tile.userData.tileZ;
    this.playerTarget = { x: tx, z: tz };

    // Fire tile enter callback
    if (this._onTileEnter) this._onTileEnter(tx, tz, tile.userData.npcId || null);
  }

  setTileEnterCallback(fn) { this._onTileEnter = fn; }

  // ─── Battle Scene ────────────────────────────────────────────────────────────

  switchToBattle(enemies) {
    this.mode = 'battle';

    const container = document.getElementById('gameContainer');
    const w = container.clientWidth;
    const h = container.clientHeight;

    // Build separate battle scene
    this.battleScene = new THREE.Scene();
    this.battleScene.background = new THREE.Color(0x050510);
    this.battleScene.fog = new THREE.Fog(0x050510, 15, 35);

    // Perspective camera
    this.battleCamera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    this.battleCamera.position.set(0, 2.8, 10);
    this.battleCamera.lookAt(0, 1.5, 0);

    // Lighting
    const ambient = new THREE.AmbientLight(0x0a0a2e, 0.6);
    this.battleScene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0x9966ff, 1.2);
    keyLight.position.set(-5, 8, 5);
    this.battleScene.add(keyLight);
    const fillLight = new THREE.PointLight(0xff00cc, 1.5, 20);
    fillLight.position.set(5, 3, 2);
    this.battleScene.add(fillLight);
    const rimLight = new THREE.PointLight(0x00ffcc, 1.2, 18);
    rimLight.position.set(-5, 2, -3);
    this.battleScene.add(rimLight);

    // Floor plane
    const floorGeo = new THREE.PlaneGeometry(20, 10);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0a18, roughness: 0.9 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.01, 2);
    this.battleScene.add(floor);

    // Grid lines on floor
    const gridHelper = new THREE.GridHelper(20, 20, 0x1a1a3a, 0x1a1a3a);
    gridHelper.position.set(0, 0, 2);
    this.battleScene.add(gridHelper);

    // Background city silhouette (distant plane)
    this._addBattleBackground();

    // Enemy models
    this.enemyMeshes = [];
    const enemyXPositions = enemies.length === 1 ? [0] :
                            enemies.length === 2 ? [-2.5, 2.5] :
                            [-3.5, 0, 3.5];
    enemies.forEach((enemy, i) => {
      const mesh = this._makeEnemyMesh(enemy);
      mesh.position.set(enemyXPositions[i], 0, 3.5);
      mesh.userData.enemyIdx = i;
      this.battleScene.add(mesh);
      this.enemyMeshes.push(mesh);
    });

    // Party models (back, smaller)
    this.partyMeshes = [];
    const partyXPos = [-2.2, 0, 2.2];
    partyXPos.forEach((px, i) => {
      const mesh = this._makePartyMesh(i);
      mesh.position.set(px, 0, -1.5);
      mesh.rotation.y = Math.PI; // facing enemies
      this.partyMeshes.push(mesh);
      this.battleScene.add(mesh);
    });
  }

  _addBattleBackground() {
    // Use a canvas texture for the city skyline
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Gradient sky
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0,   '#0a0020');
    grad.addColorStop(0.6, '#1a0535');
    grad.addColorStop(1,   '#0d0015');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 80; i++) {
      const sx = Math.random() * 512;
      const sy = Math.random() * 150;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // City buildings silhouette
    const buildings = [
      [0, 200, 60, 180], [55, 180, 40, 140], [90, 170, 30, 130],
      [115, 190, 50, 160], [160, 150, 35, 110], [190, 175, 45, 140],
      [230, 130, 55, 90],  [280, 165, 40, 130], [315, 145, 50, 105],
      [360, 180, 45, 150], [400, 160, 50, 125], [445, 185, 40, 155],
      [480, 195, 40, 170],
    ];
    ctx.fillStyle = '#0d0520';
    for (const [x, y, w, h] of buildings) {
      ctx.fillRect(x, y, w, 256 - y);
    }

    // Neon glow windows
    const neonColors = ['#ff00cc', '#00ffcc', '#9966ff', '#ffd700'];
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = neonColors[Math.floor(Math.random() * neonColors.length)];
      ctx.globalAlpha = Utils.rand(0.3, 0.9);
      ctx.fillRect(Math.random() * 512, 130 + Math.random() * 100, 3, 3);
    }
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(canvas);
    const bgGeo = new THREE.PlaneGeometry(40, 20);
    const bgMat = new THREE.MeshBasicMaterial({ map: tex, depthWrite: false });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    bg.position.set(0, 8, -8);
    this.battleScene.add(bg);
  }

  _makeEnemyMesh(enemy) {
    const group = new THREE.Group();
    const def = CONFIG.ENEMIES[enemy.id];
    const col = new THREE.Color(def.color);
    const acc = new THREE.Color(def.accentColor);

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.8, 1.0, 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: col, emissive: col, emissiveIntensity: 0.2, roughness: 0.6,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.7;
    group.add(body);

    // Head
    const headGeo = def.ai === 'boss'
      ? new THREE.OctahedronGeometry(0.55)
      : new THREE.SphereGeometry(0.36, 8, 6);
    const headMat = new THREE.MeshStandardMaterial({
      color: acc, emissive: acc, emissiveIntensity: 0.5, roughness: 0.4,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = def.ai === 'boss' ? 1.65 : 1.6;
    group.add(head);

    // Edge highlight
    const edgeGeo = new THREE.EdgesGeometry(bodyGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: acc });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    edges.position.y = 0.7;
    group.add(edges);

    // Boss special: extra rings
    if (def.ai === 'boss') {
      const ringGeo = new THREE.TorusGeometry(1.0, 0.05, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 4;
      ring.position.y = 1.0;
      group.add(ring);
    }

    group.userData.baseEmissive = col;
    group.userData.baseScale    = 1;
    return group;
  }

  _makePartyMesh(idx) {
    const colors = [CONFIG.COLORS.neonGold, 0x00ffcc, 0xcc66ff];
    const group = new THREE.Group();

    const bodyGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.8, 7);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: colors[idx], emissive: new THREE.Color(colors[idx]), emissiveIntensity: 0.25,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.4;
    group.add(body);

    const headGeo = new THREE.SphereGeometry(0.24, 8, 6);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xc87941, roughness: 0.7 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.96;
    group.add(head);

    return group;
  }

  switchToWorld() {
    this.mode = 'world';
    this.battleScene  = null;
    this.battleCamera = null;
    this.enemyMeshes  = [];
    this.partyMeshes  = [];
    this.effects      = [];
  }

  // ─── Hit / Skill Animations ─────────────────────────────────────────────────

  playHitEffect(isEnemy, idx) {
    const meshes = isEnemy ? this.enemyMeshes : this.partyMeshes;
    const mesh   = meshes[idx];
    if (!mesh) return;

    const start = performance.now();
    const dur   = 350;
    const anim  = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const scale = t < 0.3 ? Utils.lerp(1, 1.35, t / 0.3) : Utils.lerp(1.35, 1, (t - 0.3) / 0.7);
      mesh.scale.setScalar(scale);
      if (t < 1) requestAnimationFrame(anim);
      else mesh.scale.setScalar(1);
    };
    requestAnimationFrame(anim);
  }

  playSkillEffect(skillId, isTargetEnemy, targetIdx) {
    const skill = CONFIG.SKILLS[skillId];
    if (!skill || this.mode !== 'battle') return;

    const targetMesh = isTargetEnemy
      ? this.enemyMeshes[targetIdx]
      : this.partyMeshes[targetIdx];

    const col = new THREE.Color(skill.effectColor);

    if (skill.type === 'damage' && skill.target === 'single_enemy') {
      this._spawnProjectile(col, this.partyMeshes[0], targetMesh, 400);
    } else if (skill.target === 'all_enemies') {
      this._spawnAoeRing(col, new THREE.Vector3(0, 0.5, 3.5), 500);
    } else if (skill.target === 'all_party') {
      this._spawnBurst(col, new THREE.Vector3(0, 1, -1.5), 600);
    } else if (skill.type === 'heal') {
      this._spawnHealPulse(col, new THREE.Vector3(0, 1, -1.5));
    } else if (targetMesh) {
      this._spawnBurst(col, targetMesh.position, 400);
    }
  }

  _spawnProjectile(color, fromMesh, toMesh, duration) {
    if (!fromMesh || !toMesh) return;
    const geo = new THREE.SphereGeometry(0.12, 6, 4);
    const mat = new THREE.MeshBasicMaterial({ color });
    const proj = new THREE.Mesh(geo, mat);
    proj.position.copy(fromMesh.position).add(new THREE.Vector3(0, 1, 0));
    this.battleScene.add(proj);

    const start = performance.now();
    const from  = proj.position.clone();
    const to    = toMesh.position.clone().add(new THREE.Vector3(0, 1, 0));

    const anim = (now) => {
      const t = Math.min(1, (now - start) / duration);
      proj.position.lerpVectors(from, to, Utils.easeOut(t));
      if (t < 1) { requestAnimationFrame(anim); }
      else { this.battleScene.remove(proj); }
    };
    requestAnimationFrame(anim);
  }

  _spawnAoeRing(color, center, duration) {
    const geo = new THREE.TorusGeometry(0.3, 0.06, 8, 24);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(center);
    this.battleScene.add(ring);

    const start = performance.now();
    const anim = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const s = Utils.lerp(0.5, 4, t);
      ring.scale.setScalar(s);
      mat.opacity = 1 - t;
      if (t < 1) { requestAnimationFrame(anim); }
      else { this.battleScene.remove(ring); }
    };
    requestAnimationFrame(anim);
  }

  _spawnBurst(color, center, duration) {
    const light = new THREE.PointLight(color, 3, 8);
    light.position.copy(center);
    this.battleScene.add(light);
    const start = performance.now();
    const anim = (now) => {
      const t = Math.min(1, (now - start) / duration);
      light.intensity = 3 * (1 - t);
      if (t < 1) { requestAnimationFrame(anim); }
      else { this.battleScene.remove(light); }
    };
    requestAnimationFrame(anim);
  }

  _spawnHealPulse(color, center) {
    this._spawnAoeRing(color, center, 700);
    this._spawnBurst(color, center, 700);
  }

  // ─── Enemy death animation ────────────────────────────────────────────────

  playEnemyDeath(idx) {
    const mesh = this.enemyMeshes[idx];
    if (!mesh) return;

    const start = performance.now();
    const dur = 600;
    const anim = (now) => {
      const t = Math.min(1, (now - start) / dur);
      mesh.scale.setScalar(1 - t);
      mesh.position.y = t * 0.5;
      mesh.traverse(child => {
        if (child.material) child.material.opacity = 1 - t;
        if (child.material) child.material.transparent = true;
      });
      if (t < 1) { requestAnimationFrame(anim); }
      else { if (this.battleScene) this.battleScene.remove(mesh); }
    };
    requestAnimationFrame(anim);
  }

  // ─── Render Loop ─────────────────────────────────────────────────────────────

  startRenderLoop(onFrame) {
    this._onFrameCallback = onFrame;
    const loop = (ts) => {
      this._animFrame = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (ts - this._lastTime) / 1000);
      this._lastTime = ts;

      if (this.mode === 'world') {
        this._updateWorld(dt);
        this.renderer.render(this.scene, this.camera);
      } else if (this.mode === 'battle' && this.battleScene && this.battleCamera) {
        this._updateBattle(dt);
        this.renderer.render(this.battleScene, this.battleCamera);
      }

      if (this._onFrameCallback) this._onFrameCallback(dt);
    };
    this._animFrame = requestAnimationFrame(loop);
  }

  _updateWorld(dt) {
    if (!this.playerMesh) return;

    const T = CONFIG.TILE_SIZE;
    const N = CONFIG.WORLD_TILES;
    const offset = (N / 2) * T;
    const target = this._tileToWorld(this.playerTarget.x, this.playerTarget.z, offset, T, N);
    const speed  = CONFIG.PLAYER_MOVE_SPEED;

    this.playerPos.x = Utils.lerp(this.playerPos.x, target.x, Math.min(1, dt * speed));
    this.playerPos.z = Utils.lerp(this.playerPos.z, target.z, Math.min(1, dt * speed));
    this.playerMesh.position.set(this.playerPos.x, 0.6, this.playerPos.z);

    // Pulse player emissive
    const t = performance.now() / 1000;
    this.playerMesh.traverse(child => {
      if (child.material && child.material.emissiveIntensity !== undefined) {
        child.material.emissiveIntensity = 0.2 + Math.sin(t * 2) * 0.1;
      }
    });

    // Pulse NPC meshes
    for (const npc of Object.values(this.npcMeshes)) {
      npc.position.y = 0.8 + Math.sin(t * 1.5 + npc.userData.tileX) * 0.08;
    }

    // Camera follow
    this.cameraTarget.x = Utils.lerp(this.cameraTarget.x, target.x, Math.min(1, dt * CONFIG.CAMERA_LERP));
    this.cameraTarget.z = Utils.lerp(this.cameraTarget.z, target.z, Math.min(1, dt * CONFIG.CAMERA_LERP));
    this.camera.position.set(this.cameraTarget.x + 15, 18, this.cameraTarget.z + 15);
    this.camera.lookAt(this.cameraTarget.x, 0, this.cameraTarget.z);
  }

  _updateBattle(dt) {
    const t = performance.now() / 1000;

    // Idle sway for enemy meshes
    this.enemyMeshes.forEach((m, i) => {
      if (m) m.rotation.y = Math.sin(t * 0.8 + i * 1.2) * 0.08;
    });
  }

  // ─── Highlight enemy for targeting ──────────────────────────────────────────

  highlightEnemy(idx, on) {
    const mesh = this.enemyMeshes[idx];
    if (!mesh) return;
    mesh.traverse(child => {
      if (child.isMesh && child.material) {
        child.material.emissiveIntensity = on ? 0.8 : 0.2;
      }
    });
  }

  // ─── Player tile position check ──────────────────────────────────────────────

  isPlayerAtTile(tx, tz) {
    return this.playerTarget.x === tx && this.playerTarget.z === tz;
  }

  setPlayerTile(tx, tz) {
    this.playerTile  = { x: tx, z: tz };
    this.playerTarget = { x: tx, z: tz };
  }
}

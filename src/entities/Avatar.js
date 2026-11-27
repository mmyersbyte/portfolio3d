import * as THREE from 'three';
import { box, seeded } from '../world/helpers.js';
import { LAYOUT, AVATAR_SPOTS } from '../world/layout.js';
import { NavGrid } from './pathfinding.js';
import { DEFAULT_OUTFIT } from '../data/wardrobe.js';

const SKIN = '#f2d3bd';
const HAIR = '#151312';
const HAIR_LIGHT = '#2b2420';

const SPEED = 1.5;
const PRESS_TIME = 0.5;
const LAUGH_TIME = 1.6;
const FACE_CAMERA = Math.PI / 4;

// poses do corpo (interpoladas): deitar gira o corpo inteiro, sentar dobra pernas e braços
const POSES = {
  stand: { lie: 0, leg: 0, arm: 0 },
  sit: { lie: 0, leg: -1.45, arm: -1.0 },
  lie: { lie: -Math.PI / 2, leg: 0, arm: 0 },
};

const ZERO_NDC = new THREE.Vector2();
const shortest = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);

/**
 * Meu boneco: voxel, cabeção estilo Habbo, cabelo cacheado preto.
 * Anda pelos tiles (A*), senta na cadeira, deita na cama, olha pro mouse,
 * pisca, acena e mexe a boca quando "fala".
 *
 * Estados: idle → walk → idle | enter → seated → leave → ...
 */
export class Avatar {
  /**
   * @param exp Experience (null quando standalone)
   * @param opts.scene cena onde entrar (padrão: a do quarto)
   * @param opts.standalone cópia "de vitrine" (prévia do guarda-roupa):
   *   não anda, não olha pro mouse e quem chama update() é o dono.
   */
  constructor(exp, { scene = exp?.scene, standalone = false } = {}) {
    this.exp = exp;
    this.standalone = standalone;
    this.root = new THREE.Group();
    this.root.name = standalone ? 'avatar-preview' : 'avatar';
    if (!standalone) this.root.position.set(LAYOUT.avatar.x, 0, LAYOUT.avatar.z);
    this.root.rotation.y = standalone ? 0 : FACE_CAMERA;
    this.heading = FACE_CAMERA;

    this.state = 'idle';
    this.spot = null; // móvel em uso (AVATAR_SPOTS)
    this.path = [];
    this.onArrive = null;
    this.tween = null;
    this.nav = new NavGrid({ margin: 0.25 });

    this.pose = { ...POSES.stand };
    this.targetPose = POSES.stand;
    this.walkAmount = 0;
    this.walkPhase = 0;

    this.waveT = 0;
    this.pressT = 0; // apertando algo na parede (interruptor)
    this.laughT = 0;
    this.sleeping = false;
    this.onSleepChange = null; // (sleeping) => void, pro "zZz" na cena
    this.talking = false;
    this.nextBlink = 2;

    this.build();
    this.setOutfit(DEFAULT_OUTFIT);
    scene.add(this.root);
    if (!standalone) exp.onUpdate((dt, t) => this.update(dt, t));
  }

  build() {
    // root = posição/direção no quarto; body = pose (deitar gira só ele)
    this.body = new THREE.Group();
    this.root.add(this.body);
    const r = this.body;

    // materiais da roupa são do boneco (não compartilhados): trocar cor = mudar .color
    const cloth = () => new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true });
    this.mats = {
      top: cloth(),
      topDetail: cloth(),
      sleeveLow: cloth(), // antebraço: cor da blusa ou pele (camiseta)
      inner: cloth(), // camiseta por baixo da jaqueta / cordões do moletom
      pants: cloth(),
      shoes: cloth(),
      sole: cloth(),
      accent: cloth(), // boné, gorro, fone, mochila, caneca...
      accentDetail: cloth(),
    };
    const M = this.mats;

    // pernas e tênis
    this.legs = [-1, 1].map((side) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.13, 0.75, 0);
      box(0.2, 0.68, 0.22, M.pants, { y: -0.68, parent: pivot });
      box(0.22, 0.1, 0.32, M.shoes, { y: -0.75, z: 0.04, parent: pivot });
      box(0.225, 0.03, 0.325, M.sole, { y: -0.755, z: 0.04, parent: pivot });
      r.add(pivot);
      return pivot;
    });

    // tronco
    this.torso = new THREE.Group();
    this.torso.position.y = 0.72;
    r.add(this.torso);
    const T = this.torso;
    box(0.6, 0.62, 0.32, M.top, { parent: T });

    // peças específicas de cada estilo (ligadas/desligadas em setOutfit)
    const noShadow = { parent: T, shadow: false };
    this.styleParts = {
      hoodie: [
        box(0.36, 0.16, 0.02, M.topDetail, { y: 0.12, z: 0.16, ...noShadow }),
        box(0.03, 0.14, 0.02, M.inner, { x: -0.06, y: 0.42, z: 0.165, ...noShadow }),
        box(0.03, 0.14, 0.02, M.inner, { x: 0.06, y: 0.42, z: 0.165, ...noShadow }),
        box(0.46, 0.14, 0.1, M.topDetail, { y: 0.54, z: -0.17, parent: T }), // capuz
      ],
      tshirt: [box(0.22, 0.03, 0.02, M.topDetail, { y: 0.58, z: 0.162, ...noShadow })],
      jacket: [
        box(0.16, 0.6, 0.02, M.inner, { y: 0.01, z: 0.162, ...noShadow }),
        box(0.02, 0.6, 0.025, M.topDetail, { x: -0.09, y: 0.01, z: 0.162, ...noShadow }),
        box(0.02, 0.6, 0.025, M.topDetail, { x: 0.09, y: 0.01, z: 0.162, ...noShadow }),
        box(0.64, 0.08, 0.36, M.topDetail, { y: 0.56, parent: T }), // gola
      ],
    };

    // braços com pivô no ombro: manga (cima) + antebraço + mão
    this.arms = [-1, 1].map((side) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.39, 0.56, 0);
      box(0.17, 0.26, 0.2, M.top, { y: -0.26, parent: pivot });
      box(0.17, 0.26, 0.2, M.sleeveLow, { y: -0.52, parent: pivot });
      box(0.15, 0.13, 0.17, SKIN, { y: -0.65, parent: pivot });
      T.add(pivot);
      return pivot;
    });
    // braço direito do boneco = lado -x (ele está de frente pra gente)
    this.waveArm = this.arms[0];

    box(0.18, 0.08, 0.18, SKIN, { y: 0.62, parent: T });

    // cabeça
    this.head = new THREE.Group();
    this.head.position.y = 0.68;
    this.torso.add(this.head);
    const h = this.head;
    box(0.52, 0.5, 0.48, SKIN, { parent: h });
    for (const side of [-1, 1]) box(0.05, 0.12, 0.1, SKIN, { x: side * 0.27, y: 0.16, parent: h });

    this.eyes = [-1, 1].map((side) => {
      const eye = box(0.07, 0.1, 0.02, '#1d1b2e', {
        x: side * 0.11,
        y: 0.2,
        z: 0.245,
        parent: h,
        shadow: false,
      });
      box(0.025, 0.025, 0.01, '#fff', { x: 0.015, y: 0.02, z: 0.012, parent: eye, shadow: false });
      return eye;
    });
    for (const side of [-1, 1]) {
      box(0.11, 0.025, 0.02, HAIR, { x: side * 0.11, y: 0.33, z: 0.245, parent: h, shadow: false });
    }
    this.mouth = box(0.13, 0.035, 0.02, '#b5523b', { y: 0.09, z: 0.245, parent: h, shadow: false });

    // óculos (acessório do guarda-roupa)
    this.glasses = new THREE.Group();
    const frame = '#1d1b2e';
    const g = { parent: this.glasses, shadow: false };
    for (const side of [-1, 1]) {
      const cx = side * 0.11;
      box(0.16, 0.022, 0.02, frame, { x: cx, y: 0.31, ...g });
      box(0.16, 0.022, 0.02, frame, { x: cx, y: 0.17, ...g });
      box(0.022, 0.16, 0.02, frame, { x: cx - 0.08, y: 0.17, ...g });
      box(0.022, 0.16, 0.02, frame, { x: cx + 0.08, y: 0.17, ...g });
      box(0.02, 0.022, 0.26, frame, { x: side * 0.265, y: 0.29, z: -0.12, ...g });
    }
    box(0.06, 0.022, 0.02, frame, { y: 0.27, ...g });
    // lentes escuras (óculos de sol)
    this.sunLenses = new THREE.Group();
    for (const side of [-1, 1]) {
      const lens = { parent: this.sunLenses, shadow: false };
      box(0.14, 0.12, 0.008, '#141418', { x: side * 0.11, y: 0.185, z: -0.004, ...lens });
      box(0.03, 0.03, 0.004, '#9aa7c7', { x: side * 0.11 - 0.035, y: 0.26, z: 0.002, ...lens });
    }
    this.glasses.add(this.sunLenses);
    this.glasses.position.z = 0.26;
    h.add(this.glasses);

    this.buildHair(h);
    this.buildAccessories();

    // âncora pro balão de fala
    this.bubbleAnchor = new THREE.Object3D();
    this.bubbleAnchor.position.y = 2.25;
    this.root.add(this.bubbleAnchor);
    // deitado na cama a cabeça fica ~1.6 pra trás dos pés: o "zZz" sai dali
    this.sleepAnchor = new THREE.Object3D();
    this.sleepAnchor.position.set(0, 0.85, -1.6);
    this.root.add(this.sleepAnchor);
  }

  /**
   * Cabelo cacheado em voxel: uma "carapaça" de blocos colada na cabeça
   * + cubinhos numa grade por cima (os cachos). A silhueta continua quadrada
   * como o resto do boneco, só com volume e textura.
   *
   * Referência da cabeça (local): x ±0.26, y 0..0.5, z ±0.24 (rosto em +z).
   */
  buildHair(head) {
    // carapaça: topo, nuca e laterais acima da orelha
    box(0.56, 0.17, 0.52, HAIR, { y: 0.43, z: -0.01, parent: head });
    box(0.56, 0.34, 0.1, HAIR, { y: 0.1, z: -0.22, parent: head });
    for (const side of [-1, 1]) {
      box(0.04, 0.14, 0.34, HAIR, { x: side * 0.27, y: 0.3, z: -0.06, parent: head });
    }

    const rand = seeded(42);
    const jitter = (n) => (rand() - 0.5) * n;
    const curls = []; // [x, y, z, tamanho]

    // topo: grade 5x5 com alturas variadas (é o que dá o "fofo" do cacho)
    for (const x of [-0.22, -0.11, 0, 0.11, 0.22]) {
      for (const z of [-0.2, -0.1, 0, 0.1, 0.2]) {
        const edge = Math.abs(x) > 0.2 || Math.abs(z) > 0.18;
        curls.push([
          x + jitter(0.02),
          0.6 + (edge ? 0 : 0.015) + rand() * 0.035,
          z + jitter(0.02),
          0.12,
        ]);
      }
    }

    // franja: fileira na testa com a borda de baixo irregular (para acima das sobrancelhas)
    [-0.21, -0.105, 0, 0.105, 0.21].forEach((x, i) => {
      curls.push([x + jitter(0.015), i % 2 ? 0.43 : 0.465, 0.235, 0.11]);
    });

    // laterais: cachinhos acima das orelhas
    for (const side of [-1, 1]) {
      for (const z of [-0.17, -0.06, 0.06]) {
        curls.push([side * 0.27, 0.4 + rand() * 0.06, z + jitter(0.02), 0.095]);
      }
    }

    // nuca: três fileiras que vão diminuindo
    [0.46, 0.33, 0.2].forEach((y, row) => {
      for (const x of [-0.2, -0.07, 0.07, 0.2]) {
        curls.push([x + jitter(0.02), y + jitter(0.03), -0.255, 0.115 - row * 0.01]);
      }
    });

    // cachinhos menores por cima: quebram os blocos e dão a textura de cacho
    for (let i = 0; i < 16; i++) {
      curls.push([jitter(0.46), 0.68 + rand() * 0.03, jitter(0.42), 0.065 + rand() * 0.02]);
    }
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        curls.push([side * 0.3, 0.5 + rand() * 0.1, jitter(0.4), 0.06]);
      }
    }

    // dois tons pra dar profundidade entre os cachos
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }),
      curls.length,
    );
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const dark = new THREE.Color(HAIR);
    const light = new THREE.Color(HAIR_LIGHT);
    curls.forEach(([x, y, z, size], i) => {
      // giro pequeno só no eixo y: quebra a grade sem sair do estilo voxel
      q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, jitter(0.5));
      mesh.setMatrixAt(i, m.compose(pos.set(x, y, z), q, scale.setScalar(size)));
      mesh.setColorAt(i, rand() < 0.35 ? light : dark);
    });
    mesh.castShadow = true;
    head.add(mesh);
  }

  /** Aplica uma roupa { style, top, pants, shoes, glasses } (preview ao vivo do guarda-roupa). */
  setOutfit(outfit) {
    const M = this.mats;
    const top = new THREE.Color(outfit.top);
    M.top.color.copy(top);
    // detalhes (bolso, gola, capuz) um tom abaixo da cor da blusa
    M.topDetail.color.copy(top).offsetHSL(0, 0, top.getHSL({}).l > 0.85 ? -0.12 : -0.07);
    M.sleeveLow.color.set(outfit.style === 'tshirt' ? SKIN : outfit.top);
    M.inner.color.set(
      outfit.style === 'jacket' ? '#f4f1ea' : top.getHSL({}).l > 0.85 ? '#bbbbbb' : '#f1f1f1',
    );
    M.pants.color.set(outfit.pants);

    const shoes = new THREE.Color(outfit.shoes);
    M.shoes.color.copy(shoes);
    // solado contrasta com o tênis
    M.sole.color.set(shoes.getHSL({}).l > 0.6 ? '#9a9aa5' : '#efefef');

    for (const [style, parts] of Object.entries(this.styleParts)) {
      for (const part of parts) part.visible = style === outfit.style;
    }
    const accent = new THREE.Color(outfit.accent);
    M.accent.color.copy(accent);
    M.accentDetail.color.copy(accent).offsetHSL(0, 0, accent.getHSL({}).l > 0.85 ? -0.15 : -0.1);

    for (const [id, hat] of Object.entries(this.hats)) hat.visible = id === outfit.hat;
    this.glasses.visible = outfit.glasses !== 'none';
    this.sunLenses.visible = outfit.glasses === 'sun';
    for (const [id, part] of Object.entries(this.beards)) part.visible = id === outfit.beard;
    for (const [id, part] of Object.entries(this.extras)) part.visible = Boolean(outfit[id]);
  }

  /** Vira de frente pra câmera (usado no guarda-roupa). */
  faceCamera() {
    this.heading = FACE_CAMERA;
  }

  /**
   * Acessórios do guarda-roupa. Tudo é criado uma vez e só liga/desliga
   * em setOutfit (trocar é instantâneo, sem recriar geometria).
   */
  buildAccessories() {
    const M = this.mats;
    const h = this.head;
    const group = (parent) => {
      const g = new THREE.Group();
      parent.add(g);
      return g;
    };
    const DARK = '#2b2d35';

    // ----- cabeça -----
    const cap = group(h);
    box(0.62, 0.18, 0.6, M.accent, { y: 0.58, z: -0.01, parent: cap });
    box(0.08, 0.04, 0.08, M.accentDetail, { y: 0.76, parent: cap });
    box(0.52, 0.035, 0.28, M.accentDetail, { y: 0.58, z: 0.4, parent: cap }); // aba

    const beanie = group(h);
    // dois blocos: o de cima mais estreito "arredonda" o gorro
    box(0.62, 0.16, 0.6, M.accent, { y: 0.55, z: -0.01, parent: beanie });
    box(0.52, 0.07, 0.5, M.accent, { y: 0.71, z: -0.01, parent: beanie });
    box(0.64, 0.08, 0.62, M.accentDetail, { y: 0.5, z: -0.01, parent: beanie });
    box(0.12, 0.1, 0.12, '#f4f1ea', { y: 0.78, parent: beanie }); // pompom

    const headphones = group(h);
    box(0.68, 0.05, 0.09, M.accentDetail, { y: 0.76, parent: headphones });
    for (const side of [-1, 1]) {
      box(0.04, 0.5, 0.07, M.accentDetail, { x: side * 0.33, y: 0.28, parent: headphones });
      box(0.08, 0.18, 0.18, M.accent, { x: side * 0.31, y: 0.12, parent: headphones });
    }

    const bandana = group(h);
    box(0.6, 0.08, 0.6, M.accent, { y: 0.45, z: -0.01, parent: bandana });
    box(0.1, 0.1, 0.06, M.accentDetail, { y: 0.43, z: -0.33, parent: bandana }); // nó
    box(0.05, 0.14, 0.03, M.accentDetail, { x: 0.03, y: 0.3, z: -0.33, parent: bandana });

    this.hats = { cap, beanie, headphones, bandana };

    // ----- rosto -----
    const mustache = group(h);
    box(0.22, 0.045, 0.03, HAIR, { y: 0.125, z: 0.245, parent: mustache, shadow: false });

    const beard = group(h);
    box(0.22, 0.045, 0.03, HAIR, { y: 0.125, z: 0.245, parent: beard, shadow: false });
    box(0.46, 0.09, 0.03, HAIR, { y: 0, z: 0.245, parent: beard, shadow: false });
    for (const side of [-1, 1]) {
      box(0.03, 0.22, 0.32, HAIR, { x: side * 0.258, y: 0, z: 0.06, parent: beard, shadow: false });
    }
    this.beards = { mustache, beard };

    // ----- extras -----
    const T = this.torso;
    const backpack = group(T);
    box(0.44, 0.46, 0.16, M.accent, { y: 0.08, z: -0.24, parent: backpack });
    box(0.3, 0.16, 0.04, M.accentDetail, { y: 0.12, z: -0.33, parent: backpack });
    for (const side of [-1, 1]) {
      box(0.06, 0.52, 0.02, DARK, { x: side * 0.17, y: 0.08, z: 0.165, parent: backpack });
      box(0.06, 0.02, 0.34, DARK, { x: side * 0.17, y: 0.62, parent: backpack });
    }

    const gold = new THREE.MeshStandardMaterial({
      color: '#e9c46a',
      metalness: 0.6,
      roughness: 0.3,
    });
    const chain = group(T);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 7; i++) {
        const k = i / 6;
        box(0.028, 0.028, 0.02, gold, {
          x: side * 0.13 * (1 - k),
          y: 0.58 - 0.17 * k,
          z: 0.17,
          parent: chain,
          shadow: false,
        });
      }
    }
    box(0.06, 0.07, 0.02, gold, { y: 0.32, z: 0.172, parent: chain, shadow: false });

    // relógio no pulso direito (braço -x), caneca na mão esquerda
    const watch = group(this.arms[0]);
    box(0.19, 0.06, 0.22, '#1f1f26', { y: -0.5, parent: watch });
    const screen = new THREE.MeshBasicMaterial({ color: '#7fd1ff', toneMapped: false });
    box(0.012, 0.045, 0.08, screen, { x: -0.1, y: -0.493, parent: watch, shadow: false });

    const mug = group(this.arms[1]);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.15, 10), M.accent);
    cup.position.set(0, -0.62, 0.15);
    cup.castShadow = true;
    mug.add(cup);
    box(0.11, 0.01, 0.11, '#5a3a24', { y: -0.551, z: 0.15, parent: mug, shadow: false }); // café
    box(0.025, 0.08, 0.05, M.accent, { x: 0, y: -0.66, z: 0.06, parent: mug });

    this.extras = { backpack, chain, watch, mug };
  }

  get isStanding() {
    return this.state === 'idle' || this.state === 'walk';
  }

  /** Andar até um ponto do piso (levanta antes, se estiver sentado/deitado). */
  walkTo(point, onArrive) {
    if (!this.isStanding) {
      this.leave(() => this.walkTo(point, onArrive));
      return true;
    }
    const pos = this.root.position;
    const path = this.nav.findPath({ x: pos.x, z: pos.z }, point);
    if (!path.length) return false;
    this.path = path;
    this.onArrive = onArrive ?? null;
    this.state = 'walk';
    return true;
  }

  /** Usar um móvel: 'chair' (sentar) ou 'bed' (deitar). Clicar de novo levanta. */
  use(name) {
    const spot = AVATAR_SPOTS[name];
    if (this.spot === spot && this.state === 'seated') {
      this.leave();
      return;
    }
    this.walkTo(spot.approach, () => this.enter(spot));
  }

  /** Tile é livre pra andar? (usado pelo destaque do piso) */
  canWalk(x, z) {
    return !this.nav.isBlocked(x, z);
  }

  enter(spot, then) {
    this.spot = spot;
    this.state = 'enter';
    this.targetPose = POSES[spot.pose];
    this.heading = spot.heading;
    this.startTween(spot.pos, spot.pose === 'lie' ? 0.75 : 0.5, () => {
      this.state = 'seated';
      then?.();
    });
  }

  /** Vai pra cama, deita e fecha os olhos. */
  sleep(onAsleep) {
    const bed = AVATAR_SPOTS.bed;
    const fallAsleep = () => {
      this.sleeping = true;
      this.onSleepChange?.(true);
      onAsleep?.();
    };
    if (this.spot === bed && this.state === 'seated') fallAsleep();
    else this.walkTo(bed.approach, () => this.enter(bed, fallAsleep));
  }

  /** Acorda e levanta da cama. */
  wakeUp(then) {
    if (!this.sleeping) return then?.();
    this.setAwake();
    setTimeout(() => this.leave(then), 500); // abre o olho, espreguiça e levanta
  }

  setAwake() {
    if (!this.sleeping) return;
    this.sleeping = false;
    this.onSleepChange?.(false);
  }

  /** Risada: corpo chacoalha, cabeça pra trás, olhos apertados. */
  laugh() {
    this.laughT = LAUGH_TIME;
    if (this.state === 'idle') this.heading = FACE_CAMERA;
  }

  leave(then) {
    const spot = this.spot;
    if (!spot) return then?.();
    this.setAwake();
    this.state = 'leave';
    this.targetPose = POSES.stand;
    const to = { x: spot.approach.x, y: 0, z: spot.approach.z };
    this.startTween(to, 0.5, () => {
      this.spot = null;
      this.state = 'idle';
      then?.();
    });
  }

  startTween(to, dur, onDone) {
    const from = this.root.position.clone();
    this.tween = { from, to: new THREE.Vector3(to.x, to.y ?? 0, to.z), t: 0, dur, onDone };
  }

  /** Estica o braço pra frente rapidinho (apertar o interruptor). */
  press() {
    this.pressT = PRESS_TIME;
  }

  wave() {
    this.waveT = 1.8;
    // se estiver parado, vira pra quem está falando comigo
    if (this.state === 'idle') this.heading = FACE_CAMERA;
  }

  setTalking(on) {
    this.talking = on;
  }

  update(dt, t) {
    const k = 1 - Math.exp(-dt * 8);

    if (this.state === 'walk') this.followPath(dt);
    if (this.tween) this.updateTween(dt);

    const turn = shortest(this.heading - this.root.rotation.y);
    this.root.rotation.y += turn * (1 - Math.exp(-dt * 10));

    this.animateBody(dt, t, k);
    this.animateFace(dt, t, k);
  }

  followPath(dt) {
    const pos = this.root.position;
    const wp = this.path[0];
    if (!wp) {
      this.state = 'idle';
      const cb = this.onArrive;
      this.onArrive = null;
      cb?.();
      return;
    }
    const dx = wp.x - pos.x;
    const dz = wp.z - pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.04) {
      this.path.shift();
      return;
    }
    this.heading = Math.atan2(dx, dz);
    const turning = Math.abs(shortest(this.heading - this.root.rotation.y));
    const step = Math.min(dist, SPEED * Math.max(0.2, 1 - turning / 1.5) * dt);
    pos.x += (dx / dist) * step;
    pos.z += (dz / dist) * step;
  }

  updateTween(dt) {
    const tw = this.tween;
    tw.t = Math.min(1, tw.t + dt / tw.dur);
    const e = easeInOut(tw.t);
    this.root.position.lerpVectors(tw.from, tw.to, e);
    // pulinho pra subir/descer da cama
    if (Math.abs(tw.to.y - tw.from.y) > 0.3)
      this.root.position.y += Math.sin(tw.t * Math.PI) * 0.25;
    if (tw.t >= 1) {
      this.tween = null;
      tw.onDone();
    }
  }

  animateBody(dt, t, k) {
    for (const key in this.pose) this.pose[key] += (this.targetPose[key] - this.pose[key]) * k;
    const P = this.pose;

    const walking = this.state === 'walk' ? 1 : 0;
    this.walkAmount += (walking - this.walkAmount) * (1 - Math.exp(-dt * 12));
    this.walkPhase += dt * 9 * this.walkAmount;
    const swing = Math.sin(this.walkPhase) * 0.55 * this.walkAmount;

    this.body.rotation.x = P.lie;
    let laugh = 0;
    if (this.laughT > 0) {
      this.laughT = Math.max(0, this.laughT - dt);
      laugh = Math.min(1, this.laughT * 3, (LAUGH_TIME - this.laughT) * 6);
    }
    this.laughAmount = laugh;
    this.body.position.y =
      Math.abs(Math.cos(this.walkPhase)) * 0.04 * this.walkAmount +
      Math.abs(Math.sin(t * 22)) * 0.035 * laugh;
    // respiração (mais lenta e funda dormindo)
    this.torso.scale.y = this.sleeping
      ? 1 + Math.sin(t * 1.3) * 0.025
      : 1 + Math.sin(t * 2.2) * 0.012;

    this.legs[0].rotation.x = P.leg + swing;
    this.legs[1].rotation.x = P.leg - swing;

    // digitando no notebook quando está na cadeira
    const typing = this.state === 'seated' && this.spot?.pose === 'sit' ? 1 : 0;
    let press = 0;
    if (this.pressT > 0) {
      this.pressT = Math.max(0, this.pressT - dt);
      press = Math.sin((1 - this.pressT / PRESS_TIME) * Math.PI);
    }
    this.arms.forEach((arm, i) => {
      const side = i === 0 ? 1 : -1;
      arm.rotation.x = P.arm - swing * side * 0.8 + Math.sin(t * 18 + i * 2) * 0.06 * typing;
      if (i === 0) arm.rotation.x -= press * 1.5; // braço direito vai até a parede
    });

    // aceno (braço direito) e leve balanço do esquerdo
    let armZ = -0.08;
    if (this.waveT > 0) {
      this.waveT -= dt;
      const up = Math.min(1, this.waveT * 3, (1.8 - this.waveT) * 4);
      armZ = THREE.MathUtils.lerp(-0.08, -2.7 + Math.sin(t * 14) * 0.3, up);
    }
    this.waveArm.rotation.z += (armZ - this.waveArm.rotation.z) * Math.min(1, k * 2);
    this.arms[1].rotation.z = 0.08 + Math.sin(t * 2.2) * 0.02;
  }

  animateFace(dt, t, k) {
    // olha pro ponteiro só quando está mais ou menos de frente pra câmera
    const facing =
      this.isStanding && !this.standalone
        ? Math.max(0, Math.cos(this.root.rotation.y - FACE_CAMERA))
        : 0;
    const ndc = this.exp?.interaction.ndc ?? ZERO_NDC;
    const yaw = THREE.MathUtils.clamp(ndc.x * 0.7, -0.6, 0.6) * facing;
    const pitch = THREE.MathUtils.clamp(-ndc.y * 0.25, -0.2, 0.25) * facing;
    this.head.rotation.y += (yaw - this.head.rotation.y) * k;
    const laugh = this.laughAmount ?? 0;
    // com música tocando e parado, balança a cabeça no ritmo (72 bpm)
    const nod =
      this.groove && this.state === 'idle' ? Math.sin(t * Math.PI * 2 * (72 / 60)) * 0.09 : 0;
    // rindo, a cabeça vai pra trás
    this.head.rotation.x += (pitch + nod - laugh * 0.35 - this.head.rotation.x) * k;

    // piscada
    this.nextBlink -= dt;
    const closed = this.nextBlink < 0.12;
    if (this.nextBlink < 0) this.nextBlink = 2 + Math.random() * 3;
    const eyeOpen = this.sleeping ? 0.12 : closed ? 0.15 : 1 - laugh * 0.65;
    for (const eye of this.eyes) eye.scale.y = eyeOpen;

    // boca: fala, risada (bem aberta) ou dormindo (fechadinha)
    if (laugh > 0) this.mouth.scale.y = 2.5 + Math.abs(Math.sin(t * 22)) * 2;
    else this.mouth.scale.y = this.talking ? 1 + Math.abs(Math.sin(t * 16)) * 2.5 : 1;
  }
}

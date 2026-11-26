import * as THREE from 'three';
import { box, seeded } from '../world/helpers.js';
import { LAYOUT, AVATAR_SPOTS } from '../world/layout.js';
import { NavGrid } from './pathfinding.js';

const SKIN = '#f2d3bd';
const HAIR = '#151312';
const HAIR_LIGHT = '#2b2420';
const HOODIE = '#2a9d8f';
const JEANS = '#2f3e5c';

const SPEED = 1.5;
const FACE_CAMERA = Math.PI / 4;

// poses do corpo (interpoladas): deitar gira o corpo inteiro, sentar dobra pernas e braços
const POSES = {
  stand: { lie: 0, leg: 0, arm: 0 },
  sit: { lie: 0, leg: -1.45, arm: -1.0 },
  lie: { lie: -Math.PI / 2, leg: 0, arm: 0 },
};

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
  constructor(exp) {
    this.exp = exp;
    this.root = new THREE.Group();
    this.root.name = 'avatar';
    this.root.position.set(LAYOUT.avatar.x, 0, LAYOUT.avatar.z);
    this.root.rotation.y = FACE_CAMERA;
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
    this.talking = false;
    this.nextBlink = 2;

    this.build();
    exp.scene.add(this.root);
    exp.onUpdate((dt, t) => this.update(dt, t));
  }

  build() {
    // root = posição/direção no quarto; body = pose (deitar gira só ele)
    this.body = new THREE.Group();
    this.root.add(this.body);
    const r = this.body;

    // pernas e tênis
    this.legs = [-1, 1].map((side) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.13, 0.75, 0);
      box(0.2, 0.68, 0.22, JEANS, { y: -0.68, parent: pivot });
      box(0.22, 0.1, 0.32, '#f1f1f1', { y: -0.75, z: 0.04, parent: pivot });
      box(0.22, 0.03, 0.32, '#e76f51', { y: -0.75, z: 0.04, parent: pivot });
      r.add(pivot);
      return pivot;
    });

    // tronco: moletom
    this.torso = new THREE.Group();
    this.torso.position.y = 0.72;
    r.add(this.torso);
    box(0.6, 0.62, 0.32, HOODIE, { parent: this.torso });
    box(0.36, 0.16, 0.02, '#238579', { y: 0.12, z: 0.16, parent: this.torso, shadow: false });
    box(0.03, 0.14, 0.02, '#f1f1f1', {
      x: -0.06,
      y: 0.42,
      z: 0.165,
      parent: this.torso,
      shadow: false,
    });
    box(0.03, 0.14, 0.02, '#f1f1f1', {
      x: 0.06,
      y: 0.42,
      z: 0.165,
      parent: this.torso,
      shadow: false,
    });

    // braços com pivô no ombro
    this.arms = [-1, 1].map((side) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.39, 0.56, 0);
      box(0.17, 0.52, 0.2, HOODIE, { y: -0.52, parent: pivot });
      box(0.15, 0.13, 0.17, SKIN, { y: -0.65, parent: pivot });
      this.torso.add(pivot);
      return pivot;
    });
    // braço direito do boneco = lado -x (ele está de frente pra gente)
    this.waveArm = this.arms[0];

    box(0.18, 0.08, 0.18, SKIN, { y: 0.62, parent: this.torso });

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

    this.buildHair(h);

    // âncora pro balão de fala
    this.bubbleAnchor = new THREE.Object3D();
    this.bubbleAnchor.position.y = 2.25;
    this.root.add(this.bubbleAnchor);
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

  enter(spot) {
    this.spot = spot;
    this.state = 'enter';
    this.targetPose = POSES[spot.pose];
    this.heading = spot.heading;
    this.startTween(spot.pos, spot.pose === 'lie' ? 0.75 : 0.5, () => (this.state = 'seated'));
  }

  leave(then) {
    const spot = this.spot;
    if (!spot) return then?.();
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
    this.body.position.y = Math.abs(Math.cos(this.walkPhase)) * 0.04 * this.walkAmount;
    this.torso.scale.y = 1 + Math.sin(t * 2.2) * 0.012; // respiração

    this.legs[0].rotation.x = P.leg + swing;
    this.legs[1].rotation.x = P.leg - swing;

    // digitando no notebook quando está na cadeira
    const typing = this.state === 'seated' && this.spot?.pose === 'sit' ? 1 : 0;
    this.arms.forEach((arm, i) => {
      const side = i === 0 ? 1 : -1;
      arm.rotation.x = P.arm - swing * side * 0.8 + Math.sin(t * 18 + i * 2) * 0.06 * typing;
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
    const facing = this.isStanding ? Math.max(0, Math.cos(this.root.rotation.y - FACE_CAMERA)) : 0;
    const ndc = this.exp.interaction.ndc;
    const yaw = THREE.MathUtils.clamp(ndc.x * 0.7, -0.6, 0.6) * facing;
    const pitch = THREE.MathUtils.clamp(-ndc.y * 0.25, -0.2, 0.25) * facing;
    this.head.rotation.y += (yaw - this.head.rotation.y) * k;
    this.head.rotation.x += (pitch - this.head.rotation.x) * k;

    // piscada
    this.nextBlink -= dt;
    const closed = this.nextBlink < 0.12;
    if (this.nextBlink < 0) this.nextBlink = 2 + Math.random() * 3;
    for (const eye of this.eyes) eye.scale.y = closed ? 0.15 : 1;

    // boca mexendo quando fala
    this.mouth.scale.y = this.talking ? 1 + Math.abs(Math.sin(t * 16)) * 2.5 : 1;
  }
}

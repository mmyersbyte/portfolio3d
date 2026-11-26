import * as THREE from 'three';
import { box, mat } from '../world/helpers.js';
import { LAYOUT, CAT_SPOTS } from '../world/layout.js';
import { NavGrid } from './pathfinding.js';

const FUR = '#17171c';
const OBEY_TIME = 45; // s: depois disso o gato "esquece" o comando e volta a ser livre
const SPEED = 0.85;
const JUMP_TIME = 0.55;

// poses: valores-alvo que são interpolados suavemente a cada frame
const POSES = {
  stand: {
    bodyY: 0,
    pitch: 0,
    headPitch: 0,
    headY: 0,
    front: 0,
    back: 0,
    eyes: 1,
    tailLift: 0.9,
    tailCurl: 0.25,
    tailSide: 0,
  },
  sit: {
    bodyY: 0,
    pitch: -0.5,
    headPitch: 0.45,
    headY: 0,
    front: 0,
    back: -1.2,
    eyes: 1,
    tailLift: 0.15,
    tailCurl: 0.05,
    tailSide: 0.35,
  },
  crouch: {
    bodyY: -0.07,
    pitch: 0.12,
    headPitch: -0.1,
    headY: -0.02,
    front: -0.4,
    back: 0.5,
    eyes: 1,
    tailLift: 0.4,
    tailCurl: 0.1,
    tailSide: 0,
  },
  air: {
    bodyY: 0,
    pitch: 0,
    headPitch: 0,
    headY: 0,
    front: -0.8,
    back: 0.8,
    eyes: 1,
    tailLift: 0.3,
    tailCurl: 0.1,
    tailSide: 0,
  },
  sleep: {
    bodyY: -0.17,
    pitch: 0,
    headPitch: 0.35,
    headY: -0.1,
    front: -1.5,
    back: -1.5,
    eyes: 0.12,
    tailLift: -0.15,
    tailCurl: 0,
    tailSide: 0.5,
  },
};
// deitado acordado (comando "deitar"): igual dormir, mas de olho aberto e cabeça erguida
POSES.lie = { ...POSES.sleep, eyes: 1, headPitch: 0.05, headY: -0.07, tailSide: 0.3 };

const rand = (a, b) => a + Math.random() * (b - a);
const angleTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const shortest = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * Gato preto com uma maquininha de estados simples:
 * idle → (passear | sentar | visitar o boneco | ir pra cama) → ...
 * Na cama: prepara, pula, dorme um tempo e desce sozinho.
 */
export class Cat {
  constructor(exp) {
    this.exp = exp;
    this.onSay = null; // (text) => void
    this.onSleepChange = null; // (sleeping) => void

    this.root = new THREE.Group();
    this.root.name = 'cat';
    this.root.position.set(2.2, 0, 1.4);
    this.root.rotation.y = -2.2;
    this.heading = this.root.rotation.y;

    this.pose = { ...POSES.stand };
    this.targetPose = POSES.stand;
    this.walkAmount = 0;
    this.walkPhase = 0;
    this.hop = 0;
    this.hopDur = 0.35;
    this.hopHeight = 0.18;
    this.pending = null; // comando recebido no meio de um pulo
    this.obeyUntil = 0;

    this.state = 'idle';
    this.timer = rand(1.5, 3);
    this.path = [];
    this.onArrive = null;
    this.lastBed = -20; // primeira ida pra cama já pode acontecer cedo
    this.nav = new NavGrid({ margin: 0.22 });
    this.avatar = null; // ligado em scene.js: o gato desvia de mim e às vezes vem me visitar

    this.build();
    exp.scene.add(this.root);
    exp.onUpdate((dt, t) => this.update(dt, t));
  }

  build() {
    this.body = new THREE.Group();
    this.root.add(this.body);
    const b = this.body;

    box(0.26, 0.22, 0.5, FUR, { y: 0.19, parent: b });

    // pernas com pivô no quadril
    this.legs = [
      [-0.08, 0.17, 'front'],
      [0.08, 0.17, 'front'],
      [-0.08, -0.17, 'back'],
      [0.08, -0.17, 'back'],
    ].map(([x, z, kind], i) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 0.22, z);
      box(0.07, 0.22, 0.07, FUR, { y: -0.22, parent: pivot });
      b.add(pivot);
      return { pivot, kind, phase: i === 0 || i === 3 ? 0 : Math.PI };
    });

    // cabeça
    this.head = new THREE.Group();
    this.head.position.set(0, 0.38, 0.27);
    b.add(this.head);
    box(0.26, 0.22, 0.22, FUR, { y: -0.11, parent: this.head });
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.11, 4), mat(FUR));
      ear.position.set(side * 0.08, 0.05, -0.02);
      ear.rotation.y = Math.PI / 4;
      ear.castShadow = true;
      this.head.add(ear);
    }
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#c6f36b', toneMapped: false });
    this.eyes = [-1, 1].map((side) => {
      const eye = box(0.055, 0.045, 0.01, eyeMat, {
        x: side * 0.065,
        y: 0,
        z: 0.111,
        parent: this.head,
        shadow: false,
      });
      box(0.014, 0.04, 0.005, '#000', { y: -0.0225, z: 0.006, parent: eye, shadow: false });
      return eye;
    });
    box(0.03, 0.02, 0.01, '#d77a8a', { y: -0.05, z: 0.112, parent: this.head, shadow: false });

    // rabo: corrente de segmentos que balança
    this.tail = [];
    let parent = new THREE.Group();
    parent.position.set(0, 0.36, -0.24);
    b.add(parent);
    this.tailBase = parent;
    for (let i = 0; i < 5; i++) {
      const seg = new THREE.Group();
      if (i > 0) seg.position.z = -0.1;
      box(0.05, 0.05, 0.11, FUR, { y: -0.025, z: -0.05, parent: seg });
      parent.add(seg);
      this.tail.push(seg);
      parent = seg;
    }

    this.bubbleAnchor = new THREE.Object3D();
    this.bubbleAnchor.position.y = 0.75;
    this.root.add(this.bubbleAnchor);
  }

  // ---------- comportamento ----------

  get onBed() {
    return this.root.position.y > 0.1;
  }

  setState(state, timer = 0) {
    this.state = state;
    this.timer = timer;
  }

  decide(elapsed) {
    const r = Math.random();
    if (elapsed - this.lastBed > 25 && r < 0.35) {
      this.walkTo(CAT_SPOTS.bedLaunch, () => this.prepareJumpUp());
    } else if (r < 0.5) {
      this.setState('sit', rand(3, 6));
    } else if (r < 0.62 && this.avatar?.isStanding) {
      // vai "conversar" com o boneco (do lado dele que fica de frente pra câmera)
      const me = this.avatar.root.position;
      this.walkTo({ x: me.x + 0.7, z: me.z + 0.6 }, () => {
        this.faceTo(this.avatar.root.position);
        this.setState('sit', rand(4, 7));
        this.say();
      });
    } else {
      const pos = this.root.position;
      let target;
      let tries = 0;
      do target = this.nav.randomFree();
      while (Math.hypot(target.x - pos.x, target.z - pos.z) < 1.5 && ++tries < 20);
      this.walkTo(target, () => this.setState('idle', rand(1.5, 4)));
    }
  }

  walkTo(target, onArrive) {
    const pos = this.root.position;
    this.path = this.nav.findPath({ x: pos.x, z: pos.z }, target, this.avatarObstacle());
    this.onArrive = onArrive;
    if (!this.path.length) {
      this.setState('idle', 1);
      return;
    }
    this.setState('walk');
  }

  /** Onde o boneco está agora (se estiver em pé no chão). */
  avatarObstacle() {
    if (!this.avatar?.isStanding) return [];
    const { x, z } = this.avatar.root.position;
    return [{ x, z, w: 0.6, d: 0.6 }];
  }

  faceTo(point) {
    this.heading = angleTo(this.root.position, point);
  }

  prepareJumpUp() {
    this.faceTo(CAT_SPOTS.bedSleep);
    this.setState('prep', 0.7);
    this.afterPrep = () =>
      this.jump(CAT_SPOTS.bedSleep, LAYOUT.bed.top, () => {
        this.lastBed = this.exp.elapsed;
        this.heading = Math.PI / 4 + rand(-0.5, 0.5);
        this.setState('sleep', rand(14, 24));
        this.onSleepChange?.(true);
      });
  }

  jump(to, toY, onLand) {
    const p = this.root.position;
    this.jumpData = { from: { x: p.x, y: p.y, z: p.z }, to: { ...to, y: toY }, t: 0, onLand };
    this.faceTo(to);
    this.setState('jump');
  }

  startHop(duration, height) {
    if (this.state === 'jump' || this.hop > 0) return;
    this.hop = this.hopDur = duration;
    this.hopHeight = height;
  }

  /**
   * Comandos estilo Habbo: jump, speak, sit, lie, come, free.
   * O gato obedece até receber "free" ou passar OBEY_TIME.
   */
  command(cmd) {
    // no meio de um pulo: executa quando aterrissar
    if (this.state === 'jump') {
      this.pending = cmd;
      return;
    }
    if (this.state === 'sleep') this.onSleepChange?.(false);
    this.path = [];
    this.onArrive = null;
    this.obeyUntil = this.exp.elapsed + OBEY_TIME;

    switch (cmd) {
      case 'jump':
        this.setState('stay');
        this.startHop(0.6, 0.45);
        break;
      case 'speak':
        // continua sentado/deitado se já estava; senão para onde está
        if (this.state !== 'staySit' && this.state !== 'stayLie') this.setState('stay');
        this.say();
        break;
      case 'sit':
        this.setState('staySit');
        break;
      case 'lie':
        this.setState('stayLie');
        break;
      case 'come':
        if (this.onBed) {
          this.jump(CAT_SPOTS.bedLand, 0, () => this.command('come'));
          return;
        }
        this.comeToAvatar();
        break;
      case 'free':
        this.release();
        break;
    }
  }

  comeToAvatar() {
    const a = this.avatar;
    if (!a) return;
    // em pé: do lado dele; sentado/deitado: no ponto de onde ele sai do móvel
    const me = a.root.position;
    const spot = (!a.isStanding && a.spot?.approach) || { x: me.x + 0.7, z: me.z + 0.6 };
    this.walkTo(spot, () => {
      this.faceTo(a.root.position);
      this.setState('staySit');
      this.say();
    });
    // walkTo pode cair pra idle se não achar caminho; ainda assim mantém "obedecendo"
    if (this.state === 'idle') this.setState('stay');
  }

  /** Volta a ser livre (desce da cama se estiver lá). */
  release() {
    this.obeyUntil = 0;
    if (this.onBed) this.setState('wake', 0.4);
    else this.setState('idle', rand(0.5, 1.5));
  }

  /** Resumo do que ele está fazendo (mostrado no painel). */
  get activity() {
    return (
      {
        sleep: 'sleeping',
        wake: 'waking',
        walk: 'walking',
        sit: 'sitting',
        staySit: 'sitting',
        stayLie: 'lying',
        jump: 'jumping',
        prep: 'jumping',
        stay: 'waiting',
      }[this.state] ?? 'idle'
    );
  }

  say(purr = false) {
    this.onSay?.(purr ? 'purr' : 'meow');
  }

  update(dt, t) {
    switch (this.state) {
      case 'idle':
        this.targetPose = POSES.stand;
        this.timer -= dt;
        if (this.timer <= 0) this.decide(t);
        break;

      case 'sit':
        this.targetPose = POSES.sit;
        this.timer -= dt;
        if (this.timer <= 0) this.setState('idle', rand(0.5, 1.5));
        break;

      case 'walk':
        this.targetPose = POSES.stand;
        this.followPath(dt);
        break;

      case 'prep':
        this.targetPose = POSES.crouch;
        this.timer -= dt;
        if (this.timer <= 0) this.afterPrep();
        break;

      case 'jump':
        this.updateJump(dt);
        break;

      case 'sleep':
        this.targetPose = POSES.sleep;
        this.timer -= dt;
        if (this.timer <= 0) {
          this.onSleepChange?.(false);
          this.setState('wake', 1.2);
        }
        break;

      case 'stay':
      case 'staySit':
      case 'stayLie':
        this.targetPose =
          this.state === 'staySit' ? POSES.sit : this.state === 'stayLie' ? POSES.lie : POSES.stand;
        if (this.exp.elapsed > this.obeyUntil) this.release();
        break;

      case 'wake':
        // espreguiça e desce da cama
        this.targetPose = POSES.crouch;
        this.timer -= dt;
        if (this.timer <= 0) {
          this.jump(CAT_SPOTS.bedLand, 0, () => this.setState('idle', rand(1, 3)));
        }
        break;
    }

    // vira suavemente pra direção desejada
    const diff = shortest(this.heading - this.root.rotation.y);
    this.root.rotation.y += diff * (1 - Math.exp(-dt * 8));

    this.animatePose(dt, t);
  }

  followPath(dt) {
    const pos = this.root.position;
    const wp = this.path[0];
    if (!wp) {
      const cb = this.onArrive;
      this.onArrive = null;
      this.setState('idle', 1);
      cb?.();
      return;
    }
    const dx = wp.x - pos.x;
    const dz = wp.z - pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.05) {
      this.path.shift();
      return;
    }
    this.heading = Math.atan2(dx, dz);
    // anda mais devagar enquanto ainda está virando
    const turning = Math.abs(shortest(this.heading - this.root.rotation.y));
    const speed = SPEED * Math.max(0.15, 1 - turning / 1.2);
    const step = Math.min(dist, speed * dt);
    pos.x += (dx / dist) * step;
    pos.z += (dz / dist) * step;
  }

  updateJump(dt) {
    const j = this.jumpData;
    j.t = Math.min(1, j.t + dt / JUMP_TIME);
    const p = j.t;
    const pos = this.root.position;
    pos.x = THREE.MathUtils.lerp(j.from.x, j.to.x, p);
    pos.z = THREE.MathUtils.lerp(j.from.z, j.to.z, p);
    pos.y = THREE.MathUtils.lerp(j.from.y, j.to.y, p) + 4 * 0.45 * p * (1 - p);
    this.targetPose = { ...POSES.air, pitch: p < 0.5 ? -0.45 : 0.35 };
    if (p >= 1) {
      this.setState('idle', 1);
      j.onLand();
      if (this.pending) {
        const cmd = this.pending;
        this.pending = null;
        this.command(cmd);
      }
    }
  }

  animatePose(dt, t) {
    const k = 1 - Math.exp(-dt * 7);
    for (const key in this.pose) this.pose[key] += (this.targetPose[key] - this.pose[key]) * k;
    const P = this.pose;

    const walking = this.state === 'walk' ? 1 : 0;
    this.walkAmount += (walking - this.walkAmount) * (1 - Math.exp(-dt * 10));
    this.walkPhase += dt * 11 * this.walkAmount;

    let hopY = 0;
    if (this.hop > 0) {
      this.hop = Math.max(0, this.hop - dt);
      hopY = Math.sin((1 - this.hop / this.hopDur) * Math.PI) * this.hopHeight;
    }

    this.body.position.y =
      P.bodyY + Math.abs(Math.sin(this.walkPhase)) * 0.015 * this.walkAmount + hopY;
    this.body.rotation.x = P.pitch;
    this.head.rotation.x = P.headPitch + Math.sin(this.walkPhase * 2) * 0.03 * this.walkAmount;
    this.head.position.y = 0.38 + P.headY;

    for (const leg of this.legs) {
      const swing = Math.sin(this.walkPhase + leg.phase) * 0.6 * this.walkAmount;
      // patas da frente compensam a inclinação do corpo pra ficarem retas no chão
      const base = leg.kind === 'front' ? P.front - P.pitch : P.back;
      leg.pivot.rotation.x = base + swing;
    }

    for (const eye of this.eyes) eye.scale.y = P.eyes;

    this.tailBase.rotation.x = P.tailLift;
    const sway = this.state === 'sleep' ? 0.08 : 0.35;
    this.tail.forEach((seg, i) => {
      if (i > 0) seg.rotation.x = P.tailCurl;
      seg.rotation.y =
        P.tailSide + Math.sin(t * 2.4 - i * 0.6) * sway * (i / this.tail.length + 0.2);
    });
  }
}

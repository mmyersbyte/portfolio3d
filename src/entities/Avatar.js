import * as THREE from 'three';
import { box, mat, seeded } from '../world/helpers.js';
import { LAYOUT } from '../world/layout.js';

const SKIN = '#f2d3bd';
const HAIR = '#151312';
const HOODIE = '#2a9d8f';
const JEANS = '#2f3e5c';

/**
 * Meu boneco: voxel, cabeção estilo Habbo, cabelo cacheado preto.
 * Fica olhando pro mouse, pisca, acena e mexe a boca quando "fala".
 */
export class Avatar {
  constructor(exp) {
    this.exp = exp;
    this.root = new THREE.Group();
    this.root.name = 'avatar';
    this.root.position.set(LAYOUT.avatar.x, 0, LAYOUT.avatar.z);
    this.root.rotation.y = Math.PI / 4; // de frente pra câmera

    this.waveT = 0;
    this.talking = false;
    this.nextBlink = 2;

    this.build();
    exp.scene.add(this.root);
    exp.onUpdate((dt, t) => this.update(dt, t));
  }

  build() {
    const r = this.root;

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
    r.add(this.bubbleAnchor);
  }

  buildHair(head) {
    // "touca" pra não aparecer pele entre os cachos
    box(0.5, 0.14, 0.46, HAIR, { y: 0.38, parent: head });
    box(0.5, 0.3, 0.1, HAIR, { y: 0.15, z: -0.2, parent: head });

    // cachos = várias bolinhas low-poly espalhadas por um elipsoide
    const rand = seeded(42);
    const center = new THREE.Vector3(0, 0.27, 0);
    const curls = [];
    while (curls.length < 85) {
      const theta = rand() * Math.PI * 2;
      const y = rand() * 1.15 - 0.15; // -0.15..1 (mais em cima)
      const ring = Math.sqrt(Math.max(0, 1 - y * y));
      const p = new THREE.Vector3(
        Math.sin(theta) * ring * 0.34,
        y * 0.3,
        Math.cos(theta) * ring * 0.32,
      );
      // libera o rosto: nada na frente abaixo da testa
      if (p.z > 0.1 && p.y < 0.13) continue;
      // nada na altura das orelhas/bochechas dos lados da frente
      if (p.y < 0 && p.z > -0.05) continue;
      curls.push(p.add(center));
    }

    const mesh = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 0),
      mat(HAIR),
      curls.length,
    );
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const s = new THREE.Vector3();
    curls.forEach((p, i) => {
      s.setScalar(0.075 + rand() * 0.05);
      q.setFromEuler(e.set(rand() * 3, rand() * 3, rand() * 3));
      mesh.setMatrixAt(i, m.compose(p, q, s));
    });
    mesh.castShadow = true;
    head.add(mesh);
  }

  wave() {
    this.waveT = 1.8;
  }

  setTalking(on) {
    this.talking = on;
  }

  update(dt, t) {
    const k = 1 - Math.exp(-dt * 8);

    // respiração
    this.torso.scale.y = 1 + Math.sin(t * 2.2) * 0.012;

    // olha pro ponteiro
    const ndc = this.exp.interaction.ndc;
    this.head.rotation.y +=
      (THREE.MathUtils.clamp(ndc.x * 0.7, -0.6, 0.6) - this.head.rotation.y) * k;
    this.head.rotation.x +=
      (THREE.MathUtils.clamp(-ndc.y * 0.25, -0.2, 0.25) - this.head.rotation.x) * k;

    // piscada
    this.nextBlink -= dt;
    const closed = this.nextBlink < 0.12;
    if (this.nextBlink < 0) this.nextBlink = 2 + Math.random() * 3;
    for (const eye of this.eyes) eye.scale.y = closed ? 0.15 : 1;

    // aceno
    let armZ = -0.08;
    if (this.waveT > 0) {
      this.waveT -= dt;
      const up = Math.min(1, this.waveT * 3, (1.8 - this.waveT) * 4);
      armZ = THREE.MathUtils.lerp(-0.08, -2.7 + Math.sin(t * 14) * 0.3, up);
    }
    this.waveArm.rotation.z += (armZ - this.waveArm.rotation.z) * Math.min(1, k * 2);
    this.arms[1].rotation.z = 0.08 + Math.sin(t * 2.2) * 0.02;

    // boca mexendo quando fala
    this.mouth.scale.y = this.talking ? 1 + Math.abs(Math.sin(t * 16)) * 2.5 : 1;
  }
}

import * as THREE from 'three';
import { box, mat, canvasTexture } from './helpers.js';
import { LAYOUT } from './layout.js';

const WOOD = '#9b6a45';
const WOOD_DARK = '#6b4630';

export function createFurniture(exp) {
  const g = new THREE.Group();
  g.name = 'furniture';

  const bed = createBed(g);
  createNightstand(g);
  const desk = createDesk(g, exp);
  const chair = createChair(g);
  createPlant(g);

  exp.scene.add(g);
  return { laptop: desk.laptop, bed, chair, lamp: desk.lamp };
}

function createBed(parent) {
  const { x, z, w, d } = LAYOUT.bed;
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  box(w, 0.35, d, WOOD, { parent: g });
  box(w - 0.1, 0.16, d - 0.1, '#f4f1ea', { y: 0.35, parent: g });
  // edredom cobrindo os pés da cama
  box(w - 0.02, 0.05, d * 0.66, '#e07a5f', { y: 0.51, z: d * 0.17, parent: g });
  box(w - 0.02, 0.05, 0.18, '#f2cc8f', { y: 0.511, z: -d * 0.16 + 0.09, parent: g });
  // travesseiro e cabeceira
  box(w * 0.6, 0.14, 0.45, '#fdfbf7', { y: 0.5, z: -d / 2 + 0.38, parent: g });
  box(w, 1.05, 0.12, WOOD_DARK, { z: -d / 2 + 0.06, parent: g });
  box(w + 0.06, 0.08, 0.16, WOOD, { y: 1.05, z: -d / 2 + 0.06, parent: g });

  parent.add(g);
  return g;
}

function createNightstand(parent) {
  const { x, z, w, d } = LAYOUT.nightstand;
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  box(w, 0.55, d, WOOD, { parent: g });
  box(w - 0.12, 0.18, 0.02, '#b98a62', { y: 0.28, z: d / 2, parent: g });
  box(0.1, 0.03, 0.03, '#3a2a1e', { y: 0.36, z: d / 2 + 0.02, parent: g, shadow: false });

  parent.add(g);
}

function createDesk(parent, exp) {
  const { x, z, w, d, top } = LAYOUT.desk;
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  const legH = top - 0.08;
  box(w, 0.08, d, '#b07d52', { y: legH, parent: g });
  for (const [lx, lz] of [
    [-w / 2 + 0.08, -d / 2 + 0.08],
    [-w / 2 + 0.08, d / 2 - 0.08],
  ]) {
    box(0.08, legH, 0.08, '#4a3a2e', { x: lx, z: lz, parent: g });
  }
  // gaveteiro do lado direito
  box(0.65, legH, d - 0.1, WOOD, { x: w / 2 - 0.37, parent: g });
  for (const dy of [0.2, 0.5]) {
    box(0.55, 0.22, 0.02, '#c49468', { x: w / 2 - 0.37, y: dy, z: d / 2 - 0.04, parent: g });
  }

  const laptop = createLaptop(exp);
  laptop.position.set(-0.15, top, 0.05);
  g.add(laptop);

  const lamp = createLamp(g, w / 2 - 0.3, top, -d / 2 + 0.3);

  // caneca de café
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.15, 10), mat('#e9c46a'));
  mug.position.set(-w / 2 + 0.4, top + 0.075, 0.15);
  mug.castShadow = true;
  g.add(mug);

  parent.add(g);
  return { laptop, lamp };
}

function createLaptop(exp) {
  // grupo próprio: é o alvo do clique "ver projetos"
  const laptop = new THREE.Group();
  laptop.name = 'laptop';

  box(0.8, 0.04, 0.55, '#2b2d35', { parent: laptop });
  box(0.7, 0.01, 0.28, '#3a3d47', { y: 0.04, z: 0.06, parent: laptop, shadow: false });

  const hinge = new THREE.Group();
  hinge.position.set(0, 0.04, -0.26);
  hinge.rotation.x = -0.22;
  laptop.add(hinge);
  box(0.8, 0.52, 0.03, '#2b2d35', { parent: hinge });

  const lines = [
    ['#c792ea', 'const', '#82aaff', ' me', '#fff', ' = {'],
    ['#fff', '  stack: ', '#c3e88d', "'node'", '#fff', ','],
    ['#fff', '  love: ', '#c3e88d', "'three.js'", '#fff', ','],
    ['#fff', '  cat: ', '#f78c6c', 'true', '#fff', ','],
    ['#fff', '};'],
    [],
    ['#c792ea', 'export default', '#82aaff', ' me', '#fff', ';'],
  ];
  const tex = canvasTexture(320, 200, (ctx, cw, ch) => {
    ctx.fillStyle = '#14161c';
    ctx.fillRect(0, 0, cw, ch);
    ctx.font = '18px monospace';
    lines.forEach((parts, i) => {
      let px = 14;
      for (let p = 0; p < parts.length; p += 2) {
        ctx.fillStyle = parts[p];
        ctx.fillText(parts[p + 1], px, 30 + i * 24);
        px += ctx.measureText(parts[p + 1]).width;
      }
    });
  });
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.74, 0.46),
    new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }),
  );
  screen.position.set(0, 0.26, 0.016);
  hinge.add(screen);

  // cursor piscando
  const cursor = new THREE.Mesh(
    new THREE.PlaneGeometry(0.02, 0.035),
    new THREE.MeshBasicMaterial({ color: '#7fd1ff', toneMapped: false }),
  );
  cursor.position.set(-0.3, 0.07, 0.017);
  hinge.add(cursor);
  exp.onUpdate((_dt, t) => (cursor.visible = Math.floor(t * 2) % 2 === 0));

  const glow = new THREE.PointLight('#7fd1ff', 1.2, 2.2, 2);
  glow.position.set(0, 0.35, 0.35);
  laptop.add(glow);

  return laptop;
}

function createLamp(parent, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const metal = mat('#2f3e46');
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.04, 12), metal);
  base.position.y = 0.02;
  g.add(base);
  box(0.035, 0.5, 0.035, metal, { parent: g });
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.2, 12, 1, true),
    mat('#f4a261', { side: THREE.DoubleSide }),
  );
  shade.position.set(0, 0.52, 0.06);
  shade.rotation.x = 0.5;
  g.add(shade);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 6),
    new THREE.MeshBasicMaterial({ color: '#fff3c4' }),
  );
  bulb.position.set(0, 0.46, 0.09);
  g.add(bulb);

  const light = new THREE.PointLight('#ffb35c', 6, 4.5, 2);
  light.position.set(0, 0.4, 0.15);
  g.add(light);
  g.traverse((o) => (o.castShadow = o.isMesh));
  parent.add(g);
  return light;
}

function createChair(parent) {
  const { x, z } = LAYOUT.chair;
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = 0.25;
  const fabric = '#3d405b';
  const dark = '#22223b';

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8), mat(dark));
  post.position.y = 0.25;
  post.castShadow = true;
  g.add(post);
  for (let i = 0; i < 5; i++) {
    const leg = box(0.05, 0.04, 0.32, dark, { y: 0.03, parent: g });
    leg.rotation.y = (i / 5) * Math.PI * 2;
    leg.position.x = Math.sin(leg.rotation.y) * 0.16;
    leg.position.z = Math.cos(leg.rotation.y) * 0.16;
  }
  box(0.6, 0.09, 0.58, fabric, { y: 0.45, parent: g });
  box(0.58, 0.62, 0.08, fabric, { y: 0.56, z: 0.27, parent: g });
  parent.add(g);
  return g;
}

function createPlant(parent) {
  const { x, z } = LAYOUT.plant;
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.42, 8), mat('#c8693d'));
  pot.position.y = 0.21;
  g.add(pot);
  const leaves = [
    [0, 0.75, 0, 0.36, '#3a8f5c'],
    [0.15, 1.0, 0.05, 0.26, '#52b788'],
    [-0.12, 1.05, -0.08, 0.24, '#40916c'],
    [0.02, 1.25, 0.0, 0.18, '#52b788'],
  ];
  for (const [lx, ly, lz, r, c] of leaves) {
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat(c));
    leaf.position.set(lx, ly, lz);
    g.add(leaf);
  }
  g.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  parent.add(g);
}

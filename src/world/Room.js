import * as THREE from 'three';
import { box, mat, canvasTexture, PIXEL_FONT } from './helpers.js';
import { ROOM, LAYOUT } from './layout.js';

const { half: H, wallHeight: WH, wallThickness: WT } = ROOM;

const COLORS = {
  floorA: '#a8714a',
  floorB: '#966341',
  floorSide: '#5e3d27',
  wall: '#efe2cc',
  wallStripe: '#e6d6bc',
  wallSide: '#c9b494',
  trim: '#8a6446',
  rugA: '#3d5a80',
  rugB: '#98c1d9',
};

export function createRoom(scene) {
  const room = new THREE.Group();
  room.name = 'room';

  createFloor(room);
  createWalls(room);
  createRug(room);
  createWindow(room);
  createPoster(room);
  createLights(scene);

  scene.add(room);
  return room;
}

function createFloor(room) {
  // piso em tacos, estilo tile isométrico
  const tex = canvasTexture(256, 256, (ctx, w, h) => {
    const n = 8;
    const s = w / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        ctx.fillStyle = (i + j) % 2 ? COLORS.floorA : COLORS.floorB;
        ctx.fillRect(i * s, j * s, s, s);
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath();
      ctx.moveTo(i * s, 0);
      ctx.lineTo(i * s, h);
      ctx.moveTo(0, i * s);
      ctx.lineTo(w, i * s);
      ctx.stroke();
    }
  });
  tex.magFilter = THREE.NearestFilter;

  const top = new THREE.Mesh(
    new THREE.PlaneGeometry(H * 2, H * 2),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }),
  );
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.001;
  top.receiveShadow = true;
  top.userData.floor = true;
  room.add(top);

  box(H * 2 + WT, 0.35, H * 2 + WT, COLORS.floorSide, {
    x: -WT / 2,
    y: -0.35,
    z: -WT / 2,
    parent: room,
    shadow: false,
  });
}

function createWalls(room) {
  const tex = canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = COLORS.wallStripe;
    for (let x = 0; x < w; x += 32) ctx.fillRect(x, 0, 14, h);
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 1);
  tex.magFilter = THREE.NearestFilter;

  const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 });
  const side = mat(COLORS.wallSide);
  // ordem das faces do BoxGeometry: +x, -x, +y, -y, +z, -z
  const leftMats = [face, side, side, side, side, side];
  const backMats = [side, side, side, side, face, side];

  const len = H * 2 + WT;
  const left = new THREE.Mesh(new THREE.BoxGeometry(WT, WH, len), leftMats);
  left.position.set(-H - WT / 2, WH / 2, -WT / 2);
  const back = new THREE.Mesh(new THREE.BoxGeometry(len, WH, WT), backMats);
  back.position.set(-WT / 2, WH / 2, -H - WT / 2);
  for (const wall of [left, back]) {
    wall.receiveShadow = true;
    room.add(wall);
  }

  // rodapé e acabamento no topo
  box(0.06, 0.16, H * 2, COLORS.trim, { x: -H + 0.03, z: 0, parent: room, shadow: false });
  box(H * 2, 0.16, 0.06, COLORS.trim, { x: 0, z: -H + 0.03, parent: room, shadow: false });
  box(WT + 0.04, 0.1, len + 0.04, COLORS.trim, { x: -H - WT / 2, y: WH, z: -WT / 2, parent: room });
  box(len + 0.04, 0.1, WT + 0.04, COLORS.trim, { x: -WT / 2, y: WH, z: -H - WT / 2, parent: room });
}

function createRug(room) {
  const { x, z, w, d } = LAYOUT.rug;
  const tex = canvasTexture(256, 192, (ctx, cw, ch) => {
    ctx.fillStyle = COLORS.rugA;
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = COLORS.rugB;
    ctx.lineWidth = 10;
    ctx.strokeRect(18, 18, cw - 36, ch - 36);
    ctx.lineWidth = 4;
    ctx.strokeRect(38, 38, cw - 76, ch - 76);
  });
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }),
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(x, 0.01, z);
  rug.receiveShadow = true;
  rug.userData.floor = true;
  room.add(rug);
}

function createWindow(room) {
  // janela na parede esquerda, noite com lua
  const g = new THREE.Group();
  g.position.set(-H + 0.02, 1.95, -0.2);
  g.rotation.y = Math.PI / 2;

  const sky = canvasTexture(128, 96, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1b2a5c');
    grad.addColorStop(1, '#3f4f8f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    for (const [sx, sy] of [
      [15, 12],
      [40, 30],
      [100, 18],
      [70, 60],
      [22, 70],
      [110, 75],
    ]) {
      ctx.fillRect(sx, sy, 3, 3);
    }
    ctx.fillStyle = '#fff6c9';
    ctx.beginPath();
    ctx.arc(88, 38, 14, 0, Math.PI * 2);
    ctx.fill();
  });
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 1.05),
    new THREE.MeshBasicMaterial({ map: sky }),
  );
  glass.position.z = 0.01;
  g.add(glass);

  const frame = '#fdfdfd';
  box(1.56, 0.08, 0.08, frame, { y: 0.52, parent: g, shadow: false });
  box(1.56, 0.08, 0.08, frame, { y: -0.6, parent: g, shadow: false });
  box(0.08, 1.12, 0.08, frame, { x: -0.74, y: -0.56, parent: g, shadow: false });
  box(0.08, 1.12, 0.08, frame, { x: 0.74, y: -0.56, parent: g, shadow: false });
  box(0.05, 1.05, 0.05, frame, { y: -0.52, parent: g, shadow: false });
  box(1.7, 0.06, 0.2, frame, { y: -0.66, z: 0.06, parent: g });
  room.add(g);
}

function createPoster(room) {
  const tex = canvasTexture(192, 256, (ctx, w, h) => {
    ctx.fillStyle = '#264653';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e9c46a';
    ctx.font = `bold 64px ${PIXEL_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('</>', w / 2, 120);
    ctx.font = `28px ${PIXEL_FONT}`;
    ctx.fillStyle = '#f4a261';
    ctx.fillText('npm run', w / 2, 180);
    ctx.fillText('dreams', w / 2, 212);
  });
  const poster = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 1.2),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }),
  );
  poster.position.set(-3.1, 2.15, -H + 0.02);
  room.add(poster);
}

function createLights(scene) {
  scene.add(new THREE.HemisphereLight('#c8d4ff', '#6b4f3a', 1.3));

  const sun = new THREE.DirectionalLight('#fff1dc', 2.2);
  sun.position.set(6, 10, 5);
  sun.castShadow = true;
  const isTouch = matchMedia('(pointer: coarse)').matches;
  sun.shadow.mapSize.setScalar(isTouch ? 1024 : 2048);
  const cam = sun.shadow.camera;
  cam.left = cam.bottom = -7;
  cam.right = cam.top = 7;
  cam.near = 1;
  cam.far = 30;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  // luz fria vinda da janela
  const moon = new THREE.PointLight('#8fa8ff', 4, 6, 2);
  moon.position.set(-3.2, 2, -0.2);
  scene.add(moon);
}

import * as THREE from 'three';
import { canvasTexture, PIXEL_FONT } from './helpers.js';
import { ROOM } from './layout.js';

/** Post-its colados na parede do fundo, em cima da mesa. */
const NOTES = [
  { id: 'cv', title: 'CV', sub: 'about me', color: '#ffe066', x: 0.55, y: 2.3, rot: 0.06 },
  {
    id: 'github',
    title: 'GitHub',
    sub: '@mmyersbyte',
    color: '#8ecae6',
    x: 1.2,
    y: 2.0,
    rot: -0.05,
  },
  {
    id: 'linkedin',
    title: 'LinkedIn',
    sub: 'conecta aí',
    color: '#95d5b2',
    x: 1.85,
    y: 2.35,
    rot: 0.04,
  },
  {
    id: 'instagram',
    title: 'Insta',
    sub: '@pedrovictorc',
    color: '#ff8fab',
    x: 2.5,
    y: 2.05,
    rot: -0.07,
  },
];

const SIZE = 0.52;

export function createPostIts(scene) {
  const notes = NOTES.map((note) => {
    const tex = canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = note.color;
      ctx.fillRect(0, 0, w, h);
      // dobrinha no canto
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath();
      ctx.moveTo(w, h - 40);
      ctx.lineTo(w - 40, h);
      ctx.lineTo(w, h);
      ctx.fill();
      // fita adesiva
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(w / 2 - 50, 0, 100, 26);

      ctx.fillStyle = '#1d1b2e';
      ctx.textAlign = 'center';
      ctx.font = `bold ${note.title.length > 6 ? 50 : 64}px ${PIXEL_FONT}`;
      ctx.fillText(note.title, w / 2, 130);
      ctx.font = `26px ${PIXEL_FONT}`;
      ctx.fillStyle = 'rgba(29,27,46,0.7)';
      ctx.fillText(note.sub, w / 2, 180);
    });

    const group = new THREE.Group();
    group.position.set(note.x, note.y, -ROOM.half + 0.03);
    group.rotation.z = note.rot;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(SIZE, SIZE),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }),
    );
    mesh.castShadow = true;
    group.add(mesh);
    scene.add(group);
    return { id: note.id, group };
  });

  return notes;
}

/**
 * Post-it do contador de visitas (laranja, à esquerda dos outros).
 * O número chega depois (vem do backend): setCount redesenha a textura.
 */
export function createVisitsNote(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  let count = null;
  let label = 'visitas';

  const draw = () => {
    const ctx = canvas.getContext('2d');
    const w = 256;
    ctx.fillStyle = '#ffb86b';
    ctx.fillRect(0, 0, w, w);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.moveTo(w, w - 40);
    ctx.lineTo(w - 40, w);
    ctx.lineTo(w, w);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(w / 2 - 50, 0, 100, 26);
    ctx.fillStyle = '#1d1b2e';
    ctx.textAlign = 'center';
    const text = count == null ? '—' : count.toLocaleString('pt-BR');
    ctx.font = `bold ${text.length > 5 ? 54 : 68}px ${PIXEL_FONT}`;
    ctx.fillText(text, w / 2, 140);
    ctx.font = `30px ${PIXEL_FONT}`;
    ctx.fillStyle = 'rgba(29,27,46,0.7)';
    ctx.fillText(label, w / 2, 188);
    texture.needsUpdate = true;
  };

  const group = new THREE.Group();
  group.position.set(-0.15, 2.05, -ROOM.half + 0.03);
  group.rotation.z = 0.05;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(SIZE, SIZE),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 }),
  );
  mesh.castShadow = true;
  group.add(mesh);
  scene.add(group);
  draw();

  return {
    group,
    setCount(n) {
      count = n;
      draw();
    },
    setLabel(text) {
      label = text;
      draw();
    },
  };
}

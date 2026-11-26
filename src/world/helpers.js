import * as THREE from 'three';

const materials = new Map();
const geometries = new Map();

/** Material padrão (low-poly, sem brilho). Compartilhado por cor+opções. */
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!materials.has(key)) {
    materials.set(
      key,
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.85,
        metalness: 0,
        flatShading: true,
        ...opts,
      }),
    );
  }
  return materials.get(key);
}

function boxGeometry(w, h, d) {
  const key = `${w}|${h}|${d}`;
  if (!geometries.has(key)) geometries.set(key, new THREE.BoxGeometry(w, h, d));
  return geometries.get(key);
}

/**
 * Caixa posicionada pela base: (x, z) é o centro e y é o "chão" da caixa.
 * Quase tudo no quarto é feito disso, estilo voxel.
 */
export function box(w, h, d, material, { x = 0, y = 0, z = 0, parent, shadow = true } = {}) {
  const mesh = new THREE.Mesh(
    boxGeometry(w, h, d),
    material instanceof THREE.Material ? material : mat(material),
  );
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  parent?.add(mesh);
  return mesh;
}

/** Textura desenhada em canvas (post-its, tela do notebook, pôster...). */
export function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** PRNG determinístico: o cabelo cacheado sai igual em todo carregamento. */
export function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const PIXEL_FONT = '"Pixelify Sans", ui-monospace, monospace';

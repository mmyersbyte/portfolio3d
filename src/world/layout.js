/**
 * Planta do quarto (unidades do mundo, 1 = 1 tile do piso).
 * Fonte única de verdade: os móveis são posicionados daqui e o boneco/gato
 * usam os mesmos retângulos como obstáculos no pathfinding.
 *
 * Paredes: x = -4 (esquerda) e z = -4 (fundo). O lado +x/+z fica aberto pra câmera.
 * Cada item: centro (x, z), largura (w, eixo x) e profundidade (d, eixo z).
 */
export const ROOM = { half: 4, wallHeight: 3.2, wallThickness: 0.2 };

export const LAYOUT = {
  bed: { x: -3.1, z: -2.6, w: 1.8, d: 2.8, top: 0.58 },
  nightstand: { x: -1.8, z: -3.65, w: 0.6, d: 0.6 },
  desk: { x: 1.6, z: -3.4, w: 2.8, d: 1.2, top: 0.95 },
  chair: { x: 1.5, z: -2.35, w: 0.75, d: 0.75 },
  plant: { x: 3.5, z: -3.5, w: 0.7, d: 0.7 },
  bookshelf: { x: -3.75, z: 2.3, w: 0.5, d: 1.6 },
  // posição inicial do boneco (ele anda, então não é obstáculo fixo)
  avatar: { x: 0, z: -0.3, w: 0.7, d: 0.7 },
  rug: { x: 0.4, z: 0.6, w: 3.6, d: 2.6 },
};

/** Pontos usados pelo gato pra subir/descer da cama (no pé da cama, pra não deitar em cima de mim). */
export const CAT_SPOTS = {
  bedLaunch: { x: -1.7, z: -1.5 },
  bedSleep: { x: -2.7, z: -1.5 },
  bedLand: { x: -1.6, z: -0.85 },
};

/**
 * Móveis que o boneco usa. `approach` é o tile de onde ele "entra" no móvel;
 * `pos`/`heading` é onde o corpo fica sentado/deitado.
 */
export const AVATAR_SPOTS = {
  chair: {
    pose: 'sit',
    approach: { x: 0.75, z: -2.15 },
    pos: { x: LAYOUT.chair.x, y: -0.11, z: LAYOUT.chair.z },
    heading: -Math.PI + 0.25, // virado pro notebook
  },
  bed: {
    pose: 'lie',
    approach: { x: -1.7, z: -2.6 },
    pos: { x: LAYOUT.bed.x, y: 0.7, z: -1.97 },
    heading: 0, // cabeça no travesseiro (-z)
  },
};

export const OBSTACLES = ['bed', 'nightstand', 'desk', 'chair', 'plant', 'bookshelf'].map(
  (key) => LAYOUT[key],
);

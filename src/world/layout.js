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
  wardrobe: { x: -3.66, z: 2.3, w: 0.68, d: 1.5, h: 2.15 },
  // posição inicial do boneco (ele anda, então não é obstáculo fixo)
  avatar: { x: 0, z: -0.3, w: 0.7, d: 0.7 },
  rug: { x: 0.4, z: 0.6, w: 3.6, d: 2.6 },
  // cantinho da TV: TV virada pra direita (+x) e o sofazinho de frente pra ela.
  // Assim a câmera vê a tela na diagonal e eu de perfil, sem um tampar o outro.
  tvRack: { x: 1.55, z: 2.9, w: 0.52, d: 1.5, rotY: Math.PI / 2 },
  sofa: { x: 3.28, z: 2.9, w: 0.8, d: 1.45, rotY: -Math.PI / 2 },
};

/**
 * Janela na parede esquerda (x = -4). `bottom` é a altura do parapeito,
 * fundo o bastante pro gato sentar.
 */
export const WINDOW = { z: -0.2, bottom: 1.05, width: 1.5, height: 1.25, sillDepth: 0.42 };

/**
 * Pontos do gato: de onde ele pula (launch), onde fica (sit/sleep) e onde cai ao descer (land).
 * Na cama ele fica no pé, pra não deitar em cima de mim.
 */
export const CAT_SPOTS = {
  bedLaunch: { x: -1.7, z: -1.5 },
  bedSleep: { x: -2.7, z: -1.5 },
  bedLand: { x: -1.6, z: -0.85 },
  windowLaunch: { x: -2.85, z: WINDOW.z },
  windowSit: { x: -3.74, z: WINDOW.z },
  windowLand: { x: -2.7, z: WINDOW.z + 0.55 },
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
    typing: true,
  },
  sofa: {
    pose: 'sit',
    relaxed: true, // braços largados, nada de digitar
    approach: { x: 2.35, z: 2.9 },
    // quadril na altura do assento (pivô da perna fica 0.75 acima dos pés)
    pos: { x: 3.2, y: -0.2, z: 2.9 },
    heading: -Math.PI / 2, // virado pra TV (de perfil pra câmera)
  },
  bed: {
    pose: 'lie',
    approach: { x: -1.7, z: -2.6 },
    pos: { x: LAYOUT.bed.x, y: 0.7, z: -1.97 },
    heading: 0, // cabeça no travesseiro (-z)
  },
};

/** Relógio de parede no fundo, entre o pôster da cama e os post-its (y = centro). */
export const WALL_CLOCK = { x: -1.0, y: 2.25 };

/**
 * Interruptor na parede esquerda, ao lado do guarda-roupa (y = altura do centro).
 * Fica do lado de +z: do outro lado, o próprio guarda-roupa esconderia ele da câmera.
 */
export const LIGHT_SWITCH = { z: 3.45, y: 1.2 };
/** Onde eu paro pra apertar o interruptor (de frente pra parede). */
export const SWITCH_SPOT = { x: -3.15, z: 3.5, heading: -Math.PI / 2 };

/** Onde eu paro pra trocar de roupa (de frente pro guarda-roupa). */
export const WARDROBE_SPOT = { x: -2.75, z: 2.3, heading: -Math.PI / 2 };

export const OBSTACLES = [
  'bed',
  'nightstand',
  'desk',
  'chair',
  'plant',
  'wardrobe',
  'tvRack',
  'sofa',
].map((key) => LAYOUT[key]);

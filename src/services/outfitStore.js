import { WARDROBE, DEFAULT_OUTFIT } from '../data/wardrobe.js';

/**
 * Roupa escolhida pelo visitante, salva no navegador dele.
 * Valida tudo ao carregar: se as opções mudarem num deploy, valores antigos
 * caem pro padrão em vez de quebrar o boneco.
 */
const KEY = 'portfolio3d:outfit';

const valid = {
  style: (v) => WARDROBE.styles.some((o) => o.id === v),
  top: (v) => WARDROBE.top.some((o) => o.id === v),
  pants: (v) => WARDROBE.pants.some((o) => o.id === v),
  shoes: (v) => WARDROBE.shoes.some((o) => o.id === v),
  glasses: (v) => typeof v === 'boolean',
};

export function sanitize(raw) {
  const outfit = { ...DEFAULT_OUTFIT };
  if (raw && typeof raw === 'object') {
    for (const key in valid) if (valid[key](raw[key])) outfit[key] = raw[key];
  }
  return outfit;
}

export function loadOutfit() {
  try {
    return sanitize(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return { ...DEFAULT_OUTFIT };
  }
}

export function saveOutfit(outfit) {
  try {
    localStorage.setItem(KEY, JSON.stringify(sanitize(outfit)));
    return true;
  } catch {
    return false; // aba anônima / storage bloqueado: a roupa vale só nesta visita
  }
}

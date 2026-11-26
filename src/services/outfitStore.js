import { WARDROBE_TABS, DEFAULT_OUTFIT } from '../data/wardrobe.js';

/**
 * Roupa escolhida pelo visitante, salva no navegador dele.
 * Valida tudo ao carregar: se as opções mudarem num deploy, valores antigos
 * caem pro padrão em vez de quebrar o boneco.
 */
const KEY = 'portfolio3d:outfit';

// validadores gerados a partir das abas do guarda-roupa
const validators = {};
for (const tab of WARDROBE_TABS) {
  for (const group of tab.groups) {
    if (group.type === 'toggles') {
      for (const o of group.options) validators[o.id] = (v) => typeof v === 'boolean';
    } else {
      const ids = new Set(group.options.map((o) => o.id));
      validators[group.key] = (v) => ids.has(v);
    }
  }
}

export function sanitize(raw) {
  const outfit = { ...DEFAULT_OUTFIT };
  if (!raw || typeof raw !== 'object') return outfit;
  // formato antigo: óculos era só liga/desliga
  if (typeof raw.glasses === 'boolean') raw = { ...raw, glasses: raw.glasses ? 'regular' : 'none' };
  for (const key in validators) if (validators[key](raw[key])) outfit[key] = raw[key];
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

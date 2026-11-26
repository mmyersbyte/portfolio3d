import { strings } from '../data/strings.js';

const STORAGE_KEY = 'portfolio3d:lang';
const SUPPORTED = ['pt', 'en'];
const listeners = new Set();

function detect() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED.includes(saved)) return saved;
  } catch {
    /* storage bloqueado: segue o navegador */
  }
  return navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

let lang = detect();

export const getLang = () => lang;

/** Texto fixo da interface. */
export const t = (key) => strings[lang][key] ?? strings.pt[key] ?? key;

/** Campo de conteúdo { pt, en } ou string simples. */
export const tr = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value[lang] ?? value.pt) : value;

export function applyTranslations(root = document) {
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  root.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
  root
    .querySelectorAll('[data-i18n-aria]')
    .forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  root
    .querySelectorAll('[data-i18n-placeholder]')
    .forEach((el) => el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder)));
}

export function setLang(next) {
  if (!SUPPORTED.includes(next) || next === lang) return;
  lang = next;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ok */
  }
  applyTranslations();
  listeners.forEach((fn) => fn(lang));
}

export const toggleLang = () => setLang(lang === 'pt' ? 'en' : 'pt');

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

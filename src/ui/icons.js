/**
 * Ícones de traço (24x24, stroke 2), no mesmo estilo dos atalhos da barra.
 * Usam currentColor, então seguem a cor do texto.
 */
const PATHS = {
  shirt: '<path d="M9 3 4 5.5 2.5 10l3 1.2V21h13v-9.8l3-1.2L20 5.5 15 3a3 3 0 0 1-6 0z"/>',
  cap: '<path d="M4 15a8 8 0 0 1 16 0z"/><path d="M12 7V5.5M20 15h2.5"/>',
  glasses:
    '<circle cx="6.5" cy="13" r="3.5"/><circle cx="17.5" cy="13" r="3.5"/><path d="M10 12.5h4M3 13 2 9M21 13l1-4"/>',
  bag: '<path d="M6 9h12l-.8 12H6.8z"/><path d="M9 9V7a3 3 0 0 1 6 0v2M9 14h6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
};

export const icon = (name, cls = 'icon') =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${PATHS[name] ?? ''}</svg>`;

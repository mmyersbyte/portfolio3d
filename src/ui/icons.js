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
  // comandos do gato
  jump: '<path d="M12 20V6M6.5 11.5 12 6l5.5 5.5"/><path d="M5 3h14"/>',
  speak: '<path d="M4 5h16v11H10l-5 4v-4H4z"/><path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01"/>',
  sit: '<path d="M7 3v10h10v8M7 13v8M17 13V9"/>',
  lie: '<path d="M3 19v-8M3 15h18v4M21 15v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="12" r="1.6"/>',
  come: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  free: '<circle cx="12" cy="16" r="3.5"/><circle cx="6.5" cy="10.5" r="1.6"/><circle cx="10" cy="6.5" r="1.6"/><circle cx="14" cy="6.5" r="1.6"/><circle cx="17.5" cy="10.5" r="1.6"/>',
};

export const icon = (name, cls = 'icon') =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${PATHS[name] ?? ''}</svg>`;

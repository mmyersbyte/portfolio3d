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
  // música
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  pause:
    '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  music:
    '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  // comandos do chat
  command: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M12.5 15H17"/>',
  hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 4 15.7l-1-3.2a1.5 1.5 0 0 1 2.7-1.2L8 14"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14a4.5 4.5 0 0 0 8 0M9 9.5h.01M15 9.5h.01"/>',
  zz: '<path d="M4 7h6l-6 7h6M14 12h5l-5 6h5"/>',
  alarm: '<circle cx="12" cy="13" r="7"/><path d="M12 9.5V13l2.5 1.5M4 5l3-2.5M20 5l-3-2.5"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  rain: '<path d="M7 14h10a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 6.9 7.5 3.3 3.3 0 0 0 7 14z"/><path d="m8 17-1 3M12 17l-1 3M16 17l-1 3"/>',
  sunrise:
    '<path d="M3 18h18M7 18a5 5 0 0 1 10 0M12 4v4M5.6 9.6 7 11M18.4 9.6 17 11M9 6l3-2 3 2"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
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

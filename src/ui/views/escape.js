const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa texto antes de interpolar em HTML. */
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => MAP[c]);

import { esc } from './views/escape.js';

const LINK_RE =
  /(https?:\/\/[^\s<]+[^\s<.,;:!?)])|((?:www\.)?github\.com\/[^\s<]+[^\s<.,;:!?)])|([\w.+-]+@[\w-]+\.[\w.]*\w)/g;

/** Escapa o texto e transforma URLs, github.com/… e e-mails em links. */
export function linkify(text) {
  return esc(text).replace(LINK_RE, (m, url, gh, mail) => {
    if (mail) return `<a href="mailto:${mail}">${mail}</a>`;
    const href = url ?? `https://${gh}`;
    return `<a href="${href}" target="_blank" rel="noopener">${m}</a>`;
  });
}

/** Texto da IA: escapa tudo, depois aplica só **negrito** e links (nada de HTML vindo de fora). */
export function richText(text) {
  return linkify(text).replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
}

/**
 * Comandos do chat (botão ao lado do X, ou digitando ":acenar" no chat).
 * `aliases` são as palavras aceitas depois de ":" ou "/" (PT e EN).
 * Textos ficam em strings.js: cmd.<id> (nome) e cmd.<id>.hint (descrição).
 */
export const COMMAND_GROUPS = [
  {
    id: 'me',
    commands: [
      { id: 'wave', icon: 'hand', aliases: ['acenar', 'oi', 'tchau', 'wave', 'hi'] },
      { id: 'laugh', icon: 'smile', aliases: ['rir', 'risada', 'haha', 'kkk', 'laugh'] },
      { id: 'sleep', icon: 'zz', aliases: ['dormir', 'cama', 'sleep'] },
      { id: 'wake', icon: 'alarm', aliases: ['acordar', 'levantar', 'wake'] },
    ],
  },
  {
    id: 'room',
    commands: [
      { id: 'light', icon: 'bulb', aliases: ['luz', 'light'] },
      { id: 'music', icon: 'music', aliases: ['musica', 'som', 'lofi', 'music'] },
      { id: 'tv', icon: 'tv', aliases: ['tv', 'televisao'] },
      { id: 'sun', icon: 'sun', aliases: ['sol', 'sun'] },
      { id: 'rain', icon: 'rain', aliases: ['chuva', 'rain'] },
      { id: 'day', icon: 'sunrise', aliases: ['dia', 'day'] },
      { id: 'night', icon: 'moon', aliases: ['noite', 'night'] },
      { id: 'now', icon: 'clock', aliases: ['agora', 'hora', 'now'] },
    ],
  },
];

const BY_ALIAS = new Map();
for (const group of COMMAND_GROUPS) {
  for (const cmd of group.commands) for (const alias of cmd.aliases) BY_ALIAS.set(alias, cmd.id);
}

/** ":acenar" / "/dormir" → id do comando; null se não for comando. undefined se for desconhecido. */
export function parseCommand(text) {
  const m = text.trim().match(/^[:/]\s*(\S+)/);
  if (!m) return null;
  const word = m[1]
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return BY_ALIAS.get(word);
}

/** Alias principal no idioma (pra mostrar ":acenar" / ":wave" na lista). */
export const mainAlias = (cmd, lang) =>
  lang === 'pt'
    ? cmd.aliases[0]
    : (cmd.aliases.find((a) => /^[a-z]+$/.test(a) && a === cmd.id) ?? cmd.aliases.at(-1));

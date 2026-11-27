import { askAvatar } from '../services/chatService.js';
import { t, getLang, onLangChange } from './i18n.js';
import { COMMAND_GROUPS, parseCommand, mainAlias } from '../data/commands.js';
import { esc } from './views/escape.js';
import { icon } from './icons.js';
import { richText } from './format.js';

/**
 * Painel de chat (bottom sheet no celular, lateral no desktop).
 * Guarda o histórico em memória no formato { role, content } que a API vai receber.
 */
export class Chat {
  constructor({ onOpenChange, onTalkingChange, onCommand } = {}) {
    this.el = document.getElementById('chat');
    this.log = document.getElementById('chat-log');
    this.form = document.getElementById('chat-form');
    this.input = document.getElementById('chat-input');
    this.suggestions = document.getElementById('chat-suggestions');
    this.onOpenChange = onOpenChange;
    this.onTalkingChange = onTalkingChange;
    this.onCommand = onCommand;

    // lista de comandos (botão ao lado do X)
    this.cmdToggle = document.getElementById('chat-cmd-toggle');
    this.cmdView = document.getElementById('chat-commands');
    this.cmdToggle.innerHTML = icon('command');
    this.cmdToggle.addEventListener('click', () => this.showCommands(this.cmdView.hidden));
    this.cmdView.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cmd]');
      if (!btn) return;
      this.onCommand?.(btn.dataset.cmd);
      btn.classList.remove('is-sent');
      void btn.offsetWidth;
      btn.classList.add('is-sent');
    });
    this.history = [];
    this.busy = false;

    this.mini = document.getElementById('chat-mini');
    this.mini.addEventListener('click', () => this.open());
    document.getElementById('chat-close').addEventListener('click', () => this.close());
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.send(this.input.value);
    });
    this.el.addEventListener('keydown', (e) => e.key === 'Escape' && this.close());
    onLangChange(() => {
      this.renderSuggestions();
      this.renderCommands();
    });
    this.renderSuggestions();
    this.renderCommands();
  }

  get isOpen() {
    return this.el.classList.contains('is-open');
  }

  /** Minimizado: painel some, mas a conversa fica e um botão traz ela de volta. */
  get isMinimized() {
    return !this.mini.hidden;
  }

  minimize() {
    if (!this.isOpen) return;
    this.close();
    this.mini.hidden = false;
  }

  open() {
    this.mini.hidden = true;
    if (this.isOpen) return;
    this.el.classList.add('is-open');
    this.el.setAttribute('aria-hidden', 'false');
    if (!this.history.length) this.push('assistant', t('chat.greeting'));
    // no celular, focar abre o teclado e cobre o quarto: só foca no desktop
    if (!matchMedia('(pointer: coarse)').matches) this.input.focus();
    this.onOpenChange?.(true);
  }

  close() {
    this.mini.hidden = true;
    if (!this.isOpen) return;
    this.el.classList.remove('is-open');
    this.el.setAttribute('aria-hidden', 'true');
    this.input.blur();
    this.onOpenChange?.(false);
  }

  /** Alterna entre a conversa e a lista de comandos. */
  showCommands(show) {
    this.cmdView.hidden = !show;
    this.log.hidden = show;
    this.suggestions.hidden = show;
    this.cmdToggle.setAttribute('aria-pressed', String(show));
    this.cmdToggle.setAttribute('aria-label', t(show ? 'chat.back' : 'chat.commands'));
    if (!show) this.log.scrollTop = this.log.scrollHeight;
  }

  renderCommands() {
    const lang = getLang();
    this.cmdView.innerHTML =
      `<p class="pet__hint">${esc(t('cmd.hint'))}</p>` +
      COMMAND_GROUPS.map(
        (group) => `<h3 class="pet__title">${esc(t(`cmd.group.${group.id}`))}</h3>
        <ul class="pet__commands">${group.commands
          .map(
            (cmd) => `<li><button type="button" class="pet-cmd" data-cmd="${cmd.id}">
              <span class="pet-cmd__icon">${icon(cmd.icon)}</span>
              <span class="pet-cmd__text"><strong>${esc(t(`cmd.${cmd.id}`))}</strong>
              <small>${esc(t(`cmd.${cmd.id}.hint`))}</small></span>
              <code class="pet-cmd__alias">:${esc(mainAlias(cmd, lang))}</code>
            </button></li>`,
          )
          .join('')}</ul>`,
      ).join('');
  }

  /** Linha de sistema (não vai pro histórico da IA). */
  note(text) {
    const msg = document.createElement('div');
    msg.className = 'msg msg--system';
    msg.textContent = text;
    this.log.append(msg);
    this.log.scrollTop = this.log.scrollHeight;
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  renderSuggestions() {
    this.suggestions.replaceChildren(
      ...t('chat.suggestions').map((text) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.textContent = text;
        chip.addEventListener('click', () => this.send(text));
        return chip;
      }),
    );
  }

  push(role, content) {
    this.history.push({ role, content });
    const msg = document.createElement('div');
    msg.className = `msg msg--${role === 'user' ? 'user' : 'bot'}`;
    // resposta da IA pode ter **negrito** e links; o que o visitante digita é sempre texto puro
    if (role === 'user') msg.textContent = content;
    else msg.innerHTML = richText(content);
    this.log.append(msg);
    this.log.scrollTop = this.log.scrollHeight;
  }

  async send(raw) {
    const text = raw.trim();
    if (!text || this.busy) return;

    // ":acenar", "/chuva"... são comandos, não perguntas
    const cmd = parseCommand(text);
    if (cmd !== null) {
      this.input.value = '';
      if (cmd) {
        this.onCommand?.(cmd);
        this.note(t('cmd.ran').replace('{name}', t(`cmd.${cmd}`)));
      } else {
        this.note(t('cmd.unknown'));
      }
      return;
    }

    this.busy = true;
    this.input.value = '';
    this.push('user', text);

    const typing = document.createElement('div');
    typing.className = 'msg msg--bot msg--typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    this.log.append(typing);
    this.log.scrollTop = this.log.scrollHeight;

    let reply;
    try {
      reply = await askAvatar(this.history.slice(-12), getLang());
    } catch (err) {
      console.error(err);
      reply = t('chat.error');
    }
    typing.remove();
    this.push('assistant', reply);
    this.busy = false;

    // boca do boneco mexe proporcional ao tamanho da resposta
    this.onTalkingChange?.(true);
    clearTimeout(this.talkTimer);
    this.talkTimer = setTimeout(
      () => this.onTalkingChange?.(false),
      Math.min(4000, 600 + reply.length * 25),
    );
  }
}

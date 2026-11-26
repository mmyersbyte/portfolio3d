import './styles/main.css';
import { profile, links } from './data/content.js';
import { t, tr, applyTranslations, toggleLang, onLangChange } from './ui/i18n.js';
import { Modal } from './ui/Modal.js';
import { Chat } from './ui/Chat.js';
import { cvView } from './ui/views/cvView.js';
import { projectsView } from './ui/views/projectsView.js';

const $ = (id) => document.getElementById(id);
const isTouch = matchMedia('(pointer: coarse)').matches;

let scene = null; // preenchido quando o 3D carregar

const modal = new Modal($('modal'));
const chat = new Chat({
  onOpenChange(open) {
    if (open) scene?.avatar.wave();
    scene?.avatarBubble[open ? 'hide' : 'show']();
  },
  onTalkingChange: (on) => scene?.avatar.setTalking(on),
});

const openLink = (url) => window.open(url, '_blank', 'noopener');

const actions = {
  chat: () => chat.toggle(),
  projects: () => modal.open(projectsView),
  cv: () => modal.open(cvView),
  github: () => openLink(links.github),
  linkedin: () => openLink(links.linkedin),
  instagram: () => openLink(links.instagram),
};

// ---------- interface fixa ----------
document.querySelector('.dock').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (btn) actions[btn.dataset.action]?.();
});

$('lang-toggle').addEventListener('click', toggleLang);

const hint = $('hint');
hint.dataset.i18n = isTouch ? 'hint.touch' : 'hint.desktop';
const hideHint = () => hint.classList.add('is-hidden');
setTimeout(hideHint, 9000);
$('webgl').addEventListener('pointerdown', hideHint, { once: true });

function renderProfile() {
  $('brand-name').textContent = profile.name;
  $('chat-name').textContent = profile.name;
  $('brand-role').textContent = tr(profile.role);
}
onLangChange(renderProfile);

applyTranslations();
renderProfile();

// ---------- 3D ----------
function hasWebGL() {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
}

const finishLoading = () => $('loader').classList.add('is-done');

async function boot() {
  if (!hasWebGL()) {
    const msg = document.createElement('p');
    msg.className = 'fallback';
    msg.textContent = t('fallback');
    document.body.append(msg);
    finishLoading();
    return;
  }

  // as texturas dos post-its usam a fonte pixel: espera ela (com limite de tempo)
  await Promise.race([
    document.fonts.load('32px "Pixelify Sans"').catch(() => {}),
    new Promise((r) => setTimeout(r, 1500)),
  ]);

  const { startScene } = await import('./scene.js');
  scene = startScene({
    canvas: $('webgl'),
    labelsEl: $('labels'),
    tooltipEl: $('tooltip'),
    actions,
    onReady: finishLoading,
  });
}

boot().catch((err) => {
  console.error(err);
  finishLoading();
});

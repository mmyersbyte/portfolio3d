import './styles/main.css';
import { profile, links } from './data/content.js';
import { t, tr, applyTranslations, toggleLang, onLangChange } from './ui/i18n.js';
import { Modal } from './ui/Modal.js';
import { Chat } from './ui/Chat.js';
import { cvView } from './ui/views/cvView.js';
import { projectsView } from './ui/views/projectsView.js';
import { WardrobePanel } from './ui/WardrobePanel.js';
import { loadOutfit } from './services/outfitStore.js';
import { PetPanel } from './ui/PetPanel.js';

const $ = (id) => document.getElementById(id);
const isTouch = matchMedia('(pointer: coarse)').matches;

let scene = null; // preenchido quando o 3D carregar

const modal = new Modal($('modal'));

// balão "fala comigo" só aparece quando nenhum painel está aberto
const syncBubble = () =>
  scene?.avatarBubble[chat.isOpen || wardrobePanel.isOpen || petPanel.isOpen ? 'hide' : 'show']();

const chat = new Chat({
  onOpenChange(open) {
    if (open) {
      wardrobePanel.cancel();
      petPanel.close();
      scene?.avatar.wave();
    }
    syncBubble();
  },
  onTalkingChange: (on) => scene?.avatar.setTalking(on),
  onCommand: (id) => scene?.runCommand(id),
});

const wardrobePanel = new WardrobePanel({
  onPreview: (outfit) => scene?.avatar.setOutfit(outfit),
  onOpenChange(open) {
    if (!open) scene?.closeWardrobe();
    syncBubble();
  },
  onSaved: (ok) => toast(t(ok ? 'wardrobe.saved' : 'wardrobe.notSaved')),
});

// chat e painel do gato ocupam o mesmo lugar: abrir o gato minimiza o chat
const petPanel = new PetPanel({
  onCommand: (cmd) => scene?.commandCat(cmd),
  getActivity: () => scene?.cat.activity,
  onOpenChange(open) {
    if (open) {
      chat.minimize();
      wardrobePanel.cancel();
    }
    scene?.framePet(open);
    syncBubble();
  },
});

let toastTimer = 0;
function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2800);
}

const openLink = (url) => window.open(url, '_blank', 'noopener');

const actions = {
  chat: () => chat.toggle(),
  cat: () => petPanel.toggle(),
  wardrobe: () => {
    chat.close();
    petPanel.close();
    scene?.visitWardrobe(() => wardrobePanel.open(loadOutfit()));
  },
  // andou pra longe do guarda-roupa: fecha sem salvar
  onWalk: () => wardrobePanel.cancel(),
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
  scene.avatar.setOutfit(loadOutfit());
  wardrobePanel.setStudio(scene.studio);
  // facilita depurar pelo console no `pnpm dev` (não vai pro build)
  if (import.meta.env.DEV) window.__scene = scene;
}

boot().catch((err) => {
  console.error(err);
  finishLoading();
});

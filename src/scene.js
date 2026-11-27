import { Experience } from './core/Experience.js';
import { createRoom } from './world/Room.js';
import { createFurniture } from './world/Furniture.js';
import { RoomWindow } from './world/Window.js';
import { Environment } from './world/Environment.js';
import { createPostIts } from './world/PostIts.js';
import { TileHighlight, snapToTile } from './world/TileHighlight.js';
import { Wardrobe } from './world/Wardrobe.js';
import { PreviewStudio } from './core/PreviewStudio.js';
import { AVATAR_SPOTS, WARDROBE_SPOT } from './world/layout.js';
import { Avatar } from './entities/Avatar.js';
import { Cat } from './entities/Cat.js';
import { WorldLabels } from './ui/WorldLabels.js';
import { t, onLangChange } from './ui/i18n.js';
import { petLine } from './ui/PetPanel.js';

const THREE_CLAMP = (v, min, max) => Math.min(max, Math.max(min, v));
import { profile } from './data/content.js';

/**
 * Monta a cena 3D e liga os objetos clicáveis às ações da interface.
 * Fica num módulo separado pra ser carregado via import() dinâmico:
 * o HTML/loader aparece antes do three.js terminar de baixar.
 */
export function startScene({ canvas, labelsEl, tooltipEl, actions, onReady }) {
  const exp = new Experience(canvas);

  const { lights } = createRoom(exp.scene);
  const { laptop, bed, chair, lamp, setClock } = createFurniture(exp);
  const roomWindow = new RoomWindow(exp.scene);
  // hora de Brasília + chuva: mexe no céu da janela e nas luzes do quarto
  const env = new Environment(exp, {
    window: roomWindow,
    lights: { ...lights, lamp },
    setClock,
  });
  const notes = createPostIts(exp.scene);
  const wardrobe = new Wardrobe(exp);
  const avatar = new Avatar(exp);
  const cat = new Cat(exp);
  cat.avatar = avatar;
  cat.env = env;
  const tiles = new TileHighlight(exp);
  const labels = new WorldLabels(exp, labelsEl);

  // ---------- clicáveis ----------
  const it = exp.interaction;
  it.register(avatar.root, { label: 'label.avatar', onClick: actions.chat });
  it.register(laptop, { label: 'label.laptop', onClick: actions.projects });
  it.register(cat.root, { label: 'label.cat', onClick: actions.cat });
  for (const note of notes) {
    it.register(note.group, { label: `label.${note.id}`, onClick: actions[note.id] });
  }

  // móveis que o boneco usa: clicar de novo faz ele levantar
  const furnitureLabel = (name) => () =>
    avatar.spot === AVATAR_SPOTS[name] ? 'label.getUp' : `label.${name}`;
  const useFurniture = (name) => () => {
    tiles.mark(AVATAR_SPOTS[name].approach);
    avatar.use(name);
  };
  it.register(bed, {
    label: furnitureLabel('bed'),
    onClick: useFurniture('bed'),
    hoverScale: 1.02,
  });
  it.register(chair, { label: furnitureLabel('chair'), onClick: useFurniture('chair') });

  // ---------- guarda-roupa ----------
  it.register(wardrobe.group, {
    label: 'label.wardrobe',
    onClick: actions.wardrobe,
    hoverScale: 1.02,
  });

  const studio = new PreviewStudio(exp, document.getElementById('wardrobe-preview'));

  let wardrobeTimer = 0;
  let visit = 0; // invalida a chegada se o painel fechar antes do boneco chegar
  /**
   * Boneco vai até o guarda-roupa e abre as portas.
   * Desktop: vira pra câmera, a câmera aproxima e só então abre o painel.
   * Celular: o painel (com prévia própria) abre na hora; o boneco vai andando por trás.
   */
  function visitWardrobe(onReady) {
    clearTimeout(wardrobeTimer);
    const id = ++visit;
    const mobile = window.innerWidth < 768;
    if (mobile) onReady();
    tiles.mark(WARDROBE_SPOT);
    avatar.walkTo(WARDROBE_SPOT, () => {
      if (id !== visit) return;
      avatar.heading = WARDROBE_SPOT.heading;
      wardrobe.setOpen(true);
      wardrobeTimer = setTimeout(() => {
        avatar.faceCamera();
        if (mobile) return;
        const head = avatar.root.position.clone().setY(1.2);
        exp.rig.focus(head, { zoom: 2.2, shiftX: -0.18 }); // painel fica na direita
        onReady();
      }, 650);
    });
  }

  function closeWardrobe() {
    visit++;
    clearTimeout(wardrobeTimer);
    wardrobe.setOpen(false);
    exp.rig.reset();
  }

  // ---------- andar pelo piso (estilo Habbo) ----------
  const walkableTile = (point) => {
    if (!point) return null;
    const tile = snapToTile(point);
    return avatar.canWalk(tile.x, tile.z) ? tile : null;
  };
  it.onFloorHover = (point) => tiles.show(walkableTile(point));
  it.onFloorClick = (point) => {
    const tile = walkableTile(point);
    if (tile && avatar.walkTo(tile)) {
      tiles.mark(tile);
      actions.onWalk?.();
    }
  };

  it.onHover = (entry, x, y) => {
    tooltipEl.classList.toggle('is-visible', Boolean(entry));
    if (!entry) return;
    tooltipEl.textContent = t(typeof entry.label === 'function' ? entry.label() : entry.label);
    const maxX = window.innerWidth - tooltipEl.offsetWidth - 8;
    tooltipEl.style.transform = `translate(${Math.min(x + 16, maxX)}px, ${y + 18}px)`;
  };

  // ---------- balões ----------
  const avatarBubble = labels.add(avatar.bubbleAnchor, { text: t('bubble.avatar') });
  onLangChange(() => (avatarBubble.text = t('bubble.avatar')));

  // falas do Frajola: sorteia do conjunto da situação, sem repetir a última
  const lastLine = {};
  let catBubble = null;
  cat.onSay = (situation) => {
    const pool = t(`pet.reply.${situation}`);
    if (!Array.isArray(pool)) return;
    let line;
    do line = pool[Math.floor(Math.random() * pool.length)];
    while (pool.length > 1 && line === lastLine[situation]);
    lastLine[situation] = line;
    // tempo de leitura proporcional ao tamanho da frase
    catBubble?.remove(); // fala nova substitui a anterior
    catBubble = labels.flash(
      cat.bubbleAnchor,
      line,
      Math.min(5000, 1500 + line.length * 45),
      'bubble--cat',
    );
  };
  let zzz = null;
  cat.onSleepChange = (sleeping) => {
    zzz?.remove();
    zzz = sleeping
      ? labels.add(cat.bubbleAnchor, { text: 'z Z z', className: 'bubble--soft' })
      : null;
  };

  exp.start(onReady);
  /**
   * No celular o painel do gato cobre a parte de baixo da tela: a câmera
   * enquadra eu + gato na faixa visível de cima pra dar pra ver ele obedecendo.
   */
  let petFraming = false;
  function framePet(open = petFraming) {
    petFraming = open;
    if (window.innerWidth >= 768) return;
    if (!open) {
      exp.rig.reset();
      return;
    }
    const a = avatar.root.position;
    const c = cat.root.position;
    const mid = a.clone().add(c).multiplyScalar(0.5).setY(1.2);
    const spread = Math.hypot(a.x - c.x, a.z - c.z);

    // faixa livre: entre o cabeçalho e o topo do painel
    const H = window.innerHeight;
    const bandTop = document.querySelector('.topbar').getBoundingClientRect().bottom + 8;
    const bandBottom = H - document.getElementById('pet').offsetHeight - 16;
    const band = Math.max(80, bandBottom - bandTop);

    // zoom que cabe ~3 unidades de altura (boneco + balão) na faixa e os dois na largura
    const cam = exp.camera;
    const byHeight = ((band / H) * (cam.top - cam.bottom)) / 3.2;
    const byWidth = (cam.right - cam.left) / (spread + 2);
    const zoom = THREE_CLAMP(Math.min(byHeight, byWidth), 0.9, 2.2);
    const shiftY = 0.5 - (bandTop + band / 2) / H;
    exp.rig.focus(mid, { zoom, shiftY });
  }

  /** Eu falo o comando (balão que sobe), viro pro gato e ele obedece. */
  function commandCat(cmd) {
    labels.say(avatar.bubbleAnchor, profile.name, petLine(`pet.say.${cmd}`));
    if (avatar.state === 'idle') {
      const a = avatar.root.position;
      const c = cat.root.position;
      avatar.heading = Math.atan2(c.x - a.x, c.z - a.z);
    }
    setTimeout(() => cat.command(cmd), 350);
    // "vem": reenquadra quando ele chegar perto de mim
    if (petFraming) setTimeout(() => framePet(), cmd === 'come' ? 2500 : 400);
  }

  return {
    exp,
    env,
    avatar,
    cat,
    avatarBubble,
    studio,
    visitWardrobe,
    closeWardrobe,
    commandCat,
    framePet,
  };
}

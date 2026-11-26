/**
 * Guarda-roupa: abas → grupos → opções. O painel e a validação do que
 * vem do localStorage são montados a partir daqui.
 *
 * Tipos de grupo:
 *  - pills:    escolhe uma opção (valor = option.id)
 *  - swatches: escolhe uma cor (valor = hex)
 *  - toggles:  cada opção é um liga/desliga (outfit[option.id] = boolean)
 *
 * Pra adicionar algo novo: inclua a opção aqui e desenhe a peça em Avatar.js.
 */

const color = (id, pt, en) => ({ id, name: { pt, en } });

export const TOPS = [
  color('#2a9d8f', 'Verde-água', 'Teal'),
  color('#e76f51', 'Coral', 'Coral'),
  color('#d62828', 'Vermelho', 'Red'),
  color('#e9c46a', 'Mostarda', 'Mustard'),
  color('#8338ec', 'Roxo', 'Purple'),
  color('#264653', 'Petróleo', 'Petrol'),
  color('#f1f1f1', 'Branco', 'White'),
  color('#1f1f26', 'Preto', 'Black'),
];

const PANTS = [
  color('#2f3e5c', 'Jeans', 'Denim'),
  color('#1f1f26', 'Preto', 'Black'),
  color('#a98b6a', 'Bege', 'Khaki'),
  color('#6b705c', 'Verde-oliva', 'Olive'),
  color('#8d99ae', 'Cinza', 'Gray'),
];

const SHOES = [
  color('#f1f1f1', 'Branco', 'White'),
  color('#1f1f26', 'Preto', 'Black'),
  color('#e63946', 'Vermelho', 'Red'),
  color('#457b9d', 'Azul', 'Blue'),
  color('#ffb703', 'Amarelo', 'Yellow'),
];

const ACCENTS = [
  color('#e63946', 'Vermelho', 'Red'),
  color('#1f1f26', 'Preto', 'Black'),
  color('#f1f1f1', 'Branco', 'White'),
  color('#457b9d', 'Azul', 'Blue'),
  color('#ffb703', 'Amarelo', 'Yellow'),
  color('#2a9d8f', 'Verde-água', 'Teal'),
  color('#ff8fab', 'Rosa', 'Pink'),
];

const opt = (id, pt, en) => ({ id, name: { pt, en } });

export const WARDROBE_TABS = [
  {
    id: 'clothes',
    icon: '👕',
    name: { pt: 'Roupa', en: 'Clothes' },
    groups: [
      {
        key: 'style',
        type: 'pills',
        label: { pt: 'Estilo', en: 'Style' },
        options: [
          opt('hoodie', 'Moletom', 'Hoodie'),
          opt('tshirt', 'Camiseta', 'T-shirt'),
          opt('jacket', 'Jaqueta', 'Jacket'),
        ],
      },
      { key: 'top', type: 'swatches', label: { pt: 'Blusa', en: 'Top' }, options: TOPS },
      { key: 'pants', type: 'swatches', label: { pt: 'Calça', en: 'Pants' }, options: PANTS },
      { key: 'shoes', type: 'swatches', label: { pt: 'Tênis', en: 'Sneakers' }, options: SHOES },
    ],
  },
  {
    id: 'head',
    icon: '🧢',
    name: { pt: 'Cabeça', en: 'Head' },
    groups: [
      {
        key: 'hat',
        type: 'pills',
        label: { pt: 'Na cabeça', en: 'Headwear' },
        options: [
          opt('none', 'Nada', 'Nothing'),
          opt('cap', 'Boné', 'Cap'),
          opt('beanie', 'Gorro', 'Beanie'),
          opt('headphones', 'Fone', 'Headphones'),
          opt('bandana', 'Bandana', 'Bandana'),
        ],
      },
      {
        key: 'accent',
        type: 'swatches',
        label: { pt: 'Cor dos acessórios', en: 'Accessory color' },
        options: ACCENTS,
      },
    ],
  },
  {
    id: 'face',
    icon: '😎',
    name: { pt: 'Rosto', en: 'Face' },
    groups: [
      {
        key: 'glasses',
        type: 'pills',
        label: { pt: 'Óculos', en: 'Glasses' },
        options: [
          opt('none', 'Sem', 'None'),
          opt('regular', 'De grau', 'Regular'),
          opt('sun', 'Escuro', 'Sunglasses'),
        ],
      },
      {
        key: 'beard',
        type: 'pills',
        label: { pt: 'Barba', en: 'Facial hair' },
        options: [
          opt('none', 'Sem', 'None'),
          opt('mustache', 'Bigode', 'Mustache'),
          opt('beard', 'Barba', 'Beard'),
        ],
      },
    ],
  },
  {
    id: 'extras',
    icon: '🎒',
    name: { pt: 'Extras', en: 'Extras' },
    groups: [
      {
        key: 'extras',
        type: 'toggles',
        label: { pt: 'Itens', en: 'Items' },
        options: [
          opt('backpack', '🎒 Mochila', '🎒 Backpack'),
          opt('chain', '⛓️ Corrente', '⛓️ Chain'),
          opt('watch', '⌚ Relógio', '⌚ Watch'),
          opt('mug', '☕ Caneca', '☕ Mug'),
        ],
      },
    ],
  },
];

/** Meu visual padrão. */
export const DEFAULT_OUTFIT = {
  style: 'hoodie',
  top: '#2a9d8f',
  pants: '#2f3e5c',
  shoes: '#f1f1f1',
  hat: 'none',
  accent: '#e63946',
  glasses: 'none',
  beard: 'none',
  backpack: false,
  chain: false,
  watch: false,
  mug: false,
};

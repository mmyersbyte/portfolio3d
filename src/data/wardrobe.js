/**
 * Opções do guarda-roupa. As cores são o próprio id (é o que vai pro localStorage).
 * Pra adicionar uma cor/estilo é só incluir aqui: o painel monta sozinho.
 */
export const WARDROBE = {
  styles: [
    { id: 'hoodie', name: { pt: 'Moletom', en: 'Hoodie' } },
    { id: 'tshirt', name: { pt: 'Camiseta', en: 'T-shirt' } },
    { id: 'jacket', name: { pt: 'Jaqueta', en: 'Jacket' } },
  ],
  top: [
    { id: '#2a9d8f', name: { pt: 'Verde-água', en: 'Teal' } },
    { id: '#e76f51', name: { pt: 'Coral', en: 'Coral' } },
    { id: '#d62828', name: { pt: 'Vermelho', en: 'Red' } },
    { id: '#e9c46a', name: { pt: 'Mostarda', en: 'Mustard' } },
    { id: '#8338ec', name: { pt: 'Roxo', en: 'Purple' } },
    { id: '#264653', name: { pt: 'Petróleo', en: 'Petrol' } },
    { id: '#f1f1f1', name: { pt: 'Branco', en: 'White' } },
    { id: '#1f1f26', name: { pt: 'Preto', en: 'Black' } },
  ],
  pants: [
    { id: '#2f3e5c', name: { pt: 'Jeans', en: 'Denim' } },
    { id: '#1f1f26', name: { pt: 'Preto', en: 'Black' } },
    { id: '#a98b6a', name: { pt: 'Bege', en: 'Khaki' } },
    { id: '#6b705c', name: { pt: 'Verde-oliva', en: 'Olive' } },
    { id: '#8d99ae', name: { pt: 'Cinza', en: 'Gray' } },
  ],
  shoes: [
    { id: '#f1f1f1', name: { pt: 'Branco', en: 'White' } },
    { id: '#1f1f26', name: { pt: 'Preto', en: 'Black' } },
    { id: '#e63946', name: { pt: 'Vermelho', en: 'Red' } },
    { id: '#457b9d', name: { pt: 'Azul', en: 'Blue' } },
    { id: '#ffb703', name: { pt: 'Amarelo', en: 'Yellow' } },
  ],
};

/** Meu visual padrão. */
export const DEFAULT_OUTFIT = {
  style: 'hoodie',
  top: '#2a9d8f',
  pants: '#2f3e5c',
  shoes: '#f1f1f1',
  glasses: false,
};

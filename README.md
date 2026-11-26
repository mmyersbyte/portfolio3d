# Portfolio 3D

Meu portfólio interativo: um quarto isométrico em 3D, estilo pixel/voxel, feito com **Three.js** puro.

- 🧑 Clique no boneco para conversar comigo (chat com respostas mock por enquanto, a IA com Groq vem depois)
- 💻 Clique no notebook para ver os projetos
- 📝 Os post-its na parede levam pro CV, GitHub, LinkedIn e Instagram
- 🐈‍⬛ O gato anda sozinho pelo quarto, desvia dos móveis e às vezes sobe na cama pra dormir
- 🌎 PT/EN, funciona no celular e em telas grandes

## Rodando

```bash
pnpm install
pnpm dev        # http://localhost:5173 (use o IP da rede pra testar no celular)
pnpm build      # gera dist/
pnpm preview    # serve o build
pnpm lint
```

Requer Node 20+.

## Estrutura

```
src/
├── main.js              # entrada: UI fixa, ações e carregamento do 3D
├── scene.js             # monta a cena e liga os clicáveis às ações (import dinâmico)
├── core/
│   ├── Experience.js    # renderer, cena, loop
│   ├── CameraRig.js     # câmera ortográfica isométrica, zoom/rotação limitados, resize
│   └── Interaction.js   # raycast de hover/clique (diferencia toque de arrasto)
├── world/
│   ├── layout.js        # planta do quarto: posição dos móveis e obstáculos do gato
│   ├── Room.js          # piso, paredes, janela, tapete, luzes
│   ├── Furniture.js     # cama, mesa + notebook, cadeira, estante, planta...
│   ├── PostIts.js
│   └── helpers.js       # box(), materiais, texturas em canvas
├── entities/
│   ├── Avatar.js        # boneco (olha pro mouse, pisca, acena, "fala")
│   ├── Cat.js           # gato + máquina de estados
│   └── pathfinding.js   # A* na grade do piso
├── ui/                  # chat, modal, i18n, balões 3D→HTML
├── services/
│   └── chatService.js   # mock hoje; POST pro backend quando existir
├── data/
│   ├── content.js       # ✏️ CV, links e projetos (edite aqui)
│   └── strings.js       # textos da interface PT/EN
└── styles/main.css
```

## Editando o conteúdo

Tudo fica em `src/data/content.js`. Campos com `{ pt, en }` são traduzidos automaticamente.
Para mexer na posição dos móveis, edite `src/world/layout.js`: o gato usa os mesmos retângulos pra desviar.

## Chat / IA

O front já está preparado. Quando o backend existir, defina no `.env` (e na Vercel):

```
VITE_CHAT_ENDPOINT=/api/chat
```

O chat faz `POST { messages: [{ role, content }], lang }` e espera `{ reply }`.
Na Vercel, uma função em `api/chat.js` resolve isso sem servidor separado (a chave do Groq fica só no backend).

## Deploy

Importe o repositório na Vercel. Ela detecta o Vite sozinha (build `pnpm build`, saída `dist`).

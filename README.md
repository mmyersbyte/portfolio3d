# Portfolio 3D

Meu portfólio interativo: um quarto isométrico em 3D, estilo pixel/voxel, feito com **Three.js** puro.

- 🚶 Clique no chão para andar pelos tiles (estilo Habbo), na cadeira para sentar e na cama para deitar
- 👕 Clique no guarda-roupa (ou em "Roupa" na barra) para vestir o boneco: roupa, cabeça (boné, gorro, fone, bandana), rosto (óculos, barba) e extras (mochila, corrente, relógio, caneca). Cada item tem miniatura 3D do próprio boneco e, no celular, uma prévia ao vivo girável. A escolha fica salva no navegador de quem visitou
- ⌨️ No chat, o botão ao lado do X lista os comandos (ou digite `:acenar`, `:rir`, `:dormir`, `:acordar`, `:luz`, `:sol`, `:chuva`, `:dia`, `:noite`, `:agora`). Indo dormir, eu deito na cama e o Frajola dorme no parapeito
- 🧑 Clique no boneco para conversar comigo (chat com respostas mock por enquanto, a IA com Groq vem depois)
- 💻 Clique no notebook e abre um navegador: projetos, GitHub (dados reais pela API pública), Instagram, LinkedIn e o Dino Corre, um joguinho de corrida em pixel art
- 📝 Os post-its na parede levam pro CV, GitHub, LinkedIn e Instagram
- 🐈‍⬛ O Frajola anda sozinho pelo quarto, desvia dos móveis e às vezes sobe na cama pra dormir. Clicando nele abre a ficha dele e dá pra dar comandos estilo Habbo (pular, falar, sentar, deitar, vem, livre): eu falo num balão que sobe e ele obedece
- 🌗 A janela mostra o céu na hora real de Brasília (madrugada, amanhecer, dia, tarde, noite) e a luz do quarto acompanha. De vez em quando chove, e depois vai parando aos poucos. O Frajola gosta de ficar no parapeito olhando a chuva
- 📺 Cantinho da TV com pufe: sentando no pufe a TV liga (logo quicando, ou equalizador se o lo-fi estiver tocando)
- 💡 Interruptor ao lado do guarda-roupa: com a luz acesa o quarto fica iluminado não importa a hora; apagada, só a luz natural (fica salvo no navegador)
- 🎵 Caixinha de som no criado-mudo toca lo-fi (botão ao lado do PT/EN, clique na caixinha ou `:musica`). A música é gerada na hora pelo navegador (Web Audio): original, sem arquivo e sem direitos autorais
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
│   ├── PreviewStudio.js # prévia 3D do guarda-roupa + miniaturas de cada item
│   └── Interaction.js   # raycast de hover/clique (diferencia toque de arrasto)
├── world/
│   ├── layout.js        # planta do quarto: posição dos móveis e obstáculos do gato
│   ├── Room.js          # piso, paredes, tapete, luzes
│   ├── Window.js        # janela (céu em pixel art, cortinas, parapeito)
│   ├── Environment.js   # hora de Brasília + chuva → céu e luzes
│   ├── LightSwitch.js   # interruptor da luz do quarto
│   ├── WallClock.js     # relógio de parede (sempre a hora real de Brasília)
│   ├── Speaker.js       # caixinha de som + notinhas que sobem
│   ├── TvCorner.js      # TV + pufe
│   ├── Furniture.js     # cama, mesa + notebook, cadeira, planta...
│   ├── PostIts.js
│   ├── TileHighlight.js # quadrado branco no piso (hover/destino)
│   ├── Wardrobe.js      # guarda-roupa com portas animadas
│   └── helpers.js       # box(), materiais, texturas em canvas
├── entities/
│   ├── Avatar.js        # boneco: anda, senta, deita, olha pro mouse, acena
│   ├── Cat.js           # gato + máquina de estados
│   └── pathfinding.js   # NavGrid: A* na grade do piso (com obstáculos dinâmicos)
├── ui/                  # chat, modal, i18n, balões 3D→HTML
│   └── browser/         # navegador do notebook (abas, páginas, DinoGame)
├── audio/
│   └── LofiPlayer.js    # lo-fi procedural (acordes, bateria, vinil) com Web Audio
├── services/
│   ├── chatService.js   # mock hoje; POST pro backend quando existir
│   └── outfitStore.js   # roupa escolhida no localStorage (validada ao carregar)
├── data/
│   ├── content.js       # ✏️ CV, links e projetos (edite aqui)
│   ├── wardrobe.js      # ✏️ abas/opções do guarda-roupa e meu visual padrão
│   ├── pet.js           # ✏️ nome, nascimento e comandos do gato
│   ├── commands.js      # ✏️ comandos do chat e as palavras aceitas (:acenar, :wave…)
│   └── strings.js       # textos da interface PT/EN
└── styles/main.css
```

## Editando o conteúdo

Tudo fica em `src/data/content.js`. Campos com `{ pt, en }` são traduzidos automaticamente.
Em `socials` ficam os usuários das redes, e em `instagramPosts` dá pra colar links de posts do Instagram pra aparecerem no navegador do notebook (embed oficial).
Para mexer na posição dos móveis, edite `src/world/layout.js`: o boneco e o gato usam os mesmos retângulos pra desviar,
e `AVATAR_SPOTS` define onde ele senta/deita.

No `pnpm dev`, a cena fica em `window.__scene` pra depurar pelo console.

### Testando hora e clima

A hora segue Brasília (`America/Sao_Paulo`). Pra ver outro horário ou forçar o clima, use a URL:

- `?hora=18:30` congela o relógio nesse horário
- `?chuva=1` já começa chovendo · `?chuva=0` nunca chove

Pelo console (no dev): `__scene.env.setHour(6.5)`, `__scene.env.setRain(true)`.

## Chat / IA

O front já está preparado. Quando o backend existir, defina no `.env` (e na Vercel):

```
VITE_CHAT_ENDPOINT=/api/chat
```

O chat faz `POST { messages: [{ role, content }], lang }` e espera `{ reply }`.
Na Vercel, uma função em `api/chat.js` resolve isso sem servidor separado (a chave do Groq fica só no backend).

## Deploy

Importe o repositório na Vercel. Ela detecta o Vite sozinha (build `pnpm build`, saída `dist`).

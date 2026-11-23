# Chess gate

A loading screen that asks visitors their chess level, then gives them a challenge
to solve before entering the site.

| Level (default) | Challenge |
| --------------- | --------- |
| Beginner        | Move a given piece / to a given square |
| Casual          | Mate in 1 |
| Club player     | Mate in 2 (famous games and patterns) |
| Expert          | Checkmate Stockfish in a basic endgame within a move limit |

## Quick reference

| I want to…                         | Edit                                             |
| ---------------------------------- | ------------------------------------------------ |
| Turn the gate on/off               | `config.ts` → `enabled`                          |
| Add / edit puzzles                 | `puzzles.ts` (templates at the top), then `npm run verify-puzzles` |
| Change or rename levels            | `config.ts` → `levels.list` (puzzles refer to the `id`) |
| Skip the level slider              | `config.ts` → `levels.ask: false` (uses `levels.default`) |
| Force a puzzle while testing       | `config.ts` → `puzzle: 'opera-game'`             |
| Show it on every reload            | `config.ts` → `remember: 'never'`                |
| Change square colors               | `config.ts` → `board.light` / `board.dark`       |
| Use images for squares             | drop files in `assets/squares/`, then `board.light: { image: 'file.png' }` |
| Use one image for the whole board  | `config.ts` → `board.image`                      |
| Change the piece set               | `config.ts` → `pieceSet` (folder in `assets/pieces/`) |
| Add a piece set                    | new folder in `assets/pieces/` with `wK wQ wR wB wN wP bK bQ bR bB bN bP` (`.svg`, `.png` or `.webp`) |
| Make the engine faster/stronger    | `config.ts` → `engine.movetimeMs`                |
| Change texts                       | `config.ts` → `text`                             |

## Writing puzzles

```ts
// Find the moves — your moves and the replies, as in a PGN
{ level: 'club', fen: '5r1k/6pp/7N/8/8/1Q6/6PP/6K1 w - - 0 1', moves: 'Qg8+ Rxg8 Nf7#' },

// Same, starting from a real game instead of a FEN, with the opponent's last move animated
{ level: 'club', after: '1. e4 e5 2. Nf3 d6 3. Bc4 Bg4 4. Nc3 g6 5. Nxe5', setup: 'Bxd1', moves: 'Bxf7+ Ke7 Nd5#' },

// Beginner tasks
{ level: 'beginner', type: 'move-piece', piece: 'knight' },
{ level: 'beginner', type: 'move-piece', piece: 'bishop', to: 'c4', after: '1. e4 e5 2. Nf3 Nc6' },

// Checkmate the engine
{ level: 'expert', type: 'mate-vs-engine', fen: '8/8/8/4k3/8/8/8/4K2Q w - - 0 1', maxMoves: 12 },
```

- The side to move (after `setup`) is the visitor; the board is flipped for Black.
- In `moves`, the listed moves are required, but **any checkmate is always accepted**.
- Titles and goals ("Mate in 2", "Move a knight"…) are generated when omitted.
- `npm run verify-puzzles` checks every puzzle and warns when another move would also
  force mate (and would therefore be rejected unfairly).
- A broken puzzle never breaks the site: it is skipped and logged in the browser console.

## Engine

Stockfish 19 (lite, single-threaded WebAssembly) lives in `public/stockfish/` because the
worker script loads the `.wasm` next to it. It is downloaded only when an engine challenge
starts. If it cannot load, a simple built-in defender plays instead.

## Search engines

The site is always rendered underneath the gate (inert while locked), so Google still
indexes its content.

## Structure

```
chess-gate/
├── config.ts             ← settings
├── puzzles.ts            ← puzzle collection
├── index.ts              ← public exports: ChessGate, Board, config
├── ChessGate.tsx         ← wraps the site: locked → reveal animation → site
├── chess-gate.css        ← styles and animations (all classes prefixed `cg-`)
├── types.ts
├── components/
│   ├── GateScreen.tsx    ← level slider → puzzle
│   ├── LevelPicker.tsx   ← the slider
│   ├── PuzzleView.tsx    ← board, goal, status, hint / retry / skip
│   └── Board.tsx         ← reusable board (click, drag & drop, keyboard)
├── hooks/
│   └── usePuzzle.ts      ← rules for the three puzzle kinds
├── lib/
│   ├── normalize.ts      ← puzzles.ts → app format (SAN → UCI, defaults)
│   ├── engine.ts         ← Stockfish worker client + fallback defender
│   ├── assets.ts         ← finds piece sets and square images automatically
│   ├── fen.ts            ← FEN / coordinate helpers
│   ├── selectPuzzle.ts   ← pick by level (random / daily / id)
│   └── storage.ts        ← remembers solved state and chosen level
└── assets/
    ├── pieces/<set>/     ← one folder per piece set
    └── squares/          ← square / board textures
```

## Credits

Pieces: see `assets/pieces/CREDITS.md`. Stockfish: see `public/stockfish/README.md` (GPLv3).

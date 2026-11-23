/**
 * ─────────────────────────────────────────────────────────────
 *  Puzzle collection. After editing, run:  npm run verify-puzzles
 * ─────────────────────────────────────────────────────────────
 *
 * Three kinds of puzzle. Copy one of these templates and fill it in:
 *
 *   // 1. Find the right moves (the default kind)
 *   {
 *     level: 'club',
 *     fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',   // or `after:` (see below)
 *     moves: 'Rd8#',                                  // your moves and the replies: 'Qb8+ Nxb8 Rd8#'
 *   },
 *
 *   // 2. Beginner task: move a piece
 *   { level: 'beginner', type: 'move-piece', piece: 'knight' },             // "Move a knight"
 *   { level: 'beginner', type: 'move-piece', piece: 'bishop', to: 'c4' },   // "Move the bishop to c4"
 *
 *   // 3. Checkmate Stockfish from a position
 *   { level: 'expert', type: 'mate-vs-engine', fen: '8/8/8/4k3/8/8/8/4K2Q w - - 0 1', maxMoves: 12 },
 *
 * Handy fields (all optional):
 *   after:  'moves from the start', e.g. '1. e4 e5 2. Nf3 Nc6' — instead of a FEN
 *   setup:  an opponent move played (and animated) at the start, like on Lichess
 *   title, source, goal (text shown to the visitor), id (to force it in config.ts)
 *
 * The side to move is the visitor. Moves can be written as in a PGN
 * ('1. e4 e5 2. Nf3', '+', '#', '!?' are fine) or in UCI ('e2e4').
 * To get a FEN, set up the position on lichess.org/editor and copy it.
 */
import type { PuzzleDef } from './types'

export const puzzles: PuzzleDef[] = [
  /* ── Beginner ─────────────────────────────────────────────── */
  {
    level: 'beginner',
    type: 'move-piece',
    title: 'Jump in',
    piece: 'knight',
  },
  {
    level: 'beginner',
    type: 'move-piece',
    title: 'The Italian way',
    after: '1. e4 e5 2. Nf3 Nc6',
    piece: 'bishop',
    to: 'c4',
  },
  {
    level: 'beginner',
    type: 'move-piece',
    title: 'Safety first',
    after: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5',
    piece: 'king',
    to: 'g1',
    goal: 'Castle kingside',
  },
  {
    level: 'beginner',
    type: 'move-piece',
    title: 'Take it!',
    after: '1. e4 d5',
    to: 'd5',
    goal: 'Capture the pawn on d5',
  },

  /* ── Casual ───────────────────────────────────────────────── */
  {
    level: 'casual',
    title: 'Back-rank weakness',
    fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
    moves: 'Rd8#',
    source: 'Classic pattern',
  },
  {
    level: 'casual',
    title: "Scholar's mate",
    after: '1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6',
    moves: 'Qxf7#',
  },
  {
    level: 'casual',
    title: "Fool's mate",
    after: '1. f3 e5',
    setup: 'g4',
    moves: 'Qh4#',
  },

  /* ── Club ─────────────────────────────────────────────────── */
  {
    id: 'philidor-legacy',
    level: 'club',
    title: "Philidor's legacy",
    fen: '5r1k/6pp/7N/8/8/1Q6/6PP/6K1 w - - 0 1',
    moves: 'Qg8+ Rxg8 Nf7#',
    source: 'Smothered mate pattern',
  },
  {
    id: 'legal-trap',
    level: 'club',
    title: "Légal's mate",
    after: '1. e4 e5 2. Nf3 d6 3. Bc4 Bg4 4. Nc3 g6 5. Nxe5',
    setup: 'Bxd1',
    moves: '6. Bxf7+ Ke7 7. Nd5#',
    source: 'Légal vs Saint Brie, Paris 1750',
  },
  {
    id: 'opera-game',
    level: 'club',
    title: 'The Opera Game',
    after:
      '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 ' +
      '9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+',
    setup: 'Nxd7',
    moves: '16. Qb8+ Nxb8 17. Rd8#',
    source: 'Morphy vs Duke Karl & Count Isouard, Paris 1858',
  },

  /* ── Expert ───────────────────────────────────────────────── */
  {
    id: 'queen-vs-king',
    level: 'expert',
    type: 'mate-vs-engine',
    title: 'Queen vs King',
    fen: '8/8/8/4k3/8/8/8/4K2Q w - - 0 1', // mate in 7 with perfect play
    maxMoves: 12,
  },
  {
    id: 'rook-vs-king',
    level: 'expert',
    type: 'mate-vs-engine',
    title: 'Rook vs King',
    fen: '8/8/8/8/3k4/8/8/R3K3 w - - 0 1', // mate in 14 with perfect play
    maxMoves: 25,
  },
]

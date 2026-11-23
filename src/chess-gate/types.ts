/** Shared types for the chess gate. */

export type Color = 'w' | 'b'
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
export type PieceName = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'
export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
export type Square = `${File}${Rank}`

export interface Piece {
  color: Color
  type: PieceType
}

/* ── Board look ─────────────────────────────────────────────── */

/**
 * How a square (or the whole board) is painted.
 * - `{ color: '#f0d9b5' }`      → any CSS color
 * - `{ image: 'wood-light.png' }` → a file in `chess-gate/assets/squares/`,
 *   or a path from `public/` starting with `/`, or a full URL.
 */
export type Fill = { color: string } | { image: string }

export interface BoardTheme {
  light: Fill
  dark: Fill
  /** Optional single image for the whole board. When set, `light`/`dark` are ignored. */
  image?: string
  /** Show a–h / 1–8 labels on the board edge. */
  coordinates: boolean
  /** Overlay colors (use translucent colors so the square shows through). */
  highlights: {
    lastMove: string
    selected: string
    legalMove: string
    check: string
    hint: string
  }
}

/* ── Config ─────────────────────────────────────────────────── */

/**
 * When the gate is shown again after someone solved it:
 * - `'never'`   → the puzzle appears on every page load
 * - `'session'` → solved once per browser tab session
 * - `'always'`  → solved once, remembered in this browser
 */
export type RememberMode = 'never' | 'session' | 'always'

/** `'random'`, `'daily'` (same puzzle for everyone on a given day) or a puzzle `id`. */
export type PuzzleChoice = 'random' | 'daily' | (string & {})

export interface Level {
  /** Used in puzzles.ts (`level: 'club'`). */
  id: string
  label: string
  /** Small text under the label, e.g. a rating range. */
  rating?: string
  description: string
}

export interface ChessGateConfig {
  enabled: boolean
  /** Who you are: shown at the top of the loading screen. */
  identity: {
    name: string
    /** Image path relative to `public/`. */
    avatar: string
  }
  /** Animation from the loading screen to the site. */
  reveal: {
    durationMs: number
    /** Element of the site the avatar flies to (missing → it just fades). */
    avatarTarget: string
    /** Element of the site the nickname flies to. */
    nameTarget: string
  }
  remember: RememberMode
  puzzle: PuzzleChoice
  levels: {
    /** Show the level slider before the puzzle. */
    ask: boolean
    /** Level used when `ask` is false, and the slider's starting position. */
    default: string
    list: Level[]
  }
  engine: {
    /** Engine script, relative to `public/`. The .wasm must sit next to it. */
    path: string
    /** Thinking time per engine move, in ms. */
    movetimeMs: number
  }
  /** Folder name inside `chess-gate/assets/pieces/`. */
  pieceSet: string
  board: BoardTheme
  behaviour: {
    /** Minimum pause before the opponent replies, in ms. */
    opponentDelayMs: number
    /** Wrong moves before the Hint button appears. 0 = always, null = never. */
    hintAfterMistakes: number | null
    /** Wrong moves before a Skip link appears. 0 = always, null = never (must solve). */
    skipAfterMistakes: number | null
    /** How long the success message stays before the site fades in, in ms. */
    revealDelayMs: number
  }
  text: {
    title: string
    levelQuestion: string
    play: string
    changeLevel: string
    yourMove: string
    opponentThinking: string
    wrongMove: string
    solved: string
    outOfMoves: string
    draw: string
    tryAgain: string
    movesLeft: string
    hint: string
    skip: string
  }
}

/* ── Puzzles as you write them (puzzles.ts) ─────────────────── */

interface PuzzleDefBase {
  /** Level id from config.ts (`'beginner'`, `'casual'`, …). */
  level: string
  title?: string
  /** Credit line, e.g. the game the position comes from. */
  source?: string
  /** Optional id, to force this puzzle with `config.puzzle`. */
  id?: string
  /** Text shown to the visitor. A sensible default is generated when omitted. */
  goal?: string
  /** Starting position (FEN). Omit to start from the initial position. */
  fen?: string
  /** Moves played before the puzzle starts, e.g. `'1. e4 e5 2. Nf3'`. Applied after `fen`. */
  after?: string
}

/** Find the right line. The listed moves must be played (any checkmate is also accepted). */
export interface LinePuzzleDef extends PuzzleDefBase {
  type?: 'line'
  /**
   * Optional opponent move played (and animated) right at the start, like on Lichess.
   * The visitor plays the other color.
   */
  setup?: string
  /** Solution, visitor and opponent alternating: `'Qb8+ Nxb8 Rd8#'` (SAN, move numbers allowed) or UCI. */
  moves: string
}

/** Beginner task: make a move with a given piece and/or to a given square. */
export interface MovePieceDef extends PuzzleDefBase {
  type: 'move-piece'
  piece?: PieceName
  to?: Square
}

/** Checkmate Stockfish from the given position (any moves allowed). */
export interface EnginePuzzleDef extends PuzzleDefBase {
  type: 'mate-vs-engine'
  /** Maximum number of visitor moves. Omit for no limit. */
  maxMoves?: number
}

export type PuzzleDef = LinePuzzleDef | MovePieceDef | EnginePuzzleDef

/* ── Puzzles as the app uses them (after normalize) ─────────── */

export interface Puzzle {
  id: string
  type: 'line' | 'move-piece' | 'mate-vs-engine'
  level: string
  title: string
  goal: string
  source?: string
  /** Position before the setup move (if any). */
  fen: string
  /** Opponent move (UCI) played automatically at the start. */
  setup?: string
  /** Line puzzles: solution in UCI, visitor first. */
  solution: string[]
  /** Move-piece tasks. */
  piece?: PieceType
  to?: Square
  /** Engine challenges. */
  maxMoves?: number
}

/**
 * ─────────────────────────────────────────────────────────────
 *  Chess gate settings — the only file you need to edit.
 * ─────────────────────────────────────────────────────────────
 */
import type { ChessGateConfig } from './types'

export const chessGateConfig: ChessGateConfig = {
  /** Master switch: false = the site opens directly, no puzzle. */
  enabled: true,

  identity: {
    name: 'TistaMilani',
    avatar: 'propic.jpg', // from public/
  },

  /** On success, avatar and nickname fly to these elements of the site (see Navbar.tsx). */
  reveal: {
    durationMs: 900,
    avatarTarget: '[data-chess-gate="avatar"]',
    nameTarget: '[data-chess-gate="name"]',
  },

  /** 'never' (every visit) | 'session' (once per tab session) | 'always' (once per browser). */
  remember: 'session',

  /** Within the chosen level: 'random' | 'daily' | a puzzle id from puzzles.ts. */
  puzzle: 'random',

  levels: {
    ask: true,
    default: 'casual',
    list: [
      { id: 'beginner', label: 'Beginner', rating: 'New to chess', description: 'I know how the pieces move.' },
      { id: 'casual', label: 'Casual', rating: '< 1300', description: 'I play now and then.' },
      { id: 'club', label: 'Club player', rating: '1300 – 1900', description: 'Tactics are my thing.' },
      { id: 'expert', label: 'Expert', rating: '1900+', description: 'Bring on the engine.' },
    ],
  },

  engine: {
    path: 'stockfish/stockfish-19-lite-single.js',
    movetimeMs: 400,
  },

  /** Folder inside ./assets/pieces — included: 'cburnett', 'chessnut'. */
  pieceSet: 'cburnett',

  board: {
    // Plain colors…
    light: { color: '#f0d9b5' },
    dark: { color: '#b58863' },
    // …or images from ./assets/squares (one per square color):
    // light: { image: 'marble-light.png' },
    // dark: { image: 'marble-dark.png' },

    // …or one image for the whole board (overrides light/dark):
    // image: 'wood-board.jpg',

    coordinates: true,

    highlights: {
      lastMove: 'rgba(155, 199, 0, 0.41)',
      selected: 'rgba(20, 85, 30, 0.5)',
      legalMove: 'rgba(20, 85, 30, 0.45)',
      check: 'rgba(255, 0, 0, 0.75)',
      hint: 'rgba(0, 120, 255, 0.55)',
    },
  },

  behaviour: {
    opponentDelayMs: 600,
    hintAfterMistakes: 1,
    skipAfterMistakes: null,
    revealDelayMs: 1400,
  },

  text: {
    title: 'Solve the puzzle to enter',
    levelQuestion: 'How strong are you at chess?',
    play: 'Play',
    changeLevel: 'change',
    yourMove: 'Your move',
    opponentThinking: 'Opponent is thinking…',
    wrongMove: 'Not quite — try again',
    solved: 'Well played! Welcome in.',
    outOfMoves: 'Out of moves',
    draw: "It's a draw",
    tryAgain: 'Try again',
    movesLeft: 'Moves left',
    hint: 'Hint',
    skip: 'Skip puzzle',
  },
}

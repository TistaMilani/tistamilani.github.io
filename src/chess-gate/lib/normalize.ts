/**
 * Turns the friendly puzzle definitions of puzzles.ts into the strict form the app uses:
 * resolves `after`, converts SAN to UCI, fills in ids, titles and goals.
 * Also used by `npm run verify-puzzles`.
 */
import { Chess } from 'chess.js'
import type { PieceName, PieceType, Puzzle, PuzzleDef } from '../types'

const PIECE_TYPES: Record<PieceName, PieceType> = {
  king: 'k',
  queen: 'q',
  rook: 'r',
  bishop: 'b',
  knight: 'n',
  pawn: 'p',
}

/** "1. e4 e5 2.Nf3!? Nc6" → ["e4", "e5", "Nf3", "Nc6"] */
export function splitMoves(text: string): string[] {
  return text
    .replace(/\{[^}]*\}/g, ' ') // PGN comments
    .split(/\s+/)
    .map((t) => t.replace(/^\d+\.+/, '').replace(/[!?]+$/, ''))
    .filter((t) => t && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t))
}

/** Plays one move (SAN or UCI) and returns it in UCI. */
function play(chess: Chess, move: string): string {
  try {
    return chess.move(move).lan
  } catch {
    throw new Error(`illegal move "${move}" in position ${chess.fen()}`)
  }
}

function describeLine(chess: Chess, solution: string[]): string {
  const playerMoves = Math.ceil(solution.length / 2)
  if (chess.isCheckmate()) return `Mate in ${playerMoves}`
  return playerMoves === 1 ? 'Find the best move' : 'Find the best line'
}

export function normalizePuzzle(def: PuzzleDef, index: number): Puzzle {
  const chess = new Chess(def.fen)
  if (def.after) splitMoves(def.after).forEach((m) => play(chess, m))
  const fen = chess.fen()
  const id = def.id ?? `${def.level}-${index + 1}`
  const base = { id, level: def.level, source: def.source, fen, solution: [] as string[] }

  switch (def.type) {
    case 'move-piece': {
      if (!def.piece && !def.to) throw new Error('move-piece needs `piece`, `to` or both')
      const piece = def.piece ? PIECE_TYPES[def.piece] : undefined
      const possible = chess
        .moves({ verbose: true })
        .some((m) => (!piece || m.piece === piece) && (!def.to || m.to === def.to))
      if (!possible) throw new Error('no legal move matches `piece` / `to`')
      const goal =
        def.goal ??
        (def.piece && def.to
          ? `Move the ${def.piece} to ${def.to}`
          : def.piece
            ? `Move ${/^[aeiou]/.test(def.piece) ? 'an' : 'a'} ${def.piece}`
            : `Move a piece to ${def.to}`)
      return { ...base, type: 'move-piece', title: def.title ?? 'First steps', goal, piece, to: def.to }
    }

    case 'mate-vs-engine': {
      if (chess.isGameOver()) throw new Error('the position is already over')
      const goal = def.goal ?? (def.maxMoves ? `Checkmate in ${def.maxMoves} moves or fewer` : 'Checkmate the engine')
      return { ...base, type: 'mate-vs-engine', title: def.title ?? 'Beat the engine', goal, maxMoves: def.maxMoves }
    }

    default: {
      const setup = def.setup ? play(chess, splitMoves(def.setup)[0]) : undefined
      const solution = splitMoves(def.moves).map((m) => play(chess, m))
      if (solution.length === 0) throw new Error('`moves` is empty')
      if (solution.length % 2 === 0) throw new Error('`moves` must end with your move (odd number of moves)')
      const goal = def.goal ?? describeLine(chess, solution)
      return { ...base, type: 'line', title: def.title ?? 'Puzzle', goal, setup, solution }
    }
  }
}

/** Normalizes every puzzle, logging (and skipping) the broken ones. */
export function normalizeAll(defs: PuzzleDef[]): Puzzle[] {
  const result: Puzzle[] = []
  defs.forEach((def, i) => {
    try {
      result.push(normalizePuzzle(def, i))
    } catch (err) {
      console.error(`[chess-gate] Skipping puzzle #${i + 1} (${def.title ?? def.id ?? def.level}): ${(err as Error).message}`)
    }
  })
  return result
}

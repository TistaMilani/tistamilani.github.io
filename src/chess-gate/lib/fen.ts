import type { Color, File, Piece, PieceType, Rank, Square } from '../types'

export const FILES: File[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
export const RANKS: Rank[] = ['1', '2', '3', '4', '5', '6', '7', '8']

/** Reads the piece placement part of a FEN into a square → piece map. */
export function parsePlacement(fen: string): Partial<Record<Square, Piece>> {
  const pieces: Partial<Record<Square, Piece>> = {}
  const rows = fen.split(' ')[0].split('/')
  rows.forEach((row, i) => {
    const rank = RANKS[7 - i]
    let file = 0
    for (const ch of row) {
      if (/\d/.test(ch)) {
        file += Number(ch)
        continue
      }
      const color: Color = ch === ch.toUpperCase() ? 'w' : 'b'
      pieces[`${FILES[file]}${rank}`] = { color, type: ch.toLowerCase() as PieceType }
      file++
    }
  })
  return pieces
}

export function sideToMove(fen: string): Color {
  return fen.split(' ')[1] === 'b' ? 'b' : 'w'
}

export function isLightSquare(square: Square): boolean {
  const file = FILES.indexOf(square[0] as File)
  const rank = Number(square[1]) - 1
  return (file + rank) % 2 === 1
}

/** Squares in display order (top-left → bottom-right) for the given orientation. */
export function squaresInOrder(orientation: Color): Square[] {
  const ranks = orientation === 'w' ? [...RANKS].reverse() : RANKS
  const files = orientation === 'w' ? FILES : [...FILES].reverse()
  return ranks.flatMap((r) => files.map((f) => `${f}${r}` as Square))
}

/** Column / row of a square on screen (0–7). */
export function screenPosition(square: Square, orientation: Color): { col: number; row: number } {
  const file = FILES.indexOf(square[0] as File)
  const rank = Number(square[1]) - 1
  return orientation === 'w' ? { col: file, row: 7 - rank } : { col: 7 - file, row: rank }
}

export function parseUci(uci: string): { from: Square; to: Square; promotion?: PieceType } {
  return {
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
    promotion: (uci[4] as PieceType | undefined) || undefined,
  }
}

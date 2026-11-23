import type { Level, Puzzle, PuzzleChoice } from '../types'

/** Puzzles of the given level; if it has none, those of the nearest level that does. */
function puzzlesForLevel(puzzles: Puzzle[], levels: Level[], levelId: string): Puzzle[] {
  const exact = puzzles.filter((p) => p.level === levelId)
  if (exact.length || levels.length === 0) return exact.length ? exact : puzzles

  const index = levels.findIndex((l) => l.id === levelId)
  const byDistance = levels
    .map((l, i) => ({ id: l.id, distance: Math.abs(i - index) }))
    .sort((a, b) => a.distance - b.distance)
  for (const { id } of byDistance) {
    const found = puzzles.filter((p) => p.level === id)
    if (found.length) return found
  }
  return puzzles
}

export function selectPuzzle(
  puzzles: Puzzle[],
  levels: Level[],
  levelId: string,
  choice: PuzzleChoice,
  exclude?: string,
): Puzzle {
  if (puzzles.length === 0) throw new Error('[chess-gate] puzzles.ts has no valid puzzles')

  if (choice !== 'random' && choice !== 'daily') {
    const found = puzzles.find((p) => p.id === choice)
    if (found) return found
    console.warn(`[chess-gate] Puzzle "${choice}" not found, picking one for the level.`)
  }

  const pool = puzzlesForLevel(puzzles, levels, levelId)

  if (choice === 'daily') {
    const day = Math.floor(Date.now() / 86_400_000)
    return pool[day % pool.length]
  }

  const fresh = pool.length > 1 && exclude ? pool.filter((p) => p.id !== exclude) : pool
  return fresh[Math.floor(Math.random() * fresh.length)]
}

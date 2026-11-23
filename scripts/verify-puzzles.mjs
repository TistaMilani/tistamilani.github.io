#!/usr/bin/env node
/**
 * Checks src/chess-gate/puzzles.ts:
 *  - every puzzle parses (FEN, `after`, `setup`, `moves` legal; move-piece target reachable)
 *  - levels exist in config.ts, ids are unique, every level has at least one puzzle
 *  - mate puzzles (up to mate in 3): warns if another move would also force mate,
 *    because the gate only accepts the listed move (direct checkmates are always accepted).
 *
 * Run with: npm run verify-puzzles
 */
import { createServer } from 'vite'
import { Chess } from 'chess.js'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const load = (path) => server.ssrLoadModule(path)

/** Can the side to move force mate within n moves? */
function forcesMate(chess, n) {
  return chess.moves().some((m) => {
    chess.move(m)
    const ok = leadsToMate(chess, n)
    chess.undo()
    return ok
  })
}

/** After a move: is it mate, or does every reply still allow mate in n-1? */
function leadsToMate(chess, n) {
  if (chess.isCheckmate()) return true
  if (n <= 1 || chess.isGameOver()) return false
  return chess.moves().every((reply) => {
    chess.move(reply)
    const ok = forcesMate(chess, n - 1)
    chess.undo()
    return ok
  })
}

/** Moves (UCI) at this point that also force mate but are not the listed one nor an immediate mate. */
function rejectedAlternatives(chess, listed, n) {
  return chess.moves({ verbose: true }).filter((m) => {
    if (m.lan === listed) return false
    chess.move(m)
    const ok = !chess.isCheckmate() && leadsToMate(chess, n)
    chess.undo()
    return ok
  }).map((m) => m.lan)
}

let errors = 0
let warnings = 0

try {
  const { puzzles } = await load('/src/chess-gate/puzzles.ts')
  const { normalizePuzzle } = await load('/src/chess-gate/lib/normalize.ts')
  const { chessGateConfig } = await load('/src/chess-gate/config.ts')
  const levelIds = chessGateConfig.levels.list.map((l) => l.id)
  const ids = new Set()
  const perLevel = Object.fromEntries(levelIds.map((id) => [id, 0]))

  puzzles.forEach((def, i) => {
    const name = `#${String(i + 1).padStart(2)} ${(def.title ?? def.id ?? '').padEnd(22)}`
    const problems = []
    const notes = []
    let p

    try {
      p = normalizePuzzle(def, i)
    } catch (err) {
      problems.push(err.message)
    }
    if (!levelIds.includes(def.level)) problems.push(`unknown level "${def.level}" (config.ts has: ${levelIds.join(', ')})`)

    if (p) {
      if (ids.has(p.id)) problems.push(`duplicate id "${p.id}"`)
      ids.add(p.id)
      if (p.level in perLevel) perLevel[p.level]++

      if (p.type === 'line' && p.goal.startsWith('Mate in')) {
        const n = Math.ceil(p.solution.length / 2)
        if (n <= 3) {
          const chess = new Chess(p.fen)
          if (p.setup) chess.move(p.setup)
          p.solution.forEach((uci, step) => {
            if (step % 2 === 0) {
              const alt = rejectedAlternatives(chess, uci, n - step / 2)
              if (alt.length) notes.push(`move ${step + 1}: ${alt.join(', ')} also force mate but would be rejected`)
            }
            chess.move(uci)
          })
        }
      }
      if (p.type === 'mate-vs-engine' && p.maxMoves !== undefined && p.maxMoves < 1) problems.push('maxMoves must be ≥ 1')
    }

    const summary = p ? `${p.level.padEnd(9)} ${p.type.padEnd(15)} ${p.goal}` : def.level
    if (problems.length) {
      errors++
      console.log(`✗ ${name} ${summary}\n      ${problems.join('\n      ')}`)
    } else if (notes.length) {
      warnings++
      console.log(`! ${name} ${summary}\n      ${notes.join('\n      ')}`)
    } else {
      console.log(`✓ ${name} ${summary}`)
    }
  })

  for (const [level, count] of Object.entries(perLevel)) {
    if (count === 0) {
      warnings++
      console.log(`! level "${level}" has no puzzles (visitors will get one from the nearest level)`)
    }
  }
  console.log(`\n${puzzles.length} puzzles · ${errors} with errors · ${warnings} warnings`)
} finally {
  await server.close()
}

process.exit(errors ? 1 : 0)

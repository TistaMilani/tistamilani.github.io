/**
 * Puzzle state machine for all three puzzle kinds:
 *  - line:           the visitor must play the listed moves, the opponent replies from the list
 *  - move-piece:     any legal move with the requested piece / to the requested square
 *  - mate-vs-engine: free play against Stockfish until checkmate, a draw or the move limit
 *
 * Remount the component (change its `key`) to restart a puzzle.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import type { Move } from 'chess.js'
import type { ChessGateConfig, Color, Puzzle, Square } from '../types'
import { parseUci } from '../lib/fen'
import { engineMove, warmUpEngine } from '../lib/engine'

export type PuzzleStatus = 'playing' | 'opponent' | 'wrong' | 'solved' | 'failed'
export type FailReason = 'out-of-moves' | 'draw'
export type MoveResult = 'correct' | 'wrong' | 'illegal'

export interface LastMove {
  from: Square
  to: Square
  /** Increments with every move, used to restart the slide animation. */
  id: number
  /** False when the piece was dragged (it is already in place). */
  animate: boolean
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function findCheckedKing(chess: Chess): Square | null {
  if (!chess.inCheck()) return null
  const turn = chess.turn()
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell && cell.type === 'k' && cell.color === turn) return cell.square as Square
    }
  }
  return null
}

export function usePuzzle(puzzle: Puzzle, config: ChessGateConfig) {
  const { opponentDelayMs } = config.behaviour
  const { path: enginePath, movetimeMs } = config.engine

  const [chess] = useState(() => new Chess(puzzle.fen))
  const playerColor = useMemo<Color>(() => {
    const c = new Chess(puzzle.fen)
    if (puzzle.setup) c.move(puzzle.setup)
    return c.turn()
  }, [puzzle])

  const [fen, setFen] = useState(puzzle.fen)
  const [status, setStatus] = useState<PuzzleStatus>(puzzle.setup ? 'opponent' : 'playing')
  const [failReason, setFailReason] = useState<FailReason | null>(null)
  const [lastMove, setLastMove] = useState<LastMove | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [playerMoves, setPlayerMoves] = useState(0)
  const [hintVisible, setHintVisible] = useState(false)

  const step = useRef(0) // position in puzzle.solution
  const moveId = useRef(0)
  const alive = useRef(true)

  /** Publishes a move already made on `chess` to the UI. */
  const sync = (played: Move, animate: boolean) => {
    setFen(chess.fen())
    setLastMove({ from: played.from as Square, to: played.to as Square, animate, id: ++moveId.current })
  }
  const playUci = (uci: string) => sync(chess.move(parseUci(uci)), true)

  const fail = (reason: FailReason) => {
    setFailReason(reason)
    setStatus('failed')
  }

  // Runs once per mount (a new puzzle or a retry remounts the component).
  useEffect(() => {
    alive.current = true
    if (puzzle.type === 'mate-vs-engine') warmUpEngine(enginePath)
    let timer: number | undefined
    if (puzzle.setup && moveId.current === 0) {
      timer = window.setTimeout(() => {
        playUci(puzzle.setup!)
        setStatus('playing')
      }, opponentDelayMs)
    }
    return () => {
      alive.current = false
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const opponentReply = async () => {
    setStatus('opponent')
    const [uci] = await Promise.all([
      puzzle.type === 'mate-vs-engine'
        ? engineMove(chess.fen(), enginePath, movetimeMs)
        : Promise.resolve(puzzle.solution[step.current]),
      sleep(opponentDelayMs),
    ])
    if (!alive.current) return
    playUci(uci)
    step.current++
    if (chess.isGameOver()) fail('draw')
    else setStatus('playing')
  }

  /** Squares the piece on `from` may move to (empty when it is not the visitor's turn). */
  const legalTargets = (from: Square): Square[] => {
    if (status !== 'playing' && status !== 'wrong') return []
    return chess.moves({ square: from, verbose: true }).map((m) => m.to as Square)
  }

  const tryMove = (from: Square, to: Square, viaDrag: boolean): MoveResult => {
    if (status !== 'playing' && status !== 'wrong') return 'illegal'
    const candidates = chess.moves({ square: from, verbose: true }).filter((m) => m.to === to)
    if (candidates.length === 0) return 'illegal'

    // Promotions: the piece from the solution when it matches, otherwise a queen.
    const expected = puzzle.type === 'line' ? parseUci(puzzle.solution[step.current]) : null
    const promotion = candidates[0].promotion
      ? expected?.from === from && expected.to === to && expected.promotion
        ? expected.promotion
        : 'q'
      : undefined

    const move = chess.move({ from, to, promotion })
    const accepted =
      puzzle.type === 'line'
        ? move.lan === puzzle.solution[step.current] || chess.isCheckmate()
        : puzzle.type === 'move-piece'
          ? (!puzzle.piece || move.piece === puzzle.piece) && (!puzzle.to || move.to === puzzle.to)
          : true // engine challenge: any legal move

    if (!accepted) {
      chess.undo()
      setMistakes((n) => n + 1)
      setStatus('wrong')
      return 'wrong'
    }

    sync(move, !viaDrag)
    setHintVisible(false)
    step.current++
    const movesPlayed = playerMoves + 1
    setPlayerMoves(movesPlayed)

    const lineFinished = puzzle.type === 'line' && step.current >= puzzle.solution.length
    if (chess.isCheckmate() || lineFinished || puzzle.type === 'move-piece') {
      setStatus('solved')
    } else if (chess.isGameOver()) {
      fail('draw')
    } else if (puzzle.maxMoves && movesPlayed >= puzzle.maxMoves) {
      fail('out-of-moves')
    } else {
      void opponentReply()
    }
    return 'correct'
  }

  let hintSquare: Square | null = null
  if (hintVisible && (status === 'playing' || status === 'wrong')) {
    if (puzzle.type === 'line') hintSquare = parseUci(puzzle.solution[step.current]).from
    if (puzzle.type === 'move-piece') {
      const m = chess
        .moves({ verbose: true })
        .find((m) => (!puzzle.piece || m.piece === puzzle.piece) && (!puzzle.to || m.to === puzzle.to))
      hintSquare = (m?.from as Square | undefined) ?? null
    }
  }

  return {
    fen,
    status,
    failReason,
    playerColor,
    lastMove,
    mistakes,
    movesLeft: puzzle.maxMoves ? puzzle.maxMoves - playerMoves : null,
    checkSquare: findCheckedKing(chess),
    canHint: puzzle.type !== 'mate-vs-engine',
    hintSquare,
    showHint: () => setHintVisible(true),
    legalTargets,
    tryMove,
  }
}

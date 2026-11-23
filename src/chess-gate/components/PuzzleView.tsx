/** One puzzle attempt: board, goal, status line and buttons. */
import { useEffect, useState } from 'react'
import type { ChessGateConfig, Level, Puzzle, Square } from '../types'
import { usePuzzle } from '../hooks/usePuzzle'
import type { PuzzleStatus } from '../hooks/usePuzzle'
import Board from './Board'

interface PuzzleViewProps {
  puzzle: Puzzle
  level?: Level
  config: ChessGateConfig
  onSolved: () => void
  onSkip: () => void
  onRetry: () => void
  onChangeLevel?: () => void
}

const STATUS_COLOR: Record<PuzzleStatus, string> = {
  playing: '#9ca3af',
  opponent: '#f59e0b',
  wrong: '#ef4444',
  solved: '#22c55e',
  failed: '#ef4444',
}

const unlockedAfter = (threshold: number | null, mistakes: number) => threshold !== null && mistakes >= threshold

export default function PuzzleView({ puzzle, level, config, onSolved, onSkip, onRetry, onChangeLevel }: PuzzleViewProps) {
  const game = usePuzzle(puzzle, config)
  const [shakeKey, setShakeKey] = useState(0)
  const { text, behaviour } = config

  useEffect(() => {
    if (game.status === 'solved') onSolved()
  }, [game.status, onSolved])

  const handleMove = (from: Square, to: Square, viaDrag: boolean) => {
    const result = game.tryMove(from, to, viaDrag)
    if (result === 'wrong') setShakeKey((k) => k + 1)
    return result === 'correct'
  }

  const statusText: Record<PuzzleStatus, string> = {
    playing: text.yourMove,
    opponent: text.opponentThinking,
    wrong: text.wrongMove,
    solved: text.solved,
    failed: game.failReason === 'draw' ? text.draw : text.outOfMoves,
  }

  const over = game.status === 'solved' || game.status === 'failed'
  const side = game.playerColor === 'w' ? 'White' : 'Black'
  const showHint = !over && game.canHint && !game.hintSquare && unlockedAfter(behaviour.hintAfterMistakes, game.mistakes)
  const showSkip = game.status !== 'solved' && unlockedAfter(behaviour.skipAfterMistakes, game.mistakes)

  return (
    <div className="cg-enter flex w-full max-w-[480px] flex-col items-center gap-4">
      <Board
        fen={game.fen}
        orientation={game.playerColor}
        theme={config.board}
        pieceSet={config.pieceSet}
        movableColor={over ? null : game.playerColor}
        legalTargets={game.legalTargets}
        onMove={handleMove}
        lastMove={game.lastMove}
        checkSquare={game.checkSquare}
        hintSquare={game.hintSquare}
        shakeKey={shakeKey}
      />

      <section className="flex w-full flex-col gap-2 text-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="font-semibold">{puzzle.title}</h2>
          <span className="flex items-center gap-2 opacity-80">
            <span
              className="inline-block h-3 w-3 rounded-sm border border-current"
              style={{ background: game.playerColor === 'w' ? '#fff' : '#000' }}
              aria-hidden
            />
            {side} to move · {puzzle.goal}
          </span>
        </div>

        <div className="flex min-h-8 flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2" role="status" aria-live="polite">
            <span className="cg-status-dot" style={{ background: STATUS_COLOR[game.status] }} aria-hidden />
            {statusText[game.status]}
            {game.movesLeft !== null && !over && (
              <span className="opacity-60">
                · {text.movesLeft}: {game.movesLeft}
              </span>
            )}
          </p>
          <div className="flex gap-2">
            {game.status === 'failed' && (
              <button type="button" className="cg-button cg-button-primary" onClick={onRetry}>
                {text.tryAgain}
              </button>
            )}
            {showHint && (
              <button type="button" className="cg-button" onClick={game.showHint}>
                {text.hint}
              </button>
            )}
            {showSkip && (
              <button type="button" className="cg-button" onClick={onSkip}>
                {text.skip}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-2 text-xs opacity-50">
          <span>{puzzle.source}</span>
          {level && onChangeLevel && game.status !== 'solved' && (
            <span>
              {level.label} ·{' '}
              <button type="button" className="underline hover:opacity-80" onClick={onChangeLevel}>
                {text.changeLevel}
              </button>
            </span>
          )}
        </div>
      </section>
    </div>
  )
}

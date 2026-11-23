/** The loading screen: level slider first (optional), then the puzzle. */
import { useState } from 'react'
import type { ChessGateConfig, Puzzle } from '../types'
import { savedLevel, saveLevel } from '../lib/storage'
import { selectPuzzle } from '../lib/selectPuzzle'
import LevelPicker from './LevelPicker'
import PuzzleView from './PuzzleView'

interface GateScreenProps {
  puzzles: Puzzle[]
  config: ChessGateConfig
  onSolved: () => void
  onSkip: () => void
}

export default function GateScreen({ puzzles, config, onSolved, onSkip }: GateScreenProps) {
  const { levels } = config
  const [levelId, setLevelId] = useState(() => {
    const saved = savedLevel()
    return saved && levels.list.some((l) => l.id === saved) ? saved : levels.default
  })
  const [puzzle, setPuzzle] = useState<Puzzle | null>(() =>
    levels.ask ? null : selectPuzzle(puzzles, levels.list, levelId, config.puzzle),
  )
  const [attempt, setAttempt] = useState(0)

  const pickLevel = (id: string) => {
    saveLevel(id)
    setLevelId(id)
    setPuzzle((current) => selectPuzzle(puzzles, levels.list, id, config.puzzle, current?.id))
    setAttempt(0)
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <header className="cg-enter flex flex-col items-center gap-3 text-center">
        {/* data-cg-source: these two fly to the navbar when the puzzle is solved (lib/reveal.ts). */}
        <div className="flex items-center gap-4">
          <img
            data-cg-source="avatar"
            src={`${import.meta.env.BASE_URL}${config.identity.avatar}`}
            alt=""
            className="cg-avatar"
          />
          <span data-cg-source="name" className="cg-name">
            {config.identity.name}
          </span>
        </div>
        <h1 className="cg-fade text-base opacity-80 md:text-lg">{config.text.title}</h1>
      </header>

      <div className="cg-fade flex w-full justify-center">
        {puzzle ? (
          <PuzzleView
            key={`${puzzle.id}#${attempt}`}
            puzzle={puzzle}
            level={levels.list.find((l) => l.id === levelId)}
            config={config}
            onSolved={onSolved}
            onSkip={onSkip}
            onRetry={() => setAttempt((n) => n + 1)}
            onChangeLevel={levels.ask ? () => setPuzzle(null) : undefined}
          />
        ) : (
          <LevelPicker
            levels={levels.list}
            initial={levelId}
            question={config.text.levelQuestion}
            playLabel={config.text.play}
            onPick={pickLevel}
          />
        )}
      </div>
    </div>
  )
}

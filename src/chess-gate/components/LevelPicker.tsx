/** Slider asking the visitor's chess level. */
import { useState } from 'react'
import type { Level } from '../types'

interface LevelPickerProps {
  levels: Level[]
  initial: string
  question: string
  playLabel: string
  onPick: (levelId: string) => void
}

export default function LevelPicker({ levels, initial, question, playLabel, onPick }: LevelPickerProps) {
  const [index, setIndex] = useState(() => Math.max(0, levels.findIndex((l) => l.id === initial)))
  const level = levels[index]

  return (
    <div className="cg-enter flex w-full max-w-[420px] flex-col items-center gap-6 text-center">
      <h2 className="text-lg font-semibold">{question}</h2>

      <div className="w-full">
        <input
          type="range"
          className="cg-slider w-full"
          min={0}
          max={levels.length - 1}
          step={1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          aria-label={question}
          aria-valuetext={level.label}
        />
        <div className="mt-2 flex justify-between text-xs">
          {levels.map((l, i) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`px-1 transition-opacity ${i === index ? 'font-semibold opacity-100' : 'opacity-50 hover:opacity-80'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div key={level.id} className="cg-enter min-h-20">
        <p className="text-2xl font-bold">{level.label}</p>
        {level.rating && <p className="mt-1 text-xs uppercase tracking-wider opacity-60">{level.rating}</p>}
        <p className="mt-2 opacity-80">{level.description}</p>
      </div>

      <button type="button" className="cg-button cg-button-primary" onClick={() => onPick(level.id)}>
        {playLabel} →
      </button>
    </div>
  )
}

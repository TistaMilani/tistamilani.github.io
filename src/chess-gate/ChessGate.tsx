/**
 * Wraps the site and shows the puzzle screen on top of it until it is solved.
 *
 * The site is always rendered underneath (inert and hidden from assistive tech
 * while locked), so search engines still index its content.
 *
 * Phases: locked → revealing (avatar + name fly to the navbar, the rest fades) → open.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import './chess-gate.css'
import { chessGateConfig as config } from './config'
import { puzzles as puzzleDefs } from './puzzles'
import { normalizeAll } from './lib/normalize'
import { markSolved, wasSolved } from './lib/storage'
import { flyToTargets, prefersReducedMotion } from './lib/reveal'
import GateScreen from './components/GateScreen'

type Phase = 'locked' | 'revealing' | 'open'

export default function ChessGate({ children }: { children: ReactNode }) {
  const [puzzles] = useState(() => (config.enabled ? normalizeAll(puzzleDefs) : []))
  const [phase, setPhase] = useState<Phase>(() =>
    !config.enabled || puzzles.length === 0 || wasSolved(config.remember) ? 'open' : 'locked',
  )
  const overlayRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const locked = phase === 'locked'
  const open = phase === 'open'

  // No scrolling the page behind the gate. Released as soon as the reveal starts,
  // so the site has its final layout when the avatar and name are measured.
  useLayoutEffect(() => {
    if (!locked) return
    const html = document.documentElement
    const previous = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = previous
    }
  }, [locked])

  // Reserve the scrollbar space while the gate is up, so nothing shifts when it goes.
  useLayoutEffect(() => {
    if (open) return
    const html = document.documentElement
    const previous = html.style.scrollbarGutter
    html.style.scrollbarGutter = 'stable'
    return () => {
      html.style.scrollbarGutter = previous
    }
  }, [open])

  // The flight itself.
  useLayoutEffect(() => {
    if (phase !== 'revealing' || !overlayRef.current) return
    const { durationMs, avatarTarget, nameTarget } = config.reveal
    const restore = flyToTargets(
      overlayRef.current,
      [
        { key: 'avatar', selector: avatarTarget },
        { key: 'name', selector: nameTarget, text: true },
      ],
      durationMs,
    )
    const timer = window.setTimeout(() => setPhase('open'), prefersReducedMotion() ? 0 : durationMs + 50)
    return () => {
      window.clearTimeout(timer)
      restore()
    }
  }, [phase])

  const unlock = useCallback((delay: number) => {
    markSolved(config.remember)
    timers.current.push(window.setTimeout(() => setPhase('revealing'), delay))
  }, [])

  const handleSolved = useCallback(() => unlock(config.behaviour.revealDelayMs), [unlock])
  const handleSkip = useCallback(() => unlock(0), [unlock])

  return (
    <>
      <div inert={!open} aria-hidden={!open || undefined}>
        {children}
      </div>
      {!open && (
        <div ref={overlayRef} className={`cg-overlay ${phase === 'revealing' ? 'cg-revealing' : ''}`}>
          <div className="cg-backdrop cg-fade" />
          <div className="cg-content">
            <GateScreen puzzles={puzzles} config={config} onSolved={handleSolved} onSkip={handleSkip} />
          </div>
        </div>
      )}
    </>
  )
}

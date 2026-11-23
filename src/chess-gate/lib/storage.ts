import type { RememberMode } from '../types'

const SOLVED_KEY = 'chess-gate:solved'
const LEVEL_KEY = 'chess-gate:level'

/** Storage access that never throws (blocked in private mode, disabled cookies…). */
function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch {
    return fallback
  }
}

function solvedStore(mode: RememberMode): Storage | null {
  if (mode === 'never') return null
  return safe(() => (mode === 'session' ? window.sessionStorage : window.localStorage), null)
}

export function wasSolved(mode: RememberMode): boolean {
  return safe(() => solvedStore(mode)?.getItem(SOLVED_KEY) === '1', false)
}

export function markSolved(mode: RememberMode): void {
  safe(() => solvedStore(mode)?.setItem(SOLVED_KEY, '1'), undefined)
}

export function savedLevel(): string | null {
  return safe(() => window.localStorage.getItem(LEVEL_KEY), null)
}

export function saveLevel(level: string): void {
  safe(() => window.localStorage.setItem(LEVEL_KEY, level), undefined)
}

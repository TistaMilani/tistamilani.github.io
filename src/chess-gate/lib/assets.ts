/**
 * Resolves piece-set and square images. Any folder dropped into
 * `assets/pieces/` becomes a piece set automatically (files named wK, bQ, wP, …),
 * and any image in `assets/squares/` can be referenced by file name.
 */
import type { CSSProperties } from 'react'
import type { Color, Fill, PieceType } from '../types'

const pieceFiles = import.meta.glob<string>('../assets/pieces/*/*.{svg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const squareFiles = import.meta.glob<string>('../assets/squares/*.{png,jpg,jpeg,webp,avif,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
})

/** set name → piece code (e.g. "wK") → url */
const pieceSets: Record<string, Record<string, string>> = {}
for (const [path, url] of Object.entries(pieceFiles)) {
  const [, set, file] = path.match(/pieces\/([^/]+)\/([^/]+)\.\w+$/) ?? []
  if (!set || !file) continue
  ;(pieceSets[set] ??= {})[file] = url
}

const squareImages: Record<string, string> = {}
for (const [path, url] of Object.entries(squareFiles)) {
  squareImages[path.split('/').pop()!] = url
}

export const availablePieceSets = Object.keys(pieceSets)

const warned = new Set<string>()
function warnOnce(message: string) {
  if (warned.has(message)) return
  warned.add(message)
  console.warn(`[chess-gate] ${message}`)
}

/** Url of a piece image, or undefined if the set/file is missing (a glyph is shown instead). */
export function pieceImage(set: string, color: Color, type: PieceType): string | undefined {
  const code = `${color}${type.toUpperCase()}`
  const url = pieceSets[set]?.[code]
  if (!url) warnOnce(`Piece "${code}" not found in set "${set}". Available sets: ${availablePieceSets.join(', ')}`)
  return url
}

const GLYPHS: Record<PieceType, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
export const pieceGlyph = (type: PieceType) => GLYPHS[type]

/** Turns a file name, `/public-path` or URL into a usable image url. */
export function resolveImage(name: string): string | undefined {
  if (/^(https?:|data:|\/)/.test(name)) return name
  const url = squareImages[name]
  if (!url) warnOnce(`Image "${name}" not found in assets/squares/.`)
  return url
}

export function fillStyle(fill: Fill): CSSProperties {
  if ('color' in fill) return { backgroundColor: fill.color }
  const url = resolveImage(fill.image)
  return url ? { backgroundImage: `url("${url}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}
}

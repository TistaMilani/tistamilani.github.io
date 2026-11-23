/**
 * Presentational, reusable chessboard. Knows nothing about puzzles:
 * it renders a FEN and reports the moves the user tries to make.
 * Supports click-to-move, drag-and-drop (mouse + touch) and keyboard (Tab + Enter).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import type { BoardTheme, Color, Piece, Square } from '../types'
import { fillStyle, pieceGlyph, pieceImage, resolveImage } from '../lib/assets'
import { isLightSquare, parsePlacement, screenPosition, squaresInOrder } from '../lib/fen'
import type { LastMove } from '../hooks/usePuzzle'

export interface BoardProps {
  fen: string
  orientation: Color
  theme: BoardTheme
  pieceSet: string
  /** Color the user may move, or null for a read-only board. */
  movableColor: Color | null
  legalTargets: (from: Square) => Square[]
  /** Return true if the move was accepted. */
  onMove: (from: Square, to: Square, viaDrag: boolean) => boolean
  lastMove?: LastMove | null
  checkSquare?: Square | null
  hintSquare?: Square | null
  /** Change this number to make the board shake (e.g. after a wrong move). */
  shakeKey?: number
}

interface DragState {
  from: Square
  startX: number
  startY: number
  x: number
  y: number
  moved: boolean
  wasSelected: boolean
  /** Board position on screen, captured when the drag starts. */
  rect: DOMRect
}

const PIECE_NAMES = { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' } as const

function PieceView({ piece, set }: { piece: Piece; set: string }) {
  const src = pieceImage(set, piece.color, piece.type)
  if (src) return <img src={src} alt="" draggable={false} className="cg-piece-img" />
  return (
    <span className={`cg-piece-glyph ${piece.color === 'w' ? 'cg-glyph-white' : 'cg-glyph-black'}`}>
      {pieceGlyph(piece.type)}
    </span>
  )
}

export default function Board({
  fen,
  orientation,
  theme,
  pieceSet,
  movableColor,
  legalTargets,
  onMove,
  lastMove,
  checkSquare,
  hintSquare,
  shakeKey = 0,
}: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const pieces = useMemo(() => parsePlacement(fen), [fen])
  const squares = useMemo(() => squaresInOrder(orientation), [orientation])

  const [selected, setSelected] = useState<Square | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    if (shakeKey > 0) setShaking(true)
  }, [shakeKey])

  // A new position invalidates the current selection.
  useEffect(() => setSelected(null), [fen])

  const interactive = movableColor !== null
  const activeFrom = drag?.from ?? selected
  const targets = useMemo(() => (activeFrom ? legalTargets(activeFrom) : []), [activeFrom, legalTargets])

  const ownsPiece = (sq: Square) => interactive && pieces[sq]?.color === movableColor

  const commit = (from: Square, to: Square, viaDrag: boolean) => {
    onMove(from, to, viaDrag)
    setSelected(null)
  }

  const squareAt = (clientX: number, clientY: number): Square | null => {
    const rect = boardRef.current?.getBoundingClientRect()
    if (!rect) return null
    const col = Math.floor(((clientX - rect.left) / rect.width) * 8)
    const row = Math.floor(((clientY - rect.top) / rect.height) * 8)
    if (col < 0 || col > 7 || row < 0 || row > 7) return null
    return squares[row * 8 + col]
  }

  /* ── pointer (mouse / touch / pen) ─────────────────────────── */

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || e.button !== 0) return
    const sq = squareAt(e.clientX, e.clientY)
    if (!sq) return

    if (selected && selected !== sq && targets.includes(sq)) {
      commit(selected, sq, false)
      return
    }
    if (ownsPiece(sq) && boardRef.current) {
      e.preventDefault()
      boardRef.current.setPointerCapture(e.pointerId)
      setDrag({
        from: sq,
        startX: e.clientX,
        startY: e.clientY,
        x: e.clientX,
        y: e.clientY,
        moved: false,
        wasSelected: selected === sq,
        rect: boardRef.current.getBoundingClientRect(),
      })
      setSelected(sq)
    } else {
      setSelected(null)
    }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return
    const moved = drag.moved || Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 4
    setDrag({ ...drag, x: e.clientX, y: e.clientY, moved })
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return
    const sq = squareAt(e.clientX, e.clientY)
    if (drag.moved) {
      if (sq && sq !== drag.from && targets.includes(sq)) commit(drag.from, sq, true)
    } else if (drag.wasSelected) {
      setSelected(null) // clicking a selected piece again deselects it
    }
    setDrag(null)
  }

  /* ── keyboard ──────────────────────────────────────────────── */

  const onSquareKey = (e: KeyboardEvent, sq: Square) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    if (selected && targets.includes(sq)) commit(selected, sq, false)
    else if (ownsPiece(sq)) setSelected(selected === sq ? null : sq)
    else setSelected(null)
  }

  /* ── rendering ─────────────────────────────────────────────── */

  const { light, dark, image, highlights } = theme
  const boardImage = image ? resolveImage(image) : undefined
  const coordStyle = (sq: Square): CSSProperties | undefined => {
    // Use the opposite square's color for contrast; on images keep the default (white + shadow).
    const other = isLightSquare(sq) ? dark : light
    return !boardImage && 'color' in other ? { color: other.color, textShadow: 'none' } : undefined
  }

  const dragPiece = drag?.moved ? pieces[drag.from] : undefined

  return (
    <div
      ref={boardRef}
      className={`cg-board ${shaking ? 'cg-shake' : ''} ${interactive ? 'cg-interactive' : ''}`}
      style={boardImage ? { backgroundImage: `url("${boardImage}")`, backgroundSize: 'cover' } : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDrag(null)}
      onAnimationEnd={(e) => e.animationName === 'cg-shake' && setShaking(false)}
      role="grid"
      aria-label="Chessboard"
    >
      {squares.map((sq, index) => {
        const piece = pieces[sq]
        const row = Math.floor(index / 8)
        const col = index % 8
        const isTarget = targets.includes(sq)
        const isLastMove = lastMove && (lastMove.from === sq || lastMove.to === sq)
        const hiddenByDrag = drag?.moved && drag.from === sq

        let slide: CSSProperties | undefined
        if (lastMove?.animate && lastMove.to === sq) {
          const from = screenPosition(lastMove.from, orientation)
          slide = { '--cg-dx': `${(from.col - col) * 100}%`, '--cg-dy': `${(from.row - row) * 100}%` } as CSSProperties
        }

        return (
          <div
            key={sq}
            className="cg-square"
            style={boardImage ? undefined : fillStyle(isLightSquare(sq) ? light : dark)}
            tabIndex={interactive ? 0 : undefined}
            onKeyDown={interactive ? (e) => onSquareKey(e, sq) : undefined}
            aria-label={piece ? `${sq}, ${piece.color === 'w' ? 'white' : 'black'} ${PIECE_NAMES[piece.type]}` : sq}
            aria-selected={selected === sq}
            role="gridcell"
          >
            {isLastMove && <div className="cg-layer" style={{ background: highlights.lastMove }} />}
            {selected === sq && <div className="cg-layer" style={{ background: highlights.selected }} />}
            {checkSquare === sq && (
              <div className="cg-layer" style={{ background: `radial-gradient(circle, ${highlights.check} 0%, transparent 70%)` }} />
            )}
            {hintSquare === sq && <div className="cg-layer cg-hint" style={{ boxShadow: `inset 0 0 0 4px ${highlights.hint}` }} />}

            {piece && (
              <div
                key={slide ? `slide-${lastMove!.id}` : 'static'}
                className={`cg-piece ${slide ? 'cg-slide' : ''}`}
                style={{ ...slide, opacity: hiddenByDrag ? 0.3 : 1 }}
              >
                <PieceView piece={piece} set={pieceSet} />
              </div>
            )}

            {isTarget && (
              <div
                className={piece ? 'cg-capture' : 'cg-dot'}
                style={piece ? { boxShadow: `inset 0 0 0 5px ${highlights.legalMove}` } : { background: highlights.legalMove }}
              />
            )}

            {theme.coordinates && col === 0 && (
              <span className="cg-coord cg-coord-rank" style={coordStyle(sq)}>{sq[1]}</span>
            )}
            {theme.coordinates && row === 7 && (
              <span className="cg-coord cg-coord-file" style={coordStyle(sq)}>{sq[0]}</span>
            )}
          </div>
        )
      })}

      {dragPiece && drag && (
        <div
          className="cg-piece cg-ghost"
          style={{
            left: `${((drag.x - drag.rect.left) / drag.rect.width) * 100 - 6.25}%`,
            top: `${((drag.y - drag.rect.top) / drag.rect.height) * 100 - 6.25}%`,
          }}
        >
          <PieceView piece={dragPiece} set={pieceSet} />
        </div>
      )}
    </div>
  )
}

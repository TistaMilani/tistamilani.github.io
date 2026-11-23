/**
 * Minimal UCI client for Stockfish running in a Web Worker.
 * The engine is created lazily (first call) and shared; if it cannot load,
 * a simple built-in heuristic picks the moves instead.
 */
import { Chess } from 'chess.js'
import type { Move } from 'chess.js'

type Listener = (line: string) => void

class StockfishClient {
  private worker: Worker
  private listeners = new Set<Listener>()
  private error: Error | null = null
  private ready: Promise<void>
  private queue: Promise<unknown> = Promise.resolve()

  constructor(url: string) {
    this.worker = new Worker(url)
    this.worker.onmessage = (e) => this.listeners.forEach((l) => l(String(e.data)))
    this.worker.onerror = (e) => {
      this.error = new Error(e.message || 'Stockfish failed to load')
      this.listeners.forEach((l) => l(''))
    }
    // Both commands are queued by the engine until its WebAssembly has loaded.
    this.ready = this.waitFor('readyok', 30_000).then(() => undefined)
    this.send('uci')
    this.send('isready')
    this.ready.catch(() => {}) // reported through bestMove()
  }

  private send(cmd: string) {
    this.worker.postMessage(cmd)
  }

  private waitFor(prefix: string, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.error) return reject(this.error)
      const done = () => {
        clearTimeout(timer)
        this.listeners.delete(listener)
      }
      const listener: Listener = (line) => {
        if (this.error) {
          done()
          reject(this.error)
        } else if (line.startsWith(prefix)) {
          done()
          resolve(line)
        }
      }
      const timer = setTimeout(() => {
        done()
        reject(new Error(`Stockfish: no "${prefix}" after ${timeoutMs} ms`))
      }, timeoutMs)
      this.listeners.add(listener)
    })
  }

  /** Best move in UCI for the side to move. Requests are queued. */
  bestMove(fen: string, movetimeMs: number): Promise<string> {
    const run = async () => {
      await this.ready
      const answer = this.waitFor('bestmove', movetimeMs + 10_000)
      this.send(`position fen ${fen}`)
      this.send(`go movetime ${movetimeMs}`)
      const move = (await answer).split(/\s+/)[1]
      if (!move || move === '(none)') throw new Error('Stockfish returned no move')
      return move
    }
    const result = this.queue.then(run, run)
    this.queue = result.catch(() => {})
    return result
  }
}

let client: StockfishClient | null = null
let clientFailed = false

function getClient(path: string): StockfishClient | null {
  if (clientFailed || typeof Worker === 'undefined') return null
  try {
    client ??= new StockfishClient(`${import.meta.env.BASE_URL}${path}`)
  } catch {
    clientFailed = true
  }
  return client
}

/** Starts downloading the engine early, so the first reply is quick. */
export function warmUpEngine(path: string): void {
  getClient(path)
}

const VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

/** Fallback defender: grab material, otherwise keep the king central and mobile. */
export function heuristicMove(fen: string): string {
  const chess = new Chess(fen)
  const score = (m: Move) => {
    let s = m.captured ? VALUES[m.captured] * 100 : 0
    chess.move(m)
    if (chess.isCheckmate()) s += 10_000
    if (m.piece === 'k') {
      const file = m.to.charCodeAt(0) - 97
      const rank = Number(m.to[1]) - 1
      s -= Math.max(Math.abs(3.5 - file), Math.abs(3.5 - rank)) * 10
    }
    chess.undo()
    return s + Math.random()
  }
  const moves = chess.moves({ verbose: true })
  return moves.reduce((best, m) => (score(m) > score(best) ? m : best), moves[0]).lan
}

/** Engine move (UCI); falls back to the heuristic if Stockfish is unavailable. */
export async function engineMove(fen: string, path: string, movetimeMs: number): Promise<string> {
  const engine = getClient(path)
  if (engine) {
    try {
      return await engine.bestMove(fen, movetimeMs)
    } catch (err) {
      console.warn('[chess-gate] Stockfish unavailable, using fallback moves.', err)
      clientFailed = true
    }
  }
  return heuristicMove(fen)
}

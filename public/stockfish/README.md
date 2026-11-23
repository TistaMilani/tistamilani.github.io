# Stockfish (WebAssembly)

Used by the chess gate (`src/chess-gate/`) for the "checkmate vs engine" challenges.
Loaded only when such a challenge starts.

- Engine: [Stockfish](https://stockfishchess.org/) 19, "lite single-threaded" build by
  [stockfish.js](https://github.com/nmrugg/stockfish.js) (npm `stockfish@19.0.1`).
- License: GPLv3 — see `COPYING.txt`. Source: https://github.com/nmrugg/stockfish.js
- Kept in `public/` because the `.js` worker loads the `.wasm` file sitting next to it,
  so neither may be renamed or bundled.

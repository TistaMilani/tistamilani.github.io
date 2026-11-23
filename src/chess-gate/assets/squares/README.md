# Square textures

Drop images here (`.png`, `.jpg`, `.webp`, `.avif`, `.svg`) and reference them by file name in `config.ts`:

```ts
board: {
  light: { image: 'marble-light.png' },   // one image per light square
  dark:  { image: 'marble-dark.png' },    // one image per dark square
  // image: 'wood-board.jpg',             // or one image for the whole board
}
```

Square images are stretched to cover each square, so square-shaped images (e.g. 128×128) work best.
A whole-board image should be square as well.

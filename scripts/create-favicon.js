#!/usr/bin/env node
/**
 * Generates the site icons from a square source image (default: public/propic.jpg).
 *
 *   node scripts/create-favicon.js [source-image]
 *
 * Outputs in public/:
 *   favicon.ico            real ICO containing 16, 32 and 48 px images
 *   favicon-48x48.png      Google Search needs a multiple of 48 px
 *   favicon-96x96.png
 *   favicon-192x192.png
 *   apple-touch-icon.png   180 px
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = path.join(__dirname, '..', 'public')
const SOURCE = process.argv[2] ?? path.join(OUTPUT_DIR, 'propic.jpg')

const ICO_SIZES = [16, 32, 48]
const PNG_SIZES = [48, 96, 192]

const square = (size) => sharp(SOURCE).resize(size, size, { fit: 'cover' }).png().toBuffer()

/** Builds an .ico file that embeds PNG images (supported by all current browsers). */
function buildIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(images.length, 4)

  let offset = 6 + 16 * images.length
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0) // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1) // height
    entry.writeUInt8(0, 2) // palette
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // color planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += data.length
    return entry
  })
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)])
}

async function main() {
  console.log(`🔄 Creating icons from ${path.relative(process.cwd(), SOURCE)}`)

  const icoImages = await Promise.all(ICO_SIZES.map(async (size) => ({ size, data: await square(size) })))
  fs.writeFileSync(path.join(OUTPUT_DIR, 'favicon.ico'), buildIco(icoImages))
  console.log(`✅ favicon.ico (${ICO_SIZES.join(', ')} px)`)

  for (const size of PNG_SIZES) {
    fs.writeFileSync(path.join(OUTPUT_DIR, `favicon-${size}x${size}.png`), await square(size))
    console.log(`✅ favicon-${size}x${size}.png`)
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'apple-touch-icon.png'), await square(180))
  console.log('✅ apple-touch-icon.png')
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})

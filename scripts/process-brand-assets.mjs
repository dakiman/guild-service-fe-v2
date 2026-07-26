#!/usr/bin/env node
// Regenerates the committed brand assets in public/ from the source art in
// ~/dev/guild-branding/round2-peon (kept outside the repo). Idempotent —
// safe to re-run; overwrites outputs. Usage: node scripts/process-brand-assets.mjs [srcDir]
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC = resolve(process.argv[2] ?? '../../guild-branding/round2-peon', '.')
const PUB = resolve('public')
mkdirSync(resolve(PUB, 'brand'), { recursive: true })

const square = (name, out) =>
  sharp(resolve(SRC, name)).resize(512, 512).jpeg({ quality: 80, mozjpeg: true })
    .toFile(resolve(PUB, 'brand', out))

const jobs = [
  square('state-loading.jpg', 'state-loading.jpg'),
  square('state-syncing.jpg', 'state-syncing.jpg'),
  square('state-empty.jpg', 'state-empty.jpg'),
  square('state-success.jpg', 'state-success.jpg'),
  square('state-error.jpg', 'state-error.jpg'),
  square('icon-characters.jpg', 'icon-characters.jpg'),
  square('icon-guilds.jpg', 'icon-guilds.jpg'),
  square('icon-mythicplus.jpg', 'icon-mythicplus.jpg'),
  square('icon-raids.jpg', 'icon-raids.jpg'),
  square('face-rune-ring.jpg', 'icon-profile.jpg'),
  sharp(resolve(SRC, 'hero-banner.jpg')).resize({ width: 1600 })
    .jpeg({ quality: 82, mozjpeg: true }).toFile(resolve(PUB, 'brand', 'hero-banner.jpg')),
  sharp(resolve(SRC, 'hero-banner.jpg')).resize(1200, 630, { fit: 'cover' })
    .jpeg({ quality: 78, mozjpeg: true }).toFile(resolve(PUB, 'og-image.jpg')),
  // apple-touch-icon: mark rasterized onto a #1a1410 plate (iOS masks its own corners)
  sharp('public/favicon.svg', { density: 288 }).resize(132, 132).png().toBuffer()
    .then((mark) =>
      sharp({ create: { width: 180, height: 180, channels: 4, background: '#1a1410' } })
        .composite([{ input: mark, gravity: 'centre' }])
        .png().toFile(resolve(PUB, 'apple-touch-icon.png'))),
]

await Promise.all(jobs)
console.log('brand assets written to public/')

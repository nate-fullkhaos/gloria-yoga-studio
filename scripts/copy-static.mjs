import { cp, mkdir, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC_DIR = path.join(ROOT, 'public')

const ROOT_FILES = [
  'about.html',
  'programs.html',
  'studio.html',
  'contact.html',
  'schedule.html',
  'style.css',
  'schedule.json',
  'breath-practice.js',
  'carousel.js',
  'community.js',
  'footer-socials.js',
  'google-reviews.js',
  'hero-carousel.js',
  'live-pulse.js',
  'motion.js',
  'programs-inquiry-modal.js',
  'programs-schedule.js',
  'sheet-config.js',
  'sheet-submit.js',
  'social-feed.js',
  'studio.js',
  'whatsapp-chat.js',
]

async function copyIfExists(from, to) {
  if (!existsSync(from)) return
  await cp(from, to, { recursive: true, force: true })
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true })
  await copyIfExists(path.join(ROOT, 'index.html'), path.join(PUBLIC_DIR, 'home.html'))

  for (const file of ROOT_FILES) {
    await copyIfExists(path.join(ROOT, file), path.join(PUBLIC_DIR, file))
  }

  await copyIfExists(path.join(ROOT, 'Images'), path.join(PUBLIC_DIR, 'Images'))
  await copyIfExists(path.join(ROOT, 'src'), path.join(PUBLIC_DIR, 'src'))

  const extras = await readdir(ROOT)
  for (const name of extras) {
    if (!name.endsWith('.png') && !name.endsWith('.ico') && !name.endsWith('.svg')) continue
    await copyIfExists(path.join(ROOT, name), path.join(PUBLIC_DIR, name))
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

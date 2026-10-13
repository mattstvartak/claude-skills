import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const exec = { run: execFileSync }

// Exact versions: identical pixels across machines depend on the same Playwright.
export const PINNED = { playwright: '1.63.0' }

const craftDir = () => join(homedir(), '.cache', 'craft-tools')
// a pinned package at any other version counts as missing
const has = (dir, pkg) => {
  try {
    const { version } = JSON.parse(readFileSync(join(dir, 'node_modules', pkg, 'package.json'), 'utf8'))
    return !PINNED[pkg] || version === PINNED[pkg]
  } catch {
    return false
  }
}

// REEL_TOOLS_DIR wins. Otherwise reel's own cache, unless only craft's has Playwright already.
export function toolsDir() {
  if (process.env.REEL_TOOLS_DIR) return process.env.REEL_TOOLS_DIR
  const own = join(homedir(), '.cache', 'reel-tools')
  return !has(own, 'playwright') && has(craftDir(), 'playwright') ? craftDir() : own
}

const load = (dir, pkg) => createRequire(join(dir, 'package.json'))(pkg)

export function need(pkg) {
  const dir = toolsDir()
  if (!has(dir, pkg)) {
    console.error(`reel: installing ${pkg} into ${dir} (one time)`)
    mkdirSync(dir, { recursive: true })
    const manifest = join(dir, 'package.json')
    if (!existsSync(manifest)) writeFileSync(manifest, '{"private":true}\n')
    exec.run('npm', ['install', '--silent', '--prefix', dir, PINNED[pkg] ? `${pkg}@${PINNED[pkg]}` : pkg], {
      stdio: 'inherit',
    })
  }
  return load(dir, pkg)
}

export function playwright() {
  const pw = need('playwright')
  if (!existsSync(pw.chromium.executablePath())) {
    exec.run(join(toolsDir(), 'node_modules', '.bin', 'playwright'), ['install', 'chromium'], { stdio: 'inherit' })
  }
  return pw
}

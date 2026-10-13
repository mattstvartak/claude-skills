#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { isMain, parseCli } from './lib/cli.mjs'
import { fileURLToPath } from 'node:url'
import { toolsDir } from './lib/tools.mjs'
import { AV1_ENCODERS } from './lib/encode.mjs'
import { ensureConfig, loadConfig } from './lib/config.mjs'

const SCRIPT = fileURLToPath(import.meta.url)
const LICENCES = [/^OFL-1\.1$/i, /^Apache-2\.0$/i, /^MIT$/i, /^Ubuntu Font Licen[cs]e/i]
const ENCODERS = [['libx264'], ['libvpx-vp9'], AV1_ENCODERS]
const FILTERS = ['scale', 'fps', 'palettegen', 'paletteuse']

const run = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return null
  }
}
const check = (name, ok, detail, fix = '') => ({ name, ok, detail, fix })

function ffmpegHint() {
  return 'install ffmpeg with libx264, libvpx and an AV1 encoder: pacman -S ffmpeg, brew install ffmpeg, or apt install ffmpeg'
}

export function ffmpegChecks(runner = run) {
  const encoders = runner('ffmpeg', ['-hide_banner', '-encoders'])
  if (encoders === null) return [check('ffmpeg', false, 'not found on PATH', ffmpegHint())]
  const filters = runner('ffmpeg', ['-hide_banner', '-filters']) || ''
  const has = (text, name) => new RegExp(`\\s${name}\\s`).test(text)
  const results = [check('ffmpeg', true, (runner('ffmpeg', ['-version']) || '').split('\n')[0] || 'found')]
  for (const names of ENCODERS) {
    const found = names.find((n) => has(encoders, n))
    results.push(check(`ffmpeg encoder ${names.join(' or ')}`, Boolean(found), found || 'missing', ffmpegHint()))
  }
  for (const f of FILTERS)
    results.push(check(`ffmpeg filter ${f}`, has(filters, f), has(filters, f) ? 'present' : 'missing', ffmpegHint()))
  return results
}

export async function playwrightChecks(dir = toolsDir()) {
  const fixPw =
    'run any reel script that needs a browser (it installs Playwright into the tools cache), or: npm install --prefix ' +
    dir +
    ' playwright'
  let pw
  try {
    pw = createRequire(join(dir, 'package.json'))('playwright')
  } catch {
    return [check('playwright', false, `not found in ${dir}`, fixPw)]
  }
  const results = [check('playwright', true, dir)]
  const fixCr = `${join(dir, 'node_modules', '.bin', 'playwright')} install chromium`
  if (!existsSync(pw.chromium.executablePath())) return [...results, check('chromium', false, 'not installed', fixCr)]
  try {
    const browser = await pw.chromium.launch({ headless: true })
    await browser.close()
    return [...results, check('chromium', true, 'headless launch ok')]
  } catch (e) {
    return [...results, check('chromium', false, `launch failed: ${e.message.split('\n')[0]}`, fixCr)]
  }
}

function findKits(root, dir) {
  const kits = join(root, dir, 'kits')
  if (!existsSync(kits)) return []
  return readdirSync(kits, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(kits, e.name, 'kit.json')))
    .map((e) => join(kits, e.name, 'kit.json'))
}

export function fontChecks(siteDir) {
  let loaded
  try {
    loaded = loadConfig(siteDir)
  } catch {
    return []
  }
  const results = []
  for (const file of findKits(loaded.root, loaded.config.dir)) {
    const kitRel = relative(loaded.root, file)
    let kit
    try {
      kit = JSON.parse(readFileSync(file, 'utf8'))
    } catch {
      results.push(check(`fonts ${kitRel}`, false, 'kit.json is not valid JSON', 'fix the JSON'))
      continue
    }
    for (const font of kit.fonts || []) {
      const licence = String(font.licence ?? '').trim()
      const ok = font.webEmbeddable === true || LICENCES.some((re) => re.test(licence))
      results.push(
        check(
          `font ${font.file} (${kitRel})`,
          ok,
          licence || 'no licence recorded',
          'confirm the licence allows web embedding, then set "webEmbeddable": true on the font entry, or swap the font',
        ),
      )
    }
  }
  return results
}

const initFix = (siteDir) => `node ${SCRIPT}${siteDir ? ` ${siteDir}` : ''} --init --app <id> --source <path>`

export function configChecks(siteDir) {
  let loaded
  try {
    loaded = loadConfig(siteDir ?? process.cwd())
  } catch (e) {
    return [check('reel.json', false, e.message, 'fix the JSON')]
  }
  if (!existsSync(loaded.path)) return [check('reel.json', false, 'not set up', initFix(siteDir))]
  if (!loaded.missing.length) return [check('reel.json', true, loaded.path)]
  return loaded.missing.map((m) =>
    check(`reel.json ${m}`, false, 'missing or invalid', /^apps/.test(m) ? initFix(siteDir) : 'edit reel.json'),
  )
}

// A reel.json at or above siteDir wins. Otherwise a site folder named on the command line is the root.
export function initConfig(siteDir, { app, source } = {}, { atDir = false } = {}) {
  const found = loadConfig(siteDir).path
  atDir &&= !existsSync(found)
  const file = atDir ? join(resolve(siteDir), 'reel.json') : found
  const current = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}
  const answers = {}
  if (!('dir' in current)) answers.dir = 'reel/'
  if (!('publicDir' in current)) answers.publicDir = 'public/reel/'
  if (app && source && !current.apps?.[app]?.source)
    answers.apps = { [app]: { source: relative(dirname(file), resolve(source)) || '.' } }
  const apps = answers.apps && { ...current.apps, ...answers.apps }
  const merged = { ...current, ...answers, ...(apps && { apps }) }
  if (existsSync(file) && JSON.stringify(merged) === JSON.stringify(current)) return loadConfig(siteDir)
  return ensureConfig(siteDir, answers, { atDir })
}

export async function report(siteDir) {
  const major = Number(process.versions.node.split('.')[0])
  const checks = [
    check('node', major >= 20, `v${process.versions.node}`, 'install Node 20 or newer'),
    ...(await playwrightChecks()),
    ...ffmpegChecks(),
    ...configChecks(siteDir),
    ...fontChecks(siteDir ?? process.cwd()),
  ]
  return { ok: checks.every((c) => c.ok), checks }
}

if (isMain(import.meta.url)) {
  const { values, positionals } = parseCli('[siteDir] [--json] [--init [--app <id> --source <path>]]', {
    max: 1,
    options: {
      json: { type: 'boolean' },
      init: { type: 'boolean' },
      app: { type: 'string' },
      source: { type: 'string' },
    },
    check: (v) => v.init && Boolean(v.app) !== Boolean(v.source) && '--app and --source go together',
  })
  const site = positionals[0] && resolve(positionals[0])
  if (values.init) {
    const { path, missing } = initConfig(site ?? process.cwd(), values, { atDir: Boolean(site) })
    console.log(`wrote ${path}`)
    for (const m of missing) console.log(`still missing: ${m}`)
    process.exit(0)
  }
  const r = await report(site)
  if (values.json) console.log(JSON.stringify(r, null, 2))
  else {
    for (const c of r.checks) {
      console.log(`${c.ok ? 'ok  ' : 'FAIL'} ${c.name}: ${c.detail}`)
      if (!c.ok && c.fix) console.log(`     fix: ${c.fix}`)
    }
  }
  process.exit(r.ok ? 0 : 1)
}

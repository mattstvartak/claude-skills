import fs from 'node:fs'
import path from 'node:path'

const FILE = 'reel.json'
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/

function findRoot(dir) {
  let site = null
  for (let d = path.resolve(dir); ; d = path.dirname(d)) {
    if (fs.existsSync(path.join(d, FILE))) return d
    if (!site && (fs.existsSync(path.join(d, 'package.json')) || fs.existsSync(path.join(d, '.git')))) site = d
    if (path.dirname(d) === d) return site ?? path.resolve(dir)
  }
}

function insideRoot(root, rel) {
  if (typeof rel !== 'string' || !rel || path.isAbsolute(rel)) return false
  const r = path.relative(root, path.resolve(root, rel))
  return r !== '' && !r.startsWith('..') && !path.isAbsolute(r)
}

export function loadConfig(dir) {
  const root = findRoot(dir)
  const file = path.join(root, FILE)
  const missing = []
  let raw = {}
  if (fs.existsSync(file)) {
    try {
      raw = JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch (e) {
      throw new Error(`${file} is not valid JSON: ${e.message}`)
    }
  } else {
    missing.push(FILE)
  }

  const config = { ...raw, dir: raw.dir ?? 'reel/', publicDir: raw.publicDir ?? 'public/reel/', apps: {} }
  for (const key of ['dir', 'publicDir']) {
    if (!insideRoot(root, config[key])) missing.push(`${key} (must be relative and inside the site root)`)
  }

  const apps = raw.apps ?? {}
  if (Object.keys(apps).length === 0) missing.push('apps')
  for (const [id, app] of Object.entries(apps)) {
    if (!KEBAB.test(id)) missing.push(`apps.${id} (id must be kebab-case)`)
    const source = app?.source
    const entry = { ...app, referenceShots: app?.referenceShots ?? path.posix.join(config.dir, 'references', id, '/') }
    if (!source) {
      missing.push(`apps.${id}.source`)
    } else {
      entry.source = path.resolve(root, source)
      if (!fs.existsSync(entry.source)) missing.push(`apps.${id}.source (not found: ${entry.source})`)
    }
    config.apps[id] = entry
  }
  return { root, path: file, config, missing }
}

// atDir: dir is the site root, even if a package.json or .git sits further up
export function ensureConfig(dir, answers = {}, { atDir = false } = {}) {
  const root = atDir ? path.resolve(dir) : findRoot(dir)
  const file = path.join(root, FILE)
  const current = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
  const { apps, ...rest } = answers
  const next = { ...current, ...rest }
  if (apps || current.apps) {
    next.apps = { ...current.apps }
    for (const [id, app] of Object.entries(apps ?? {})) next.apps[id] = { ...next.apps[id], ...app }
  }
  fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n')
  return loadConfig(root)
}

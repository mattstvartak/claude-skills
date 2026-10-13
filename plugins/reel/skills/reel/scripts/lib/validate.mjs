import { readFileSync } from 'node:fs'
import { posix } from 'node:path'

export const schema = JSON.parse(readFileSync(new URL('../../runtime/scene.schema.json', import.meta.url)))

const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v)
const isType = (v, t) => (t === 'number' ? typeof v === 'number' : typeOf(v) === t)
const key = (path, k) => (typeof k === 'number' ? `${path}[${k}]` : path ? `${path}.${k}` : k)
const deref = (ref) =>
  ref
    .slice(2)
    .split('/')
    .reduce((n, k) => n[k], schema)

// Subset of JSON Schema 2020-12 that scene.schema.json uses. Returns [{ path, message }].
export function check(value, s, path = '') {
  if (s.$ref) return check(value, deref(s.$ref), path)
  const at = path || '(root)'
  const err = (message) => [{ path: at, message }]
  if (s.oneOf) {
    let best
    for (const branch of s.oneOf) {
      const errs = check(value, branch, path)
      if (!errs.length) return []
      if (!best || errs.length < best.length) best = errs
    }
    return best
  }
  if (s.enum && !s.enum.includes(value))
    return err(`expected one of ${s.enum.join(', ')}, got ${JSON.stringify(value)}`)
  if (s.type && !isType(value, s.type)) return err(`expected ${s.type}, got ${typeOf(value)}`)
  const out = []
  if (typeof value === 'number') {
    if (s.minimum !== undefined && value < s.minimum) out.push(...err(`expected >= ${s.minimum}, got ${value}`))
    if (s.exclusiveMinimum !== undefined && value <= s.exclusiveMinimum)
      out.push(...err(`expected > ${s.exclusiveMinimum}, got ${value}`))
  }
  if (typeof value === 'string' && s.minLength && value.length < s.minLength)
    out.push(...err('expected a non-empty string'))
  if (Array.isArray(value)) {
    if (s.minItems !== undefined && value.length < s.minItems)
      out.push(...err(`expected at least ${s.minItems} items, got ${value.length}`))
    if (s.maxItems !== undefined && value.length > s.maxItems)
      out.push(...err(`expected at most ${s.maxItems} items, got ${value.length}`))
    value.forEach((item, i) => {
      const sub = s.prefixItems?.[i] ?? s.items
      if (sub) out.push(...check(item, sub, key(path, i)))
    })
  } else if (value && typeof value === 'object') {
    const props = s.properties ?? {}
    for (const r of s.required ?? []) if (!(r in value)) out.push({ path: key(path, r), message: 'required' })
    if (s.minProperties && Object.keys(value).length < s.minProperties)
      out.push(...err(`expected at least ${s.minProperties} entries`))
    for (const [k, v] of Object.entries(value)) {
      if (props[k]) out.push(...check(v, props[k], key(path, k)))
      else if (s.additionalProperties === false) out.push({ path: key(path, k), message: 'unknown key' })
      else if (s.additionalProperties) out.push(...check(v, s.additionalProperties, key(path, k)))
    }
  }
  return out
}

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/
const insideScene = (file) =>
  !/^([a-z]:|[\\/])/i.test(file) && !posix.normalize(file.replaceAll('\\', '/')).split('/').includes('..')

// What the schema can't say: names that must resolve to something defined elsewhere in the scene.
export function crossCheck(scene) {
  const out = []
  const targets = new Set(['@frame', ...Object.keys(scene.targets ?? {})])
  const framings = scene.cameras?.framings ?? {}
  const copy = scene.copy ?? {}
  const need = (set, name, path, what) => {
    if (typeof name === 'string' && !set.has(name)) out.push({ path, message: `unknown ${what} '${name}'` })
  }
  const point = (p, path) => p && need(targets, p.at, `${path}.at`, 'target')
  const keys = (list, path) =>
    Array.isArray(list) &&
    list.forEach(
      (k, i) => Array.isArray(k) && need(new Set(Object.keys(framings)), k[1], `${path}[${i}][1]`, 'framing'),
    )

  const ascending = (times, path, what) => {
    for (let i = 1; i < times.length; i++)
      if (times[i] < times[i - 1]) return out.push({ path, message: `${what} must be in ascending time order` })
  }
  for (const k of ['id', 'kit'])
    if (typeof scene[k] === 'string' && !KEBAB.test(scene[k]))
      out.push({ path: k, message: `expected a kebab-case name, got '${scene[k]}'` })
  scene.media?.forEach?.((m, i) => {
    if (typeof m?.file === 'string' && !insideScene(m.file))
      out.push({ path: `media[${i}].file`, message: `'${m.file}' must be a relative path inside the scene folder` })
  })
  if ('@frame' in (scene.targets ?? {})) out.push({ path: 'targets.@frame', message: "'@frame' is reserved" })
  for (const [name, tr] of Object.entries(scene.tracks?.state ?? {})) {
    if (Array.isArray(tr?.keys))
      ascending(
        tr.keys.map((k) => k?.[0]),
        `tracks.state.${name}.keys`,
        'keys',
      )
  }
  for (const name of ['default', 'phone']) {
    const list = scene.cameras?.[name]?.keys
    if (Array.isArray(list))
      ascending(
        list.map((k) => k?.[0]),
        `cameras.${name}.keys`,
        'keys',
      )
  }
  const cursor = scene.tracks?.cursor
  if (Array.isArray(cursor?.path))
    ascending(
      cursor.path.filter((s) => s?.to).map((s) => s.at?.[0]),
      'tracks.cursor.path',
      'moves',
    )
  point(cursor?.from, 'tracks.cursor.from')
  cursor?.path?.forEach?.((step, i) => point(step?.to, `tracks.cursor.path[${i}].to`))
  scene.tracks?.callouts?.forEach?.((c, i) => {
    need(new Set(Object.keys(copy)), c?.copy, `tracks.callouts[${i}].copy`, 'copy id')
    point(c?.anchor, `tracks.callouts[${i}].anchor`)
  })
  for (const [name, f] of Object.entries(framings)) {
    f?.focus?.forEach?.((item, i) => {
      const path = `cameras.framings.${name}.focus[${i}]`
      if (typeof item === 'string') need(targets, item, path, 'target')
      else point(item, path)
    })
  }
  const sb = scene.storyboard
  if (Array.isArray(sb?.beats) && Array.isArray(sb.times) && sb.beats.length !== sb.times.length)
    out.push({
      path: 'storyboard.beats',
      message: `expected ${sb.times.length} beats to match storyboard.times, got ${sb.beats.length}`,
    })
  keys(scene.cameras?.default?.keys, 'cameras.default.keys')
  keys(scene.cameras?.phone?.keys, 'cameras.phone.keys')
  return out
}

export function validateScene(scene) {
  const errs = check(scene, schema)
  if (!errs.length) errs.push(...crossCheck(scene))
  return errs.map((e) => `${e.path}: ${e.message}`)
}

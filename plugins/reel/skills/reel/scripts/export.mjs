#!/usr/bin/env node
import { createHash, randomBytes } from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { isMain, parseCli } from './lib/cli.mjs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { loadConfig } from './lib/config.mjs'
import { budget, walk } from './lib/budget.mjs'
import { fitCheck } from './lib/fitcheck.mjs'
import { kitDir, openStage } from './lib/stage.mjs'
import { encodeStream, FORMATS } from './lib/encode.mjs'
import { render } from './render.mjs'
import { requireValidScene } from './validate.mjs'

const RUNTIME = fileURLToPath(new URL('../runtime/', import.meta.url))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// public/reel/ is served at /reel/; any other publicDir is served from its own path
export function urlBase(publicDir) {
  const p = publicDir.replace(/^\.?\//, '').replace(/\/+$/, '')
  return '/' + p.replace(/^public\//, '')
}

export function snippet(scene, publicDir) {
  const base = urlBase(publicDir)
  const [w, h] = scene.fit.size
  const alt = scene.alt ?? 'TODO: describe what this animation shows'
  const dir = `${base}/scenes/${scene.id}`
  return {
    html: `<script type="module" src="${base}/runtime/reel.js"></script>\n\n<reel-scene src="${dir}/scene.json" style="max-width: ${w}px">\n  <img src="${dir}/poster.jpg" width="${w}" height="${h}" alt="${escapeHtml(alt)}">\n</reel-scene>`,
    react: `// copy ${publicDir.replace(/^\.?\//, '').replace(/\/+$/, '')}/runtime/reel-react.js into your components\nimport { ReelScene } from './reel-react.js'\n\n<ReelScene runtime="${base}/runtime/reel.js" src="${dir}/scene.json" poster="${dir}/poster.jpg" width={${w}} height={${h}} alt={${JSON.stringify(alt)}} style={{ maxWidth: ${w} }} />`,
    altMissing: scene.alt === undefined,
  }
}

// A killed export leaves its tmp and old folders beside the output.
function clearStale(final) {
  const dir = dirname(final)
  const name = basename(final)
  for (const n of readdirSync(dir))
    if (n.startsWith(`${name}.tmp-`) || n.startsWith(`${name}.old-`))
      rmSync(join(dir, n), { recursive: true, force: true })
}

function swap(final, tmp, units) {
  const old = `${final}.old-${randomBytes(4).toString('hex')}`
  const moved = []
  const placed = []
  try {
    for (const unit of units) {
      if (existsSync(join(final, unit))) {
        mkdirSync(dirname(join(old, unit)), { recursive: true })
        renameSync(join(final, unit), join(old, unit))
        moved.push(unit)
      }
    }
    for (const unit of units) {
      mkdirSync(dirname(join(final, unit)), { recursive: true })
      renameSync(join(tmp, unit), join(final, unit))
      placed.push(unit)
    }
  } catch (e) {
    for (const unit of placed) rmSync(join(final, unit), { recursive: true, force: true })
    for (const unit of moved) renameSync(join(old, unit), join(final, unit))
    rmSync(old, { recursive: true, force: true })
    throw e
  }
  rmSync(old, { recursive: true, force: true })
}

const cssUrls = (file) =>
  [...readFileSync(file, 'utf8').matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)]
    .map((m) => m[2])
    .filter((ref) => !/^(data:|#|%23|[a-z]+:|\/\/)/i.test(ref))
    .map((ref) => resolve(dirname(file), ref.split(/[?#]/)[0]))

// kit.js, its styles and fonts, and what their stylesheets point at. Nothing else in the kit folder ships.
async function copyKit(kitSrc, dest) {
  const file = join(kitSrc, 'kit.js')
  const kit = (await import(`${pathToFileURL(file).href}?v=${statSync(file).mtimeMs}`)).default
  if (!Number.isInteger(kit?.version)) throw new Error(`${file}: kit needs an integer version`)
  const sheets = [...(kit.styles ?? []), ...(kit.fonts ?? [])].map((s) => resolve(kitSrc, s))
  for (const f of new Set([file, ...sheets, ...sheets.flatMap(cssUrls)])) {
    const into = relative(kitSrc, f)
    if (into.startsWith('..') || isAbsolute(into)) throw new Error(`${f} is outside the kit folder`)
    mkdirSync(dirname(join(dest, into)), { recursive: true })
    cpSync(f, join(dest, into))
  }
  return kit.version
}

function copyScene(scene, scenePath, sceneOut) {
  mkdirSync(sceneOut, { recursive: true })
  const { storyboard, ...published } = scene
  writeFileSync(join(sceneOut, 'scene.json'), JSON.stringify(published, null, 2) + '\n')
  for (const m of scene.media ?? []) {
    const dest = join(sceneOut, m.file)
    mkdirSync(dirname(dest), { recursive: true })
    cpSync(resolve(dirname(scenePath), m.file), dest)
  }
}

async function capture(scene, scenePath, sceneOut, { skipVideo, formats, scale }) {
  if (!skipVideo) return (await render(scenePath, { out: sceneOut, formats, scale })).seam
  const stage = await openStage(scenePath, { scale })
  try {
    const png = await stage.shot(scene.posterAt ?? 0)
    await encodeStream(
      (async function* () {
        yield png
      })(),
      sceneOut,
      ['poster'],
      { posterFrame: 0 },
    )
  } finally {
    await stage.close()
  }
  return null
}

function buildManifest({ scene, kit, tmp, sceneOut, budgetResult, fit, seam, failures }) {
  const files = {}
  for (const p of walk(sceneOut))
    files[p] = { bytes: statSync(join(sceneOut, p)).size, sha256: sha256(join(sceneOut, p)) }
  const runtimeHash = createHash('sha256')
  for (const p of walk(join(tmp, 'runtime'))) runtimeHash.update(p).update(sha256(join(tmp, 'runtime', p)))
  return {
    scene: scene.id,
    kit,
    runtime: { sha256: runtimeHash.digest('hex') },
    generated: new Date().toISOString(),
    files,
    budget: { total: budgetResult.total, limit: budgetResult.limit, ok: budgetResult.ok },
    fit: {
      ok: fit.ok,
      results: fit.results.map(({ width, framing, track, textPx, ok }) => ({ width, framing, track, textPx, ok })),
    },
    loop: seam ? { ok: seam.ok, message: seam.message } : null,
    failures,
  }
}

export async function exportScene(
  scenePath,
  { site = process.cwd(), formats = FORMATS, skipVideo = false, force = false, scale = 2 } = {},
) {
  scenePath = resolve(scenePath)
  const { root, config, missing } = loadConfig(site)
  const bad = missing.filter((m) => m.startsWith('publicDir'))
  if (bad.length) throw new Error(`reel.json: ${bad.join(', ')}`)
  const final = resolve(root, config.publicDir)
  const scene = JSON.parse(readFileSync(scenePath, 'utf8'))

  mkdirSync(dirname(final), { recursive: true })
  clearStale(final)
  const tmp = `${final}.tmp-${randomBytes(4).toString('hex')}`
  const sceneRel = `scenes/${scene.id}`
  const units = ['runtime', `kits/${scene.kit}`, sceneRel]
  try {
    mkdirSync(join(tmp, 'runtime'), { recursive: true })
    for (const f of readdirSync(RUNTIME))
      if (f.endsWith('.js') || f === 'film.css') cpSync(join(RUNTIME, f), join(tmp, 'runtime', f))
    const kit = { name: scene.kit, version: await copyKit(kitDir(scenePath, scene.kit), join(tmp, 'kits', scene.kit)) }
    const sceneOut = join(tmp, sceneRel)
    copyScene(scene, scenePath, sceneOut)

    const fit = await fitCheck(scenePath)
    const seam = await capture(scene, scenePath, sceneOut, { skipVideo, formats, scale })

    const budgetResult = budget(tmp, {
      exclude: ['runtime/reel-react.js', ...(scene.media ?? []).map((m) => `${sceneRel}/${m.file}`)],
    })
    const failures = []
    if (!fit.ok)
      failures.push(
        `fit check failed at ${fit.results
          .filter((r) => !r.ok)
          .map((r) => `${r.framing} ${r.width}px (needs zoom ${r.zoomToPass.toFixed(2)})`)
          .join(', ')}`,
      )
    if (!budgetResult.ok) failures.push(budgetResult.message)
    if (seam && !seam.ok) failures.push(`loop: ${seam.message}`)

    const manifest = buildManifest({ scene, kit, tmp, sceneOut, budgetResult, fit, seam, failures })
    writeFileSync(join(sceneOut, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')

    const published = failures.length === 0 || force
    if (published) swap(final, tmp, units)
    return {
      ok: failures.length === 0,
      published,
      failures,
      manifest,
      budget: budgetResult,
      fit,
      seam,
      snippet: snippet(scene, config.publicDir),
      dir: final,
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

export function formatReport(r) {
  const kb = (n) => (n / 1024).toFixed(1)
  const lines = [
    `budget  ${r.budget.ok ? 'ok  ' : 'OVER'} ${kb(r.budget.total)} KB gzipped of ${kb(r.budget.limit)} KB${r.budget.ok ? '' : `, heaviest ${r.budget.heaviest.path} (${kb(r.budget.heaviest.gzip)} KB)`}`,
  ]
  lines.push(`loop    ${r.seam ? (r.seam.ok ? 'ok   ' : 'SEAM ') + r.seam.message : 'not checked (--skip-video)'}`)
  for (const f of r.fit.results)
    lines.push(
      `fit     ${f.ok ? 'ok  ' : 'FAIL'} ${String(f.width).padStart(5)}px ${f.framing} ${f.textPx.toFixed(1)}px`,
    )
  for (const [p, f] of Object.entries(r.manifest.files)) lines.push(`file    ${kb(f.bytes).padStart(8)} KB  ${p}`)
  lines.push(
    r.ok
      ? `exported to ${r.dir}`
      : `${r.published ? 'FORCED export despite' : 'NOT exported:'} ${r.failures.join('; ')}`,
  )
  if (r.published) {
    if (r.snippet.altMissing) lines.push('note    write an alt text: set "alt" in scene.json and export again')
    lines.push('', r.snippet.html, '', 'React:', r.snippet.react)
  }
  return lines.join('\n')
}

if (isMain(import.meta.url)) {
  const { values, positionals } = parseCli(
    '<scene.json> [--site <dir>] [--formats mp4,webm,gif,poster,scrub] [--skip-video] [--force] [--scale 2] [--report <file.json>]',
    {
      min: 1,
      options: {
        site: { type: 'string' },
        formats: { type: 'string', default: FORMATS.join(',') },
        'skip-video': { type: 'boolean' },
        force: { type: 'boolean' },
        scale: { type: 'string', default: '2' },
        report: { type: 'string' },
      },
      enums: { formats: FORMATS },
      numeric: ['scale'],
    },
  )
  requireValidScene(positionals[0])
  const site = values.site ?? process.cwd()
  if (values.report) {
    const { root, config } = loadConfig(site)
    const into = relative(resolve(root, config.publicDir), resolve(values.report))
    if (!into.startsWith('..') && !isAbsolute(into)) {
      console.error(
        `--report ${values.report} is inside publicDir (${config.publicDir}), which is published; choose a path outside it`,
      )
      process.exit(2)
    }
  }
  const r = await exportScene(positionals[0], {
    site,
    formats: values.formats.split(',').map((s) => s.trim()),
    skipVideo: values['skip-video'],
    force: values.force,
    scale: Number(values.scale),
  })
  if (values.report) writeFileSync(values.report, JSON.stringify(r, null, 2) + '\n')
  console.log(formatReport(r))
  process.exit(r.published ? 0 : 1)
}

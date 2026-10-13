#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve, extname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { isMain, parseCli } from './lib/cli.mjs'
import { kitDir, sceneRoot } from './lib/stage.mjs'
import { stillName } from './stills.mjs'
import { requireValidScene } from './validate.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const RUNTIME = resolve(HERE, '../runtime')
const LIMIT = 16 * 1024 * 1024
const MIME = {
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
}

const dataUrl = (buf, type) => `data:${type};base64,${Buffer.from(buf).toString('base64')}`

// Inline every url(file) a stylesheet points at, so the sheet works as a <style> with no files beside it.
function inlineCss(path) {
  return readFileSync(path, 'utf8').replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, _q, ref) => {
    if (/^(data:|#|%23)/.test(ref)) return m
    if (/^[a-z]+:|^\/\//i.test(ref)) throw new Error(`${path}: remote url(${ref}) would need the network`)
    const file = resolve(dirname(path), ref.split(/[?#]/)[0])
    return `url("${dataUrl(readFileSync(file), MIME[extname(file)] ?? 'application/octet-stream')}")`
  })
}

// One module as a function that returns its exports. Handles the import and export forms the runtime and kits use.
function moduleFn(name, src, known) {
  const names = []
  const body = src
    .replace(/^import \{([^}]+)\} from '\.\/([\w.-]+)'$/gm, (_, list, dep) => {
      if (!known.has(dep)) throw new Error(`${name} imports ./${dep}, which the preview cannot bundle`)
      return `const {${list.replace(/\bas\b/g, ':')}} = load('${dep}')`
    })
    .replace(/^export (?:async )?(?:function\*? |class |const |let )(\w+)/gm, (m, id) => {
      names.push(id)
      return m.slice('export '.length)
    })
    .replace(/^export default /m, () => {
      names.push('default: exportDefault')
      return 'const exportDefault = '
    })
  if (/^(import|export)\b/m.test(body)) throw new Error(`${name}: an import or export form the preview cannot bundle`)
  return `() => {\n${body}\nreturn { ${names.join(', ')} }\n}`
}

// The runtime and kit as one script that defines load(name), since an Artifact's CSP refuses blob: and data: scripts.
// The kit is '@kit' so it cannot clash with the runtime's own kit.js.
function bundle(runtime, kitSrc) {
  const known = new Set(Object.keys(runtime))
  const defs = [
    ...Object.entries(runtime).map(([name, src]) => [name, moduleFn(name, src, known)]),
    ['@kit', moduleFn('kit.js', kitSrc, new Set())],
  ].map(([name, fn]) => `${JSON.stringify(name)}: ${fn}`)
  const code = `(() => {\nconst done = {}\nconst defs = {\n${defs.join(',\n')}\n}\nconst load = (name) => (done[name] ??= defs[name]())\nreturn load\n})()`
  return code.replace(/<\/(script)/gi, '<\\/$1')
}

// Shrink a shot to a JPEG data URL sized for viewing. ffmpeg is already a hard dependency (encode.mjs).
function shrink(file) {
  const r = spawnSync(
    'nice',
    [
      '-n',
      '19',
      'ffmpeg',
      '-v',
      'error',
      '-i',
      file,
      '-vf',
      'scale=w=min(iw\\,800):h=-2',
      '-frames:v',
      '1',
      '-q:v',
      '5',
      '-f',
      'image2pipe',
      '-c:v',
      'mjpeg',
      '-',
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  )
  if (r.status !== 0 || !r.stdout.length) throw new Error(`could not shrink ${file}: ${String(r.stderr).trim()}`)
  return dataUrl(r.stdout, 'image/jpeg')
}

// One entry per storyboard time, with its stills and reference shots in both themes (null when absent).
function storyboardData(scene, siteRoot, stillsDir) {
  const sb = scene.storyboard
  if (!sb?.times?.length || !stillsDir) return null
  const pick = (file) => (file && existsSync(file) ? shrink(file) : null)
  const beats = sb.times.map((time, i) => {
    const b = sb.beats?.[i]
    const still = (theme) => pick(resolve(stillsDir, stillName(scene, theme, time)))
    const refPath = (theme) => (typeof b?.ref === 'string' ? b.ref : b?.ref?.[theme])
    const ref = (theme) => {
      const p = refPath(theme)
      return { path: p ?? null, src: p ? pick(resolve(siteRoot, p)) : null }
    }
    return {
      time,
      title: b?.title ?? null,
      caption: b?.caption ?? null,
      hasRef: !!b,
      light: still('light'),
      dark: still('dark'),
      ref: { light: ref('light'), dark: ref('dark') },
    }
  })
  return beats.some((b) => b.light || b.dark) ? beats : null
}

// Only what the page reads, so the export's absolute dir and anything else stays out of the file.
const pageReport = ({ budget, fit, seam, failures, snippet, published, ok }) => ({
  budget,
  fit,
  seam,
  failures,
  snippet,
  published,
  ok,
})

export async function buildPreview(scenePath, outPath, { stills, report } = {}) {
  scenePath = resolve(scenePath)
  requireValidScene(scenePath)
  const scene = JSON.parse(readFileSync(scenePath, 'utf8'))
  const kitPath = join(kitDir(scenePath, scene.kit), 'kit.js')
  const kitSrc = readFileSync(kitPath, 'utf8')
  const kit = (await import(pathToFileURL(kitPath).href)).default
  const inKit = (f) => resolve(dirname(kitPath), f)

  const runtime = Object.fromEntries(
    readdirSync(RUNTIME)
      .filter((f) => f.endsWith('.js') && f !== 'reel-react.js')
      .map((f) => [f, readFileSync(resolve(RUNTIME, f), 'utf8')]),
  )
  const data = {
    scene,
    css: [resolve(RUNTIME, 'film.css'), ...(kit.styles ?? []).map(inKit)].map(inlineCss),
    fonts: (kit.fonts ?? []).map((f) => inlineCss(inKit(f))),
    storyboard: storyboardData(scene, sceneRoot(scenePath), stills),
    report: report ? pageReport(JSON.parse(readFileSync(report, 'utf8'))) : null,
  }
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  const html = readFileSync(resolve(HERE, 'preview.html'), 'utf8')
    .replace('/*@data*/null', () => json)
    .replace('/*@runtime*/null', () => bundle(runtime, kitSrc))
  const bytes = Buffer.byteLength(html)
  if (bytes > LIMIT) throw new Error(`preview is ${(bytes / 1048576).toFixed(1)} MB, over the 16 MB Artifact limit`)
  writeFileSync(outPath, html)
  return bytes
}

if (isMain(import.meta.url)) {
  const { values, positionals } = parseCli('<scene.json> --out <file.html> [--stills <dir>] [--report <file.json>]', {
    min: 1,
    required: ['out'],
    options: { out: { type: 'string' }, stills: { type: 'string' }, report: { type: 'string' } },
  })
  const bytes = await buildPreview(positionals[0], values.out, { stills: values.stills, report: values.report })
  console.log(`${values.out}: ${(bytes / 1024).toFixed(0)} KB`)
}

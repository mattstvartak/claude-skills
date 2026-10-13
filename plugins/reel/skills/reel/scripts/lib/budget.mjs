import { readdirSync, readFileSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join, extname, relative } from 'node:path'

export const BUDGET_BYTES = 100 * 1024

const EXCLUDED_EXT = new Set([
  '.woff2',
  '.woff',
  '.ttf',
  '.otf',
  '.png',
  '.jpg',
  '.jpeg',
  '.avif',
  '.webp',
  '.gif',
  '.svg',
  '.ico',
  '.mp4',
  '.webm',
  '.mov',
])
const MANIFEST = 'manifest.json'

// every file under dir, as sorted forward-slash paths relative to it
export function walk(dir) {
  const all = (d) =>
    readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? all(join(d, e.name)) : [join(d, e.name)]))
  return all(dir)
    .map((p) => relative(dir, p).split('\\').join('/'))
    .sort()
}

// opts.exclude: extra relative paths to leave uncounted
export function budget(exportDir, opts = {}) {
  const exclude = new Set(opts.exclude || [])
  const files = walk(exportDir)
    .map((path) => {
      const file = join(exportDir, path)
      const gzip = gzipSync(readFileSync(file), { level: 9 }).length
      const excluded = EXCLUDED_EXT.has(extname(path).toLowerCase()) || exclude.has(path) || path === MANIFEST
      return { path, bytes: statSync(file).size, gzip, counted: !excluded }
    })
    .sort((a, b) => a.path.localeCompare(b.path))
  const counted = files.filter((f) => f.counted)
  const total = counted.reduce((s, f) => s + f.gzip, 0)
  const heaviest = counted.reduce((m, f) => (!m || f.gzip > m.gzip ? f : m), null)
  const ok = total <= BUDGET_BYTES
  return {
    ok,
    total,
    limit: BUDGET_BYTES,
    files,
    heaviest,
    message: ok
      ? `${total} B gzipped of ${BUDGET_BYTES} B`
      : `${total} B gzipped is over ${BUDGET_BYTES} B, heaviest file ${heaviest.path} (${heaviest.gzip} B)`,
  }
}

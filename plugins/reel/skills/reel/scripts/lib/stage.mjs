import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { playwright } from './tools.mjs'
import { staticServer } from './serve.mjs'

const RUNTIME = fileURLToPath(new URL('../../runtime/', import.meta.url))
const PREFIX = '/__reel-runtime/'

// scenes live at <root>/<dir>/scenes/<id>/scene.json, next to <root>/<dir>/kits. dir comes from
// reel.json (default "reel"); without a reel.json the folder two levels above "scenes" is dir.
const reelDir = (scenePath) => dirname(dirname(dirname(resolve(scenePath))))

function readConfigDir(root) {
  try {
    return JSON.parse(readFileSync(join(root, 'reel.json'), 'utf8')).dir ?? 'reel/'
  } catch {
    return null
  }
}

export function sceneRoot(scenePath) {
  const base = reelDir(scenePath)
  for (let d = base; ; d = dirname(d)) {
    const dir = readConfigDir(d)
    if (dir !== null && resolve(d, dir) === base) return d
    if (dirname(d) === d) return dirname(base)
  }
}

export const kitDir = (scenePath, kit) => join(reelDir(scenePath), 'kits', kit)

const nextFrames = () => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)))

export async function openStage(scenePath, { width, theme = 'light', scale = 2 } = {}) {
  const abs = resolve(scenePath)
  const scene = JSON.parse(await readFile(abs, 'utf8'))
  // only the reel folder and the runtime are served, not the rest of the site
  const base = reelDir(abs)
  const src =
    '/' +
    abs
      .slice(base.length + 1)
      .split('/')
      .map(encodeURIComponent)
      .join('/')
  const server = await staticServer(base, 0, { [PREFIX]: RUNTIME })
  const origin = server.url
  let browser
  const errors = []
  try {
    browser = await playwright().chromium.launch({ headless: true, args: ['--hide-scrollbars'] })
    const page = await browser.newPage({
      viewport: { width: 1600, height: 1000 },
      deviceScaleFactor: scale,
      reducedMotion: 'reduce',
    })
    page.on('pageerror', (e) => errors.push(e.message))
    await page.route(`${origin}/__stage.html`, (r) =>
      r.fulfill({
        contentType: 'text/html',
        body: `<!doctype html><meta charset="utf-8"><body style="margin:0"><script type="module" src="${PREFIX}reel.js"></script>`,
      }),
    )
    await page.goto(`${origin}/__stage.html`)
    const check = () => {
      if (errors.length) throw new Error(`page error: ${errors.splice(0).join('; ')}`)
    }
    const stage = {
      scene,
      page,
      async mount({ width: w = scene.fit?.size?.[0], theme: t = theme } = {}) {
        await page.evaluate(
          async ([src, w, t]) => {
            document.querySelector('reel-scene')?.remove()
            document.documentElement.dataset.theme = t
            const el = document.createElement('reel-scene')
            el.id = 'subject'
            el.setAttribute('drive', 'manual')
            el.setAttribute('src', src)
            if (w) el.style.width = `${w}px`
            document.body.prepend(el)
            await el.ready
            await document.fonts.ready
          },
          [src, w, t],
        )
        check()
      },
      async seek(t) {
        await page.evaluate((t) => document.getElementById('subject').seek(t), t)
        await page.evaluate(nextFrames)
        check()
      },
      async shot(t) {
        await stage.seek(t)
        return page.locator('#subject').screenshot()
      },
      async close() {
        await browser.close()
        await server.close()
      },
    }
    await stage.mount({ width })
    return stage
  } catch (e) {
    await browser?.close()
    await server.close()
    throw e
  }
}

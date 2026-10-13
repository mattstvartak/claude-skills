import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
}

// mounts maps a url prefix to another directory, e.g. { '/__reel-runtime/': runtimeDir }
export async function staticServer(root, port = 0, mounts = {}) {
  const server = createServer(async (req, res) => {
    try {
      const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname))
      const prefix = Object.keys(mounts).find((p) => path.startsWith(p))
      const file = prefix
        ? join(mounts[prefix], path.slice(prefix.length))
        : join(root, path.endsWith('/') ? `${path}index.html` : path)
      const body = await readFile(file)
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(body)
    } catch {
      res.writeHead(404).end()
    }
  })
  await new Promise((ok) => server.listen(port, '127.0.0.1', ok))
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((ok) => server.close(ok)) }
}

import { inflateSync } from 'node:zlib'

export const SEAM_FACTOR = 2
export const MIN_SEAM_DELTA = 2

const CHANNELS = { 2: 3, 6: 4 }

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a),
    pb = Math.abs(p - b),
    pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

// 8-bit RGB/RGBA, non-interlaced only
export function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG')
  let pos = 8,
    width,
    height,
    channels
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('latin1', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      channels = CHANNELS[data[9]]
      if (data[8] !== 8 || !channels || data[12] !== 0) {
        throw new Error('unsupported PNG: need 8-bit RGB or RGBA, not interlaced')
      }
    } else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    pos += 12 + len
  }
  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * channels
  const out = Buffer.alloc(stride * height)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    const src = y * (stride + 1) + 1
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? out[y * stride + x - channels] : 0
      const b = y ? out[(y - 1) * stride + x] : 0
      const c = y && x >= channels ? out[(y - 1) * stride + x - channels] : 0
      const pred = [0, a, b, (a + b) >> 1, paeth(a, b, c)][filter]
      if (pred === undefined) throw new Error(`bad PNG filter ${filter}`)
      out[y * stride + x] = (raw[src + x] + pred) & 255
    }
  }
  return { width, height, channels, data: out }
}

const GRID = 8

// largest mean absolute difference (0 to 255) over a GRID x GRID grid of tiles, so a local
// change is not averaged away by the unchanged rest of the frame
export function frameDelta(pngA, pngB) {
  const a = decodePng(pngA),
    b = decodePng(pngB)
  if (a.width !== b.width || a.height !== b.height) throw new Error('frame sizes differ')
  const { width, height, channels } = a
  const sums = new Float64Array(GRID * GRID)
  const counts = new Float64Array(GRID * GRID)
  for (let y = 0; y < height; y++) {
    const row = Math.min(GRID - 1, Math.floor((y * GRID) / height)) * GRID
    for (let x = 0; x < width; x++) {
      const tile = row + Math.min(GRID - 1, Math.floor((x * GRID) / width))
      const i = (y * width + x) * channels
      sums[tile] +=
        Math.abs(a.data[i] - b.data[i]) +
        Math.abs(a.data[i + 1] - b.data[i + 1]) +
        Math.abs(a.data[i + 2] - b.data[i + 2])
      counts[tile] += 3
    }
  }
  let max = 0
  for (let t = 0; t < sums.length; t++) if (counts[t]) max = Math.max(max, sums[t] / counts[t])
  return max
}

export const median = (a) => {
  const s = [...a].sort((x, y) => x - y)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

// median delta over consecutive frame pairs, [[a, b], ...], ignoring pairs that did not change
export function typicalDelta(pairs) {
  const d = pairs.map(([a, b]) => frameDelta(a, b)).filter((x) => x > 0)
  return d.length ? median(d) : 0
}

export function loopSeam(lastPng, firstPng, typical) {
  const delta = frameDelta(lastPng, firstPng)
  const limit = Math.max(typical * SEAM_FACTOR, MIN_SEAM_DELTA)
  const seam = delta > limit
  return {
    seam,
    ok: !seam,
    delta,
    typicalDelta: typical,
    limit,
    message: `last to first delta ${delta.toFixed(2)}, typical frame delta ${typical.toFixed(2)}, limit ${limit.toFixed(2)}${seam ? ': visible seam' : ''}`,
  }
}

import { spawn } from 'node:child_process'
import { mkdir, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

export const FORMATS = ['mp4', 'webm', 'gif', 'poster', 'scrub']
export const FPS = 60
// same as craft's encode.sh desktop mode
export const SCRUB = { height: 1080, gop: 8, crf: 20 }

const EVEN = 'scale=trunc(iw/2)*2:trunc(ih/2)*2'

// per format: the files it writes and the ffmpeg output args. A gif builds its own filter graph.
const SPECS = {
  mp4: {
    files: ['scene.mp4'],
    args: (opts, dest) => [
      '-map',
      '0:v',
      '-vf',
      EVEN,
      '-an',
      '-c:v',
      'libx264',
      '-profile:v',
      'high',
      '-preset',
      'medium',
      '-crf',
      String(opts.crf ?? 20),
      '-pix_fmt',
      'yuv420p',
      '-r',
      String(FPS),
      '-movflags',
      '+faststart',
      dest('scene.mp4'),
    ],
  },
  webm: {
    files: ['scene.webm'],
    args: (opts, dest) => [
      '-map',
      '0:v',
      '-vf',
      EVEN,
      '-an',
      '-c:v',
      'libvpx-vp9',
      '-b:v',
      '0',
      '-crf',
      String(opts.webmCrf ?? 32),
      '-row-mt',
      '1',
      '-pix_fmt',
      'yuv420p',
      '-r',
      String(FPS),
      dest('scene.webm'),
    ],
  },
  gif: {
    files: ['scene.gif'],
    filter: (opts) =>
      `[0:v]fps=${opts.gifFps ?? 20},scale='min(${opts.gifWidth ?? 640},iw)':-2:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle[g]`,
    args: (opts, dest) => ['-map', '[g]', '-loop', '0', dest('scene.gif')],
  },
  scrub: {
    files: ['scene-scrub.mp4'],
    args: (opts, dest) => {
      const s = { ...SCRUB, ...opts.scrub }
      return [
        '-map',
        '0:v',
        '-an',
        '-vf',
        `scale=-2:'min(${s.height},ih)':flags=lanczos,format=yuv420p`,
        '-c:v',
        'libx264',
        '-profile:v',
        'high',
        '-preset',
        'slow',
        '-crf',
        String(s.crf),
        '-g',
        String(s.gop),
        '-keyint_min',
        String(s.gop),
        '-sc_threshold',
        '0',
        '-r',
        String(FPS),
        '-movflags',
        '+faststart',
        dest('scene-scrub.mp4'),
      ]
    },
  },
  poster: {
    files: ['poster.jpg', 'poster.avif'],
    args: async (opts, dest) => {
      const sel = `select=eq(n\\,${opts.posterFrame ?? 0}),${EVEN}`
      return [
        '-map',
        '0:v',
        '-vf',
        sel,
        '-frames:v',
        '1',
        '-fps_mode',
        'passthrough',
        '-q:v',
        '3',
        '-pix_fmt',
        'yuvj420p',
        dest('poster.jpg'),
        '-map',
        '0:v',
        '-vf',
        `${sel},format=yuv420p`,
        '-frames:v',
        '1',
        '-fps_mode',
        'passthrough',
        ...(await avifEncoder()),
        '-f',
        'avif',
        dest('poster.avif'),
      ]
    },
  },
}

// in order of preference
const AV1_ARGS = {
  libsvtav1: ['-crf', '30'],
  'libaom-av1': ['-crf', '30', '-b:v', '0', '-still-picture', '1'],
}
export const AV1_ENCODERS = Object.keys(AV1_ARGS)

let encoders
async function avifEncoder() {
  encoders ??= await run(['-hide_banner', '-encoders'], null)
  const name = AV1_ENCODERS.find((n) => encoders.includes(n))
  if (!name) throw new Error(`no AV1 encoder (${AV1_ENCODERS.join(' or ')}) in this ffmpeg`)
  return ['-c:v', name, ...AV1_ARGS[name]]
}

function run(args, input) {
  return new Promise((resolve, reject) => {
    const p = spawn('nice', ['-n', '19', 'ffmpeg', ...args], { stdio: ['pipe', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    p.stdout.on('data', (d) => (out += d))
    p.stderr.on('data', (d) => (err += d))
    p.stdin.on('error', () => {})
    p.on('error', reject)
    p.on('close', (code) => {
      if (code === 0) return resolve(out || err)
      reject(new Error(`ffmpeg exited ${code}:\n${err.trim().split('\n').slice(-12).join('\n')}`))
    })
    if (!input) return p.stdin.end()
    ;(async () => {
      try {
        for await (const buf of input) if (!p.stdin.write(buf)) await new Promise((r) => p.stdin.once('drain', r))
      } catch (e) {
        p.kill()
        return reject(e)
      }
      p.stdin.end()
    })()
  })
}

async function outputArgs(outDir, formats, opts) {
  const args = []
  let filter = ''
  const dest = (name) => join(outDir, name)
  for (const f of formats) {
    const spec = SPECS[f]
    if (!spec) throw new Error(`unknown format "${f}"`)
    if (spec.filter) filter = spec.filter(opts)
    args.push(...(await spec.args(opts, dest)))
  }
  return filter ? ['-filter_complex', filter, ...args] : args
}

async function report(outDir, formats) {
  const files = {}
  for (const f of formats)
    for (const name of SPECS[f].files) {
      const path = join(outDir, name)
      files[name] = { path, bytes: (await stat(path)).size }
    }
  return files
}

async function runEncode(inputArgs, input, outDir, formats, opts) {
  await mkdir(outDir, { recursive: true })
  const args = ['-y', '-hide_banner', '-loglevel', 'error', ...inputArgs, ...(await outputArgs(outDir, formats, opts))]
  await run(args, input)
  return report(outDir, formats)
}

export async function encode(framesDir, outDir, formats, opts = {}) {
  const frames = (await readdir(framesDir)).filter((n) => /^frame-\d+\.png$/.test(n))
  if (!frames.length) throw new Error(`no frame-NNNNN.png files in ${framesDir}`)
  return runEncode(['-framerate', String(FPS), '-i', join(framesDir, 'frame-%05d.png')], null, outDir, formats, opts)
}

export function encodeStream(frames, outDir, formats, opts = {}) {
  return runEncode(
    ['-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', 'pipe:0'],
    frames,
    outDir,
    formats,
    opts,
  )
}

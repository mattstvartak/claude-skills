#!/usr/bin/env node
// usage: node media.mjs add <file|url> --scene <id> [--name <file>] --author A --licence L [--url U] [--source supplied|stock]
//        node media.mjs check [siteDir]
//        node media.mjs estimate [--calls N] [--credits-per-call C] [--usd-per-credit R]
//        node media.mjs generate "<prompt>" <name.png> --scene <id> --confirm <credits> --credits-per-call C [--calls N] [--ar 16:9]
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { loadConfig } from './lib/config.mjs'
import { isMain, parseCli } from './lib/cli.mjs'

const API = 'https://api.kie.ai'
const MODEL = 'seedream/5-pro-text-to-image'
const SOURCES = ['supplied', 'stock', 'generated']
const BLOCKING = /(^|[^a-z])(nc|nd)([^a-z]|$)|non-?commercial|no-?derivs?|unknown|all rights reserved/i

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/
const MAX_POLLS = 120
const POLL_MS = 4000
const text = (v) => (typeof v === 'string' ? v.trim() : '')

const reelDir = (cwd) => {
  const { root, config } = loadConfig(cwd)
  return path.join(root, config.dir)
}
const readLicences = (reel) => {
  const list = path.join(reel, 'media', 'licences.json')
  return fs.existsSync(list) ? JSON.parse(fs.readFileSync(list, 'utf8')) : []
}

export function validateProvenance(p) {
  const bad = []
  if (!SOURCES.includes(p?.source)) bad.push(`source must be one of ${SOURCES.join(', ')}`)
  for (const k of ['author', 'licence']) if (!text(p?.[k])) bad.push(`${k} is required`)
  if (p?.source === 'stock' && !text(p?.url)) bad.push('url is required for stock')
  if (p?.source === 'generated' && p.costIfGenerated != null && !(p.costIfGenerated >= 0))
    bad.push('costIfGenerated must be a number of credits, zero or more')
  if (bad.length) throw new Error(`bad provenance: ${bad.join('; ')}`)
}

export function addMedia(file, provenance, { cwd = process.cwd(), scene, name } = {}) {
  validateProvenance(provenance)
  if (!fs.existsSync(file)) throw new Error(`file not found: ${file}`)
  const reel = reelDir(cwd)
  if (!KEBAB.test(scene ?? '') || !fs.existsSync(path.join(reel, 'scenes', scene)))
    throw new Error(`scene "${scene}" not found under ${path.join(reel, 'scenes')}`)
  const fileName = name ?? path.basename(file)
  if (fileName !== path.basename(fileName)) throw new Error(`--name must be a bare file name, got "${fileName}"`)
  const dir = path.join(reel, 'scenes', scene, 'media')
  const dest = path.join(dir, fileName)
  if (path.resolve(file) !== dest) {
    if (fs.existsSync(dest) && !fs.readFileSync(dest).equals(fs.readFileSync(file)))
      throw new Error(`${dest} already exists with different content, pass --name to pick another file name`)
    fs.mkdirSync(dir, { recursive: true })
    fs.copyFileSync(file, dest)
  }
  const key = `scenes/${scene}/media/${fileName}`
  const entries = readLicences(reel)
  const entry = {
    file: key,
    source: provenance.source,
    author: text(provenance.author),
    licence: text(provenance.licence),
    url: text(provenance.url),
    costIfGenerated: provenance.source === 'generated' ? (provenance.costIfGenerated ?? null) : null,
  }
  const i = entries.findIndex((e) => e.file === key)
  if (i < 0) entries.push(entry)
  else entries[i] = entry
  fs.mkdirSync(path.join(reel, 'media'), { recursive: true })
  fs.writeFileSync(path.join(reel, 'media', 'licences.json'), JSON.stringify(entries, null, 2) + '\n')
  return entry
}

export function checkMedia(cwd = process.cwd()) {
  const reel = reelDir(cwd)
  const entries = readLicences(reel)
  const scenes = path.join(reel, 'scenes')
  const problems = []
  for (const id of fs.existsSync(scenes) ? fs.readdirSync(scenes) : []) {
    const sceneFile = path.join(scenes, id, 'scene.json')
    if (!fs.existsSync(sceneFile)) continue
    for (const m of JSON.parse(fs.readFileSync(sceneFile, 'utf8')).media ?? []) {
      const abs = path.resolve(scenes, id, m.file)
      const rel = path.relative(reel, abs).split(path.sep).join('/')
      const e = rel.startsWith('..') ? null : entries.find((x) => x.file === rel)
      if (!fs.existsSync(abs)) problems.push(`${id}: ${m.file} does not exist`)
      if (!e) problems.push(`${id}: ${m.file} has no entry in media/licences.json`)
      else if (BLOCKING.test(e.licence))
        problems.push(`${id}: ${m.file} licence "${e.licence}" does not allow a public marketing page`)
    }
  }
  return problems
}

export function estimate({ calls = 1, creditsPerCall = null, usdPerCredit = null } = {}) {
  const credits = creditsPerCall == null ? null : calls * creditsPerCall
  return { model: MODEL, calls, credits, usd: credits != null && usdPerCredit != null ? credits * usdPerCredit : null }
}

export function formatEstimate(e) {
  const cost =
    e.credits == null
      ? 'cost: unknown. kie.ai price for this model is not verified, pass --credits-per-call from https://kie.ai/pricing'
      : `cost: ${e.credits} credits${e.usd != null ? ` (about $${e.usd.toFixed(2)})` : ''}`
  return `model: ${e.model}\ncalls: ${e.calls}\n${cost}`
}

export async function generate(
  prompt,
  out,
  {
    calls = 1,
    creditsPerCall,
    confirm,
    ar = '16:9',
    env = process.env,
    sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
    cwd = process.cwd(),
    scene,
  } = {},
) {
  const key = env.KIE_AI_API_KEY
  if (!key) throw new Error('KIE_AI_API_KEY is not set in the environment')
  let work
  try {
    if (!fs.existsSync(path.join(reelDir(cwd), 'scenes', String(scene)))) throw new Error(`scene "${scene}" not found`)
    const ext = path.extname(out) || '.png'
    const stem = path.basename(out, path.extname(out))
    const names = Array.from({ length: calls }, (_, i) => (calls === 1 ? `${stem}${ext}` : `${stem}-${i + 1}${ext}`))
    const taken = names.filter((n) => fs.existsSync(path.join(reelDir(cwd), 'scenes', scene, 'media', n)))
    if (taken.length) throw new Error(`refusing: ${taken.join(', ')} already in the scene's media, pick another name`)
    const est = estimate({ calls, creditsPerCall })
    if (est.credits == null) throw new Error('refusing: no verified price, pass --credits-per-call')
    if (!(confirm >= est.credits))
      throw new Error(`refusing: estimate is ${est.credits} credits, pass --confirm ${est.credits} to proceed`)
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }
    const credit = async () => {
      const j = await (await fetch(`${API}/api/v1/chat/credit`, { headers })).json()
      if (typeof j?.data !== 'number') throw new Error('could not read account credit')
      return j.data
    }
    const before = await credit()
    if (before < est.credits) throw new Error(`refusing: account has ${before} credits, estimate is ${est.credits}`)
    work = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-gen-'))
    const entries = []
    const record = (f, costIfGenerated = null) =>
      addMedia(
        f,
        {
          source: 'generated',
          author: 'kie.ai',
          licence: 'kie.ai terms (generated)',
          url: `${API} ${MODEL}`,
          costIfGenerated,
        },
        { cwd, scene },
      )
    for (let n = 1; n <= calls; n++) {
      const input = { prompt, aspect_ratio: ar, quality: 'high', output_format: ext.slice(1) }
      const created = await (
        await fetch(`${API}/api/v1/jobs/createTask`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ model: MODEL, input }),
        })
      ).json()
      const taskId = created?.data?.taskId
      if (created?.code !== 200 || !taskId) throw new Error(`createTask failed (code ${created?.code})`)
      let url
      for (let tries = 0; !url; tries++) {
        if (tries > MAX_POLLS) throw new Error('job timed out')
        const d =
          (
            await (
              await fetch(`${API}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, { headers })
            ).json()
          )?.data ?? {}
        const state = d.state || d.status
        if (state === 'fail' || state === 'failed')
          throw new Error(`job failed: ${d.failMsg || d.failCode || 'unknown'}`)
        if (state === 'success') {
          const r = typeof d.resultJson === 'string' ? JSON.parse(d.resultJson) : d.resultJson
          url = r?.resultUrls?.[0]
          if (!url) throw new Error('job finished with no result url')
        } else await sleep(POLL_MS)
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error(`download failed (${res.status})`)
      const tmp = path.join(work, names[n - 1])
      fs.writeFileSync(tmp, Buffer.from(await res.arrayBuffer()))
      entries.push(record(tmp))
    }
    const cost = before - (await credit())
    // second pass writes the real per-image cost onto entries already recorded
    return { cost, entries: entries.map((e) => record(path.join(work, path.basename(e.file)), cost / calls)) }
  } catch (e) {
    throw new Error(String(e.message).replaceAll(key, '[key]'))
  } finally {
    if (work) fs.rmSync(work, { recursive: true, force: true })
  }
}

const TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
}

async function download(url, name) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download failed (${res.status}) ${url}`)
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-dl-'))
  let base = name ?? (path.basename(new URL(url).pathname) || 'download')
  if (!path.extname(base)) {
    const ext = TYPES[(res.headers?.get?.('content-type') ?? '').split(';')[0].trim()]
    if (!ext) throw new Error(`cannot tell the file type of ${url}, pass --name with an extension`)
    base += ext
  }
  const file = path.join(dir, base)
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  return { file, dir }
}

const USAGE = `add <file|url> --scene <id> [--name <file>] --author A --licence L [--url U] [--source supplied|stock]
       check [siteDir]
       estimate [--calls N] [--credits-per-call C] [--usd-per-credit R]
       generate "<prompt>" <name.png> --scene <id> --confirm <credits> --credits-per-call C [--calls N] [--ar 16:9]`
const ARGS = { add: [1, 1], check: [0, 1], estimate: [0, 0], generate: [2, 2] }
const OPTIONS = Object.fromEntries(
  [
    'scene',
    'name',
    'author',
    'licence',
    'url',
    'source',
    'calls',
    'credits-per-call',
    'usd-per-credit',
    'confirm',
    'ar',
  ].map((k) => [k, { type: 'string' }]),
)
const num = (v) => (v == null ? undefined : Number(v))

function checkArgs(values, [cmd, ...args]) {
  const range = ARGS[cmd]
  if (!range) return cmd ? `unknown command "${cmd}"` : 'missing command'
  if (args.length < range[0] || args.length > range[1]) return `wrong number of arguments for ${cmd}`
  if ((cmd === 'add' || cmd === 'generate') && !values.scene) return `--scene is required for ${cmd}`
}

async function main(values, [cmd, ...args]) {
  const calls = num(values.calls) ?? 1
  const creditsPerCall = num(values['credits-per-call'])
  if (cmd === 'add') {
    const src = args[0]
    const isUrl = /^https?:\/\//i.test(src)
    const dl = isUrl ? await download(src, values.name) : null
    try {
      const entry = addMedia(
        dl?.file ?? src,
        {
          source: values.source ?? (isUrl ? 'stock' : 'supplied'),
          author: values.author,
          licence: values.licence,
          url: values.url ?? (isUrl ? src : ''),
        },
        { scene: values.scene, name: values.name },
      )
      console.log(`added ${entry.file} (${entry.source}, ${entry.licence})`)
    } finally {
      if (dl) fs.rmSync(dl.dir, { recursive: true, force: true })
    }
  } else if (cmd === 'check') {
    const problems = checkMedia(args[0] ?? process.cwd())
    for (const p of problems) console.log(p)
    if (problems.length) process.exitCode = 1
    else console.log('media ok')
  } else if (cmd === 'estimate') {
    console.log(formatEstimate(estimate({ calls, creditsPerCall, usdPerCredit: num(values['usd-per-credit']) })))
  } else {
    const result = await generate(args[0], args[1], {
      calls,
      creditsPerCall,
      confirm: num(values.confirm),
      ar: values.ar,
      scene: values.scene,
    })
    console.log(`generated ${result.entries.map((e) => e.file).join(', ')}; cost ${result.cost} credits`)
  }
}

if (isMain(import.meta.url)) {
  const { values, positionals } = parseCli(USAGE, {
    options: OPTIONS,
    min: 1,
    max: 3,
    enums: { source: ['supplied', 'stock'] },
    numeric: ['calls', 'credits-per-call', 'usd-per-credit', 'confirm'],
    check: checkArgs,
  })
  await main(values, positionals)
}

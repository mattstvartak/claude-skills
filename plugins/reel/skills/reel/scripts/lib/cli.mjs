import { realpathSync } from 'node:fs'
import { setPriority } from 'node:os'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

export function isMain(importMetaUrl) {
  if (process.argv[1] === undefined) return false
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(importMetaUrl))
  } catch {
    return false
  }
}

const die = (e) => {
  console.error(process.env.DEBUG ? (e?.stack ?? e) : `error: ${e?.message ?? e}`)
  process.exit(1)
}

// usage is everything after the script path. Bad input exits 2 with the usage line; a runtime
// failure later exits 1 with one line (DEBUG=1 for the stack).
export function parseCli(
  usage,
  { options = {}, min = 0, max = min, required = [], enums = {}, numeric = [], check } = {},
) {
  try {
    setPriority(19)
  } catch {
    /* not allowed on every system */
  }
  // a kit.js imported from a site without "type": "module" warns on every run
  process.removeAllListeners('warning')
  process.on('warning', (w) => {
    if (w.code !== 'MODULE_TYPELESS_PACKAGE_JSON')
      console.error(
        process.env.DEBUG ? w.stack : `(node:${process.pid}) ${w.code ? `[${w.code}] ` : ''}${w.name}: ${w.message}`,
      )
  })
  process.on('uncaughtException', die)
  process.on('unhandledRejection', die)
  const bad = (msg) => {
    console.error(`error: ${msg}\nusage: node ${process.argv[1]} ${usage}`)
    process.exit(2)
  }
  let parsed
  try {
    parsed = parseArgs({ allowPositionals: true, options })
  } catch (e) {
    bad(e.message.split('. ')[0])
  }
  const { values, positionals } = parsed
  if (positionals.length < min || positionals.length > max)
    bad(positionals.length < min ? 'missing argument' : `unexpected argument "${positionals[max]}"`)
  for (const name of required) if (values[name] === undefined) bad(`--${name} is required`)
  for (const [name, allowed] of Object.entries(enums)) {
    const wrong = (values[name]?.split(',') ?? []).map((s) => s.trim()).find((v) => !allowed.includes(v))
    if (wrong !== undefined) bad(`--${name} "${wrong}" is not one of ${allowed.join(', ')}`)
  }
  for (const name of numeric) {
    if (values[name] !== undefined && !(Number(values[name]) > 0)) bad(`--${name} must be a positive number`)
  }
  const problem = check?.(values, positionals)
  if (problem) bad(problem)
  return { values, positionals }
}

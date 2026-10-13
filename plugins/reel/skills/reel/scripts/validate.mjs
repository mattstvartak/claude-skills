#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { validateScene } from './lib/validate.mjs'
import { isMain, parseCli } from './lib/cli.mjs'

export function validateSceneFile(file) {
  let scene
  try {
    scene = JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    return [`${file}: ${e.message}`]
  }
  return validateScene(scene)
}

export function requireValidScene(file) {
  const errs = validateSceneFile(file)
  if (!errs.length) return
  console.error(errs.join('\n'))
  process.exit(1)
}

if (isMain(import.meta.url)) {
  const { positionals } = parseCli('<scene.json>', { min: 1 })
  const errs = validateSceneFile(positionals[0])
  console.log(errs.length ? errs.join('\n') : 'ok')
  process.exit(errs.length ? 1 : 0)
}

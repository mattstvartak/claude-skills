const RESET = `[data-reel-kit], [data-reel-kit] *, [data-reel-kit] *::before, [data-reel-kit] *::after {
  transition: none !important;
  animation: none !important;
}`

const mounted = new WeakMap()

export function mountKit(root, kit) {
  root.setAttribute('data-reel-kit', kit.name ?? '')
  root.innerHTML = `<style data-reel-reset>${RESET}</style>${kit.html}`
  const components = Object.entries(kit.components ?? {}).map(([name, c]) => {
    const el = root.querySelector(c.el)
    if (!el) throw new Error(`kit "${kit.name}": component "${name}" selector "${c.el}" matched nothing`)
    return { name, el, apply: c.apply, key: null }
  })
  mounted.set(root, { components })
}

function tweensFor(all, name) {
  const out = {}
  const prefix = `${name}.`
  for (const key in all ?? {}) if (key.startsWith(prefix)) out[key.slice(prefix.length)] = all[key]
  return out
}

export function applyState(root, state) {
  const entry = mounted.get(root)
  if (!entry) throw new Error('applyState called on a root that has no kit mounted')
  if (state.theme != null && root.dataset.theme !== state.theme) root.dataset.theme = state.theme
  for (const c of entry.components) {
    const props = state.kit?.[c.name] ?? {}
    const tweens = tweensFor(state.tweens, c.name)
    const key = JSON.stringify([props, tweens])
    if (key === c.key) continue
    c.apply(c.el, props, tweens)
    c.key = key
  }
}

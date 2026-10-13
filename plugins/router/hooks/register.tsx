import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { UsageWindow } from '../types'

const WARN_AT: Record<string, number> = { five_hour: 80, seven_day: 90 }
const WINDOW_NAMES: Record<string, string> = { five_hour: '5-hour', seven_day: 'Weekly' }

const limits = atom({ plugin: 'router', key: 'limits' } as const, [])
const warning = atom({ plugin: 'router', key: 'warning' } as const, null)
const dismissed = atom({ plugin: 'router', key: 'dismissed' } as const, [])

const windowName = (kind: string) => WINDOW_NAMES[kind] ?? kind
const keyOf = (w: UsageWindow) => `${w.kind}@${w.resetsAt ?? ''}`

const SIGN_IN_MS = 10 * 60 * 1000

const route = async ($: EngineInterface, args: string[], timeoutMs?: number) => {
  const run = await $.process
    .run([`${$.plugin.root}/bin/claude-route`, ...args], { timeoutMs })
    .catch((err: unknown) => ({ exitCode: -1, stdout: '', stderr: String(err) }))
  return { ok: run.exitCode === 0, text: (run.exitCode === 0 ? run.stdout : run.stderr).trim() }
}

const reroute = async ($: EngineInterface, w: UsageWindow) => {
  const { ok, text } = await route($, ['next', w.resetsAt ?? ''])
  $.ui.toast(ok ? text : `Reroute failed: ${text}`)
  if (ok) await update($, warning, () => null)
}

const addLogin = async ($: EngineInterface, name: string) => {
  const { ok, text } = await route($, ['add', name], SIGN_IN_MS)
  $.ui.toast(
    ok
      ? `${text} /route ${name} switches to it.`
      : `Adding ${name} failed: ${text}. In a terminal, claude-route add ${name} also takes a pasted code.`,
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'route',
      description: 'List the stored Claude accounts, or switch this session to one',
      argumentHint: '[account]',
      immediate: true,
    })
    await $.command.register({
      name: 'login-add',
      description: 'Sign in to another Claude account and store it for /route',
      argumentHint: '<name>',
    })
    return next(e)
  })

  on('command.run', { command: 'route' }, async ($, e) => {
    const name = e.args.trim()
    if (name) {
      const { ok, text } = await route($, ['use', name])
      if (ok) await update($, warning, () => null)
      return { text }
    }

    const { ok, text } = await route($, ['status'])
    if (!ok) return { text }
    const usage = (await read($, limits)).map(w => `${windowName(w.kind)} ${w.percentUsed}%`).join(', ')
    return {
      text: [text, usage && `Active account usage: ${usage}`, '/route <name> switches to an account.']
        .filter(Boolean)
        .join('\n'),
    }
  })

  on('command.run', { command: 'login-add' }, async ($, e) => {
    const name = e.args.trim()
    if (!/^[A-Za-z0-9_-]+$/.test(name)) return { text: 'Name the account: /login-add <name>, e.g. /login-add personal' }
    // The sign-in can take minutes, longer than a command's dispatch may run.
    $.clock.after(0, () => void addLogin($, name))
    return { text: `Opening the browser. Sign in as the account to add as ${name}; a notice here says when it's stored.` }
  })

  on('session.measure', async ($, e, next) => {
    await update($, limits, () => e.rateLimits)
    const over = e.rateLimits.find(w => w.percentUsed >= (WARN_AT[w.kind] ?? Infinity))
    await update($, warning, () => over ?? null)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const w = await read($, warning)
    if (e.props.hasSurvey || !w || (await read($, dismissed)).includes(keyOf(w))) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box>
        <Text color="warning">
          {windowName(w.kind)} usage is at {w.percentUsed}%. Reroute to another account?{' '}
        </Text>
        <Button key="reroute" label="Reroute" variant="primary" onPress={() => reroute($, w)} />
        <Text> </Text>
        <Button key="later" label="Not now" dimColor onPress={() => update($, dismissed, d => [...d, keyOf(w)])} />
      </Box>
    )
  })
}

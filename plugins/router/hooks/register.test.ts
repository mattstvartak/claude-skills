import { test, expect, mock } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const RESETS = '2026-10-13T22:00:00Z'

const measure = (kind: string, percentUsed: number) => ({
  context: { window: 200000 },
  rateLimits: [{ kind, percentUsed, resetsAt: RESETS }],
  changed: ['rateLimits'],
})

const fakeRoute = (on: On, runs: string[][], stdout = 'Switched from a to b (b@example.com).') =>
  on('process.run', ($, e) => {
    const args = e.argv.slice(1) as string[]
    runs.push(args)
    const out = args[0] === 'list' ? 'one\ta@example.com\t*\t\ntwo\tb@example.com\t\t\n' : stdout
    return { value: { exitCode: 0, stdout: out, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })

// Answers the account picker with `pick`, keeping what it was asked.
const fakePicker = (on: On, asked: { question: string; options: string[] }[], pick: string) =>
  on('tool.call', { tool: 'AskUserQuestion' }, ($, e) => {
    const [q] = e.questions
    asked.push({ question: q?.question ?? '', options: q?.options.map(o => o.label) ?? [] })
    return { result: { questions: e.questions, answers: { [q?.question ?? '']: pick } } as never }
  })

// What the engine draws above the prompt when no plugin does: nothing.
const engineBand = (on: On) => on('ui.render', () => ({ type: 'Box' }))

const band = ($: Engine) =>
  $.ui.mount({
    plugin: 'router',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100, scroll: { offset: 0, bodyRows: 10 }, view: {} },
  })

test('asks to reroute at 80% of the 5-hour window and 90% of the weekly one', async ($, on) => {
  engineBand(on)
  on('session.measure', ($, e) => ({ changed: e.changed }))

  await $.session.measure(measure('five_hour', 79) as never)
  expect(await (await band($)).find({ key: 'reroute' })).toBeUndefined()

  await $.session.measure(measure('five_hour', 80) as never)
  expect(await (await band($)).find({ key: 'reroute' })).toBeDefined()

  await $.session.measure(measure('seven_day', 89) as never)
  expect(await (await band($)).find({ key: 'reroute' })).toBeUndefined()

  await $.session.measure(measure('seven_day', 90) as never)
  expect(await (await band($)).find({ key: 'reroute' })).toBeDefined()
})

test('Reroute runs claude-route next and clears the band', async ($, on) => {
  const runs: string[][] = []
  const toasts: string[] = []
  fakeRoute(on, runs)
  engineBand(on)
  on('ui.toast', ($, e) => (toasts.push(e.text), { value: undefined }))
  on('session.measure', ($, e) => ({ changed: e.changed }))

  await $.session.measure(measure('five_hour', 85) as never)
  const ui = await band($)
  await ui.press({ key: 'reroute' })

  expect(runs).toEqual([['next', RESETS]])
  expect(toasts).toEqual(['Switched from a to b (b@example.com).'])
  expect(await ui.find({ key: 'reroute' })).toBeUndefined()
})

test('Not now hides the band until that window resets', async ($, on) => {
  engineBand(on)
  on('session.measure', ($, e) => ({ changed: e.changed }))

  await $.session.measure(measure('five_hour', 85) as never)
  const ui = await band($)
  await ui.press({ key: 'later' })
  expect(await ui.find({ key: 'reroute' })).toBeUndefined()

  await $.session.measure(measure('five_hour', 92) as never)
  expect(await (await band($)).find({ key: 'reroute' })).toBeUndefined()
})

test('/route asks which account and switches to the pick', async ($, on) => {
  const runs: string[][] = []
  const asked: { question: string; options: string[] }[] = []
  fakeRoute(on, runs)
  fakePicker(on, asked, 'two (b@example.com)')
  on('session.measure', ($, e) => ({ changed: e.changed }))
  on('command.run', () => ({ text: 'unanswered' }))

  await $.session.measure(measure('five_hour', 42) as never)
  const done = await $.command.run({ command: 'route', args: '' } as never)

  expect(asked).toEqual([
    { question: "You're on one (5-hour 42%). Switch to which account?", options: ['two (b@example.com)', 'Stay on one'] },
  ])
  expect(runs).toEqual([['list'], ['use', 'two']])
  expect(done.text).toBe('Switched from a to b (b@example.com).')
})

test('/route stays put when the pick is to stay', async ($, on) => {
  const runs: string[][] = []
  fakeRoute(on, runs)
  fakePicker(on, [], 'Stay on one')
  on('command.run', () => ({ text: 'unanswered' }))

  const done = await $.command.run({ command: 'route', args: '' } as never)
  expect(runs).toEqual([['list']])
  expect(done.text).toBe('Staying on one.')
})

test('/route <name> switches without asking', async ($, on) => {
  const runs: string[][] = []
  fakeRoute(on, runs)
  on('command.run', () => ({ text: 'unanswered' }))

  await $.command.run({ command: 'route', args: ' two ' } as never)
  expect(runs).toEqual([['use', 'two']])
})

test('/login-add signs in through claude-route add without holding the command', async ($, on) => {
  const runs: string[][] = []
  const toasts: string[] = []
  const clock = mock.clock(on)
  fakeRoute(on, runs, 'Stored personal (p@example.com).')
  on('ui.toast', ($, e) => (toasts.push(e.text), { value: undefined }))
  on('command.run', () => ({ text: 'unanswered' }))

  const bad = await $.command.run({ command: 'login-add', args: '../x' } as never)
  expect(bad.text).toContain('Name the account')

  const started = await $.command.run({ command: 'login-add', args: 'personal' } as never)
  expect(started.text).toContain('Opening the browser')
  expect(runs).toEqual([])

  await clock.advance(0)
  expect(runs).toEqual([['add', 'personal']])
  expect(toasts).toEqual(['Stored personal (p@example.com). /route personal switches to it.'])
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { reportCsv } from '../src/lib/reportDownload.js'

async function analytics(env = {}) {
  const scripts = []
  const window = { location: { origin: 'https://nexprep.example', pathname: '/student' } }
  const context = vm.createContext({ window, document: {
    title: 'NexPrep', createElement: () => ({}), head: { appendChild: script => scripts.push(script) },
  } })
  const module = new vm.SourceTextModule(await readFile(new URL('../src/lib/analytics.js', import.meta.url), 'utf8'), {
    context, initializeImportMeta: meta => { meta.env = env },
  })
  await module.link(() => {})
  await module.evaluate()
  return { api: module.namespace, window, scripts, events: () => Array.from(window.dataLayer || [], args => Array.from(args)).filter(args => args[0] === 'event') }
}

test('missing/invalid IDs and development without opt-in send nothing', async () => {
  for (const env of [{}, { VITE_GA_MEASUREMENT_ID: 'UA-123' }, { VITE_GA_MEASUREMENT_ID: 'G-TEST123', DEV: true }]) {
    const instance = await analytics(env)
    instance.api.trackEvent('quiz_created')
    assert.equal(instance.scripts.length, 0)
    assert.equal(instance.events().length, 0)
  }
})

test('initialization queues once and disables automatic page views', async () => {
  const instance = await analytics({ VITE_GA_MEASUREMENT_ID: 'G-TEST123', DEV: true, VITE_GA_DEBUG: 'true' })
  instance.api.initAnalytics()
  instance.api.initAnalytics()
  assert.equal(instance.scripts.length, 1)
  assert.equal(instance.window.dataLayer[1][2].send_page_view, false)
  assert.equal(instance.window.dataLayer[1][2].debug_mode, true)
})

test('custom events exclude personal data and free text', async () => {
  const instance = await analytics({ VITE_GA_MEASUREMENT_ID: 'G-TEST123' })
  instance.api.trackEvent('quiz_submitted', { quiz_id: 't_1', submission_type: 'manual', email: 'private@example.com', studentName: 'Private', answers: { q1: 1 } })
  const params = instance.events()[0][2]
  assert.equal(params.quiz_id, 't_1')
  assert.equal(params.submission_type, 'manual')
  for (const key of ['email', 'studentName', 'answers']) assert.equal(key in params, false)
})

test('page tracking emits standard and requested events with previous page', async () => {
  const instance = await analytics({ VITE_GA_MEASUREMENT_ID: 'G-TEST123' })
  instance.api.trackPageView('/student', '/login')
  assert.deepEqual(instance.events().map(event => event[1]), ['page_view', 'page_viewed'])
  assert.equal(instance.events()[0][2].page_referrer, 'https://nexprep.example/login')
  assert.equal(instance.events()[0][2].page_location, 'https://nexprep.example/student')
})

test('analytics failure cannot break application actions', async () => {
  const instance = await analytics({ VITE_GA_MEASUREMENT_ID: 'G-TEST123' })
  instance.window.gtag = () => { throw new Error('blocked') }
  assert.doesNotThrow(() => instance.api.trackEvent('quiz_started'))
  assert.doesNotThrow(() => instance.api.trackPageView('/student'))
})

test('CSV escapes quotes, protects formulas, and includes breakdowns', () => {
  const csv = reportCsv({ testName: '=HYPERLINK("example")', score: 4, subjectBreakdown: { Physics: { correct: 1, wrong: 0, total: 1 } } })
  assert.ok(csv.includes('"\'=HYPERLINK(""example"")"'))
  assert.ok(csv.includes('"Physics","1","0","1"'))
  assert.ok(csv.includes('"Score","4"'))
})

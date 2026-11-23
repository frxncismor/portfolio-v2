import type { Localized } from '../i18n/types'

export type WinTone = 'strong' | 'head' | 'add' | 'del' | 'ok'

export interface WinSegment {
  text: string
  tone?: WinTone
}

/** One line of a simulated window. `spark` carries y values (0–64) of a 200×64 sparkline. */
export type WinLine =
  | { kind: 'text'; segments: WinSegment[] }
  | { kind: 'blank' }
  | { kind: 'check'; text: string }
  | { kind: 'spark'; points: number[] }

export interface ProcessStep {
  id: 'spec' | 'harness' | 'review' | 'observe'
  label: Localized
  title: Localized
  text: Localized
  /** Simulated deliverable (aria-hidden artwork: not translated). */
  win: WinLine[]
}

const seg = (text: string, tone?: WinTone): WinSegment => (tone ? { text, tone } : { text })
const line = (...segments: WinSegment[]): WinLine => ({ kind: 'text', segments })

export const processSteps: ProcessStep[] = [
  {
    id: 'spec',
    label: { en: '01 · Spec', es: '01 · Especificar' },
    title: { en: 'Write it down first', es: 'Primero, por escrito' },
    text: {
      en: 'Behavior, edge cases and acceptance criteria before any code. Agents and tests build against it.',
      es: 'Comportamiento, casos límite y criterios de aceptación antes de escribir código. Los agentes y las pruebas se construyen contra eso.',
    },
    win: [
      line(seg('spec.md', 'strong')),
      { kind: 'blank' },
      line(seg('## Checkout retry', 'head')),
      line(seg('- Retry failed payment 3x')),
      line(seg('- Show status after 2s')),
      line(seg('- '), seg('Never', 'strong'), seg(' double-charge')),
      line(seg('✓', 'ok'), seg(' acceptance: 4 cases')),
    ],
  },
  {
    id: 'harness',
    label: { en: '02 · Harness', es: '02 · Harness' },
    title: { en: 'Build inside guardrails', es: 'Construir con límites' },
    text: {
      en: 'Project rules, MCP servers, skills, type checks and tests that fail loudly.',
      es: 'Reglas del proyecto, servidores MCP, skills, verificación de tipos y pruebas que fallan con ruido.',
    },
    win: [
      line(seg('agent · run #482', 'strong')),
      line(seg('+ retryPayment(order, 3)', 'add')),
      line(seg('+ idempotencyKey(order.id)', 'add')),
      line(seg('- chargeCard(order)', 'del')),
      line(seg('tests  '), seg('24 passed', 'ok')),
      line(seg('types  '), seg('ok', 'ok'), seg(' · lint '), seg('ok', 'ok')),
    ],
  },
  {
    id: 'review',
    label: { en: '03 · Review', es: '03 · Revisión' },
    title: { en: 'A human signs off', es: 'Una persona da el visto bueno' },
    text: {
      en: 'I read and run every diff. Nothing merges until it meets the spec and I understand it.',
      es: 'Leo y ejecuto cada diff. Nada se integra hasta que cumple la spec y lo entiendo.',
    },
    win: [
      line(seg('review · PR 213', 'strong')),
      { kind: 'blank' },
      { kind: 'check', text: 'matches spec' },
      { kind: 'check', text: 'ran locally' },
      { kind: 'check', text: 'edge cases covered' },
      { kind: 'check', text: 'approved by Francisco' },
    ],
  },
  {
    id: 'observe',
    label: { en: '04 · Observe', es: '04 · Observación' },
    title: { en: 'Watch it in production', es: 'Vigilarlo en producción' },
    text: {
      en: 'Errors, latency and real usage, watched after every release.',
      es: 'Errores, latencia y uso real, vigilados después de cada release.',
    },
    win: [
      line(seg('production · 24h', 'strong')),
      { kind: 'spark', points: [46, 42, 44, 36, 38, 27, 31, 19, 23, 15, 17] },
      line(seg('errors '), seg('0.02%', 'ok'), seg(' · p95 180ms')),
    ],
  },
]

export const processLoop: { label: Localized; title: Localized; text: Localized } = {
  label: { en: 'And back again', es: 'Y vuelta a empezar' },
  title: { en: 'Every release improves the next.', es: 'Cada release mejora la siguiente.' },
  text: {
    en: 'What I learn in production becomes the next spec: a new edge case, a sharper test, a better rule for the agents. The process gets a little better every time it runs.',
    es: 'Lo que aprendo en producción se vuelve la siguiente spec: un caso límite nuevo, una prueba más afinada, una mejor regla para los agentes. El proceso mejora un poco cada vez que corre.',
  },
}

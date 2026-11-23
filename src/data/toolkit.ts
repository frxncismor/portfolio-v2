import type { Localized } from '../i18n/types'

export interface ToolkitGroup {
  id: 'frontend' | 'backend' | 'ai' | 'ship'
  label: Localized
  items: string[]
}

export const toolkitGroups: ToolkitGroup[] = [
  {
    id: 'frontend',
    label: { en: 'Frontend', es: 'Frontend' },
    items: ['Angular', 'RxJS', 'NgRx', 'TypeScript', 'React', 'Next.js', 'Astro'],
  },
  {
    id: 'backend',
    label: { en: 'Backend & data', es: 'Backend y datos' },
    items: ['.NET 10', 'Node.js', 'Express', 'Prisma', 'Oracle', 'SQL Server', 'MySQL', 'Supabase', 'Firebase'],
  },
  {
    id: 'ai',
    label: { en: 'AI workflow', es: 'Flujo con IA' },
    items: ['Claude Code', 'MCP servers', 'Agent skills', 'Spec-driven dev', 'Harness engineering', 'Human-in-the-loop'],
  },
  {
    id: 'ship',
    label: { en: 'Ship & observe', es: 'Entrega y observabilidad' },
    items: ['Docker', 'ARO', 'Traefik', 'Datadog', 'Sentry', 'Stripe'],
  },
]

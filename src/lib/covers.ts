export const COVERS = [
  'worktrees', 'mcp', 'adversarial', 'contract', 'signals', 'zoneless', 'migration', 'expand',
  'columns', 'frozen', 'refs', 'spec', 'skills', 'e2e', 'api', 'monorepo', 'layers', 'lint',
  'devai', 'generic',
] as const

export type Cover = (typeof COVERS)[number]

/** Cover used when a post does not set `cover`, by category. Unknown categories get the neutral one. */
const CATEGORY_COVER: Record<string, Cover> = {
  Angular: 'signals',
  Backend: 'monorepo',
  AI: 'devai',
  Testing: 'contract',
  JavaScript: 'refs',
}

export function defaultCover(category: string): Cover {
  return CATEGORY_COVER[category] ?? 'generic'
}

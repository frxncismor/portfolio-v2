/** JSON for an inline `<script>`: `<` is escaped so a value containing `</script>` can't close the tag. */
export function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\u003c')
}

/** Collision-resistant local IDs. Timestamps alone collide when two records are created in the same millisecond. */
export function newId(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}

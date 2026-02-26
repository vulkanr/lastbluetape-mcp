/**
 * In-memory cache mapping list_id -> token.
 * Populated from create_list and list_my_lists responses.
 */

const cache = new Map<string, string>();

export function getToken(listId: string): string | undefined {
  return cache.get(listId);
}

export function setToken(listId: string, token: string): void {
  cache.set(listId, token);
}

export function setTokens(entries: Array<{ list_id: string; token: string }>): void {
  for (const entry of entries) {
    cache.set(entry.list_id, entry.token);
  }
}

export function hasToken(listId: string): boolean {
  return cache.has(listId);
}

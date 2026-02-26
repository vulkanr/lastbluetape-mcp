/**
 * In-memory cache mapping list_id -> token.
 * Populated from create_list and list_my_lists responses.
 */
const cache = new Map();
export function getToken(listId) {
    return cache.get(listId);
}
export function setToken(listId, token) {
    cache.set(listId, token);
}
export function setTokens(entries) {
    for (const entry of entries) {
        cache.set(entry.list_id, entry.token);
    }
}
export function hasToken(listId) {
    return cache.has(listId);
}
//# sourceMappingURL=token-cache.js.map
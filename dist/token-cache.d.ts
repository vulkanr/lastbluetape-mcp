/**
 * In-memory cache mapping list_id -> token.
 * Populated from create_list and list_my_lists responses.
 */
export declare function getToken(listId: string): string | undefined;
export declare function setToken(listId: string, token: string): void;
export declare function setTokens(entries: Array<{
    list_id: string;
    token: string;
}>): void;
export declare function hasToken(listId: string): boolean;
//# sourceMappingURL=token-cache.d.ts.map
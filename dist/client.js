import { getToken, setToken, setTokens, hasToken } from "./token-cache.js";
const BASE_URL = process.env.LASTBLUETAPE_BASE_URL || "https://lastbluetape.com";
const API_BASE = `${BASE_URL}/api/v1`;
const API_KEY = process.env.LASTBLUETAPE_API_KEY;
const PAYMENT_METHOD = process.env.LASTBLUETAPE_PAYMENT_METHOD;
function apiKeyHeader() {
    if (!API_KEY)
        throw new Error("LASTBLUETAPE_API_KEY environment variable is required");
    return {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
    };
}
function tokenHeader(listId) {
    const token = getToken(listId);
    if (!token)
        throw new Error(`No token cached for list ${listId}. Try calling list_my_lists first.`);
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
}
async function request(method, path, headers, body) {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`API ${method} ${path} returned ${res.status}: ${text}`);
    }
    return res.json();
}
/**
 * Ensure we have a token for a list_id. If not cached, refresh via list_my_lists.
 */
async function ensureToken(listId) {
    if (hasToken(listId))
        return;
    await listMyLists();
    if (!hasToken(listId)) {
        throw new Error(`No token found for list ${listId} even after refreshing. You may not have access to this list.`);
    }
}
// --- Account-level operations (API key auth) ---
export async function createList(input) {
    const data = await request("POST", "/lists", apiKeyHeader(), input);
    // Cache the token from the response
    const list = data.list;
    const token = data.token;
    if (list && token) {
        setToken(list.id, token);
    }
    const listId = list?.id;
    const listTitle = list?.title;
    const webUrl = token ? `${BASE_URL}/list/${listId}?t=${token}` : undefined;
    return {
        ...data,
        hint: `List '${listTitle}' created successfully.${webUrl ? ` Share the web URL with your team: ${webUrl}` : ""}`,
    };
}
export async function listMyLists() {
    const data = await request("GET", "/lists", apiKeyHeader());
    const lists = data.lists;
    if (lists) {
        const entries = lists
            .filter((l) => l.id && l.token)
            .map((l) => ({ list_id: l.id, token: l.token }));
        setTokens(entries);
    }
    const count = lists?.length ?? 0;
    return {
        ...data,
        hint: `Found ${count} list${count === 1 ? "" : "s"} linked to your account.`,
    };
}
// --- List-level operations (token auth) ---
export async function getList(input) {
    await ensureToken(input.list_id);
    const data = await request("GET", `/lists/${input.list_id}`, tokenHeader(input.list_id));
    const list = data.list;
    return {
        ...data,
        hint: `List '${list?.title ?? input.list_id}' has ${list?.total_items ?? "?"} items (${list?.done_items ?? "?"} done).`,
    };
}
export async function listItems(input) {
    await ensureToken(input.list_id);
    const data = await request("GET", `/lists/${input.list_id}/items`, tokenHeader(input.list_id));
    const items = data.items;
    const count = items?.length ?? 0;
    const done = items?.filter((i) => i.status === "done").length ?? 0;
    return {
        ...data,
        hint: `${count} item${count === 1 ? "" : "s"} in this list (${done} done, ${count - done} remaining).`,
    };
}
export async function addItem(input) {
    await ensureToken(input.list_id);
    const { list_id, ...body } = input;
    const data = await request("POST", `/lists/${list_id}/items`, tokenHeader(list_id), body);
    const stats = data.list_stats;
    let hint = `Item '${input.title}' added.`;
    if (stats) {
        const total = stats.total_items;
        const limit = stats.limit;
        const plan = stats.plan;
        if (plan === "free" && limit) {
            const remaining = limit - total;
            hint += ` This free list has ${remaining} item${remaining === 1 ? "" : "s"} remaining before upgrade is needed ($4.99).`;
        }
        else {
            hint += ` Pro list — ${total} items total, no limit.`;
        }
    }
    return { ...data, hint };
}
export async function updateItem(input) {
    await ensureToken(input.list_id);
    const { list_id, item_id, ...body } = input;
    const data = await request("PUT", `/lists/${list_id}/items/${item_id}`, tokenHeader(list_id), body);
    return {
        ...data,
        hint: `Item updated successfully.`,
    };
}
export async function setItemStatus(input) {
    await ensureToken(input.list_id);
    const { list_id, item_id, status } = input;
    const data = await request("PUT", `/lists/${list_id}/items/${item_id}/status`, tokenHeader(list_id), { status });
    return {
        ...data,
        hint: `Item status set to '${status}'.`,
    };
}
export async function flagItem(input) {
    await ensureToken(input.list_id);
    const { list_id, item_id, flagged } = input;
    const data = await request("PUT", `/lists/${list_id}/items/${item_id}/flag`, tokenHeader(list_id), { flagged });
    return {
        ...data,
        hint: `Item ${flagged ? "flagged" : "unflagged"} successfully.`,
    };
}
export async function getActivity(input) {
    await ensureToken(input.list_id);
    const params = input.limit ? `?limit=${input.limit}` : "";
    const data = await request("GET", `/lists/${input.list_id}/activity${params}`, tokenHeader(input.list_id));
    const activity = data.activity;
    const count = activity?.length ?? 0;
    return {
        ...data,
        hint: `${count} activity entr${count === 1 ? "y" : "ies"} returned.`,
    };
}
export async function upgradeList(input) {
    await ensureToken(input.list_id);
    if (!PAYMENT_METHOD) {
        throw new Error("LASTBLUETAPE_PAYMENT_METHOD environment variable is required for upgrades. Set it to a Stripe pm_xxx payment method ID.");
    }
    const data = await request("POST", `/lists/${input.list_id}/upgrade`, tokenHeader(input.list_id), {
        payment_method_id: PAYMENT_METHOD,
    });
    return {
        ...data,
        hint: "List upgraded to Pro! Unlimited items, no expiry. One-time $4.99 payment processed.",
    };
}
//# sourceMappingURL=client.js.map
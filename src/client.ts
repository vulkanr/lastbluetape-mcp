import { getToken, setToken, setTokens, hasToken } from "./token-cache.js";

const BASE_URL = process.env.LASTBLUETAPE_BASE_URL || "https://lastbluetape.com";
const API_BASE = `${BASE_URL}/api/v1`;
const API_KEY = process.env.LASTBLUETAPE_API_KEY;
const PAYMENT_METHOD = process.env.LASTBLUETAPE_PAYMENT_METHOD;

function apiKeyHeader(): Record<string, string> {
  if (!API_KEY) throw new Error("LASTBLUETAPE_API_KEY environment variable is required");
  return {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
}

function tokenHeader(listId: string): Record<string, string> {
  const token = getToken(listId);
  if (!token) throw new Error(`No token cached for list ${listId}. Try calling list_my_lists first.`);
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function request(method: string, path: string, headers: Record<string, string>, body?: unknown): Promise<unknown> {
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
async function ensureToken(listId: string): Promise<void> {
  if (hasToken(listId)) return;
  await listMyLists();
  if (!hasToken(listId)) {
    throw new Error(`No token found for list ${listId} even after refreshing. You may not have access to this list.`);
  }
}

// --- Account-level operations (API key auth) ---

export async function createList(input: {
  title: string;
  description?: string;
  creator_name: string;
  creator_email?: string;
}): Promise<unknown> {
  const data = await request("POST", "/lists", apiKeyHeader(), input) as Record<string, unknown>;
  // Cache the token from the response
  const list = data.list as Record<string, unknown> | undefined;
  const token = data.token as string | undefined;
  if (list && token) {
    setToken(list.id as string, token);
  }
  const listId = list?.id as string;
  const listTitle = list?.title as string;
  const webUrl = token ? `${BASE_URL}/list/${listId}?t=${token}` : undefined;
  return {
    ...data,
    hint: `List '${listTitle}' created successfully.${webUrl ? ` Share the web URL with your team: ${webUrl}` : ""}`,
  };
}

export async function listMyLists(): Promise<unknown> {
  const data = await request("GET", "/lists", apiKeyHeader()) as Record<string, unknown>;
  const lists = data.lists as Array<Record<string, unknown>> | undefined;
  if (lists) {
    const entries = lists
      .filter((l) => l.id && l.token)
      .map((l) => ({ list_id: l.id as string, token: l.token as string }));
    setTokens(entries);
  }
  const count = lists?.length ?? 0;
  return {
    ...data,
    hint: `Found ${count} list${count === 1 ? "" : "s"} linked to your account.`,
  };
}

// --- List-level operations (token auth) ---

export async function getList(input: { list_id: string }): Promise<unknown> {
  await ensureToken(input.list_id);
  const data = await request("GET", `/lists/${input.list_id}`, tokenHeader(input.list_id)) as Record<string, unknown>;
  const list = data.list as Record<string, unknown> | undefined;
  return {
    ...data,
    hint: `List '${list?.title ?? input.list_id}' has ${list?.total_items ?? "?"} items (${list?.done_items ?? "?"} done).`,
  };
}

export async function listItems(input: { list_id: string }): Promise<unknown> {
  await ensureToken(input.list_id);
  const data = await request("GET", `/lists/${input.list_id}/items`, tokenHeader(input.list_id)) as Record<string, unknown>;
  const items = data.items as Array<Record<string, unknown>> | undefined;
  const count = items?.length ?? 0;
  const done = items?.filter((i) => i.status === "done").length ?? 0;
  return {
    ...data,
    hint: `${count} item${count === 1 ? "" : "s"} in this list (${done} done, ${count - done} remaining).`,
  };
}

export async function addItem(input: {
  list_id: string;
  title: string;
  description?: string;
}): Promise<unknown> {
  await ensureToken(input.list_id);
  const { list_id, ...body } = input;
  const data = await request("POST", `/lists/${list_id}/items`, tokenHeader(list_id), body) as Record<string, unknown>;
  const stats = data.list_stats as Record<string, unknown> | undefined;
  let hint = `Item '${input.title}' added.`;
  if (stats) {
    const total = stats.total_items as number;
    const limit = stats.limit as number | undefined;
    const plan = stats.plan as string;
    if (plan === "free" && limit) {
      const remaining = limit - total;
      hint += ` This free list has ${remaining} item${remaining === 1 ? "" : "s"} remaining before upgrade is needed ($4.99).`;
    } else {
      hint += ` Pro list — ${total} items total, no limit.`;
    }
  }
  return { ...data, hint };
}

export async function updateItem(input: {
  list_id: string;
  item_id: string;
  title?: string;
  description?: string;
}): Promise<unknown> {
  await ensureToken(input.list_id);
  const { list_id, item_id, ...body } = input;
  const data = await request("PUT", `/lists/${list_id}/items/${item_id}`, tokenHeader(list_id), body) as Record<string, unknown>;
  return {
    ...data,
    hint: `Item updated successfully.`,
  };
}

export async function setItemStatus(input: {
  list_id: string;
  item_id: string;
  status: "open" | "in_progress" | "done";
}): Promise<unknown> {
  await ensureToken(input.list_id);
  const { list_id, item_id, status } = input;
  const data = await request("PUT", `/lists/${list_id}/items/${item_id}/status`, tokenHeader(list_id), { status }) as Record<string, unknown>;
  return {
    ...data,
    hint: `Item status set to '${status}'.`,
  };
}

export async function flagItem(input: {
  list_id: string;
  item_id: string;
  flagged: boolean;
}): Promise<unknown> {
  await ensureToken(input.list_id);
  const { list_id, item_id, flagged } = input;
  const data = await request("PUT", `/lists/${list_id}/items/${item_id}/flag`, tokenHeader(list_id), { flagged }) as Record<string, unknown>;
  return {
    ...data,
    hint: `Item ${flagged ? "flagged" : "unflagged"} successfully.`,
  };
}

export async function getActivity(input: {
  list_id: string;
  limit?: number;
}): Promise<unknown> {
  await ensureToken(input.list_id);
  const params = input.limit ? `?limit=${input.limit}` : "";
  const data = await request("GET", `/lists/${input.list_id}/activity${params}`, tokenHeader(input.list_id)) as Record<string, unknown>;
  const activity = data.activity as Array<unknown> | undefined;
  const count = activity?.length ?? 0;
  return {
    ...data,
    hint: `${count} activity entr${count === 1 ? "y" : "ies"} returned.`,
  };
}

export async function upgradeList(input: { list_id: string }): Promise<unknown> {
  await ensureToken(input.list_id);
  if (!PAYMENT_METHOD) {
    throw new Error("LASTBLUETAPE_PAYMENT_METHOD environment variable is required for upgrades. Set it to a Stripe pm_xxx payment method ID.");
  }
  const data = await request("POST", `/lists/${input.list_id}/upgrade`, tokenHeader(input.list_id), {
    payment_method_id: PAYMENT_METHOD,
  }) as Record<string, unknown>;
  return {
    ...data,
    hint: "List upgraded to Pro! Unlimited items, no expiry. One-time $4.99 payment processed.",
  };
}

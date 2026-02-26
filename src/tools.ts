import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  createList,
  listMyLists,
  getList,
  listItems,
  addItem,
  updateItem,
  setItemStatus,
  flagItem,
  getActivity,
  upgradeList,
} from "./client.js";

export function registerTools(server: McpServer): void {
  server.tool(
    "create_list",
    "Create a new punch list. Returns the list details, share token, and a shareable web URL.",
    {
      title: z.string().describe("Title of the punch list"),
      description: z.string().optional().describe("Optional description of the list"),
      creator_name: z.string().describe("Name of the list creator"),
      creator_email: z.string().email().optional().describe("Optional email of the creator"),
    },
    async (input) => {
      const result = await createList(input);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "list_my_lists",
    "List all punch lists linked to your API key. Also refreshes the token cache for list-level operations.",
    {},
    async () => {
      const result = await listMyLists();
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_list",
    "Get details and stats for a specific punch list.",
    {
      list_id: z.string().describe("The list ID"),
    },
    async (input) => {
      const result = await getList(input);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "list_items",
    "List all items in a punch list.",
    {
      list_id: z.string().describe("The list ID"),
    },
    async (input) => {
      const result = await listItems(input);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "add_item",
    "Add a new item to a punch list. Returns the created item and list stats (including remaining capacity for free lists).",
    {
      list_id: z.string().describe("The list ID"),
      title: z.string().describe("Title of the item"),
      description: z.string().optional().describe("Optional description of the item"),
    },
    async (input) => {
      const result = await addItem(input);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "update_item",
    "Update the title and/or description of a punch list item.",
    {
      list_id: z.string().describe("The list ID"),
      item_id: z.string().describe("The item ID"),
      title: z.string().optional().describe("New title for the item"),
      description: z.string().optional().describe("New description for the item"),
    },
    async (input) => {
      const result = await updateItem(input);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "set_item_status",
    "Change the status of a punch list item to open, in_progress, or done.",
    {
      list_id: z.string().describe("The list ID"),
      item_id: z.string().describe("The item ID"),
      status: z.enum(["open", "in_progress", "done"]).describe("New status for the item"),
    },
    async (input) => {
      const result = await setItemStatus(input);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "flag_item",
    "Flag or unflag a punch list item for attention.",
    {
      list_id: z.string().describe("The list ID"),
      item_id: z.string().describe("The item ID"),
      flagged: z.boolean().describe("True to flag the item, false to unflag"),
    },
    async (input) => {
      const result = await flagItem(input);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_activity",
    "Get the activity log for a punch list.",
    {
      list_id: z.string().describe("The list ID"),
      limit: z.number().int().positive().optional().describe("Max number of activity entries to return"),
    },
    async (input) => {
      const result = await getActivity(input);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "upgrade_list",
    "Upgrade a punch list to Pro ($4.99 one-time). Requires LASTBLUETAPE_PAYMENT_METHOD env var with a Stripe payment method ID. Removes the 30-item limit and 90-day expiry.",
    {
      list_id: z.string().describe("The list ID to upgrade"),
    },
    async (input) => {
      const result = await upgradeList(input);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}

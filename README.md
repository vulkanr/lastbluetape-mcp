# @lastbluetape/mcp-server

MCP server for [LastBlueTape](https://lastbluetape.com) — a punch list service for construction and renovation projects. This server lets AI assistants create lists, manage items, track progress, and share lists with your team, all through the LastBlueTape API.

## Installation

```bash
npx @lastbluetape/mcp-server
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LASTBLUETAPE_API_KEY` | Yes | Your API key (`lbt_xxx`) |
| `LASTBLUETAPE_PAYMENT_METHOD` | No | Stripe payment method ID (`pm_xxx`) for auto-upgrading lists |
| `LASTBLUETAPE_BASE_URL` | No | API base URL (default: `https://lastbluetape.com`) |

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "lastbluetape": {
      "command": "npx",
      "args": ["-y", "@lastbluetape/mcp-server"],
      "env": {
        "LASTBLUETAPE_API_KEY": "lbt_your_api_key_here"
      }
    }
  }
}
```

### Claude Code

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "lastbluetape": {
      "command": "npx",
      "args": ["-y", "@lastbluetape/mcp-server"],
      "env": {
        "LASTBLUETAPE_API_KEY": "lbt_your_api_key_here"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `create_list` | Create a new punch list |
| `list_my_lists` | List all punch lists linked to your API key |
| `get_list` | Get details and stats for a list |
| `list_items` | List all items in a list |
| `add_item` | Add a new item to a list |
| `update_item` | Update an item's title or description |
| `set_item_status` | Set item status (open, in_progress, done) |
| `flag_item` | Flag or unflag an item for attention |
| `get_activity` | Get the activity log for a list |
| `upgrade_list` | Upgrade a list to Pro ($4.99 one-time) |

## Pricing

- **Free tier**: 30 items per list, 2 photos per item, 90-day expiry
- **Pro**: $4.99 one-time payment per list, unlimited items, no expiry

## Documentation

Full API docs at [lastbluetape.com/docs](https://lastbluetape.com/docs)

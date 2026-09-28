# Use your YOU memory from an MCP client (preview)

`mcp/you-mcp.mjs` is a small local [MCP](https://modelcontextprotocol.io) server. It serves **one YOU export file** to **one assistant** over stdio. It has no dependencies, opens no network connections, and only reads what you exported.

> **Preview status:** the server enforces grants and logs access, but it trusts the local file and the `--client` flag you give it. It is not an authenticated service, and it does not sync with the browser demo: export again after changing memories or grants.

## 1. Grant access and export

1. In YOU, open **Privacy & access → Agent permissions**. Every assistant starts with no access.
2. Choose the topics this assistant may read (People, Preferences, Routines, Plans, Wellbeing), and **Propose memories** if it may suggest new facts.
3. Choose **Export**. Turn off **Include private memories** unless you want them in the file. Private memories are never served, but leaving them out means they never leave the browser.

## 2. Connect an assistant

Requires Node.js 22.13+. Use absolute paths.

Claude Code:

```bash
claude mcp add you -- node --experimental-strip-types --no-warnings /path/to/you-app/mcp/you-mcp.mjs --file /path/to/you-memory-export.json --client claude
```

Any client that takes a JSON config (Claude Desktop, Cursor, and others):

```json
{
  "mcpServers": {
    "you": {
      "command": "node",
      "args": ["--experimental-strip-types", "--no-warnings", "/path/to/you-app/mcp/you-mcp.mjs", "--file", "/path/to/you-memory-export.json", "--client", "claude"]
    }
  }
}
```

`--client` selects which grant applies: `claude`, `openai`, `codex`, or `other-mcp` (the default).

## Tools

| Tool | Needs | Returns |
| --- | --- | --- |
| `you_search_context` | any read scope | Matching facts in granted categories, with state, confidence, and source |
| `you_get_person` | `people.read` | A person and the facts about them this assistant may read |
| `you_explain_fact` | the fact's category | Evidence, source, state, and confidence for one fact |
| `you_list_open_loops` | `plans.read` | Known or inferred plans and possible commitments |
| `you_propose_memory` | `memory.write` | Writes a **Needs review** proposal into the export file |

These are always withheld, whatever the grant:

- private memories
- memories awaiting review
- categories the assistant was not granted

Inferred facts are labeled as uncertain and unknown facts as unknown, so the assistant is told not to guess.

## Reviewing proposals and access

- **Proposals:** `you_propose_memory` adds the fact to the export as *Needs review*, with the assistant named as the source. Import the file in YOU and accept, edit, or reject it under **Review**. At most 25 proposals can wait at once.
- **Access log:** every call, allowed or denied, is appended to `<export>.access-log.jsonl` next to the export.
- **Revoking access:** remove the grant in YOU and export again, or delete the server from your client.

# YOU

YOU is an open source prototype for a personal context layer: a private, inspectable memory of the people, plans, preferences, routines, and commitments in your life. It can help an assistant make useful suggestions while showing why it believes something and how certain it is. **The last agent you’ll ever need** is the product ambition: YOU stays with you while underlying models can change.

The model is replaceable. The memory belongs to the user. The long term goal is a portable context service that any authorized harness can use through a scoped HTTP API or MCP adapter.

> **Prototype status:** The app is an interactive frontend with fictional seed data. Changes are saved in this browser's `localStorage`. It has no real connectors, authentication, live AI, device telemetry, ticket purchases, or production MCP server. The simulated Ask YOU answers use seeded facts and respect available/private memory settings. A [local MCP server preview](docs/MCP.md) can serve an exported memory file to one assistant under the grants you set.

## Explore the demo

[Open the interactive YOU demo](https://you-relationship-memory.saccojoseph961968.chatgpt.site/) · [Follow the 90-second walkthrough](docs/DEMO.md)

The public demo starts with **Alex**, a fictional persona, and invented people and events. It does not import contacts, read your computer, or connect to your accounts. Anything you type into the demo stays in that browser's local storage unless you choose to export it. Use fictional details when sharing screenshots or feedback.

### Screenshots

Fictional sample data, captured from the running prototype:

| For you | Ask YOU |
| --- | --- |
| ![YOU's For you screen with a gentle check-in and evidence card](https://github.com/user-attachments/assets/b5455b9a-bdbb-4d75-bbca-82e575033c37) | ![Ask YOU answering an uncertain question with its source](https://github.com/user-attachments/assets/cb92aa3f-fad7-41f1-b822-6530a58b27f3) |

![Memory screen showing known, inferred, and unknown facts with sources and confidence](https://github.com/user-attachments/assets/8bed4e01-7610-473c-850f-0af545f53ecd)

## Try it locally

Requires Node.js 22.13+.

```bash
npm ci
npm run dev
```

Open the local URL printed by the development server. `npm test` checks the memory answer boundary, agent grants, and the MCP server; `npm run build` makes a production build. `npm run mcp -- --file <export.json> --client claude` starts the local MCP server ([setup](docs/MCP.md)).

## What works in the demo

- A first-run experience that selects possible sources and an assistant harness, creates a personal engram, and saves routine preferences. All connection and scheduling choices are simulated.
- A calm suggestion feed for check-ins, plans, relationships, and open commitments.
- A memory browser with **known, inferred, unknown, and needs review** states, confidence, provenance, and verification dates. You can confirm, correct, or fill in an unknown fact; corrections are recorded as coming from you, with the previous value kept in the evidence.
- A **Review** inbox for agent proposals and facts you flagged. Nothing in it is used in answers or shared with agents until you accept it.
- People you can add, edit, and remove; a relationship map built from each person's relationship; upcoming important dates; and a timeline that includes what you add.
- Manual memories, important dates, and reminders; profile editing; dismissing and handling suggestions.
- A simulated Ask YOU view that answers from the current available memory, carries source and confidence, and says when it does not know. Changed, hidden, or removed facts affect future answers.
- **Per-assistant grants** by topic (People, Preferences, Routines, Plans, Wellbeing, Propose memories). Every assistant starts with no access. Browser agents using the page's WebMCP tools are checked against their grant, and every call, allowed or denied, appears in an **access log**.
- Connection placeholders, per-memory availability, validated local import/export with a preview of what leaves the browser, and demo reset.

## Product principles

1. **The user owns the engram.** Context is portable and exportable.
2. **Every claim has a state and source.** An inference is never silently promoted to a fact.
3. **Agents receive minimum necessary context.** Access is scoped, revocable, and auditable.
4. **Sensitive observations invite conversation.** A busy calendar may justify a gentle question, not a conclusion about someone's wellbeing.
5. **Suggestions remain optional.** YOU can be quiet, and users can correct, dismiss, or exclude information.
6. **Connectors require permission.** No impersonation, fake accounts, or covert collection.

## Repository map

```text
components/you/           Interactive prototype: app shell, views, dialogs, state, WebMCP tools
app/api/protocol/route.ts  Read-only discovery of the proposed protocol
data/demo.ts              Fictional people, memories, insights, events, connectors
lib/context-contract.ts   Model-neutral fact, evidence, grant, and scope types
lib/agent-access.ts       Per-assistant grants, the shared read policy, and access-log entries
mcp/you-mcp.mjs           Local MCP server preview over an exported memory file
docs/MCP.md               Connecting Claude, Codex, or another MCP client
docs/ARCHITECTURE.md      Roadmap for a real local-first service and MCP/API
docs/LAUNCH.md            Honest launch copy and outreach plan
```

## Next implementation milestones

1. Split the browser demo state into a local encrypted datastore with migrations and an import/export format.
2. Build a consented import pipeline: connector → raw event → identity candidate → fact candidate → user review → graph update. Keep raw source and extracted fact separate.
3. Add an HTTP API with user authentication, scope grants, query logs, and an MCP adapter. The same service should work with Claude, OpenAI, Codex, local models, and custom agents. The local MCP preview already enforces grants and logs access over a file; the service needs authentication and live sync.
4. Validate identity matching and inference with uncertainty tests, provenance checks, and correction propagation.
5. Add official connectors where permitted. Device activity and local event discovery need platform-specific feasibility work; they are not connected here.

See [the architecture](docs/ARCHITECTURE.md) for the proposed data model and boundaries.

## Contributing and security

Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md) before sending a change involving personal data or a connector. This project uses the MIT license.

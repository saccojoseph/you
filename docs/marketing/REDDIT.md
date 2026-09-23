# Reddit launch drafts

These are community-specific launch texts. Both were published from u/Liquidjojo1987 on September 23, 2026. Do not cross-post identical text or claim the prototype has live integrations.

## r/SideProject — feedback post

Published: https://www.reddit.com/r/SideProject/comments/1wo5uk4/i_built_a_prototype_for_a_personal_ai_memory_you/

**Title:** I built a prototype for a personal AI memory you could take between assistants

I keep running into the same problem with AI tools: each assistant knows a different fragment of my life, and none of that context is easy to inspect or carry elsewhere.

So I built the first interactive prototype of **YOU**. The idea is a user-owned personal context layer for people, plans, preferences, and commitments. It marks memories as known, inferred, or unknown, shows sources and confidence, and is designed to eventually give Claude, OpenAI, or another authorized agent only the context it needs.

What works today: a fictional-data demo with onboarding, a memory browser, relationship context, a suggestion feed, and simulated Ask YOU answers. The app saves demo edits in your browser. It does **not** connect to accounts, read your device, or provide a production MCP/API service yet.

Demo: https://you-relationship-memory.saccojoseph961968.chatgpt.site/

Code and screenshots: https://github.com/saccojoseph/you

I would especially value feedback on one thing: **what would make you trust—or refuse to trust—a personal memory that another AI assistant could query?**

## r/github — self-promotion megathread comment

Published: https://www.reddit.com/r/github/comments/1jy8rea/comment/pbk8ch2/

I'm building **YOU**, an MIT-licensed prototype for an inspectable personal context layer. The long-term goal is user-owned memory that can be shared selectively with different AI assistants rather than locked into one model. The current demo uses fictional data and browser storage; connectors and a real MCP/API service are roadmap items, not shipped features.

Repo: https://github.com/saccojoseph/you

Demo: https://you-relationship-memory.saccojoseph961968.chatgpt.site/

Stack: Next.js, TypeScript, React. I would welcome feedback on the provenance/confidence model and the architecture for scoped access across agent harnesses.

## After posting

Answer substantive questions in the threads. Turn repeated concerns into GitHub issues. Do not ask for upvotes or use alternate accounts to boost engagement.

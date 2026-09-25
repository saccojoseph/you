# YOU feedback and growth log

This log is appended by the weekday feedback-and-growth loop. No private data about commenters is recorded here, only public post links and paraphrased themes.

## 2026-09-23 — launch day, first automated run

### Feedback collected

- **GitHub (saccojoseph/you):** 0 stars, 0 forks, 0 open issues, no pull requests, discussions not enabled. No feedback yet. https://github.com/saccojoseph/you
- **LinkedIn (launch post):** 1 comment, from Randy Heath. Category: opinion/question. He describes a deep, years-long relationship with his ChatGPT instance and asks how to avoid losing that "AI friend" if the provider changes pricing or shuts down, and whether the relationship can be made portable and who owns it. This directly validates YOU's core pitch (model-neutral, user-owned context). 10 reactions, 270 impressions, unanswered as of this run. https://www.linkedin.com/feed/update/urn:li:share:7508518775856746497/
- **Reddit (r/SideProject and r/github threads):** Could not access either thread this run. Confirmed blocked under a platform safety policy in both the built-in browser and the Claude-in-Chrome extension ("This site is not allowed due to safety restrictions") — not a login or connection issue, no permission prompt available either way. Joe will need to check r/SideProject and the r/github megathread comment manually.
- **Instagram (launch post):** Confirmed via the Claude-in-Chrome extension (signed in as Joe): 2 likes, no comments yet ("No comments yet. Start the conversation."). Nothing to draft.

### Reply drafts proposed (not posted — pending Joe's approval)

Only one substantive unanswered comment was reachable this run (Instagram has none yet, Reddit was unreachable).

1. Reply to Randy Heath on LinkedIn: https://www.linkedin.com/feed/update/urn:li:share:7508518775856746497/
   > Randy, that is exactly the problem I am trying to get at. Right now YOU is just a demo with fictional data, there is no real ChatGPT or ongoing-assistant integration yet. But the idea is that your memory should live outside any single assistant, so if a provider changes its terms or shuts down you still have it. I just added an import and export round trip to the prototype so you can see what taking your own data out and back in actually looks like. Curious what would make you trust handing that context to a new assistant in the first place.

### Shipped

- Branch `feature/memory-import`, commit `33f0067`: added an "Import your memory" action in Settings → Storage, mirroring the existing Export. It loads a previously exported `you-memory-export.json` back into the browser's local storage, keeping each fact's known/inferred/unknown status, confidence, and source. Files that are not a valid `you-memory-export` show an inline error and leave existing local storage untouched. This gives the "take your context somewhere else" pitch a working round trip and directly answers Randy's portability question above.
  - `npx tsc --noEmit`: clean.
  - `npm run lint`: no new warnings or errors from this change (1 pre-existing error and 7 pre-existing warnings elsewhere in `app/page.tsx`, unrelated to this diff, left as-is).
  - `npm run build`: could not run in this device shell — fails with a missing `@rolldown/binding-linux-arm64-gnu` native module, a pre-existing local-environment/architecture issue unrelated to this change.
  - Not pushed, not merged. Waiting on approval.

### Promotion

- None drafted this run. Today is launch day; per `docs/LAUNCH.md` the next planned steps are participating in existing threads and converting repeat feedback into scoped GitHub issues (days 3–7), not a new post. Will revisit next week if warranted.

### Blockers for next run

- Reddit is inaccessible to this session's built-in browser (policy block); the Claude-in-Chrome extension was not connected. Either connect Chrome with the extension signed in, or plan to check Reddit manually.
- Instagram requires a sign-in in the built-in browser to see comments.
- The local build command doesn't run in this device shell due to a native-binding/architecture mismatch; lint and `tsc --noEmit` are used as the practical proportional check until that's fixed.

## 2026-09-24 — manual catch-up after the schedule was paused

### Feedback collected

- **GitHub:** No issues or open pull requests. [PR #1](https://github.com/saccojoseph/you/pull/1) was merged and the public demo was deployed after the September 23 log; there are no outside reviews or PR comments. Discussions are not enabled.
- **[r/SideProject](https://www.reddit.com/r/SideProject/comments/1wo5uk4/i_built_a_prototype_for_a_personal_ai_memory_you/):** Two substantive replies were visible. One argues that a refusal to share must be enforced by the memory layer rather than entrusted to an assistant prompt. The other suggests separating durable facts, episodic summaries, and temporary task state, with provenance and expiration; it also asks for review before export and retrieval-precision testing. These are product requests, not evidence that any of those controls exist today. The post showed 132 views when checked.
- **[r/github](https://www.reddit.com/r/github/comments/1jy8rea/comment/pbk8ch2/):** No direct replies to the YOU comment.
- **[Instagram](https://www.instagram.com/p/DdoY_u5juke/):** Two likes and no comments.
- **[LinkedIn](https://www.linkedin.com/feed/update/urn:li:share:7508518775856746497/):** Joe had already replied to the original portability question. The commenter followed up that portability also means preserving deliberately taught interaction preferences, such as tone, challenge, and source citations. The post showed 29 reactions and 899 impressions when checked. Do not treat a transferable assistant persona as a shipped capability.

### Product action

- Added name-aware retrieval to the demo's agent-facing `you_find_memories` page tool. A query for a person's name now finds that person's available memories while the existing private/excluded boundary stays in place. This is a small retrieval-quality fix, not a new connector or production agent API.
- Added regression tests; all 13 tests, lint, TypeScript, and production build passed locally.
- The refusal, retention, expiration, and export-review suggestions need a deliberate privacy/data-model decision before implementation. No privacy settings or live integrations changed.

### Outreach

- No new promotional post: launch posts were published yesterday. Reply drafts for the existing Reddit and LinkedIn conversations are awaiting Joe's approval; nothing was posted automatically.

## 2026-09-25 — weekday run

### Feedback collected

- **GitHub:** 0 stars, 0 forks, no issues, no open pull requests, discussions off. Only activity is Joe's merged [PR #1](https://github.com/saccojoseph/you/pull/1) and [PR #2](https://github.com/saccojoseph/you/pull/2). No outside feedback.
- **[LinkedIn](https://www.linkedin.com/feed/update/urn:li:share:7508518775856746497/):** Rechecked after Joe signed in. The 4 comments are Randy's two comments and Joe's two replies; all answered. 31 reactions, about 1,100 impressions. New signal in Randy's follow-up: trust depends on which model provider receives the context, which supports per-assistant grants (opinion).
- **Reddit ([r/SideProject](https://www.reddit.com/r/SideProject/comments/1wo5uk4/i_built_a_prototype_for_a_personal_ai_memory_you/), [r/github](https://www.reddit.com/r/github/comments/1jy8rea/comment/pbk8ch2/)):** A later signed-in check found both threads accessible. The SideProject thread shows the same two substantive comments and Joe's replies, with no new actionable feedback; the r/github comment has no direct replies.
- **[Instagram](https://www.instagram.com/p/DdoY_u5juke/):** Rechecked signed in: 2 likes, 1 repost, no comments.

### Themes carried forward (from Sept 24)

- Refusals must be enforced by the memory layer, not a prompt (opinion / feature request).
- Separate durable facts, episodic summaries, and temporary task state with expiry; review before export; retrieval-precision tests (feature request).
- Portability should include taught interaction preferences such as tone, challenge, and citing sources (feature request).

### Product action

- Branch `feature/agent-memory-proposals`, commit `380678e` (local only, not pushed): the `you_add_memory` page tool now saves an agent-written memory as **Needs review** with "Agent proposal" provenance and no confidence, instead of a user-known fact. Ask YOU will not present it as true until the user confirms it. This follows the architecture rule that agents propose rather than silently rewrite the graph and relates to the layer-enforced boundary theme.
  - `npm test`: 16/16 pass (3 new). `npx tsc --noEmit` clean. ESLint clean on changed files.
  - `npm run build`: still fails in the device shell on the known missing `@rolldown/binding-linux-arm64` native module (environment issue, not this change).
  - Uses `sourceType: "inference"` because the contract has no `agent` source type; adding one is left for Joe to decide.

### Reply drafts proposed (not posted)

- LinkedIn: none needed; Joe already replied to both comments.
- r/SideProject: replies on layer-enforced refusals and on memory types, only if still unanswered.

### Promotion

- None. Launch posts went out Sept 23; the plan's next owned-channel step is a week 2 walkthrough.

### Blockers

- LinkedIn and Instagram were signed out during the earlier check; Reddit became accessible in a later signed-in check. Chrome extension not connected.
- The device shell cannot delete files, so git left stale lock and temp files. They were moved to `_to_delete/` in the repo root (untracked) and the repo was left on `feature/agent-memory-proposals` because switching branches needs file deletion.

### Later review of the unpublished branch

- The browser check confirmed no new actionable Reddit feedback in either launch thread. GitHub still has no open issues or pull requests.
- A local test found that `you_find_memories` could return the value of a disputed agent proposal even though Ask YOU would withhold it. The proposed fix excludes disputed facts from agent search and the portable read-grant helper, and records agent provenance as `agent` rather than `inference`.
- Verification: 18 tests passed; TypeScript (`--incremental false`), lint, and the production build passed. This branch remains unpublished pending the normal GitHub review path. The unrelated `_to_delete/` directory was left untouched.

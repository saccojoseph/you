import assert from "node:assert/strict";
import test from "node:test";
import { accessEntry, appendAccessLog, grantFor, mayReadMemory, parseGrants, pendingAgentProposals } from "../lib/agent-access.ts";
import { agentProposedMemory } from "../lib/agent-proposal.ts";
import { parseMemoryExport } from "../lib/memory-export.ts";
import { searchAvailableMemories } from "../lib/memory-search.ts";
import { memories, people } from "../data/demo.ts";

const now = new Date("2026-09-28T12:00:00.000Z");

test("a client with no grant reads nothing", () => {
  const grant = grantFor("browser-agent", {});
  assert.deepEqual(grant.scopes, []);
  assert.equal(memories.some(memory => mayReadMemory(memory, grant, now)), false);
  assert.deepEqual(searchAvailableMemories("Mike", memories, people, 10, grant), []);
});

test("a grant opens only its categories", () => {
  const grant = grantFor("claude", { claude: ["people.read"] });
  const found = searchAvailableMemories("Mike", memories, people, 10, grant);
  assert.ok(found.length > 0);
  assert.ok(found.every(memory => memory.category === "People"));
  assert.equal(found.some(memory => memory.id === "m-mike-golf"), false, "golf is a preference, not granted");
});

test("grants never expose private or proposed memories", () => {
  const grant = grantFor("claude", { claude: ["people.read", "preferences.read", "routines.read", "plans.read", "wellbeing.read"] });
  const work = memories.find(memory => memory.id === "m-work");
  assert.equal(work.privacy, "private");
  assert.equal(mayReadMemory(work, grant, now), false);
  const proposal = agentProposedMemory({ label: "Favorite tea", value: "Oolong", subjectId: "self" }, now);
  assert.equal(mayReadMemory(proposal, grant, now), false);
});

test("grants are per client", () => {
  const grants = { claude: ["preferences.read"] };
  const golf = memories.find(memory => memory.id === "m-mike-golf");
  assert.equal(mayReadMemory(golf, grantFor("claude", grants), now), true);
  assert.equal(mayReadMemory(golf, grantFor("codex", grants), now), false);
});

test("agent proposals get unique IDs even in the same millisecond", () => {
  const ids = new Set(Array.from({ length: 50 }, () => agentProposedMemory({ label: "Tea", value: "Oolong", subjectId: "self" }, now).id));
  assert.equal(ids.size, 50);
  const proposals = [...ids].map(id => agentProposedMemory({ label: "Tea", value: "Oolong", subjectId: "self" }, now, id));
  assert.doesNotThrow(() => parseMemoryExport({ format: "you-memory-export", version: 1, memories: [...proposals, ...memories], people }));
  assert.equal(pendingAgentProposals(proposals), 50);
});

test("grants round-trip through export and reject unknown clients or scopes", () => {
  const base = { format: "you-memory-export", version: 1, memories, people };
  assert.deepEqual(parseMemoryExport({ ...base, grants: { claude: ["people.read", "people.read"] } }).grants, { claude: ["people.read"] });
  assert.throws(() => parseGrants({ mallory: ["people.read"] }), /Invalid grants/);
  assert.throws(() => parseGrants({ claude: ["everything.read"] }), /Invalid grants/);
  assert.throws(() => parseMemoryExport({ ...base, grants: [] }), /Invalid grants/);
});

test("the access log keeps the newest entries first and is capped", () => {
  let log = [];
  for (let i = 0; i < 5; i++) log = appendAccessLog(log, accessEntry("browser-agent", "you_find_memories", "allowed", `call ${i}`, now), 3);
  assert.deepEqual(log.map(entry => entry.detail), ["call 4", "call 3", "call 2"]);
});

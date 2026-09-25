import assert from "node:assert/strict";
import test from "node:test";
import { agentProposedMemory } from "../lib/agent-proposal.ts";
import { answerFromMemory } from "../lib/ask-memory.ts";
import { parseMemoryExport } from "../lib/memory-export.ts";
import { memories, people } from "../data/demo.ts";

const now = new Date("2026-09-25T12:00:00.000Z");

test("agent-written memories enter as needs review with agent provenance", () => {
  const fact = agentProposedMemory({ label: "  Favorite tea ", value: " Oolong ", subjectId: "self" }, now);
  assert.equal(fact.status, "disputed");
  assert.equal(fact.confidence, null);
  assert.equal(fact.lastVerified, null);
  assert.equal(fact.label, "Favorite tea");
  assert.equal(fact.value, "Oolong");
  assert.match(fact.source, /Agent proposal/);
  assert.notEqual(fact.sourceType, "user");
});

test("Ask YOU does not present an unconfirmed agent proposal as fact", () => {
  const fact = agentProposedMemory({ label: "Favorite tea", value: "Oolong", subjectId: "self" }, now);
  const answer = answerFromMemory("What is my favorite tea?", { memories: [fact, ...memories], people });
  assert.match(answer.text, /needs review/);
  assert.doesNotMatch(answer.text, /Oolong/);
});

test("agent proposals survive export and import as proposals", () => {
  const fact = agentProposedMemory({ label: "Favorite tea", value: "Oolong", subjectId: "self" }, now);
  const parsed = parseMemoryExport({ format: "you-memory-export", version: 1, memories: [fact, ...memories], people });
  assert.equal(parsed.memories[0].status, "disputed");
  assert.equal(parsed.memories[0].confidence, null);
});

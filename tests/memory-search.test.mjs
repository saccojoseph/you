import assert from "node:assert/strict";
import test from "node:test";
import { searchAvailableMemories } from "../lib/memory-search.ts";
import { memories, people } from "../data/demo.ts";

test("finds available memories by a person's name, regardless of case", () => {
  const results = searchAvailableMemories("  MIKE  ", memories, people);
  assert.deepEqual(results.map(memory => memory.id), ["m-mike-birthday", "m-mike-golf"]);
});

test("does not return private or excluded memories even when their subject matches", () => {
  const results = searchAvailableMemories("self", memories, people);
  assert.deepEqual(results.map(memory => memory.id), ["m-live-music", "m-boundary"]);
});

test("keeps text search and limits results", () => {
  assert.deepEqual(searchAvailableMemories("golf", memories, people).map(memory => memory.id), ["m-mike-golf"]);
  assert.equal(searchAvailableMemories("mike", memories, people, 1).length, 1);
  assert.deepEqual(searchAvailableMemories(" ", memories, people), []);
});

import assert from "node:assert/strict";
import test from "node:test";
import { parseMemoryExport } from "../lib/memory-export.ts";
import { memories, people } from "../data/demo.ts";

const exportFile = () => ({ format: "you-memory-export", version: 1, exportedAt: "2026-09-23T00:00:00.000Z", memories, people, dismissed: ["concert"], privateExtra: "never import me" });

test("round-trips valid people and facts without accepting extra state", () => {
  const parsed = parseMemoryExport(exportFile());
  assert.equal(parsed.memories.length, memories.length);
  assert.equal(parsed.people.length, people.length);
  assert.deepEqual(parsed.dismissed, ["concert"]);
  assert.equal("privateExtra" in parsed, false);
  assert.equal("exportedAt" in parsed, false);
});

test("rejects unsupported versions and malformed records", () => {
  assert.throws(() => parseMemoryExport({ ...exportFile(), version: 2 }), /not a supported/i);
  assert.throws(() => parseMemoryExport({ ...exportFile(), memories: [null] }), /invalid people or memories/i);
  assert.throws(() => parseMemoryExport({ ...exportFile(), memories: [{ ...memories[0], status: "known", confidence: 4 }] }), /invalid people or memories/i);
  assert.throws(() => parseMemoryExport({ ...exportFile(), people: [{ name: "Incomplete" }] }), /invalid people or memories/i);
});

test("rejects broken references, duplicates, and malformed settings", () => {
  assert.throws(() => parseMemoryExport({ ...exportFile(), memories: [...memories, memories[0]] }), /duplicate IDs/i);
  assert.throws(() => parseMemoryExport({ ...exportFile(), memories: [{ ...memories[0], subjectId: "missing" }] }), /no matching person/i);
  assert.throws(() => parseMemoryExport({ ...exportFile(), dismissed: ["concert", 8] }), /Invalid dismissed/i);
  assert.throws(() => parseMemoryExport({ ...exportFile(), permission: { claude: "yes" } }), /Invalid permissions/i);
});

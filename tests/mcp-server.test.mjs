import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { memories, people } from "../data/demo.ts";

const server = fileURLToPath(new URL("../mcp/you-mcp.mjs", import.meta.url));

function exportFile(grants) {
  const dir = mkdtempSync(join(tmpdir(), "you-mcp-"));
  const file = join(dir, "you-memory-export.json");
  writeFileSync(file, JSON.stringify({ format: "you-memory-export", version: 1, memories, people, grants }));
  return file;
}

/** Start the server, send JSON-RPC requests in order, and collect one response per request. */
async function session(file, client, requests) {
  const child = spawn(process.execPath, ["--experimental-strip-types", "--no-warnings", server, "--file", file, "--client", client], { stdio: ["pipe", "pipe", "pipe"] });
  const responses = new Map();
  let buffer = "";
  child.stdout.on("data", chunk => {
    buffer += chunk;
    for (let index; (index = buffer.indexOf("\n")) > -1; buffer = buffer.slice(index + 1)) {
      const line = buffer.slice(0, index).trim();
      if (line) { const message = JSON.parse(line); responses.set(message.id, message); }
    }
  });
  const expected = requests.filter(request => request.id !== undefined).length;
  for (const request of requests) child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", ...request })}\n`);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("MCP server timed out")), 10_000);
    const check = setInterval(() => { if (responses.size >= expected) { clearTimeout(timer); clearInterval(check); resolve(); } }, 10);
  });
  child.kill();
  return responses;
}

const call = (id, name, args = {}) => ({ id, method: "tools/call", params: { name, arguments: args } });
const payload = response => JSON.parse(response.result.content[0].text);

test("speaks MCP: initialize, list tools, ignore notifications", async () => {
  const responses = await session(exportFile({}), "claude", [
    { id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } } },
    { method: "notifications/initialized" },
    { id: 2, method: "tools/list" },
    { id: 3, method: "nope" },
  ]);
  assert.equal(responses.get(1).result.protocolVersion, "2025-06-18");
  assert.equal(responses.get(1).result.serverInfo.name, "you-memory");
  assert.deepEqual(responses.get(2).result.tools.map(tool => tool.name), ["you_search_context", "you_get_person", "you_explain_fact", "you_list_open_loops", "you_propose_memory"]);
  assert.equal(responses.get(3).error.code, -32601);
});

test("denies everything without a grant and logs the denials", async () => {
  const file = exportFile({ codex: ["people.read"] });
  const responses = await session(file, "claude", [call(1, "you_search_context", { query: "Mike" }), call(2, "you_get_person", { person: "Mike" }), call(3, "you_propose_memory", { label: "Tea", value: "Oolong" })]);
  for (const id of [1, 2, 3]) assert.equal(responses.get(id).result.isError, true);
  const log = readFileSync(`${file}.access-log.jsonl`, "utf8").trim().split("\n").map(line => JSON.parse(line));
  assert.deepEqual(log.map(entry => [entry.clientId, entry.outcome]), [["claude", "denied"], ["claude", "denied"], ["claude", "denied"]]);
});

test("returns only granted categories, never private facts, with state and provenance", async () => {
  const file = exportFile({ claude: ["people.read", "routines.read"] });
  const responses = await session(file, "claude", [
    call(1, "you_get_person", { person: "mike" }),
    call(2, "you_search_context", { query: "work" }),
    call(3, "you_explain_fact", { id: "m-mike-golf" }),
    call(4, "you_explain_fact", { id: "m-mike-birthday" }),
  ]);
  const mike = payload(responses.get(1));
  assert.equal(mike.name, "Mike Thompson");
  assert.deepEqual(mike.facts.map(fact => fact.id), ["m-mike-birthday"], "golf is a preference and was not granted");
  assert.deepEqual(payload(responses.get(2)).results, [], "the busy-week routine is private");
  assert.equal(responses.get(3).result.isError, true);
  const birthday = payload(responses.get(4));
  assert.equal(birthday.state, "known");
  assert.match(birthday.evidence, /contact card/);
});

test("proposals are written back as Needs review and stay invisible to reads", async () => {
  const file = exportFile({ claude: ["preferences.read", "memory.write"] });
  const responses = await session(file, "claude", [call(1, "you_propose_memory", { label: "Favorite tea", value: "Oolong", category: "Preferences" })]);
  assert.equal(payload(responses.get(1)).state, "needs_review");
  const saved = JSON.parse(readFileSync(file, "utf8"));
  assert.equal(saved.memories[0].label, "Favorite tea");
  assert.equal(saved.memories[0].status, "disputed");
  assert.equal(saved.memories[0].sourceType, "agent");
  assert.match(saved.memories[0].source, /Claude via MCP/);
  const after = await session(file, "claude", [call(1, "you_search_context", { query: "Oolong" })]);
  assert.deepEqual(payload(after.get(1)).results, []);
});

#!/usr/bin/env node
/**
 * YOU local MCP server (preview).
 *
 * Serves one YOU memory export to one MCP client over stdio. The client sees only what the user granted
 * that client in YOU → Privacy & access; private memories and memories awaiting review are always withheld.
 * Proposals are written back into the export as "Needs review" for the user to import and review.
 * Every call, allowed or denied, is appended to <export>.access-log.jsonl.
 *
 *   node --experimental-strip-types --no-warnings mcp/you-mcp.mjs --file you-memory-export.json --client claude
 *
 * No dependencies and no network access. stdout carries only JSON-RPC; diagnostics go to stderr.
 */
import { appendFileSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { accessEntry, agentClientIds, grantFor, hasScope, isAgentClientId, mayReadMemory, maxPendingProposals, pendingAgentProposals } from "../lib/agent-access.ts";
import { agentProposedMemory } from "../lib/agent-proposal.ts";
import { parseMemoryExport } from "../lib/memory-export.ts";
import { searchAvailableMemories } from "../lib/memory-search.ts";

const serverInfo = { name: "you-memory", version: "0.1.0" };
const supportedVersions = ["2025-06-18", "2025-03-26", "2024-11-05"];
const categories = ["People", "Preferences", "Routines", "Plans", "Wellbeing"];

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : undefined;
}

const fileArg = argument("file");
const clientId = argument("client") ?? "other-mcp";
if (!fileArg || !isAgentClientId(clientId)) {
  process.stderr.write(`Usage: you-mcp --file <you-memory-export.json> [--client ${agentClientIds.filter(id => id !== "browser-agent").join("|")}]\n`);
  process.exit(1);
}
const file = resolve(fileArg);
const logFile = `${file}.access-log.jsonl`;

function load() {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  const engram = parseMemoryExport(raw);
  return { raw, engram, grant: grantFor(clientId, engram.grants) };
}

function log(tool, outcome, detail) {
  try { appendFileSync(logFile, `${JSON.stringify(accessEntry(clientId, tool, outcome, detail))}\n`); }
  catch (error) { process.stderr.write(`you-mcp: could not write access log: ${error.message}\n`); }
}

function about(subjectId, people) {
  return subjectId === "self" ? "the user" : people.find(person => person.id === subjectId)?.name ?? subjectId;
}

function shape(memory, people, withEvidence = false) {
  const fact = {
    id: memory.id, about: about(memory.subjectId, people), category: memory.category, label: memory.label, value: memory.value,
    state: memory.status, confidence: memory.confidence, source: memory.source, observedAt: memory.observedAt, lastVerified: memory.lastVerified,
  };
  if (memory.status === "inferred") fact.note = "Inferred, not confirmed. Do not present this as certain.";
  if (memory.status === "unknown") fact.note = "YOU does not know this. Do not guess.";
  return withEvidence ? { ...fact, evidence: memory.evidence } : fact;
}

const ok = payload => ({ content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] });
const refuse = message => ({ content: [{ type: "text", text: message }], isError: true });
const notGranted = scope => `Access not granted. The user has not given this assistant ${scope} in YOU → Privacy & access.`;
const text = (value, max = 500) => typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

const tools = [
  {
    name: "you_search_context",
    title: "Search YOU memory",
    description: "Search the user's memory for facts the user has shared with this assistant. Each fact carries its state (known, inferred, unknown), confidence, and source. Treat inferred facts as uncertain.",
    inputSchema: { type: "object", properties: { query: { type: "string", description: "Words to find, such as a person's name or a topic." }, limit: { type: "integer", minimum: 1, maximum: 25 } }, required: ["query"], additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run({ query, limit }, { engram, grant }) {
      const q = text(query, 200);
      if (!q) return refuse("query must be a non-empty string.");
      if (!grant.scopes.some(scope => scope.endsWith(".read"))) { log("you_search_context", "denied", `Search “${q.slice(0, 60)}” · no read scope`); return refuse(notGranted("any read scope")); }
      const found = searchAvailableMemories(q, engram.memories, engram.people, Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 25) : 10, grant);
      log("you_search_context", "allowed", `Search “${q.slice(0, 60)}” · ${found.length} returned`);
      return ok({ query: q, results: found.map(memory => shape(memory, engram.people)), note: found.length ? undefined : "No shared memory matches. That does not mean the answer is no." });
    },
  },
  {
    name: "you_get_person",
    title: "Get a person",
    description: "Look up a person in the user's life by name or ID, with the facts about them this assistant may read.",
    inputSchema: { type: "object", properties: { person: { type: "string", description: "A name, first name, or person ID." } }, required: ["person"], additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run({ person }, { engram, grant }) {
      const q = text(person, 120)?.toLowerCase();
      if (!q) return refuse("person must be a non-empty string.");
      if (!hasScope(grant, "people.read")) { log("you_get_person", "denied", `Person “${q.slice(0, 60)}” · people.read not granted`); return refuse(notGranted("people.read")); }
      const match = engram.people.find(p => p.id === q || p.name.toLowerCase() === q) ?? engram.people.find(p => p.name.split(" ")[0].toLowerCase() === q);
      if (!match) { log("you_get_person", "allowed", `Person “${q.slice(0, 60)}” · not found`); return ok({ found: false, note: "No saved person matches." }); }
      const facts = engram.memories.filter(memory => memory.subjectId === match.id && mayReadMemory(memory, grant));
      log("you_get_person", "allowed", `Person ${match.name} · ${facts.length} facts returned`);
      return ok({ found: true, id: match.id, name: match.name, relation: match.relation, closeness: match.importance, lastContact: match.lastContact, notes: match.details, facts: facts.map(memory => shape(memory, engram.people)) });
    },
  },
  {
    name: "you_explain_fact",
    title: "Explain a fact",
    description: "Return the evidence, source, state, and confidence behind one fact by its ID.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"], additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run({ id }, { engram, grant }) {
      const memory = typeof id === "string" ? engram.memories.find(m => m.id === id) : undefined;
      if (!memory || !mayReadMemory(memory, grant)) {
        log("you_explain_fact", "denied", `Fact ${String(id).slice(0, 60)} · not available to this assistant`);
        return refuse("That fact is not available to this assistant.");
      }
      log("you_explain_fact", "allowed", `Explained “${memory.label}”`);
      return ok(shape(memory, engram.people, true));
    },
  },
  {
    name: "you_list_open_loops",
    title: "List open loops",
    description: "List plans and possible commitments the user may still need to follow up on.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run(_args, { engram, grant }) {
      if (!hasScope(grant, "plans.read")) { log("you_list_open_loops", "denied", "plans.read not granted"); return refuse(notGranted("plans.read")); }
      const loops = engram.memories.filter(memory => memory.category === "Plans" && (memory.status === "known" || memory.status === "inferred") && mayReadMemory(memory, grant));
      log("you_list_open_loops", "allowed", `${loops.length} returned`);
      return ok({ openLoops: loops.map(memory => shape(memory, engram.people)) });
    },
  },
  {
    name: "you_propose_memory",
    title: "Propose a memory",
    description: "Suggest a new fact for the user to review. It is saved as Needs review and is not treated as true, or shared with any assistant, until the user accepts it in YOU.",
    inputSchema: {
      type: "object",
      properties: { label: { type: "string" }, value: { type: "string" }, subjectId: { type: "string", description: "\"self\" for the user, or a person ID from you_get_person." }, category: { type: "string", enum: categories } },
      required: ["label", "value"], additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    run({ label, value, subjectId = "self", category }, { raw, engram, grant }) {
      const cleanLabel = text(label, 120);
      const cleanValue = text(value);
      if (!cleanLabel || !cleanValue) return refuse("label and value must be non-empty strings.");
      if (!hasScope(grant, "memory.write")) { log("you_propose_memory", "denied", `Proposal “${cleanLabel.slice(0, 60)}” · memory.write not granted`); return refuse(notGranted("memory.write")); }
      if (category !== undefined && !categories.includes(category)) return refuse(`category must be one of ${categories.join(", ")}.`);
      if (subjectId !== "self" && (!hasScope(grant, "people.read") || !engram.people.some(p => p.id === subjectId))) return refuse("subjectId must be \"self\" or a person ID this assistant can read.");
      if (pendingAgentProposals(engram.memories) >= maxPendingProposals) {
        log("you_propose_memory", "denied", `Proposal “${cleanLabel.slice(0, 60)}” · review queue full`);
        return refuse(`The user already has ${maxPendingProposals} proposals waiting for review.`);
      }
      const fact = agentProposedMemory({ label: cleanLabel, value: cleanValue, subjectId, category });
      fact.source = `Agent proposal · ${grant.displayName} via MCP`;
      fact.evidence = `Proposed by ${grant.displayName} through the YOU MCP server. It needs your confirmation before YOU treats it as known.`;
      const next = { ...raw, memories: [fact, ...raw.memories] };
      const temp = `${file}.${process.pid}.tmp`;
      writeFileSync(temp, `${JSON.stringify(next, null, 2)}\n`);
      renameSync(temp, file);
      log("you_propose_memory", "allowed", `Proposed “${fact.label}” for review`);
      return ok({ id: fact.id, state: "needs_review", note: "Saved as a proposal in the user's export. The user reviews it after importing the file into YOU." });
    },
  },
];

const instructions = "YOU is the user's own memory of their people, plans, and preferences. You see only what the user granted you. "
  + "Each fact has a state: known, inferred (uncertain), or unknown. Never present inferred facts as certain and never guess unknown ones. "
  + "You cannot change facts; you_propose_memory only suggests one for the user to review.";

function handle(message) {
  const { id, method, params } = message;
  if (method === "initialize") {
    const requested = params?.protocolVersion;
    return { protocolVersion: supportedVersions.includes(requested) ? requested : supportedVersions[0], capabilities: { tools: {} }, serverInfo, instructions };
  }
  if (method === "ping") return {};
  if (method === "tools/list") return { tools: tools.map(({ name, title, description, inputSchema, annotations }) => ({ name, title, description, inputSchema, annotations })) };
  if (method === "tools/call") {
    const tool = tools.find(item => item.name === params?.name);
    if (!tool) throw Object.assign(new Error(`Unknown tool: ${params?.name}`), { code: -32602 });
    let context;
    try { context = load(); }
    catch (error) { return refuse(`Could not read the YOU export: ${error.message}`); }
    return tool.run(params?.arguments ?? {}, context);
  }
  if (id === undefined) return undefined; // notifications such as notifications/initialized
  throw Object.assign(new Error(`Method not found: ${method}`), { code: -32601 });
}

function send(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

createInterface({ input: process.stdin }).on("line", line => {
  if (!line.trim()) return;
  let message;
  try { message = JSON.parse(line); }
  catch { send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }); return; }
  try {
    const result = handle(message);
    if (message.id !== undefined && result !== undefined) send({ jsonrpc: "2.0", id: message.id, result });
  } catch (error) {
    if (message.id !== undefined) send({ jsonrpc: "2.0", id: message.id, error: { code: error.code ?? -32603, message: error.message } });
  }
});

try { load(); process.stderr.write(`you-mcp: serving ${file} to client "${clientId}"\n`); }
catch (error) { process.stderr.write(`you-mcp: warning, ${file} is not a readable YOU export yet: ${error.message}\n`); }

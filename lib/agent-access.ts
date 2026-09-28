import type { Memory } from "../data/demo";
import { mayReadFact, type ContextGrant, type ContextScope, type PortableFact } from "./context-contract.ts";
import { newId } from "./ids.ts";

export type AgentClientId = "browser-agent" | "claude" | "openai" | "codex" | "other-mcp";
export type Grants = Partial<Record<AgentClientId, ContextScope[]>>;
export type AccessLogEntry = {
  id: string;
  at: string;
  clientId: AgentClientId;
  tool: string;
  outcome: "allowed" | "denied";
  detail: string;
};

export const agentClients: { id: AgentClientId; name: string; enforcedBy: string }[] = [
  { id: "browser-agent", name: "Browser agents", enforcedBy: "Enforced now for agents using this page's WebMCP tools" },
  { id: "claude", name: "Claude", enforcedBy: "Saved in your export · enforced by the local MCP server" },
  { id: "openai", name: "OpenAI / ChatGPT", enforcedBy: "Saved in your export · enforced by the local MCP server" },
  { id: "codex", name: "Codex", enforcedBy: "Saved in your export · enforced by the local MCP server" },
  { id: "other-mcp", name: "Other MCP clients", enforcedBy: "Saved in your export · enforced by the local MCP server" },
];
export const agentClientIds = agentClients.map(client => client.id);

/** Scopes a user can grant from the UI. Each read scope matches one memory category. */
export const grantableScopes: { scope: ContextScope; label: string }[] = [
  { scope: "people.read", label: "People" },
  { scope: "preferences.read", label: "Preferences" },
  { scope: "routines.read", label: "Routines" },
  { scope: "plans.read", label: "Plans" },
  { scope: "wellbeing.read", label: "Wellbeing" },
  { scope: "memory.write", label: "Propose memories" },
];
export const allScopes: ContextScope[] = ["people.read", "preferences.read", "routines.read", "plans.read", "wellbeing.read", "insights.read", "memory.write"];

/** Pending agent proposals are capped so an agent cannot flood the review queue. */
export const maxPendingProposals = 25;

export function grantFor(clientId: AgentClientId, grants: Grants | undefined): ContextGrant {
  const client = agentClients.find(item => item.id === clientId);
  return { clientId, displayName: client?.name ?? clientId, scopes: grants?.[clientId] ?? [] };
}

export function hasScope(grant: ContextGrant, scope: ContextScope): boolean {
  return !grant.revokedAt && grant.scopes.includes(scope);
}

function toPortableFact(memory: Memory): PortableFact {
  return {
    id: memory.id,
    subjectId: memory.subjectId,
    category: memory.category.toLowerCase() as PortableFact["category"],
    key: memory.label,
    value: memory.value,
    status: memory.status,
    confidence: memory.confidence,
    evidence: [],
    lastVerified: memory.lastVerified,
    visibility: memory.privacy,
  };
}

/** One policy for every agent path: available, not awaiting review, and inside a granted category scope. */
export function mayReadMemory(memory: Memory, grant: ContextGrant, now: Date = new Date()): boolean {
  return mayReadFact(toPortableFact(memory), grant, now);
}

export function pendingAgentProposals(memories: Memory[]): number {
  return memories.filter(memory => memory.sourceType === "agent" && memory.status === "disputed").length;
}

export function accessEntry(clientId: AgentClientId, tool: string, outcome: AccessLogEntry["outcome"], detail: string, now: Date = new Date()): AccessLogEntry {
  return { id: newId("access"), at: now.toISOString(), clientId, tool, outcome, detail };
}

export function appendAccessLog(log: AccessLogEntry[], entry: AccessLogEntry, max = 200): AccessLogEntry[] {
  return [entry, ...log].slice(0, max);
}

export function isAgentClientId(value: unknown): value is AgentClientId {
  return typeof value === "string" && (agentClientIds as string[]).includes(value);
}

/** Accept only known clients and known scopes. */
export function parseGrants(value: unknown): Grants {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid grants in the export.");
  const grants: Grants = {};
  for (const [clientId, scopes] of Object.entries(value)) {
    if (!isAgentClientId(clientId) || !Array.isArray(scopes) || !scopes.every(scope => (allScopes as unknown[]).includes(scope))) {
      throw new Error("Invalid grants in the export.");
    }
    grants[clientId] = [...new Set(scopes as ContextScope[])];
  }
  return grants;
}

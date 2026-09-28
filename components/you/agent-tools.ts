"use client";

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { agentProposedMemory } from "@/lib/agent-proposal";
import { accessEntry, appendAccessLog, grantFor, hasScope, maxPendingProposals, pendingAgentProposals, type AccessLogEntry } from "@/lib/agent-access";
import { searchAvailableMemories } from "@/lib/memory-search";
import type { SavedState } from "./state";

type PageTool = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: unknown) => unknown | Promise<unknown> };
type PageModelContext = { registerTool: (tool: PageTool, options?: { signal?: AbortSignal }) => void | Promise<void> };

const clientId = "browser-agent" as const;
const notGranted = "Access not granted. The user can allow Browser agents in YOU → Privacy & access.";

/**
 * Registers WebMCP page tools. Every call is checked against the user's Browser agents grant
 * and recorded in the access log, whether it is allowed or denied.
 */
export function useAgentTools(hydrated: boolean, data: SavedState, setData: Dispatch<SetStateAction<SavedState>>, notify: (message: string) => void) {
  const latest = useRef(data);
  useEffect(() => { latest.current = data; }, [data]);

  useEffect(() => {
    if (!hydrated) return;
    const context = (document as Document & { modelContext?: PageModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const log = (entry: AccessLogEntry) => setData(prev => ({ ...prev, accessLog: appendAccessLog(prev.accessLog, entry) }));
    const register = async (tool: PageTool) => { try { await context.registerTool(tool, { signal: lifecycle.signal }); } catch { /* Browser has no usable WebMCP registry. */ } };

    void register({
      name: "you_find_memories",
      title: "Find available memories",
      description: "Search memories the user has made available to browser agents, including by person name. Only categories the user granted are returned. Returns state, confidence, and provenance.",
      inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute(input) {
        if (!input || typeof input !== "object" || typeof (input as { query?: unknown }).query !== "string") throw new Error("query must be a string");
        const q = (input as { query: string }).query;
        if (!q.trim()) throw new Error("query cannot be empty");
        const { memories, people, grants } = latest.current;
        const grant = grantFor(clientId, grants);
        if (!grant.scopes.some(scope => scope.endsWith(".read"))) {
          log(accessEntry(clientId, "you_find_memories", "denied", `Search “${q.slice(0, 60)}” · no read scope granted`));
          throw new Error(notGranted);
        }
        const found = searchAvailableMemories(q, memories, people, 10, grant);
        log(accessEntry(clientId, "you_find_memories", "allowed", `Search “${q.slice(0, 60)}” · ${found.length} ${found.length === 1 ? "memory" : "memories"} returned`));
        return { memories: found.map(({ id, subjectId, label, value, status, confidence, source, observedAt }) => ({ id, subjectId, label, value, status, confidence, source, observedAt })) };
      },
    });

    void register({
      name: "you_add_memory",
      title: "Propose a memory",
      description: "Propose a memory for the user to review in YOU. Requires the user's memory.write grant. It is saved as Needs review with agent provenance and is not treated as known until the user confirms it.",
      inputSchema: { type: "object", properties: { label: { type: "string" }, value: { type: "string" }, subjectId: { type: "string" } }, required: ["label", "value"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(input) {
        if (!input || typeof input !== "object") throw new Error("Expected an object");
        const args = input as { label?: unknown; value?: unknown; subjectId?: unknown };
        if (typeof args.label !== "string" || !args.label.trim() || typeof args.value !== "string" || !args.value.trim()) throw new Error("label and value are required strings");
        const { memories, people, grants } = latest.current;
        if (!hasScope(grantFor(clientId, grants), "memory.write")) {
          log(accessEntry(clientId, "you_add_memory", "denied", `Proposal “${args.label.slice(0, 60)}” · memory.write not granted`));
          throw new Error(notGranted);
        }
        const subjectId = typeof args.subjectId === "string" ? args.subjectId : "self";
        if (subjectId !== "self" && !people.some(p => p.id === subjectId)) throw new Error("Unknown subjectId");
        if (pendingAgentProposals(memories) >= maxPendingProposals) {
          log(accessEntry(clientId, "you_add_memory", "denied", `Proposal “${args.label.slice(0, 60)}” · review queue is full`));
          throw new Error(`The user has ${maxPendingProposals} agent proposals waiting for review. Try again after they review them.`);
        }
        const fact = agentProposedMemory({ label: args.label, value: args.value, subjectId });
        const entry = accessEntry(clientId, "you_add_memory", "allowed", `Proposed “${fact.label}” for review`);
        latest.current = { ...latest.current, memories: [fact, ...latest.current.memories] };
        setData(prev => ({ ...prev, memories: [fact, ...prev.memories], accessLog: appendAccessLog(prev.accessLog, entry) }));
        notify(`An agent proposed “${fact.label}”. It is waiting in Review.`);
        return { id: fact.id, status: "needs_review", visibleIn: "Review", note: "Saved as a proposal. The user must confirm it before YOU treats it as known." };
      },
    });

    return () => lifecycle.abort();
  }, [hydrated, setData, notify]);
}

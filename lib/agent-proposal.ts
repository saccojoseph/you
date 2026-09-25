import type { Memory } from "../data/demo";

export type AgentProposalInput = { label: string; value: string; subjectId: string };

/**
 * A memory written by an agent through a page tool is a proposal, not a fact.
 * It enters as "Needs review" with no confidence and agent provenance, so Ask YOU
 * will not present it as true until the user confirms it in the memory browser.
 */
export function agentProposedMemory(input: AgentProposalInput, now: Date = new Date()): Memory {
  const date = now.toISOString().slice(0, 10);
  return {
    id: `agent-proposal-${now.getTime()}`,
    subjectId: input.subjectId,
    category: "Preferences",
    label: input.label.trim(),
    value: input.value.trim(),
    status: "disputed",
    confidence: null,
    source: "Agent proposal · page tool",
    sourceType: "agent",
    observedAt: date,
    lastVerified: null,
    evidence: "Proposed by an agent through the YOU page tool. It needs your confirmation before YOU treats it as known.",
    privacy: "available",
  };
}

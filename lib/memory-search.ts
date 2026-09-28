import type { Memory, Person } from "../data/demo";
import type { ContextGrant } from "./context-contract.ts";
import { mayReadMemory } from "./agent-access.ts";

/**
 * Search only agent-available memories, including the subject's visible name.
 * With a grant, results are further limited to the categories that grant allows.
 */
export function searchAvailableMemories(query: string, memories: Memory[], people: Person[], limit = 10, grant?: ContextGrant): Memory[] {
  const needle = query.trim().toLowerCase();
  if (!needle || limit <= 0) return [];

  const names = new Map(people.map(person => [person.id, person.name]));
  return memories.filter(memory => {
    if (memory.privacy !== "available" || memory.status === "disputed") return false;
    if (grant && !mayReadMemory(memory, grant)) return false;
    const subject = memory.subjectId === "self" ? "You" : names.get(memory.subjectId) ?? "";
    return `${subject} ${memory.subjectId} ${memory.label} ${memory.value} ${memory.category}`.toLowerCase().includes(needle);
  }).slice(0, limit);
}

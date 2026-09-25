import type { Memory, Person } from "../data/demo";

/** Search only agent-available demo memories, including the subject's visible name. */
export function searchAvailableMemories(query: string, memories: Memory[], people: Person[], limit = 10): Memory[] {
  const needle = query.trim().toLowerCase();
  if (!needle || limit <= 0) return [];

  const names = new Map(people.map(person => [person.id, person.name]));
  return memories.filter(memory => {
    if (memory.privacy !== "available" || memory.status === "disputed") return false;
    const subject = memory.subjectId === "self" ? "You" : names.get(memory.subjectId) ?? "";
    return `${subject} ${memory.subjectId} ${memory.label} ${memory.value} ${memory.category}`.toLowerCase().includes(needle);
  }).slice(0, limit);
}

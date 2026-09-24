import type { Memory, Person } from "../data/demo";

type ImportedMemory = {
  memories: Memory[];
  people: Person[];
  dismissed?: string[];
  handled?: string[];
  reminders?: string[];
  mutedKinds?: string[];
  permission?: Record<string, boolean>;
  onboarded?: boolean;
  introSeen?: boolean;
  selectedSources?: string[];
  selectedHarness?: string;
  routines?: string[];
  publicDiscovery?: boolean;
  publicProfileUrl?: string;
  seedVersion?: number;
};

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function string(value: unknown): value is string {
  return typeof value === "string";
}

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(string);
}

function oneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === "string" && options.includes(value as T);
}

function validMemory(value: unknown): value is Memory {
  if (!record(value)) return false;
  const status = value.status;
  const confidence = value.confidence;
  return string(value.id) && string(value.subjectId)
    && oneOf(value.category, ["People", "Preferences", "Routines", "Plans", "Wellbeing"])
    && string(value.label) && string(value.value)
    && oneOf(status, ["known", "inferred", "unknown", "disputed"])
    && (status === "known" || status === "inferred"
      ? typeof confidence === "number" && Number.isFinite(confidence) && confidence >= 0 && confidence <= 1
      : confidence === null)
    && string(value.source)
    && oneOf(value.sourceType, ["user", "email", "calendar", "contacts", "inference", "demo"])
    && string(value.observedAt) && (value.lastVerified === null || string(value.lastVerified))
    && string(value.evidence)
    && oneOf(value.privacy, ["available", "private", "excluded"]);
}

function validPerson(value: unknown): value is Person {
  return record(value)
    && string(value.id) && string(value.name) && string(value.relation)
    && oneOf(value.importance, ["Inner circle", "Close", "Regular"])
    && string(value.initials) && string(value.color) && string(value.lastContact)
    && (value.nextMoment === undefined || string(value.nextMoment))
    && string(value.details);
}

/** Parse only the versioned, supported browser export fields; never merge unchecked JSON into state. */
export function parseMemoryExport(input: unknown): ImportedMemory {
  if (!record(input) || input.format !== "you-memory-export" || input.version !== 1) {
    throw new Error("This is not a supported YOU memory export.");
  }
  if (!Array.isArray(input.memories) || input.memories.length > 10_000 || !input.memories.every(validMemory)
    || !Array.isArray(input.people) || input.people.length > 2_000 || !input.people.every(validPerson)) {
    throw new Error("The export contains invalid people or memories.");
  }

  const people = input.people as Person[];
  const memories = input.memories as Memory[];
  const personIds = new Set(people.map(person => person.id));
  if (personIds.size !== people.length || new Set(memories.map(memory => memory.id)).size !== memories.length
    || memories.some(memory => memory.subjectId !== "self" && !personIds.has(memory.subjectId))) {
    throw new Error("The export has duplicate IDs or memories with no matching person.");
  }

  const result: ImportedMemory = { memories, people };
  for (const key of ["dismissed", "handled", "reminders", "mutedKinds", "selectedSources", "routines"] as const) {
    if (input[key] !== undefined) {
      if (!stringArray(input[key])) throw new Error(`Invalid ${key} in the export.`);
      result[key] = input[key];
    }
  }
  for (const key of ["onboarded", "introSeen", "publicDiscovery"] as const) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== "boolean") throw new Error(`Invalid ${key} in the export.`);
      result[key] = input[key];
    }
  }
  for (const key of ["selectedHarness", "publicProfileUrl"] as const) {
    if (input[key] !== undefined) {
      if (!string(input[key])) throw new Error(`Invalid ${key} in the export.`);
      result[key] = input[key];
    }
  }
  if (input.permission !== undefined) {
    if (!record(input.permission) || !Object.values(input.permission).every(value => typeof value === "boolean")) {
      throw new Error("Invalid permissions in the export.");
    }
    result.permission = input.permission as Record<string, boolean>;
  }
  if (input.seedVersion !== undefined) {
    if (!Number.isInteger(input.seedVersion) || (input.seedVersion as number) < 0) throw new Error("Invalid export seed version.");
    result.seedVersion = input.seedVersion as number;
  }
  return result;
}

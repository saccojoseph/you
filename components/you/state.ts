import { memories as seedMemories, people as seedPeople, type Memory, type Person } from "@/data/demo";
import { parseGrants, type AccessLogEntry, type Grants } from "@/lib/agent-access";
import type { MemoryAnswer } from "@/lib/ask-memory";

export type View = "for-you" | "review" | "memory" | "people" | "relationships" | "timeline" | "reminders" | "ask" | "connections" | "settings";
export type SavedState = {
  memories: Memory[];
  people: Person[];
  dismissed: string[];
  handled: string[];
  reminders: string[];
  mutedKinds: string[];
  permission: Record<string, boolean>;
  onboarded: boolean;
  introSeen: boolean;
  selectedSources: string[];
  selectedHarness: string;
  routines: string[];
  publicDiscovery: boolean;
  publicProfileUrl: string;
  seedVersion: number;
  grants: Grants;
  accessLog: AccessLogEntry[];
};

export const seedVersion = 3;
export const storageKey = "you-prototype-v2";
export const askHistoryKey = "you-ask-history-v1";
export const seedMemoryIds = new Set(seedMemories.map(memory => memory.id));
export const initialState: SavedState = {
  memories: seedMemories, people: seedPeople, dismissed: [], handled: [], reminders: [], mutedKinds: [], permission: {},
  onboarded: false, introSeen: false, selectedSources: [], selectedHarness: "", routines: [], publicDiscovery: false,
  publicProfileUrl: "", seedVersion, grants: {}, accessLog: [],
};

function safeGrants(value: unknown): Grants {
  try { return value === undefined ? {} : parseGrants(value); } catch { return {}; }
}

export function readState(): SavedState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return initialState;
    const stored = JSON.parse(raw) as Partial<SavedState>;
    const memories = stored.memories ?? seedMemories;
    const newSeedIds = new Set(["m-chris-rhythm", "m-steve-loop"]);
    const migratedMemories = stored.seedVersion === seedVersion ? memories : [
      ...memories,
      ...seedMemories.filter(memory => newSeedIds.has(memory.id) && !memories.some(saved => saved.id === memory.id)),
    ];
    return {
      ...initialState, ...stored, seedVersion, memories: migratedMemories, people: stored.people ?? seedPeople,
      grants: safeGrants(stored.grants), accessLog: Array.isArray(stored.accessLog) ? stored.accessLog : [],
    };
  } catch { return initialState; }
}

/** Storage can be full or blocked (some private windows). Report failure instead of crashing the app. */
export function writeState(state: SavedState): boolean {
  try { window.localStorage.setItem(storageKey, JSON.stringify(state)); return true; } catch { return false; }
}

export function readAskHistory(): MemoryAnswer[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(askHistoryKey) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is MemoryAnswer => !!item && typeof item.question === "string" && typeof item.text === "string" && Array.isArray(item.sources)) : [];
  } catch { return []; }
}

export function writeAskHistory(answers: MemoryAnswer[]): void {
  try { window.localStorage.setItem(askHistoryKey, JSON.stringify(answers.slice(-50))); } catch { /* Conversation history is a convenience. */ }
}

export function clearStoredState(): void {
  try { window.localStorage.removeItem(storageKey); window.localStorage.removeItem(askHistoryKey); } catch { /* Nothing stored. */ }
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

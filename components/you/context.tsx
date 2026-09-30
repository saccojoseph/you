"use client";

import { createContext, useContext, type Dispatch, type SetStateAction } from "react";
import type { Insight, Memory, Person } from "@/data/demo";
import type { AgentClientId } from "@/lib/agent-access";
import type { ContextScope } from "@/lib/context-contract";
import type { MemoryAnswer } from "@/lib/ask-memory";
import type { SavedState, View } from "./state";

export type Modal =
  | { kind: "add-memory"; subjectId: string }
  | { kind: "person"; personId: string | null }
  | { kind: "delete-person"; personId: string }
  | { kind: "add-date"; personId: string }
  | { kind: "reminder" }
  | { kind: "action" }
  | { kind: "reset" }
  | { kind: "export" }
  | { kind: "setup" }
  | null;

export type MemoryEdit = { label: string; value: string };
export type PersonDraft = { name: string; relation: string; importance: Person["importance"] };

export type YouApi = {
  data: SavedState;
  setData: Dispatch<SetStateAction<SavedState>>;
  /** The viewer's date, known only after hydration: the server may be in another time zone (workerd runs in UTC). */
  today: Date | null;
  todayText: string;
  answers: MemoryAnswer[];
  navigate: (view: View) => void;
  openPerson: (id: string) => void;
  closePerson: () => void;
  openMemory: (id: string, options?: { edit?: boolean }) => void;
  openModal: (modal: Modal) => void;
  showInsight: (insight: Insight) => void;
  notify: (message: string) => void;
  confirmMemory: (id: string) => void;
  correctMemory: (id: string, edit: MemoryEdit) => void;
  markForReview: (id: string) => void;
  removeMemory: (id: string) => void;
  setMemoryPrivacy: (id: string, privacy: Memory["privacy"]) => void;
  dismiss: (id: string) => void;
  remind: (id: string) => void;
  completeReminder: (id: string) => void;
  handleInsight: (insight: Insight) => void;
  ask: (question: string) => void;
  clearAnswers: () => void;
  importData: (file: File) => void;
  importError: string;
  setGrant: (clientId: AgentClientId, scope: ContextScope, allowed: boolean) => void;
  revokeClient: (clientId: AgentClientId) => void;
  clearAccessLog: () => void;
};

export const YouContext = createContext<YouApi | null>(null);

export function useYou(): YouApi {
  const api = useContext(YouContext);
  if (!api) throw new Error("useYou must be used inside YouContext");
  return api;
}

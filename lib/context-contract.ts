/**
 * The portable boundary between YOU and any assistant harness.
 * This is a design contract for the prototype, not a live server API.
 */
export type ContextScope =
  | "people.read"
  | "preferences.read"
  | "routines.read"
  | "plans.read"
  | "wellbeing.read"
  | "insights.read"
  | "memory.write";

export type ContextGrant = {
  clientId: string;
  displayName: string;
  scopes: ContextScope[];
  personIds?: string[];
  expiresAt?: string;
  revokedAt?: string;
};

export type Evidence = {
  sourceId: string;
  sourceType: "user" | "email" | "calendar" | "contacts" | "message" | "device" | "public" | "agent";
  observedAt: string;
  excerpt?: string;
};

export type PortableFact = {
  id: string;
  subjectId: string;
  category: "people" | "preferences" | "routines" | "plans" | "wellbeing";
  key: string;
  value: unknown;
  status: "known" | "inferred" | "unknown" | "disputed";
  confidence: number | null;
  evidence: Evidence[];
  lastVerified: string | null;
  visibility: "available" | "private" | "excluded";
};

export type ContextResult<T> = {
  data: T;
  provenance: Evidence[];
  uncertainty?: string;
  accessedAt: string;
};

export function mayReadFact(fact: PortableFact, grant: ContextGrant, now: Date = new Date()): boolean {
  if (grant.revokedAt || (grant.expiresAt && new Date(grant.expiresAt) <= now)) return false;
  if (fact.visibility !== "available" || fact.status === "disputed") return false;
  if (grant.personIds && !grant.personIds.includes(fact.subjectId)) return false;
  const scope = `${fact.category}.read` as ContextScope;
  return grant.scopes.includes(scope);
}

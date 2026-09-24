import type { Memory, Person } from "../data/demo";

export type MemoryAnswer = { question: string; text: string; sources: string[] };
export type MemoryContext = {
  memories: Memory[];
  people: Person[];
  handled?: string[];
  dismissed?: string[];
};

const stopWords = new Set([
  "a", "about", "am", "are", "can", "could", "do", "does", "for", "have", "i", "in", "is", "it", "know", "like", "likes", "me", "my", "of", "on", "our", "remember", "saved", "should", "the", "think", "to", "what", "when", "who", "why", "with", "you",
]);
const factStates = { known: "Known", inferred: "Inferred", unknown: "Unknown", disputed: "Needs review" } as const;

function hasWord(text: string, word: string): boolean {
  return new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text);
}

function mentionedPerson(question: string, people: Person[]): Person | undefined {
  const q = question.toLowerCase();
  const byName = people.find(person => hasWord(q, person.name.toLowerCase()) || hasWord(q, person.name.split(" ")[0].toLowerCase()));
  if (byName) return byName;
  if (hasWord(q, "wife") || hasWord(q, "spouse")) return people.find(person => person.relation.toLowerCase() === "wife");
  if (hasWord(q, "mother")) return people.find(person => person.relation.toLowerCase() === "mother");
  if (hasWord(q, "father")) return people.find(person => person.relation.toLowerCase() === "father");
  return undefined;
}

function citation(memory: Memory): string {
  const confidence = memory.confidence === null ? "" : ` · ${Math.round(memory.confidence * 100)}%`;
  return `${memory.label} · ${memory.source} · ${factStates[memory.status]}${confidence} · observed ${memory.observedAt}`;
}

function describe(memory: Memory, subject: string, explain: boolean): string {
  if (memory.status === "unknown") return `I don't know ${memory.label.toLowerCase()} for ${subject}.`;
  if (memory.status === "disputed") return `${memory.label} for ${subject} needs review; I won't present it as fact.`;
  const claim = `${subject}: ${memory.label} — ${memory.value}.`;
  const qualified = memory.status === "inferred" ? `I think this may be true, but it is inferred: ${claim}` : claim;
  return explain ? `${qualified} Evidence: ${memory.evidence}` : qualified;
}

function fromMemories(question: string, memories: Memory[], people: Person[], explain = false): MemoryAnswer {
  if (!memories.length) return { question, text: "I don't know from the memories available to Ask YOU.", sources: [] };
  const selected = memories.slice(0, 4);
  return {
    question,
    text: selected.map(memory => describe(memory, people.find(person => person.id === memory.subjectId)?.name ?? "You", explain)).join(" "),
    sources: selected.map(citation),
  };
}

/** A deterministic demo answerer. It never reads private or excluded memories. */
export function answerFromMemory(question: string, context: MemoryContext): MemoryAnswer {
  const q = question.toLowerCase().trim();
  const available = context.memories.filter(memory => memory.privacy === "available");
  const person = mentionedPerson(q, context.people);
  const subjectId = person?.id ?? (/(?:\bme\b|\bmy\b|\bmyself\b|\bour\b)/.test(q) ? "self" : null);
  const aboutSubject = subjectId ? available.filter(memory => memory.subjectId === subjectId) : available;
  const explain = /\b(why|evidence|source|how do you know)\b/.test(q);

  if (/\b(birthday|anniversary|graduation|important dates?)\b/.test(q)) {
    const key = ["birthday", "anniversary", "graduation"].find(word => hasWord(q, word));
    const dates = aboutSubject.filter(memory => memory.category === "People" && (key ? hasWord(memory.label, key) : /birthday|anniversary|graduation|date/i.test(memory.label)));
    return dates.length ? fromMemories(question, dates, context.people, explain) : { question, text: `I don't know ${person ? `${person.name}'s ` : "the "}${key ?? "important date"} from the available memory.`, sources: [] };
  }

  if (/\b(unknown|don't(?: you)? know|do not know|missing)\b/.test(q)) {
    const unknown = aboutSubject.filter(memory => memory.status === "unknown");
    return unknown.length ? fromMemories(question, unknown, context.people) : { question, text: "I don't have an available unknown memory to list. That does not mean I know everything.", sources: [] };
  }

  if (/\b(commitments?|open loops?|follow.up|promised)\b/.test(q)) {
    const open = available.filter(memory => /open loop|commitment/i.test(memory.label) && !context.handled?.includes(memory.subjectId) && !context.dismissed?.includes(memory.subjectId));
    return open.length ? fromMemories(question, open, context.people, explain) : { question, text: "I don't have an unresolved commitment in the available demo memory.", sources: [] };
  }

  if (/\b(catch up|reach out|haven't talked|not spoken)\b/.test(q)) {
    const rhythms = aboutSubject.filter(memory => /contact rhythm/i.test(memory.label) && !context.dismissed?.includes(memory.subjectId));
    return rhythms.length ? fromMemories(question, rhythms, context.people, explain) : { question, text: "I don't have an available contact pattern to suggest a catch-up.", sources: [] };
  }

  if (/\b(screen time|tiktok|device activity)\b/.test(q)) {
    return { question, text: "I don't know your device or app usage. No device activity source is connected in this prototype.", sources: [] };
  }

  if (/\bdraft\b/.test(q) && person) {
    const contextMemory = aboutSubject.find(memory => memory.status === "known" || memory.status === "inferred");
    return {
      question,
      text: `Draft for you to review: “Hey ${person.name.split(" ")[0]}, I've been thinking of you. Would you like to catch up sometime?” I haven't sent anything.`,
      sources: contextMemory ? [citation(contextMemory)] : [],
    };
  }

  if (/\b(make time|tonight|concert|music)\b/.test(q)) {
    const interests = available.filter(memory => memory.subjectId === "self" && memory.category === "Preferences");
    const answer = fromMemories(question, interests, context.people);
    return { ...answer, text: `${answer.text} I cannot verify local events or book tickets in this prototype.` };
  }

  if (/\b(changed jobs|new role|promotion|promoted)\b/.test(q)) {
    const roles = aboutSubject.filter(memory => /new role|promotion|job change/i.test(memory.label));
    return fromMemories(question, roles, context.people, explain);
  }

  const topicWords = q.match(/[a-z]{3,}/g)?.filter(word => !stopWords.has(word) && !person?.name.toLowerCase().includes(word)) ?? [];
  const preferenceQuestion = /\b(interests?|likes?|enjoys?|gift ideas?)\b/.test(q);
  const relevant = aboutSubject.filter(memory => {
    if (preferenceQuestion && memory.category !== "Preferences") return false;
    if (topicWords.length === 0) return true;
    return topicWords.some(word => hasWord(`${memory.label} ${memory.value}`, word));
  });
  if (relevant.length) return fromMemories(question, relevant, context.people, explain);
  if (person) return { question, text: `I don't know that about ${person.name} from the available memory.`, sources: [] };
  return { question, text: "I don't know from the memories available to Ask YOU. This prototype does not search connected accounts or the web.", sources: [] };
}

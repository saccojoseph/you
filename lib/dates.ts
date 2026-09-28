import type { Memory, Person } from "../data/demo";

const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const monthPattern = /^\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+\d{4})?\s*$/i;
const dayMs = 24 * 60 * 60 * 1000;

export type UpcomingDate = { memory: Memory; person: Person | null; date: Date; daysUntil: number };

/**
 * Parse a value that is only a recurring month/day, such as "October 17" or "Oct 2, 2019".
 * Returns null for anything else, including "Unknown" or prose that happens to mention a date.
 */
export function parseMonthDay(value: string): { month: number; day: number } | null {
  const match = value.match(monthPattern);
  if (!match) return null;
  const month = months.findIndex(name => name.startsWith(match[1].toLowerCase().slice(0, 3)));
  const day = Number(match[2]);
  const probe = new Date(2024, month, day); // leap year, so Feb 29 is accepted
  return month >= 0 && probe.getMonth() === month && probe.getDate() === day ? { month, day } : null;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** The next time a recurring date happens, counting today. */
export function nextOccurrence(monthDay: { month: number; day: number }, today: Date): Date {
  const base = startOfDay(today);
  for (let year = base.getFullYear(); year <= base.getFullYear() + 8; year++) {
    const candidate = new Date(year, monthDay.month, monthDay.day);
    if (candidate.getMonth() === monthDay.month && candidate >= base) return candidate;
  }
  return new Date(base.getFullYear() + 1, monthDay.month, monthDay.day);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / dayMs);
}

/** Important dates saved as People memories. Unknown or unconfirmed dates are never scheduled. */
export function upcomingDates(memories: Memory[], people: Person[], today: Date, withinDays = Infinity): UpcomingDate[] {
  return memories
    .filter(memory => memory.category === "People" && (memory.status === "known" || memory.status === "inferred"))
    .flatMap(memory => {
      const monthDay = parseMonthDay(memory.value);
      if (!monthDay) return [];
      const date = nextOccurrence(monthDay, today);
      return [{ memory, person: people.find(person => person.id === memory.subjectId) ?? null, date, daysUntil: daysBetween(today, date) }];
    })
    .filter(item => item.daysUntil <= withinDays)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export function formatDaysUntil(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export function shortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** The next moment shown on a person card: a saved date first, then the sample note. */
export function nextMomentFor(person: Person, memories: Memory[], today: Date): string | undefined {
  const next = upcomingDates(memories.filter(memory => memory.subjectId === person.id), [person], today)[0];
  return next ? `${next.memory.label} · ${shortDate(next.date)}` : person.nextMoment;
}

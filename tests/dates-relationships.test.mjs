import assert from "node:assert/strict";
import test from "node:test";
import { nextMomentFor, nextOccurrence, parseMonthDay, upcomingDates } from "../lib/dates.ts";
import { initialsFor, linkedPeople, relationshipBranches } from "../lib/relationships.ts";
import { memories, people } from "../data/demo.ts";

const today = new Date(2026, 8, 28); // Sep 28, 2026, local time

test("parses saved month/day values and refuses anything else", () => {
  assert.deepEqual(parseMonthDay("October 17"), { month: 9, day: 17 });
  assert.deepEqual(parseMonthDay("Oct 2"), { month: 9, day: 2 });
  assert.deepEqual(parseMonthDay("February 29"), { month: 1, day: 29 });
  assert.equal(parseMonthDay("Unknown"), null);
  assert.equal(parseMonthDay("February 30"), null);
});

test("next occurrence rolls into next year and handles leap days", () => {
  assert.equal(nextOccurrence({ month: 5, day: 14 }, today).getFullYear(), 2027);
  assert.equal(nextOccurrence({ month: 8, day: 28 }, today).getDate(), 28, "today counts");
  assert.equal(nextOccurrence({ month: 1, day: 29 }, today).getFullYear(), 2028);
});

test("upcoming dates come from known People memories, never unknown ones", () => {
  const upcoming = upcomingDates(memories, people, today, 45);
  assert.deepEqual(upcoming.map(item => [item.memory.id, item.daysUntil]), [["m-mike-birthday", 4], ["m-anniversary", 19]]);
  assert.equal(upcoming.some(item => item.memory.id === "m-mom-anniversary"), false);
});

test("a newly added date shows on the person card instead of 'no date'", () => {
  const chris = people.find(person => person.id === "chris");
  assert.equal(nextMomentFor(chris, memories, today), undefined);
  const added = { ...memories[2], id: "date-1", subjectId: "chris", label: "Birthday", value: "November 3" };
  assert.equal(nextMomentFor(chris, [added, ...memories], today), "Birthday · Nov 3");
});

test("relationship groups come from relation text, so edits and new people are placed", () => {
  const titles = Object.fromEntries(relationshipBranches(people).map(branch => [branch.title, branch.people.map(person => person.id)]));
  assert.deepEqual(titles.Family, ["morgan", "mom", "dad"]);
  assert.deepEqual(titles.Friends, ["mike", "chris", "steve"]);
  assert.deepEqual(titles["Connected through Mike"], ["sarah"]);
  const withNew = [...people, { ...people[3], id: "jo", name: "Jo Park", relation: "Sister" }];
  assert.ok(relationshipBranches(withNew).find(branch => branch.title === "Family").people.some(person => person.id === "jo"));
});

test("links work in both directions", () => {
  const mike = people.find(person => person.id === "mike");
  const sarah = people.find(person => person.id === "sarah");
  assert.deepEqual(linkedPeople(mike, people).map(link => [link.person.id, link.description]), [["sarah", "Sarah is Mike’s wife"]]);
  assert.deepEqual(linkedPeople(sarah, people).map(link => link.person.id), ["mike"]);
  assert.equal(initialsFor("Jordan Lee"), "JL");
  assert.equal(initialsFor("Mom"), "MO");
});

test("prose that mentions a date is not treated as an important date", () => {
  assert.equal(parseMonthDay("Usually every two to three weeks; last sample contact July 4"), null);
  assert.deepEqual(parseMonthDay("June 3rd, 1990"), { month: 5, day: 3 });
});

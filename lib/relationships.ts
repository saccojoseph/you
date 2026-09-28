import type { Person } from "../data/demo";

export type RelationshipBranch = { title: string; detail: string; people: Person[] };
export type PersonLink = { person: Person; description: string };

const familyWords = /\b(wife|husband|spouse|partner|mother|father|mom|dad|sister|brother|son|daughter|parent|grandmother|grandfather|grandma|grandpa|aunt|uncle|cousin|niece|nephew)\b/i;

function firstName(person: Person): string {
  return person.name.split(" ")[0];
}

/** "Mike’s wife · Friend" → the person named Mike, if they are saved. */
function connectedThrough(person: Person, people: Person[]): Person | undefined {
  const match = person.relation.match(/^([^’'·]+?)[’']s\s/);
  if (!match) return undefined;
  const name = match[1].trim().toLowerCase();
  return people.find(other => other.id !== person.id && (firstName(other).toLowerCase() === name || other.name.toLowerCase() === name));
}

/** Group people from their saved relation text, so edits and new people show up in the map. */
export function relationshipBranches(people: Person[]): RelationshipBranch[] {
  const family: Person[] = [];
  const friends: Person[] = [];
  const others: Person[] = [];
  const through = new Map<string, { via: Person; people: Person[] }>();
  for (const person of people) {
    const via = connectedThrough(person, people);
    if (via) {
      const branch = through.get(via.id) ?? { via, people: [] };
      branch.people.push(person);
      through.set(via.id, branch);
    } else if (familyWords.test(person.relation)) family.push(person);
    else if (/friend/i.test(person.relation)) friends.push(person);
    else others.push(person);
  }
  return [
    { title: "Family", detail: "The people closest to home", people: family },
    { title: "Friends", detail: "Shared history and open loops", people: friends },
    ...[...through.values()].map(({ via, people: linked }) => ({
      title: `Connected through ${firstName(via)}`,
      detail: linked.map(person => `${firstName(person)} is ${person.relation.split("·")[0].trim()}`).join(" · "),
      people: linked,
    })),
    { title: "Others", detail: "Everyone else you’ve saved", people: others },
  ].filter(branch => branch.people.length);
}

/** People linked to this person through relation text, in either direction. */
export function linkedPeople(person: Person, people: Person[]): PersonLink[] {
  const links: PersonLink[] = [];
  const via = connectedThrough(person, people);
  if (via) links.push({ person: via, description: `${firstName(person)} is ${person.relation.split("·")[0].trim()}` });
  for (const other of people) {
    if (other.id !== person.id && connectedThrough(other, people)?.id === person.id) {
      links.push({ person: other, description: `${firstName(other)} is ${other.relation.split("·")[0].trim()}` });
    }
  }
  return links;
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts.length === 1 ? parts[0].slice(0, 2) : `${parts[0][0]}${parts[parts.length - 1][0]}`).toUpperCase();
}

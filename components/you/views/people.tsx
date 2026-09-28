"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenText, CalendarDays, ChevronRight, Network, Plus, Search, Settings2, Sparkles, Trash2 } from "lucide-react";
import { events, type Person } from "@/data/demo";
import { nextMomentFor, shortDate, upcomingDates, formatDaysUntil } from "@/lib/dates";
import { linkedPeople } from "@/lib/relationships";
import { useYou } from "../context";
import { Avatar, MemoryRow, SectionTitle } from "../ui";

export function PeopleView() {
  const { data, today, openPerson, openModal, navigate } = useYou();
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => data.people.filter(p => `${p.name} ${p.relation} ${p.details}`.toLowerCase().includes(search.toLowerCase())), [data.people, search]);

  return <>
    <SectionTitle eyebrow="YOUR PEOPLE" title="People who matter" description="A private, living picture of the people in your world."
      action={<div className="section-actions">
        <button className="outline-button" onClick={() => navigate("memory")}><BookOpenText size={16} /> See memories</button>
        <button className="primary-button" onClick={() => openModal({ kind: "person", personId: null })}><Plus size={16} /> Add person</button>
      </div>} />
    <div className="toolbar"><div className="search-field"><Search size={17} /><input aria-label="Search people" placeholder="Search people" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
    {(["Inner circle", "Close", "Regular"] as const).map(group => {
      const groupPeople = filtered.filter(p => p.importance === group);
      return groupPeople.length ? <section className="people-section" key={group}>
        <h2>{group}</h2>
        <div className="people-grid">
          {groupPeople.map(p => {
            const moment = nextMomentFor(p, data.memories, today);
            return <button key={p.id} className="person-card" onClick={() => openPerson(p.id)}>
              <Avatar person={p} />
              <span className="person-card-copy"><strong>{p.name}</strong><span>{p.relation}</span><small>Last contact · {p.lastContact}</small>{moment && <em>{moment}</em>}</span>
              <ChevronRight size={17} />
            </button>;
          })}
        </div>
      </section> : null;
    })}
    {!filtered.length && <div className="empty-card">No people match this search.</div>}
  </>;
}

export function PersonProfile({ person }: { person: Person }) {
  const { data, today, openMemory, openModal, openPerson, closePerson } = useYou();
  const dates = upcomingDates(data.memories.filter(m => m.subjectId === person.id), [person], today);
  const links = linkedPeople(person, data.people);
  const personEvents = events.filter(e => e.personId === person.id);

  return <>
    <button className="back-link" onClick={closePerson}><ArrowLeft size={16} /> All people</button>
    <div className="profile-head">
      <Avatar person={person} size="lg" />
      <div className="profile-head-copy"><div className="eyebrow">{person.importance.toUpperCase()}</div><h1>{person.name}</h1><p>{person.relation}</p></div>
      <button className="outline-button" onClick={() => openModal({ kind: "person", personId: person.id })}><Settings2 size={16} /> Edit profile</button>
    </div>
    <div className="profile-grid">
      <div>
        <div className="profile-callout">
          <div className="rail-kicker"><Sparkles size={16} /> A LITTLE CONTEXT</div>
          <p>{person.details || "No notes yet. Add facts below as you learn them."}</p>
          <span>Last interaction · {person.lastContact}</span>
        </div>
        <div className="subsection-head"><h2>What I remember</h2><button onClick={() => openModal({ kind: "add-memory", subjectId: person.id })}><Plus size={16} /> Add fact</button></div>
        <div className="memory-list">
          {data.memories.filter(m => m.subjectId === person.id).map(m => <MemoryRow key={m.id} memory={m} withIcon={false} onOpen={() => openMemory(m.id)} />)}
          {!data.memories.some(m => m.subjectId === person.id) && <div className="empty-card">Nothing saved about {person.name} yet.</div>}
        </div>
        {personEvents.length > 0 && <>
          <div className="subsection-head"><h2>Recent history</h2></div>
          <div className="mini-timeline">{personEvents.map(e => <div key={e.id}><span>{e.date}</span><div><strong>{e.title}</strong><small>{e.detail} · {e.source}</small></div></div>)}</div>
        </>}
      </div>
      <aside className="profile-side">
        <div className="rail-card">
          <div className="rail-kicker"><CalendarDays size={16} /> IMPORTANT DATES</div>
          {dates.length ? <div className="upcoming-list">
            {dates.map(item => <button key={item.memory.id} onClick={() => openMemory(item.memory.id)}>
              <span className="upcoming-when">{formatDaysUntil(item.daysUntil)}</span>
              <span><strong>{item.memory.label}</strong><small>{shortDate(item.date)}{item.memory.status === "inferred" ? " · inferred" : ""}</small></span>
            </button>)}
          </div> : <h3>{person.nextMoment ?? "No date saved yet"}</h3>}
          <button className="rail-link" onClick={() => openModal({ kind: "add-date", personId: person.id })}><Plus size={15} /> Add important date</button>
        </div>
        <div className="rail-card">
          <div className="rail-kicker"><Network size={16} /> RELATIONSHIPS</div>
          {links.length ? <div className="link-list">
            {links.map(link => <button key={link.person.id} onClick={() => openPerson(link.person.id)}>
              <Avatar person={link.person} size="sm" />
              <span><strong>{link.person.name}</strong><small>{link.description}</small></span>
              <ArrowRight size={15} />
            </button>)}
          </div> : <p>Connections appear when a relationship names another saved person, such as “Mike’s wife”.</p>}
        </div>
        <section className="settings-card danger-card">
          <h2>Remove {person.name.split(" ")[0]}</h2>
          <p>Deletes this person and every memory about them from this browser.</p>
          <button className="danger-button" onClick={() => openModal({ kind: "delete-person", personId: person.id })}><Trash2 size={16} /> Remove person</button>
        </section>
      </aside>
    </div>
  </>;
}

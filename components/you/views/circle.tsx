"use client";

import { ArrowRight, ChevronRight, Network, ShieldCheck } from "lucide-react";
import { events } from "@/data/demo";
import { relationshipBranches } from "@/lib/relationships";
import { useYou } from "../context";
import { seedMemoryIds } from "../state";
import { Avatar, SectionTitle, subjectName } from "../ui";

export function RelationshipsView() {
  const { data, openPerson } = useYou();
  const branches = relationshipBranches(data.people);

  return <>
    <SectionTitle eyebrow="YOUR CIRCLE" title="The people around you" description="Connections help YOU understand context across the people in your life. Every link can be reviewed." />
    <div className="graph-root-card"><span className="user-avatar">A</span><div><strong>Alex</strong><span>Your relationships, in context</span></div><Network size={19} /></div>
    <div className="graph-branches">
      {branches.map(branch => <section className="graph-branch" key={branch.title}>
        <div className="graph-branch-heading"><span className="graph-line-dot" /><div><h2>{branch.title}</h2><p>{branch.detail}</p></div></div>
        <div className="graph-people">
          {branch.people.map(person => <button key={person.id} onClick={() => openPerson(person.id)}>
            <Avatar person={person} size="sm" />
            <span><strong>{person.name}</strong><small>{person.relation}</small></span>
            <ChevronRight size={15} />
          </button>)}
        </div>
      </section>)}
    </div>
    <div className="graph-note"><ShieldCheck size={17} /><p>Groups come from each person’s relationship, so editing a profile updates this map. A future connector will propose links with evidence; you decide whether to keep them.</p></div>
  </>;
}

type TimelineEntry = { id: string; on: string; date: string; title: string; detail: string; source: string; personId?: string };

function displayDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

export function TimelineView() {
  const { data, openPerson } = useYou();
  const saved: TimelineEntry[] = data.memories.filter(m => !seedMemoryIds.has(m.id)).map(m => ({
    id: m.id,
    on: m.observedAt,
    date: displayDate(m.observedAt),
    title: m.sourceType === "agent" ? `An agent proposed “${m.label}”` : `You saved “${m.label}”`,
    detail: `${subjectName(m.subjectId, data.people)} · ${m.value}`,
    source: m.sourceType === "agent" ? "Agent proposal" : "Added in this browser",
    personId: m.subjectId === "self" || !data.people.some(p => p.id === m.subjectId) ? undefined : m.subjectId,
  }));
  const entries = [...saved, ...events].sort((a, b) => b.on.localeCompare(a.on));

  return <>
    <SectionTitle eyebrow="YOUR STORY" title="A timeline of context" description="The events behind YOU’s memories and suggestions, including what you add. Demo events are labeled by source." />
    <div className="timeline-list">
      {entries.map(e => <div className="timeline-item" key={e.id}>
        <div className="timeline-date">{e.date}</div>
        <span className="timeline-node" />
        <div className="timeline-card">
          <span className="eyebrow">{e.source}</span>
          <h2>{e.title}</h2>
          <p>{e.detail}</p>
          {e.personId && <button className="rail-link" onClick={() => openPerson(e.personId!)}>View {subjectName(e.personId, data.people)} <ArrowRight size={15} /></button>}
        </div>
      </div>)}
    </div>
  </>;
}

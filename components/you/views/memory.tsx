"use client";

import { useMemo, useState } from "react";
import { Check, CircleHelp, Inbox, Pencil, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useYou } from "../context";
import { MemoryRow, SectionTitle, subjectName } from "../ui";

const memoryCategories = ["All", "People", "Preferences", "Routines", "Plans", "Wellbeing"] as const;

export function MemoryView() {
  const { data, openMemory, openModal, navigate } = useYou();
  const [filter, setFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => data.memories.filter(m => (filter === "All" || m.category === filter)
    && `${m.label} ${m.value} ${m.source} ${subjectName(m.subjectId, data.people)}`.toLowerCase().includes(search.toLowerCase())), [data.memories, data.people, filter, search]);
  const count = (status: string) => data.memories.filter(m => m.status === status).length;

  return <>
    <SectionTitle eyebrow="YOUR CONTEXT" title="What YOU remembers" description="Each memory has a source, a confidence level, and a choice about who can use it."
      action={<button className="primary-button" onClick={() => openModal({ kind: "add-memory", subjectId: "self" })}><Plus size={17} /> Add memory</button>} />
    <div className="memory-summary">
      <div><strong>{count("known")}</strong><span>Known</span></div>
      <div><strong>{count("inferred")}</strong><span>Inferred</span></div>
      <div><strong>{count("unknown")}</strong><span>Unknown</span></div>
      <button className="memory-summary-review" onClick={() => navigate("review")}><strong>{count("disputed")}</strong><span>Needs review</span></button>
      <div className="memory-summary-note"><ShieldCheck size={17} /><span>Inference never silently becomes fact.</span></div>
    </div>
    <div className="toolbar">
      <div className="search-field"><Search size={17} /><input aria-label="Search memories" placeholder="Search memories, people, or sources" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="filter-scroll">{memoryCategories.map(category => <button key={category} className={`filter-chip ${filter === category ? "selected" : ""}`} onClick={() => setFilter(category)}>{category}</button>)}</div>
    </div>
    <div className="memory-list">
      {filtered.map(m => <MemoryRow key={m.id} memory={m} subject={subjectName(m.subjectId, data.people)} onOpen={() => openMemory(m.id)} />)}
      {!filtered.length && <div className="empty-card">No memories match this search.</div>}
    </div>
  </>;
}

export function ReviewView() {
  const { data, confirmMemory, removeMemory, openMemory, navigate } = useYou();
  const pending = data.memories.filter(m => m.status === "disputed");

  return <>
    <SectionTitle eyebrow="YOUR DECISION" title="Needs review" description="Agent proposals and facts you flagged wait here. Nothing in this list is used in answers or shared with agents until you accept it." />
    <div className="review-list">
      {pending.length ? pending.map(m => (
        <article className="review-card" key={m.id}>
          <div className="review-card-head">
            <span className={`review-origin ${m.sourceType === "agent" ? "agent" : ""}`}>{m.sourceType === "agent" ? "Agent proposal" : "Flagged by you"}</span>
            <small>{subjectName(m.subjectId, data.people)} · {m.category} · {m.observedAt}</small>
          </div>
          <h2>{m.label}</h2>
          <p className="review-value">{m.value}</p>
          <p className="review-evidence">{m.source} · {m.evidence}</p>
          <div className="detail-actions">
            <button className="primary-button" onClick={() => confirmMemory(m.id)}><Check size={15} /> Accept as known</button>
            <button className="outline-button compact" onClick={() => openMemory(m.id, { edit: true })}><Pencil size={15} /> Edit first</button>
            <button className="danger-link" onClick={() => removeMemory(m.id)}><Trash2 size={15} /> {m.sourceType === "agent" ? "Reject" : "Remove"}</button>
          </div>
        </article>
      )) : <div className="empty-card">
        <Inbox size={27} />
        <h2>Nothing waiting for review.</h2>
        <p>When an agent proposes a memory, or you mark one to correct later, it appears here.</p>
        <button className="text-button" onClick={() => navigate("memory")}><CircleHelp size={15} /> Browse memory</button>
      </div>}
    </div>
  </>;
}

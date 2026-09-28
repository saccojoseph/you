"use client";

import { useState } from "react";
import { ArrowRight, Bell, Check, CircleHelp, Compass, Download, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { Insight, Memory, Person } from "@/data/demo";
import type { MemoryEdit, PersonDraft } from "./context";
import { Status, subjectName } from "./ui";

type Close = { onClose: () => void };
const categories: Memory["category"][] = ["People", "Preferences", "Routines", "Plans", "Wellbeing"];

export function MemoryDialog({ memory, people, startEditing = false, onClose, onConfirm, onCorrect, onMarkForReview, onRemove, onPrivacy }: Close & {
  memory: Memory | null;
  people: Person[];
  startEditing?: boolean;
  onConfirm: (id: string) => void;
  onCorrect: (id: string, edit: MemoryEdit) => void;
  onMarkForReview: (id: string) => void;
  onRemove: (id: string) => void;
  onPrivacy: (id: string, privacy: Memory["privacy"]) => void;
}) {
  const unknown = memory?.status === "unknown";
  const [edit, setEdit] = useState<MemoryEdit | null>(startEditing && memory ? { label: memory.label, value: unknown ? "" : memory.value } : null);
  const startEdit = () => memory && setEdit({ label: memory.label, value: unknown ? "" : memory.value });

  return <Dialog open={!!memory} onOpenChange={open => { if (!open) { setEdit(null); onClose(); } }}>
    <DialogContent className="memory-dialog">
      <DialogHeader>
        <DialogTitle>{memory?.label}</DialogTitle>
        <DialogDescription>{edit ? (unknown ? "Fill in what you know. It will be saved as known, from you." : "Your correction replaces the value and is recorded as coming from you.") : "Memory and evidence"}</DialogDescription>
      </DialogHeader>
      {memory && edit && <form className="form-stack" onSubmit={e => { e.preventDefault(); if (edit.label.trim() && edit.value.trim()) { onCorrect(memory.id, edit); setEdit(null); } }}>
        <label>Label<input value={edit.label} onChange={e => setEdit({ ...edit, label: e.target.value })} /></label>
        <label>{unknown ? "What is it?" : "Corrected detail"}<textarea autoFocus value={edit.value} onChange={e => setEdit({ ...edit, value: e.target.value })} placeholder={unknown ? "e.g. June 3" : undefined} /></label>
        <div className="detail-actions">
          <button type="button" className="outline-button compact" onClick={() => setEdit(null)}>Cancel</button>
          <button type="submit" className="primary-button" disabled={!edit.label.trim() || !edit.value.trim()}>Save as known <Check size={15} /></button>
        </div>
      </form>}
      {memory && !edit && <div className="memory-detail">
        <Status memory={memory} />
        <p className="detail-value">{memory.value}</p>
        <div className="detail-grid">
          <div><span>About</span><strong>{subjectName(memory.subjectId, people)}</strong></div>
          <div><span>Category</span><strong>{memory.category}</strong></div>
          <div><span>Source</span><strong>{memory.source}</strong></div>
          <div><span>Observed</span><strong>{memory.observedAt}</strong></div>
          <div><span>Last verified</span><strong>{memory.lastVerified ?? "Not verified"}</strong></div>
        </div>
        <div className="evidence-box"><strong>Why YOU believes this</strong><p>{memory.evidence}</p></div>
        <div className="detail-control">
          <div><strong>Available to agents you allow</strong><span>Private memories stay out of Ask YOU and every agent response, whatever you grant.</span></div>
          <Switch aria-label="Available to agents" checked={memory.privacy === "available"} onCheckedChange={checked => onPrivacy(memory.id, checked ? "available" : "private")} />
        </div>
        <div className="detail-actions">
          {unknown
            ? <button className="primary-button" onClick={startEdit}><Pencil size={15} /> Add what you know</button>
            : <>
              <button className="outline-button compact" onClick={() => onConfirm(memory.id)}><Check size={15} /> {memory.status === "disputed" ? "Accept as known" : "Confirm"}</button>
              <button className="outline-button compact" onClick={startEdit}><Pencil size={15} /> Edit</button>
              {memory.status !== "disputed" && <button className="outline-button compact" onClick={() => onMarkForReview(memory.id)}><CircleHelp size={15} /> Correct later</button>}
            </>}
          <button className="danger-link" onClick={() => onRemove(memory.id)}><Trash2 size={15} /> Remove</button>
        </div>
      </div>}
    </DialogContent>
  </Dialog>;
}

export function InsightDialog({ insight, onClose }: Close & { insight: Insight | null }) {
  return <Dialog open={!!insight} onOpenChange={open => !open && onClose()}>
    <DialogContent className="memory-dialog">
      <DialogHeader><DialogTitle>Why YOU surfaced this</DialogTitle><DialogDescription>{insight?.title}</DialogDescription></DialogHeader>
      {insight && <div className="memory-detail">
        <span className="status status-inferred"><span className="status-dot" />{insight.confidence}</span>
        <p className="detail-value">{insight.body}</p>
        <div className="evidence-box"><strong>Evidence in this demo</strong>{insight.evidence.map(line => <p key={line}>• {line}</p>)}</div>
        <p className="small-note">YOU should ask before acting on uncertain or sensitive patterns. This sample uses no live accounts.</p>
      </div>}
    </DialogContent>
  </Dialog>;
}

export function AddMemoryDialog({ subjectId: initialSubject, people, onClose, onSave }: Close & {
  subjectId: string;
  people: Person[];
  onSave: (memory: { subjectId: string; category: Memory["category"]; label: string; value: string }) => void;
}) {
  const [draft, setDraft] = useState({ subjectId: initialSubject, category: (initialSubject === "self" ? "Preferences" : "People") as Memory["category"], label: "", value: "" });
  const ready = draft.label.trim() && draft.value.trim();
  return <Dialog open onOpenChange={open => !open && onClose()}>
    <DialogContent>
      <DialogHeader><DialogTitle>Add to memory</DialogTitle><DialogDescription>Facts you add directly are marked “Known · You told me.”</DialogDescription></DialogHeader>
      <div className="form-stack">
        <label>About<select value={draft.subjectId} onChange={e => setDraft({ ...draft, subjectId: e.target.value })}><option value="self">You</option>{people.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
        <label>Category<select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value as Memory["category"] })}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
        <label>What should I remember?<input autoFocus value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })} placeholder="e.g. Favorite restaurant" /></label>
        <label>Detail<textarea value={draft.value} onChange={e => setDraft({ ...draft, value: e.target.value })} placeholder="Write the detail in your own words" /></label>
        <button className="primary-button" disabled={!ready} onClick={() => ready && onSave(draft)}>Save memory <ArrowRight size={16} /></button>
      </div>
    </DialogContent>
  </Dialog>;
}

export function PersonDialog({ person, onClose, onSave }: Close & { person: Person | null; onSave: (draft: PersonDraft) => void }) {
  const [draft, setDraft] = useState<PersonDraft>({ name: person?.name ?? "", relation: person?.relation ?? "", importance: person?.importance ?? "Close" });
  return <Dialog open onOpenChange={open => !open && onClose()}>
    <DialogContent>
      <DialogHeader><DialogTitle>{person ? "Edit person" : "Add a person"}</DialogTitle><DialogDescription>{person ? "Keep names and relationship context accurate." : "Only people you add yourself. YOU does not import contacts in this demo."}</DialogDescription></DialogHeader>
      <form className="form-stack" onSubmit={e => { e.preventDefault(); if (draft.name.trim()) onSave(draft); }}>
        <label>Name<input autoFocus value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Jordan Lee" /></label>
        <label>Relationship<input value={draft.relation} onChange={e => setDraft({ ...draft, relation: e.target.value })} placeholder="e.g. Friend, Sister, Mike’s brother" /></label>
        <label>How close<select value={draft.importance} onChange={e => setDraft({ ...draft, importance: e.target.value as Person["importance"] })}><option>Inner circle</option><option>Close</option><option>Regular</option></select></label>
        <button className="primary-button" type="submit" disabled={!draft.name.trim()}>{person ? "Save changes" : "Add person"} <Check size={16} /></button>
      </form>
    </DialogContent>
  </Dialog>;
}

export function DeletePersonDialog({ person, memoryCount, onClose, onDelete }: Close & { person: Person; memoryCount: number; onDelete: () => void }) {
  return <Dialog open onOpenChange={open => !open && onClose()}>
    <DialogContent>
      <DialogHeader><DialogTitle>Remove {person.name}?</DialogTitle><DialogDescription>This deletes {person.name} and {memoryCount} {memoryCount === 1 ? "memory" : "memories"} about them from this browser. Export first if you want a copy.</DialogDescription></DialogHeader>
      <div className="detail-actions"><button className="outline-button" onClick={onClose}>Cancel</button><button className="danger-button" onClick={onDelete}><Trash2 size={16} /> Remove person</button></div>
    </DialogContent>
  </Dialog>;
}

export function AddDateDialog({ person, onClose, onSave }: Close & { person: Person; onSave: (label: string, isoDate: string) => void }) {
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");
  return <Dialog open onOpenChange={open => !open && onClose()}>
    <DialogContent>
      <DialogHeader><DialogTitle>Add an important date</DialogTitle><DialogDescription>For {person.name}. You can revisit or remove it later.</DialogDescription></DialogHeader>
      <div className="form-stack">
        <label>Occasion<input autoFocus value={label} onChange={e => setLabel(e.target.value)} placeholder="Birthday, anniversary, graduation…" /></label>
        <label>Date<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
        <button className="primary-button" disabled={!label.trim() || !date} onClick={() => onSave(label.trim(), date)}>Save date <Check size={16} /></button>
      </div>
    </DialogContent>
  </Dialog>;
}

export function ReminderDialog({ onClose, onSave }: Close & { onSave: (text: string) => void }) {
  const [text, setText] = useState("");
  return <Dialog open onOpenChange={open => !open && onClose()}>
    <DialogContent>
      <DialogHeader><DialogTitle>Add a reminder</DialogTitle><DialogDescription>Keep a thought or commitment close. This demo saves it in your browser.</DialogDescription></DialogHeader>
      <form className="form-stack" onSubmit={e => { e.preventDefault(); if (text.trim()) onSave(text.trim()); }}>
        <label>What should YOU remind you about?<input autoFocus value={text} onChange={e => setText(e.target.value)} placeholder="e.g. Ask Mom how her appointment went" /></label>
        <button className="primary-button" type="submit" disabled={!text.trim()}>Save reminder <Check size={16} /></button>
      </form>
    </DialogContent>
  </Dialog>;
}

export function ActionDialog({ insight, onClose, onTalk, onRemind, onConnectors }: Close & { insight: Insight | null; onTalk: () => void; onRemind: (id: string) => void; onConnectors: () => void }) {
  const work = insight?.id === "work";
  return <Dialog open onOpenChange={open => !open && onClose()}>
    <DialogContent>
      <DialogHeader><DialogTitle>{work ? "Let’s make space" : "Explore this idea"}</DialogTitle><DialogDescription>This is a guided demo. YOU won’t send or book anything.</DialogDescription></DialogHeader>
      <div className="action-body">
        {work ? <>
          <p>It sounds like your week may be crowded. What would help most right now?</p>
          <button onClick={onTalk}><MessageCircle size={17} /> Talk it through <ArrowRight size={16} /></button>
          <button onClick={() => onRemind("work-break")}><Bell size={17} /> Remind me to take a break <ArrowRight size={16} /></button>
        </> : <>
          <p>A future local events connector could check availability and link to official ticket sellers. Tonight’s concert is only a sample suggestion.</p>
          <button onClick={() => onRemind("concert")}><Bell size={17} /> Remind me about live music <ArrowRight size={16} /></button>
          <button onClick={onConnectors}><Compass size={17} /> See event connector plan <ArrowRight size={16} /></button>
        </>}
      </div>
    </DialogContent>
  </Dialog>;
}

export function ResetDialog({ onClose, onReset }: Close & { onReset: () => void }) {
  return <Dialog open onOpenChange={open => !open && onClose()}>
    <DialogContent>
      <DialogHeader><DialogTitle>Reset demo data?</DialogTitle><DialogDescription>All changes saved in this browser will be removed, including agent grants, the access log, and Ask YOU history. The original fictional data will return.</DialogDescription></DialogHeader>
      <div className="detail-actions"><button className="outline-button" onClick={onClose}>Cancel</button><button className="danger-button" onClick={onReset}>Reset demo</button></div>
    </DialogContent>
  </Dialog>;
}

export function ExportDialog({ memories, peopleCount, grantedClients, onClose, onExport }: Close & { memories: Memory[]; peopleCount: number; grantedClients: number; onExport: (includePrivate: boolean) => void }) {
  const [includePrivate, setIncludePrivate] = useState(true);
  const privateCount = memories.filter(m => m.privacy !== "available").length;
  const pending = memories.filter(m => m.status === "disputed").length;
  const leaving = includePrivate ? memories.length : memories.length - privateCount;
  return <Dialog open onOpenChange={open => !open && onClose()}>
    <DialogContent className="memory-dialog">
      <DialogHeader><DialogTitle>Review your export</DialogTitle><DialogDescription>This file leaves the browser. Anyone or anything you give it to can read what it contains.</DialogDescription></DialogHeader>
      <div className="memory-detail">
        <div className="detail-grid">
          <div><span>People</span><strong>{peopleCount}</strong></div>
          <div><span>Memories included</span><strong>{leaving} of {memories.length}</strong></div>
          <div><span>Private memories</span><strong>{privateCount}{includePrivate ? " · included" : " · left out"}</strong></div>
          <div><span>Awaiting review</span><strong>{pending} · stay marked Needs review</strong></div>
          <div><span>Agent grants</span><strong>{grantedClients ? `${grantedClients} ${grantedClients === 1 ? "assistant" : "assistants"} with access` : "No assistant has access"}</strong></div>
        </div>
        <div className="detail-control">
          <div><strong>Include private memories</strong><span>Keep on for a full backup. Turn off before giving this file to an MCP server or another client.</span></div>
          <Switch aria-label="Include private memories" checked={includePrivate} onCheckedChange={setIncludePrivate} />
        </div>
        <p className="small-note">The access log and Ask YOU conversation stay in this browser and are not exported.</p>
        <div className="detail-actions"><button className="outline-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={() => onExport(includePrivate)}><Download size={15} /> Download export</button></div>
      </div>
    </DialogContent>
  </Dialog>;
}

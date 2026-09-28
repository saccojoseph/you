import type * as React from "react";
import { Activity, CalendarDays, ChevronRight, Heart, ShieldCheck, Users } from "lucide-react";
import type { Memory, MemoryStatus, Person } from "@/data/demo";

export const statusNames: Record<MemoryStatus, string> = { known: "Known", inferred: "Inferred", unknown: "Unknown", disputed: "Needs review" };

export function Avatar({ person, size = "md" }: { person: Person; size?: "sm" | "md" | "lg" }) {
  return <div className={`avatar avatar-${person.color} avatar-${size}`} aria-hidden="true">{person.initials}</div>;
}

export function Status({ memory }: { memory: Memory }) {
  return (
    <span className={`status status-${memory.status}`}>
      <span className="status-dot" />
      {statusNames[memory.status]}
      {memory.confidence !== null ? ` · ${Math.round(memory.confidence * 100)}%` : ""}
    </span>
  );
}

export function SectionTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CategoryIcon({ category, size = 19 }: { category: Memory["category"]; size?: number }) {
  if (category === "People") return <Users size={size} />;
  if (category === "Preferences") return <Heart size={size} />;
  if (category === "Routines") return <Activity size={size} />;
  if (category === "Plans") return <CalendarDays size={size} />;
  return <ShieldCheck size={size} />;
}

export function MemoryRow({ memory, subject, withIcon = true, onOpen }: { memory: Memory; subject?: string; withIcon?: boolean; onOpen: () => void }) {
  return (
    <button className="memory-row" onClick={onOpen}>
      {withIcon && <span className="memory-row-icon"><CategoryIcon category={memory.category} /></span>}
      <span className="memory-row-main">
        <strong>{memory.label}</strong>
        <span>{memory.value}</span>
        <small>{subject ? `${subject} · ` : ""}{memory.source}{memory.privacy !== "available" ? " · Private" : ""}</small>
      </span>
      <span className="memory-row-side"><Status memory={memory} /><ChevronRight size={18} /></span>
    </button>
  );
}

export function subjectName(subjectId: string, people: Person[]): string {
  return people.find(person => person.id === subjectId)?.name ?? "You";
}

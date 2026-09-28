"use client";

import { Bell, Check, Clock3, Plus } from "lucide-react";
import { useYou } from "../context";
import { SectionTitle } from "../ui";

const suggestionReminders: Record<string, string> = { chris: "Reach out to Chris", work: "Check in about your work week", "work-break": "Make space for a break", concert: "Look for outdoor live music", steve: "Follow up with Steve" };

function reminderLabel(id: string): string {
  return id.startsWith("custom:") ? id.slice(7) : suggestionReminders[id] ?? id;
}

export function RemindersView() {
  const { data, openModal, completeReminder } = useYou();
  return <>
    <SectionTitle eyebrow="OPEN LOOPS" title="Reminders" description="A small place for the things you don’t want to lose track of."
      action={<button className="primary-button" onClick={() => openModal({ kind: "reminder" })}><Plus size={16} /> Add reminder</button>} />
    <div className="reminders-list">
      {data.reminders.length ? data.reminders.map((id, index) => <div className="reminder-card" key={`${id}-${index}`}>
        <span className="reminder-icon"><Bell size={18} /></span>
        <div><strong>{reminderLabel(id)}</strong><p>{id.startsWith("custom:") ? "You added this" : "From a YOU suggestion"} · Saved in this browser</p></div>
        <button className="outline-button compact" onClick={() => completeReminder(id)}><Check size={14} /> Mark handled</button>
      </div>) : <div className="empty-card">
        <Bell size={27} />
        <h2>Nothing to remember right now.</h2>
        <p>You can add your own reminder or save one from a suggestion.</p>
        <button className="primary-button" onClick={() => openModal({ kind: "reminder" })}><Plus size={15} /> Add reminder</button>
      </div>}
    </div>
    <div className="reminder-plan"><Clock3 size={18} /><div><strong>Scheduled follow-ups are on the roadmap.</strong><p>This demo saves reminders locally. Background notifications will need an authorized scheduler and delivery channel.</p></div></div>
  </>;
}

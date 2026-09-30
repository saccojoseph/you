"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Bell, BookOpenText, Check, ChevronRight, Clock3, Inbox, Link2, LockKeyhole, Menu, MessageCircle, MoreHorizontal, Network, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { FirstRunDialog, type FirstRunAnswers } from "@/components/first-run";
import { YouMark } from "@/components/you-mark";
import type { Insight, Memory, Person } from "@/data/demo";
import { answerFromMemory, type MemoryAnswer } from "@/lib/ask-memory";
import { parseMemoryExport } from "@/lib/memory-export";
import { newId } from "@/lib/ids";
import { initialsFor } from "@/lib/relationships";
import { useAgentTools } from "./agent-tools";
import { YouContext, type MemoryEdit, type Modal, type PersonDraft, type YouApi } from "./context";
import { ActionDialog, AddDateDialog, AddMemoryDialog, DeletePersonDialog, ExportDialog, InsightDialog, MemoryDialog, PersonDialog, ReminderDialog, ResetDialog } from "./dialogs";
import { clearStoredState, initialState, readAskHistory, readState, seedVersion, todayISO, writeAskHistory, writeState, type SavedState, type View } from "./state";
import { AskView } from "./views/ask";
import { RelationshipsView, TimelineView } from "./views/circle";
import { ConnectionsView } from "./views/connections";
import { ForYouView } from "./views/for-you";
import { MemoryView, ReviewView } from "./views/memory";
import { PeopleView, PersonProfile } from "./views/people";
import { RemindersView } from "./views/reminders";
import { SettingsView } from "./views/settings";

const nav: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "for-you", label: "For you", icon: Sparkles }, { id: "review", label: "Review", icon: Inbox }, { id: "memory", label: "Memory", icon: BookOpenText },
  { id: "people", label: "People", icon: Users }, { id: "relationships", label: "Relationships", icon: Network }, { id: "timeline", label: "Timeline", icon: Clock3 },
  { id: "reminders", label: "Reminders", icon: Bell }, { id: "ask", label: "Ask YOU", icon: MessageCircle }, { id: "connections", label: "Connections", icon: Link2 },
  { id: "settings", label: "Privacy & access", icon: ShieldCheck },
];
const avatarColors = ["peach", "blue", "lilac", "mint", "rose", "sand", "slate"];

export function YouApp() {
  const [data, setData] = useState<SavedState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<View>("for-you");
  const [personId, setPersonId] = useState<string | null>(null);
  const [memoryId, setMemoryId] = useState<string | null>(null);
  const [memoryEditing, setMemoryEditing] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [actionInsight, setActionInsight] = useState<Insight | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [answers, setAnswers] = useState<MemoryAnswer[]>([]);
  const [introOpen, setIntroOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [today, setToday] = useState<Date | null>(null);
  const [todayText, setTodayText] = useState("Today");
  const [importError, setImportError] = useState("");
  const storageWarned = useRef(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const saved = readState();
      setData(saved);
      setAnswers(readAskHistory());
      setIntroOpen(!saved.introSeen);
      setHydrated(true);
      const now = new Date();
      setToday(now);
      setTodayText(new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(now));
    });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!hydrated || writeState(data) || storageWarned.current) return;
    storageWarned.current = true;
    queueMicrotask(() => setToast("This browser blocked saving. Changes will be lost when you close this tab."));
  }, [data, hydrated]);
  useEffect(() => { if (hydrated) writeAskHistory(answers); }, [answers, hydrated]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), Math.max(3300, toast.length * 55));
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((message: string) => setToast(message), []);
  useAgentTools(hydrated, data, setData, notify);

  const selectedPerson = data.people.find(p => p.id === personId) ?? null;
  const selectedMemory = data.memories.find(m => m.id === memoryId) ?? null;
  const pendingReview = data.memories.filter(m => m.status === "disputed").length;

  function navigate(next: View) { setView(next); setPersonId(null); setMobileNav(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function openPerson(id: string) { setView("people"); setPersonId(id); setMobileNav(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function patchMemory(id: string, patch: (memory: Memory) => Memory) { setData(prev => ({ ...prev, memories: prev.memories.map(m => m.id === id ? patch(m) : m) })); }

  function confirmMemory(id: string) {
    const date = todayISO();
    patchMemory(id, m => m.status === "unknown" ? m : { ...m, status: "known", confidence: 1, lastVerified: date, evidence: `${m.evidence} Confirmed by you on ${date}.` });
    notify("Confirmed by you.");
  }
  function correctMemory(id: string, edit: MemoryEdit) {
    const date = todayISO();
    patchMemory(id, m => ({
      ...m, label: edit.label.trim(), value: edit.value.trim(), status: "known", confidence: 1, source: "You", sourceType: "user", lastVerified: date,
      evidence: m.status === "unknown" ? `${m.evidence} You filled this in on ${date}.` : `${m.evidence} You corrected this on ${date} (previously “${m.value}”).`,
    }));
    notify("Saved as known, from you.");
  }
  function markForReview(id: string) {
    patchMemory(id, m => ({ ...m, status: "disputed", confidence: null, evidence: `${m.evidence} You marked this for review.` }));
    notify("Marked for review.");
  }
  function removeMemory(id: string) {
    const agent = data.memories.find(m => m.id === id)?.sourceType === "agent";
    setData(prev => ({ ...prev, memories: prev.memories.filter(m => m.id !== id) }));
    setMemoryId(null);
    notify(agent ? "Proposal rejected and removed." : "Memory removed from this browser.");
  }
  function addMemory(input: { subjectId: string; category: Memory["category"]; label: string; value: string }) {
    const date = todayISO();
    const memory: Memory = { id: newId("user"), subjectId: input.subjectId, category: input.category, label: input.label.trim(), value: input.value.trim(), status: "known", confidence: 1, source: "You", sourceType: "user", observedAt: date, lastVerified: date, evidence: "You added this directly.", privacy: "available" };
    setData(prev => ({ ...prev, memories: [memory, ...prev.memories] }));
    setModal(null);
    notify("Saved to your memory.");
  }
  function addDate(person: Person, label: string, isoDate: string) {
    const date = todayISO();
    const value = new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" });
    const memory: Memory = { id: newId("date"), subjectId: person.id, category: "People", label, value, status: "known", confidence: 1, source: "You", sourceType: "user", observedAt: date, lastVerified: date, evidence: "You added this date directly.", privacy: "available" };
    setData(prev => ({ ...prev, memories: [memory, ...prev.memories] }));
    setModal(null);
    notify("Important date added.");
  }
  function savePerson(existing: Person | null, draft: PersonDraft) {
    const name = draft.name.trim();
    if (existing) {
      setData(prev => ({ ...prev, people: prev.people.map(p => p.id === existing.id ? { ...p, name, relation: draft.relation.trim(), importance: draft.importance, initials: name === p.name ? p.initials : initialsFor(name) } : p) }));
      notify("Person updated.");
    } else {
      const person: Person = { id: newId("person"), name, relation: draft.relation.trim() || "Someone you know", importance: draft.importance, initials: initialsFor(name), color: avatarColors[data.people.length % avatarColors.length], lastContact: "Not recorded yet", details: "" };
      setData(prev => ({ ...prev, people: [...prev.people, person] }));
      openPerson(person.id);
      notify(`${name} added.`);
    }
    setModal(null);
  }
  function deletePerson(id: string) {
    const name = data.people.find(p => p.id === id)?.name ?? "Person";
    setData(prev => ({ ...prev, people: prev.people.filter(p => p.id !== id), memories: prev.memories.filter(m => m.subjectId !== id) }));
    setModal(null);
    setPersonId(null);
    notify(`${name} removed from this browser.`);
  }
  function dismiss(id: string) { setData(prev => ({ ...prev, dismissed: [...prev.dismissed, id] })); notify("Suggestion dismissed."); }
  function remind(id: string) { setData(prev => ({ ...prev, reminders: [...new Set([...prev.reminders, id])] })); notify("Added to your reminders."); }
  function createReminder(text: string) { setData(prev => ({ ...prev, reminders: [`custom:${text}`, ...prev.reminders] })); setModal(null); notify("Reminder added."); }
  function completeReminder(id: string) { setData(prev => ({ ...prev, reminders: prev.reminders.filter(item => item !== id) })); notify("Reminder marked handled."); }
  function ask(question: string) {
    const q = question.trim();
    if (!q) return;
    setAnswers(prev => [...prev, answerFromMemory(q, data)]);
    setView("ask");
    setPersonId(null);
  }
  function handleInsight(insight: Insight) {
    if (insight.id === "steve") { setData(prev => ({ ...prev, handled: [...prev.handled, "steve"] })); notify("Marked handled."); }
    else if (insight.id === "chris") ask("Draft a warm note to Chris");
    else { setActionInsight(insight); setModal({ kind: "action" }); }
  }
  function exportData(includePrivate: boolean) {
    const rest: Partial<SavedState> = { ...data };
    delete rest.accessLog;
    const memories = includePrivate ? data.memories : data.memories.filter(m => m.privacy === "available");
    const blob = new Blob([JSON.stringify({ format: "you-memory-export", version: 1, exportedAt: new Date().toISOString(), ...rest, memories }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "you-memory-export.json";
    link.click();
    URL.revokeObjectURL(url);
    setModal(null);
    notify(includePrivate ? "Your full memory export is ready." : "Your export is ready, without private memories.");
  }
  function importData(file: File) {
    setImportError("");
    if (file.size > 10 * 1024 * 1024) { setImportError("That file is too large for the demo. Choose a YOU export under 10 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const incoming = parseMemoryExport(JSON.parse(String(reader.result)));
        setData({ ...initialState, ...incoming, seedVersion });
        notify("Memory imported. This replaced what was stored in this browser.");
      } catch (error) { setImportError(error instanceof Error ? error.message : "Could not read that file. Export a fresh copy and try again."); }
    };
    reader.onerror = () => setImportError("Could not read that file. Export a fresh copy and try again.");
    reader.readAsText(file);
  }
  function reset() {
    clearStoredState();
    setData(initialState);
    setAnswers([]);
    setPersonId(null);
    setModal(null);
    notify("Demo restored.");
  }
  function finishOnboarding(answers: FirstRunAnswers) {
    const date = todayISO();
    const items = [
      { label: "A person who matters", value: answers.person, category: "People" as const },
      { label: "Something that brings me joy", value: answers.joy, category: "Preferences" as const },
      { label: "What I want help with", value: answers.focus, category: "Plans" as const },
      { label: "How to check in", value: answers.style, category: "Wellbeing" as const },
    ].filter(item => item.value.trim()).map((item): Memory => ({ id: newId("engram"), subjectId: "self", category: item.category, label: item.label, value: item.value.trim(), status: "known", confidence: 1, source: "You · first engram", sourceType: "user", observedAt: date, lastVerified: date, evidence: "You shared this in the first engram questionnaire.", privacy: "available" }));
    setData(prev => ({ ...prev, memories: [...items, ...prev.memories], onboarded: true, introSeen: true, selectedSources: answers.sources, selectedHarness: answers.harness, routines: answers.routines, publicDiscovery: answers.publicDiscovery, publicProfileUrl: answers.publicProfileUrl }));
    setModal(null);
    notify("Your first engram is saved.");
  }

  const api: YouApi = {
    data, setData, today, todayText, answers, importError, notify, navigate, openPerson,
    closePerson: () => setPersonId(null),
    openMemory: (id, options) => { setMemoryEditing(!!options?.edit); setMemoryId(id); },
    openModal: setModal,
    showInsight: setSelectedInsight,
    confirmMemory, correctMemory, markForReview, removeMemory,
    setMemoryPrivacy: (id, privacy) => patchMemory(id, m => ({ ...m, privacy })),
    dismiss, remind, completeReminder, handleInsight, ask,
    clearAnswers: () => setAnswers([]),
    importData,
    setGrant: (clientId, scope, allowed) => setData(prev => {
      const current = prev.grants[clientId] ?? [];
      const scopes = allowed ? [...new Set([...current, scope])] : current.filter(s => s !== scope);
      return { ...prev, grants: { ...prev.grants, [clientId]: scopes } };
    }),
    revokeClient: clientId => { setData(prev => ({ ...prev, grants: { ...prev.grants, [clientId]: [] } })); notify("Access revoked."); },
    clearAccessLog: () => setData(prev => ({ ...prev, accessLog: [] })),
  };
  const grantedClients = useMemo(() => Object.values(data.grants).filter(scopes => scopes?.length).length, [data.grants]);
  const modalPerson = modal && "personId" in modal && modal.personId ? data.people.find(p => p.id === modal.personId) ?? null : null;

  return <YouContext.Provider value={api}>
    <div className="app-shell">
      {introOpen && <div className="intro-screen" role="dialog" aria-modal="true" aria-label="Welcome to YOU"><div className="intro-center"><div className="intro-mark"><YouMark /></div><div className="intro-words"><span className="intro-hi">Hi.</span><span className="intro-name">I’m YOU.</span></div><p>The last agent you’ll ever need.</p><div className="intro-buttons"><button onClick={() => { setIntroOpen(false); setData(prev => ({ ...prev, introSeen: true })); setModal({ kind: "setup" }); }}>Begin <ArrowRight size={17} /></button><button onClick={() => { setIntroOpen(false); setData(prev => ({ ...prev, introSeen: true })); }}>Explore the demo</button></div></div></div>}
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="sidebar-top"><button className="brand" onClick={() => navigate("for-you")}><span className="brand-mark"><YouMark /></span><span><strong>YOU</strong><small>Your personal context</small></span></button><button className="mobile-close" aria-label="Close navigation" onClick={() => setMobileNav(false)}><X size={20} /></button></div>
        <div className="nav-caption">YOUR SPACE</div>
        <nav aria-label="Main navigation" className="nav-list">
          {nav.map(item => {
            const Icon = item.icon;
            return <button key={item.id} className={`nav-link ${view === item.id ? "active" : ""}`} onClick={() => navigate(item.id)}>
              <Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>
              {item.id === "memory" && <span className="nav-count">{data.memories.length}</span>}
              {item.id === "review" && pendingReview > 0 && <span className="nav-count attention" aria-label={`${pendingReview} waiting`}>{pendingReview}</span>}
            </button>;
          })}
        </nav>
        <div className="sidebar-bottom"><div className="privacy-mini"><LockKeyhole size={15} /><span>Fictional data · stored in this browser</span></div><div className="user-row"><span className="user-avatar">A</span><span><strong>Alex</strong><small>Personal space</small></span><MoreHorizontal size={17} /></div></div>
      </aside>
      {mobileNav && <button aria-label="Close navigation" className="nav-scrim" onClick={() => setMobileNav(false)} />}
      <div className="app-main">
        <header className="topbar"><button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={21} /></button><div className="breadcrumb"><span>YOU</span><ChevronRight size={14} /><strong>{selectedPerson?.name ?? nav.find(n => n.id === view)?.label}</strong></div><div className="top-actions"><span className="demo-pill"><span /> Fictional demo</span><button className="icon-button" aria-label="Go to privacy settings" onClick={() => navigate("settings")}><ShieldCheck size={18} /></button></div></header>
        <main className="content">
          {data.onboarded && (view === "connections" || view === "settings") && <div className="setup-current"><span className="setup-current-icon"><Sparkles size={18} /></span><div><strong>Your setup choices</strong><p>{data.selectedHarness ? `${data.selectedHarness} selected as your first assistant` : "No assistant selected"} · {data.selectedSources.length} possible sources · {data.routines.length} routine preferences. These are saved locally; no accounts or jobs are active.</p></div></div>}
          {view === "for-you" && <ForYouView />}
          {view === "review" && <ReviewView />}
          {view === "memory" && <MemoryView />}
          {view === "people" && (selectedPerson ? <PersonProfile person={selectedPerson} /> : <PeopleView />)}
          {view === "relationships" && <RelationshipsView />}
          {view === "timeline" && <TimelineView />}
          {view === "reminders" && <RemindersView />}
          {view === "ask" && <AskView />}
          {view === "connections" && <ConnectionsView />}
          {view === "settings" && <SettingsView />}
        </main>
      </div>

      <MemoryDialog key={`${memoryId ?? "none"}-${memoryEditing}`} startEditing={memoryEditing} memory={selectedMemory} people={data.people} onClose={() => setMemoryId(null)} onConfirm={confirmMemory} onCorrect={correctMemory} onMarkForReview={markForReview} onRemove={removeMemory} onPrivacy={api.setMemoryPrivacy} />
      <InsightDialog insight={selectedInsight} onClose={() => setSelectedInsight(null)} />
      {modal?.kind === "add-memory" && <AddMemoryDialog subjectId={modal.subjectId} people={data.people} onClose={() => setModal(null)} onSave={addMemory} />}
      {modal?.kind === "person" && <PersonDialog person={modalPerson} onClose={() => setModal(null)} onSave={draft => savePerson(modalPerson, draft)} />}
      {modal?.kind === "delete-person" && modalPerson && <DeletePersonDialog person={modalPerson} memoryCount={data.memories.filter(m => m.subjectId === modalPerson.id).length} onClose={() => setModal(null)} onDelete={() => deletePerson(modalPerson.id)} />}
      {modal?.kind === "add-date" && modalPerson && <AddDateDialog person={modalPerson} onClose={() => setModal(null)} onSave={(label, isoDate) => addDate(modalPerson, label, isoDate)} />}
      {modal?.kind === "reminder" && <ReminderDialog onClose={() => setModal(null)} onSave={createReminder} />}
      {modal?.kind === "action" && <ActionDialog insight={actionInsight} onClose={() => setModal(null)} onTalk={() => { setModal(null); ask("What should I make time for?"); }} onRemind={id => { remind(id); setModal(null); }} onConnectors={() => { setModal(null); navigate("connections"); }} />}
      {modal?.kind === "reset" && <ResetDialog onClose={() => setModal(null)} onReset={reset} />}
      {modal?.kind === "export" && <ExportDialog memories={data.memories} peopleCount={data.people.length} grantedClients={grantedClients} onClose={() => setModal(null)} onExport={exportData} />}
      <FirstRunDialog open={modal?.kind === "setup"} onClose={() => setModal(null)} onFinish={finishOnboarding} />
      {toast && <div role="status" className="toast"><Check size={16} />{toast}</div>}
    </div>
  </YouContext.Provider>;
}

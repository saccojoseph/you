"use client";

import { Activity, ArrowRight, BookOpenText, CalendarDays, Check, CircleHelp, Compass, Heart, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { insights, type Insight, type Memory } from "@/data/demo";
import { formatDaysUntil, shortDate, upcomingDates } from "@/lib/dates";
import { useYou } from "../context";
import { Status } from "../ui";

/**
 * Sample suggestions quote their evidence, so each stays visible only while that memory still says
 * what the suggestion claims and is not unknown or awaiting review. Editing the memory retires the stale text.
 */
const requiredEvidence: Record<string, { id: string; valueIncludes: string }> = {
  work: { id: "m-work", valueIncludes: "late evenings" },
  concert: { id: "m-live-music", valueIncludes: "outdoor concerts" },
  chris: { id: "m-chris-rhythm", valueIncludes: "two to three weeks" },
  steve: { id: "m-steve-loop", valueIncludes: "contractor" },
};

export function visibleInsights(memories: Memory[], dismissed: string[], handled: string[], mutedKinds: string[]): Insight[] {
  return insights.filter(insight => !dismissed.includes(insight.id) && !handled.includes(insight.id) && !mutedKinds.includes(insight.kind)
    && memories.some(memory => memory.id === requiredEvidence[insight.id].id && memory.value.toLowerCase().includes(requiredEvidence[insight.id].valueIncludes)
      && memory.status !== "disputed" && memory.status !== "unknown"));
}

function KindIcon({ kind }: { kind: Insight["kind"] }) {
  if (kind === "check-in") return <Heart size={17} />;
  if (kind === "opportunity") return <Compass size={17} />;
  if (kind === "relationship") return <Users size={17} />;
  return <Check size={17} />;
}

export function ForYouView() {
  const { data, setData, today, todayText, dismiss, remind, notify, handleInsight, showInsight, navigate, openMemory, openModal, openPerson } = useYou();
  const shown = visibleInsights(data.memories, data.dismissed, data.handled, data.mutedKinds);
  const spotlight = data.memories.find(m => m.id === "m-live-music" && m.status === "known");
  const upcoming = upcomingDates(data.memories, data.people, today, 45).slice(0, 4);
  const pending = data.memories.filter(m => m.status === "disputed").length;

  function secondary(insight: Insight) {
    if (insight.secondary.toLowerCase().includes("remind")) remind(insight.id);
    else if (insight.secondary.includes("fewer")) {
      setData(prev => ({ ...prev, mutedKinds: [...prev.mutedKinds, insight.kind] }));
      notify("You’ll see fewer suggestions like this.");
    } else dismiss(insight.id);
  }

  return <>
    <div className="greeting">
      <div className="eyebrow">{todayText.toUpperCase()} · YOUR SPACE</div>
      <h1>Good to see you, Alex.</h1>
      <p>Here are a few things I noticed. You decide what’s useful.</p>
    </div>
    {!data.onboarded && <div className="engram-banner">
      <span className="engram-symbol"><BookOpenText size={21} /></span>
      <div><strong>Make YOU yours</strong><p>Choose possible sources and an assistant, then create your first engram.</p></div>
      <button onClick={() => openModal({ kind: "setup" })}>Begin setup <ArrowRight size={16} /></button>
    </div>}
    {pending > 0 && <div className="engram-banner review-banner">
      <span className="engram-symbol"><CircleHelp size={21} /></span>
      <div><strong>{pending} {pending === 1 ? "memory needs" : "memories need"} your review</strong><p>Agent proposals and facts you flagged stay out of answers until you confirm them.</p></div>
      <button onClick={() => navigate("review")}>Review <ArrowRight size={16} /></button>
    </div>}
    <div className="feature-layout">
      <div className="insight-stack">
        {shown.length ? shown.map((insight, index) => (
          <article className={`insight-card ${index === 0 ? "featured" : ""}`} key={insight.id}>
            <div className="insight-top">
              <span className="insight-kicker"><span className={`kind-icon kind-${insight.kind}`}><KindIcon kind={insight.kind} /></span>{insight.eyebrow}</span>
              <button className="subtle-icon" aria-label={`Dismiss ${insight.title}`} onClick={() => dismiss(insight.id)}><X size={16} /></button>
            </div>
            <h2>{insight.title}</h2>
            <p>{insight.body}</p>
            <div className="insight-actions">
              <button className="primary-button" onClick={() => handleInsight(insight)}>{insight.action}<ArrowRight size={16} /></button>
              <button className="text-button" onClick={() => secondary(insight)}>{insight.secondary}</button>
              <button className="why-button" onClick={() => showInsight(insight)}><CircleHelp size={15} />Why this?</button>
            </div>
            <div className="insight-evidence"><span className="evidence-dot" />{insight.confidence}<span className="evidence-separator">·</span>{insight.evidence[0]}</div>
          </article>
        )) : <div className="empty-card">
          <Sparkles size={28} />
          <h2>You’re all caught up.</h2>
          <p>Dismissed suggestions stay out of your way. Your memory is still here when you need it.</p>
          <button className="text-button" onClick={() => navigate("memory")}>Explore memory <ArrowRight size={16} /></button>
        </div>}
      </div>
      <aside className="context-rail">
        {upcoming.length > 0 && <div className="rail-card">
          <div className="rail-kicker"><CalendarDays size={16} /> COMING UP</div>
          <div className="upcoming-list">
            {upcoming.map(item => (
              <button key={item.memory.id} onClick={() => item.person ? openPerson(item.person.id) : openMemory(item.memory.id)}>
                <span className="upcoming-when">{formatDaysUntil(item.daysUntil)}</span>
                <span><strong>{item.person?.name ?? "You"} · {item.memory.label}</strong><small>{shortDate(item.date)}{item.memory.status === "inferred" ? " · inferred" : ""}</small></span>
              </button>
            ))}
          </div>
        </div>}
        {spotlight && <div className="rail-card memory-spotlight">
          <div className="rail-kicker"><BookOpenText size={16} /> A MEMORY IN CONTEXT</div>
          <h3>What I know about you</h3>
          <p>{spotlight.value}</p>
          <div className="memory-proof"><Status memory={spotlight} /><span>{spotlight.source}</span></div>
          <button className="rail-link" onClick={() => { navigate("memory"); openMemory(spotlight.id); }}>See the evidence <ArrowRight size={15} /></button>
        </div>}
        <div className="rail-card">
          <div className="rail-kicker"><Activity size={16} /> ABOUT DEVICE ACTIVITY</div>
          <h3>You’re in control</h3>
          <p>I can’t read TikTok or Screen Time here. If a supported connector becomes available, you can choose whether to share aggregate trends.</p>
          <button className="rail-link" onClick={() => navigate("connections")}>Review connections <ArrowRight size={15} /></button>
        </div>
        <div className="rail-note"><ShieldCheck size={17} /><span>Suggestions use visible evidence. Uncertain patterns stay uncertain.</span></div>
      </aside>
    </div>
  </>;
}

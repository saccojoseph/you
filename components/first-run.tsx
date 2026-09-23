"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenText, CalendarDays, Check, Clock3, Link2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

export type FirstRunAnswers = {
  sources: string[];
  harness: string;
  person: string;
  joy: string;
  focus: string;
  style: string;
  routines: string[];
  publicDiscovery: boolean;
  publicProfileUrl: string;
};

const sources = [
  { id: "contacts", label: "Contacts", note: "People & dates" },
  { id: "gmail", label: "Gmail", note: "Conversations" },
  { id: "calendar", label: "Calendar", note: "Plans & rhythms" },
  { id: "linkedin", label: "LinkedIn", note: "Public updates" },
  { id: "instagram", label: "Instagram", note: "Public interests" },
  { id: "facebook", label: "Facebook", note: "Events & dates" },
  { id: "device", label: "Device activity", note: "Optional trends" },
];

const harnesses = ["Claude", "ChatGPT / OpenAI", "Codex", "Local model", "Another MCP client", "Not sure yet"];
const routines = [
  { id: "Morning briefing", detail: "A short look at plans, people, and open loops" },
  { id: "Weekly people check-in", detail: "A gentle reminder about relationships" },
  { id: "Evening wind-down", detail: "A quiet prompt when the day looks full" },
  { id: "Local ideas", detail: "Activities that match your interests" },
];

const initial: FirstRunAnswers = { sources: [], harness: "", person: "", joy: "", focus: "", style: "Gentle check-ins", routines: ["Morning briefing", "Weekly people check-in"], publicDiscovery: false, publicProfileUrl: "" };

export function FirstRunDialog({ open, onClose, onFinish }: { open: boolean; onClose: () => void; onFinish: (answers: FirstRunAnswers) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<FirstRunAnswers>(initial);
  const toggle = (key: "sources" | "routines", value: string) => setAnswers(prev => ({ ...prev, [key]: prev[key].includes(value) ? prev[key].filter(x => x !== value) : [...prev[key], value] }));
  const next = () => step < 4 ? setStep(step + 1) : onFinish(answers);
  return <Dialog open={open} onOpenChange={value => !value && onClose()}><DialogContent className="first-run-dialog"><DialogHeader><DialogTitle>{["Connect your world", "Choose your agent", "Begin your engram", "Set your rhythm", "Your space is ready"][step]}</DialogTitle><DialogDescription>{["Choose sources you may want YOU to learn from.", "YOU works with the assistant you prefer.", "A few things in your own words help YOU start well.", "Choose what YOU should bring to your attention.", "Review your choices before you enter the demo."][step]}</DialogDescription></DialogHeader><div className="setup-progress"><span style={{ width: `${(step + 1) * 20}%` }} /></div>
    {step === 0 && <div className="setup-body"><div className="setup-options source-options">{sources.map(source => <button key={source.id} className={answers.sources.includes(source.id) ? "selected" : ""} onClick={() => toggle("sources", source.id)}><span className="setup-option-icon">{source.id === "contacts" ? <Users size={18} /> : source.id === "calendar" ? <CalendarDays size={18} /> : source.id === "device" ? <Clock3 size={18} /> : <Link2 size={18} />}</span><span><strong>{source.label}</strong><small>{source.note}</small></span><span className="setup-check">{answers.sources.includes(source.id) && <Check size={14} />}</span></button>)}</div><div className="setup-permission"><div><strong>Public profile discovery</strong><p>In a future version, YOU could inspect a public profile you provide and ask you to review candidate facts. No lookup happens in this demo.</p></div><Switch aria-label="Allow public profile discovery" checked={answers.publicDiscovery} onCheckedChange={checked => setAnswers({ ...answers, publicDiscovery: checked })} /></div>{answers.publicDiscovery && <input className="setup-input" aria-label="Public profile URL" placeholder="Optional public profile URL" value={answers.publicProfileUrl} onChange={e => setAnswers({ ...answers, publicProfileUrl: e.target.value })} />}<p className="setup-footnote">Selecting a source saves your preference. It does not connect an account yet.</p></div>}
    {step === 1 && <div className="setup-body"><div className="setup-story"><span className="setup-story-icon"><Sparkles size={21} /></span><p>Your memory can follow you across models. Choose where you would like YOU to appear first.</p></div><div className="setup-options harness-options">{harnesses.map(harness => <button key={harness} className={answers.harness === harness ? "selected" : ""} onClick={() => setAnswers({ ...answers, harness })}><strong>{harness}</strong><span className="setup-check">{answers.harness === harness && <Check size={14} />}</span></button>)}</div><p className="setup-footnote">MCP and API connection steps are a roadmap item. No assistant is granted access by this choice.</p></div>}
    {step === 2 && <div className="setup-body setup-fields"><div className="setup-story"><span className="setup-story-icon"><BookOpenText size={21} /></span><p>This first engram is a starting point. Every answer can be edited, hidden, or removed.</p></div><label>Who matters most right now?<input className="setup-input" placeholder="e.g. My partner Morgan" value={answers.person} onChange={e => setAnswers({ ...answers, person: e.target.value })} /></label><label>What brings you joy?<input className="setup-input" placeholder="e.g. Outdoor concerts and weekends away" value={answers.joy} onChange={e => setAnswers({ ...answers, joy: e.target.value })} /></label><label>What should YOU help you make time for?<input className="setup-input" placeholder="e.g. Seeing friends outside of work" value={answers.focus} onChange={e => setAnswers({ ...answers, focus: e.target.value })} /></label><label>How should YOU check in?<select className="setup-input" value={answers.style} onChange={e => setAnswers({ ...answers, style: e.target.value })}><option>Gentle check-ins</option><option>Only when I ask</option><option>Direct and practical</option></select></label></div>}
    {step === 3 && <div className="setup-body"><div className="setup-options routine-options">{routines.map(routine => <button key={routine.id} className={answers.routines.includes(routine.id) ? "selected" : ""} onClick={() => toggle("routines", routine.id)}><span><strong>{routine.id}</strong><small>{routine.detail}</small></span><span className="setup-check">{answers.routines.includes(routine.id) && <Check size={14} />}</span></button>)}</div><p className="setup-footnote">These are saved preferences in the demo. Scheduled jobs will require an authorized background service.</p></div>}
    {step === 4 && <div className="setup-body"><div className="setup-summary"><div><span>Sources to explore</span><strong>{answers.sources.length ? answers.sources.map(id => sources.find(s => s.id === id)?.label).join(", ") : "None yet"}</strong></div><div><span>First assistant</span><strong>{answers.harness || "Decide later"}</strong></div><div><span>Your engram</span><strong>{[answers.person, answers.joy, answers.focus].filter(Boolean).length} personal details</strong></div><div><span>Possible routines</span><strong>{answers.routines.length} selected</strong></div></div><div className="setup-promise"><ShieldCheck size={20} /><div><strong>You stay in control.</strong><p>Everything is editable. This demo stores your choices locally and does not connect accounts or schedule real jobs.</p></div></div></div>}
    <div className="setup-actions"><button className="setup-back" onClick={() => step ? setStep(step - 1) : onClose()}>{step ? <><ArrowLeft size={15} /> Back</> : "Explore demo instead"}</button><button className="primary-button" onClick={next}>{step === 4 ? "Enter YOU" : "Continue"}<ArrowRight size={16} /></button></div></DialogContent></Dialog>;
}

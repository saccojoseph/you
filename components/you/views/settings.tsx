"use client";

import { useRef } from "react";
import { Download, Eye, History, LockKeyhole, Network, Trash2, Upload } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { agentClients, grantableScopes } from "@/lib/agent-access";
import { useYou } from "../context";
import { SectionTitle } from "../ui";

const suggestionKinds = [
  { id: "check-in", name: "Gentle wellbeing check-ins", desc: "Patterns can prompt a question, never a diagnosis." },
  { id: "opportunity", name: "Plans and local ideas", desc: "Suggest activities based on your interests." },
  { id: "relationship", name: "People reminders", desc: "Surface important dates and changed rhythms." },
];

function logTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function SettingsView() {
  const { data, setData, openModal, importData, importError, setGrant, revokeClient, clearAccessLog } = useYou();
  const fileInput = useRef<HTMLInputElement | null>(null);

  return <>
    <SectionTitle eyebrow="YOU STAY IN CHARGE" title="Privacy & access" description="See what is stored, control what agents may read, and take your data with you." />
    <div className="settings-grid">
      <div>
        <section className="settings-card">
          <div className="settings-card-head"><span className="settings-icon"><LockKeyhole size={18} /></span><div><h2>Storage</h2><p>This prototype stores demo changes only in this browser’s local storage.</p></div></div>
          <div className="setting-row"><div><strong>Local mode</strong><span>No account or server sync is active.</span></div><span className="status status-known"><span className="status-dot" />On</span></div>
          <div className="setting-row"><div><strong>Export your memory</strong><span>Preview what leaves this browser, then download people, facts, states, and agent grants as JSON.</span></div><button className="outline-button compact" onClick={() => openModal({ kind: "export" })}><Download size={15} /> Export</button></div>
          <div className="setting-row">
            <div><strong>Import your memory</strong><span>Load a YOU export back in, here or in another compatible client. Facts keep their known, inferred, or unknown state and source.</span></div>
            <button className="outline-button compact" onClick={() => fileInput.current?.click()}><Upload size={15} /> Import</button>
            <input ref={fileInput} type="file" accept="application/json" style={{ display: "none" }} onChange={e => { const file = e.target.files?.[0]; if (file) importData(file); e.target.value = ""; }} />
          </div>
          {importError && <p className="settings-error">{importError}</p>}
        </section>
        <section className="settings-card">
          <div className="settings-card-head"><span className="settings-icon"><Eye size={18} /></span><div><h2>Suggestion boundaries</h2><p>Tell YOU when it can speak up.</p></div></div>
          {suggestionKinds.map(k => <div className="setting-row" key={k.id}>
            <div><strong>{k.name}</strong><span>{k.desc}</span></div>
            <Switch aria-label={k.name} checked={!data.mutedKinds.includes(k.id)} onCheckedChange={checked => setData(prev => ({ ...prev, mutedKinds: checked ? prev.mutedKinds.filter(x => x !== k.id) : [...prev.mutedKinds, k.id] }))} />
          </div>)}
        </section>
        <section className="settings-card">
          <div className="settings-card-head">
            <span className="settings-icon"><History size={18} /></span>
            <div><h2>Access log</h2><p>Every agent read and proposal, allowed or denied. Stored in this browser.</p></div>
            {data.accessLog.length > 0 && <button className="text-button log-clear" onClick={clearAccessLog}>Clear</button>}
          </div>
          {data.accessLog.length ? <ul className="access-log">
            {data.accessLog.slice(0, 25).map(entry => <li key={entry.id}>
              <span className={`log-outcome ${entry.outcome}`}>{entry.outcome === "allowed" ? "Allowed" : "Denied"}</span>
              <div><strong>{agentClients.find(c => c.id === entry.clientId)?.name ?? entry.clientId} · {entry.tool}</strong><span>{entry.detail}</span></div>
              <time dateTime={entry.at}>{logTime(entry.at)}</time>
            </li>)}
          </ul> : <p className="log-empty">No agent has asked for anything yet.</p>}
        </section>
      </div>
      <aside>
        <section className="settings-card">
          <div className="settings-card-head"><span className="settings-icon"><Network size={18} /></span><div><h2>Agent permissions</h2><p>Every assistant starts with no access. Grant only the topics it needs; private memories and memories awaiting review are always withheld.</p></div></div>
          {agentClients.map(client => {
            const scopes = data.grants[client.id] ?? [];
            return <div className="grant-row" key={client.id}>
              <div className="grant-row-head">
                <div><strong>{client.name}</strong><span>{client.enforcedBy}</span></div>
                {scopes.length ? <button className="text-button" onClick={() => revokeClient(client.id)}>Revoke all</button> : <span className="off-label">No access</span>}
              </div>
              <div className="grant-chips" role="group" aria-label={`${client.name} scopes`}>
                {grantableScopes.map(({ scope, label }) => {
                  const on = scopes.includes(scope);
                  return <button key={scope} className={`filter-chip ${on ? "selected" : ""}`} aria-pressed={on} title={scope} onClick={() => setGrant(client.id, scope, !on)}>{label}</button>;
                })}
              </div>
            </div>;
          })}
        </section>
        <section className="settings-card danger-card">
          <h2>Reset this demo</h2>
          <p>Clear changes made in this browser and restore the sample data.</p>
          <button className="danger-button" onClick={() => openModal({ kind: "reset" })}><Trash2 size={16} /> Reset demo data</button>
        </section>
      </aside>
    </div>
  </>;
}

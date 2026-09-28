"use client";

import { Activity, ArrowRight, Compass, Link2, Network, ShieldCheck } from "lucide-react";
import { connectors } from "@/data/demo";
import { useYou } from "../context";
import { SectionTitle } from "../ui";

export function ConnectionsView() {
  const { notify, navigate } = useYou();
  return <>
    <SectionTitle eyebrow="YOUR INPUTS & OUTPUTS" title="Connections" description="Choose what YOU may learn from, and which assistants may read your memory." />
    <div className="connection-intro">
      <div>
        <span className="connection-intro-icon"><Network size={24} /></span>
        <h2>One memory. Many assistants.</h2>
        <p>YOU keeps the context. Claude, OpenAI, Codex, local models, and future tools can access only the scopes you grant. A local MCP server preview reads your export and enforces those grants today.</p>
      </div>
      <div className="harness-tags"><span>Claude</span><span>OpenAI</span><span>Codex</span><span>Any MCP client</span></div>
    </div>
    <div className="subsection-head"><h2>Sources & capabilities</h2><span className="muted-small">Data sources are simulated in this prototype</span></div>
    <div className="connector-grid">
      {connectors.map(c => {
        const local = c.id === "mcp";
        return <div className="connector-card" key={c.id}>
          <div className="connector-top">
            <span className="connector-icon">{c.id === "screentime" ? <Activity size={20} /> : c.id === "events" ? <Compass size={20} /> : local ? <Network size={20} /> : <Link2 size={20} />}</span>
            <span className={`connector-state ${local ? "demo" : c.status}`}>{local ? "Local preview" : c.status === "demo" ? "Demo source" : c.status === "available" ? "Placeholder" : "Exploring"}</span>
          </div>
          <h3>{c.name}</h3>
          <p>{c.description}</p>
          <small>{c.data}</small>
          <button className="rail-link" onClick={() => local
            ? notify("Export your memory, then run: npm run mcp -- --file you-memory-export.json --client claude. See docs/MCP.md.")
            : notify(`${c.name} is a placeholder. No live account was connected.`)}>
            {local ? "How to connect" : "How it would work"} <ArrowRight size={15} />
          </button>
        </div>;
      })}
    </div>
    <div className="access-card">
      <div>
        <div className="rail-kicker"><ShieldCheck size={16} /> AGENT ACCESS</div>
        <h2>Grant access per assistant, per topic.</h2>
        <p>Scopes such as people.read, preferences.read, and memory.write are set per assistant in Privacy & access. Browser agents and the local MCP server enforce them, and every read or proposal is logged.</p>
      </div>
      <button className="outline-button" onClick={() => navigate("settings")}>Manage agent access <ArrowRight size={16} /></button>
    </div>
  </>;
}

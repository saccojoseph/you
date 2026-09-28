"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { YouMark } from "@/components/you-mark";
import { useYou } from "../context";
import { SectionTitle } from "../ui";

const introQuestions = ["What do you remember about me?", "Who should I catch up with?", "Why do you think Mike likes golf?", "What should I make time for?", "What don't you know yet?"];

export function AskView() {
  const { answers, ask, clearAnswers } = useYou();
  const [input, setInput] = useState("");
  const end = useRef<HTMLDivElement | null>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [answers.length]);

  return <>
    <SectionTitle eyebrow="ASK YOUR MEMORY" title="Ask YOU" description="Answers come from the memory you can inspect. When I don’t know, I’ll say so."
      action={answers.length ? <button className="outline-button" onClick={clearAnswers}><RotateCcw size={15} /> Clear conversation</button> : undefined} />
    <div className="ask-layout">
      <div className="ask-panel">
        <div className="ask-conversation">
          {answers.length ? answers.map((a, index) => <div className="answer-block" key={`${a.question}-${index}`}>
            <div className="user-question">{a.question}</div>
            <div className="you-answer">
              <span className="tiny-brand"><YouMark /></span>
              <div><p>{a.text}</p>{a.sources.length > 0 && <div className="answer-sources"><strong>Based on</strong>{a.sources.map(s => <span key={s}>{s}</span>)}</div>}</div>
            </div>
          </div>) : <div className="ask-empty">
            <span className="ask-symbol"><Sparkles size={28} /></span>
            <h2>What’s on your mind?</h2>
            <p>Ask about people, plans, patterns, or what YOU remembers. This demo answers from its visible sample memory.</p>
          </div>}
          <div ref={end} />
        </div>
        <form className="ask-form" onSubmit={e => { e.preventDefault(); ask(input); setInput(""); }}>
          <input aria-label="Ask YOU a question" placeholder="Ask anything about your world…" value={input} onChange={e => setInput(e.target.value)} />
          <button aria-label="Send question" type="submit"><ArrowRight size={19} /></button>
        </form>
      </div>
      <aside className="ask-prompts"><h3>Try asking</h3>{introQuestions.map(q => <button key={q} onClick={() => ask(q)}>{q}<ArrowRight size={15} /></button>)}</aside>
    </div>
  </>;
}

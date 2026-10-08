"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Semester = { id: string; name: "FIRST" | "SECOND" };
type Session = { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean; semesters: Semester[]; _count: { students: number; offerings: number; fees: number; applications: number } };

export default function AcademicAdministration() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const r = await fetch("/api/admin/academic", { cache: "no-store" });
    const data = await r.json();
    if (r.ok) setSessions(data);
    else setError(data.error || "Unable to load academic sessions.");
  }
  useEffect(() => { load(); }, []);

  async function post(payload: Record<string, string | boolean>) {
    setError(""); setMessage(""); setLoading(true);
    try {
      const r = await fetch("/api/admin/academic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Request failed."); return; }
      setMessage("Academic configuration updated.");
      await load();
    } finally { setLoading(false); }
  }

  function createSession(e: FormEvent) {
    e.preventDefault();
    void post({ action: "create-session", name, startDate, endDate });
    setName(""); setStartDate(""); setEndDate("");
  }

  return <main className="portalPage">
    <nav className="portalNav"><Link href="/admin" className="brand"><span className="brandMark">U</span><span>Academic administration</span></Link><Link href="/api/auth/logout" className="portalLogout">Sign out</Link></nav>
    <section className="portalHero"><div className="eyebrow">ACADEMIC CONFIGURATION</div><h1>Sessions & semesters</h1><p>Manage academic periods and control the university-wide current session.</p></section>
    <section className="registrationShell">
      <div className="registrationHeader"><div><h2>Create academic session</h2><p>Use the official session label and its date range.</p></div><Link href="/admin" className="secondary">Back</Link></div>
      <form onSubmit={createSession} className="adminForm">
        <label>Session name<input value={name} onChange={e => setName(e.target.value)} placeholder="2026/2027" required /></label>
        <label>Start date<input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required /></label>
        <label>End date<input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required /></label>
        <button className="primary" disabled={loading}>Create session</button>
      </form>
      {error && <div className="formError">{error}</div>}{message && <div className="successBox">{message}</div>}
      <div className="catalogList">{sessions.map(s => <article className="portalCard" key={s.id}>
        <div className="registrationHeader"><div><div className="eyebrow">{s.isCurrent ? "CURRENT SESSION" : "ACADEMIC SESSION"}</div><h3>{s.name}</h3><p>{new Date(s.startDate).toLocaleDateString()} – {new Date(s.endDate).toLocaleDateString()}</p></div>{!s.isCurrent && <button className="secondary" onClick={() => void post({ action: "set-current", id: s.id })}>Set current</button>}</div>
        <div className="adminStats"><article><small>Students</small><strong>{s._count.students}</strong></article><article><small>Offerings</small><strong>{s._count.offerings}</strong></article><article><small>Fees</small><strong>{s._count.fees}</strong></article><article><small>Applications</small><strong>{s._count.applications}</strong></article></div>
        <div className="quickLinks">{s.semesters.map(sem => <span key={sem.id} className="roleBadge">{sem.name} SEMESTER</span>)}{s.semesters.length < 2 && <button className="secondary" onClick={() => void post({ action: "create-semester", sessionId: s.id, name: s.semesters.some(x => x.name === "FIRST") ? "SECOND" : "FIRST" })}>Add {s.semesters.some(x => x.name === "FIRST") ? "Second" : "First"} Semester</button>}</div>
      </article>)}</div>
    </section>
  </main>;
}

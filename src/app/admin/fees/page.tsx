"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Session = { id: string; name: string };
type Fee = { id: string; name: string; amount: number; session: string; programme: string; collected: number };

export default function FinanceAdmin() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", amount: "", sessionId: "" });

  async function load() {
    const [feeRes, sessionRes] = await Promise.all([fetch("/api/admin/fees"), fetch("/api/admin/academic")]);
    const feeData = await feeRes.json();
    const sessionData = await sessionRes.json();
    if (feeRes.ok) setFees(feeData); else setError(feeData.error || "Unable to load fees.");
    if (sessionRes.ok) {
      const list = sessionData.sessions ?? sessionData;
      setSessions(list);
      if (!form.sessionId && list[0]) setForm(x => ({ ...x, sessionId: list[0].id }));
    }
  }

  useEffect(() => { void load(); }, []);

  async function createFee(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const r = await fetch("/api/admin/fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, amount: Number(form.amount), sessionId: form.sessionId }),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error || "Unable to create fee."); return; }
    setForm(x => ({ ...x, name: "", amount: "" }));
    await load();
  }

  return <main className="portalPage">
    <nav className="portalNav"><Link href="/admin" className="brand"><span className="brandMark">U</span><span>Finance</span></Link><Link href="/api/auth/logout" className="portalLogout">Sign out</Link></nav>
    <section className="portalHero"><div className="eyebrow">FINANCIAL ADMINISTRATION</div><h1>Fees & payments</h1><p>Manage fee assessments and review successful student payments.</p></section>
    <section className="registrationShell">
      {error && <div className="formError">{error}</div>}
      <article className="portalCard"><h3>Create fee structure</h3><form onSubmit={createFee} className="formGrid">
        <label>Name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="School fees" required /></label>
        <label>Amount (₦)<input type="number" min="1" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></label>
        <label>Academic session<select value={form.sessionId} onChange={e => setForm({ ...form, sessionId: e.target.value })} required>{sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <button className="primary" type="submit">Create fee structure</button>
      </form></article>
      <article className="portalCard"><h3>Fee structures</h3>{fees.map(f => <div className="paymentRow" key={f.id}><div><b>{f.name}</b><span>{f.session} · {f.programme}</span></div><strong>₦{f.amount.toLocaleString()}</strong><em>Collected ₦{f.collected.toLocaleString()}</em></div>)}</article>
      <Link href="/admin" className="secondary">Back to administration</Link>
    </section>
  </main>;
}
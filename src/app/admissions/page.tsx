"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Programme = { id: string; name: string; award: string };

export default function AdmissionsPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", programmeId: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admissions/programmes")
      .then((r) => r.json())
      .then(setProgrammes)
      .catch(() => setProgrammes([]));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    const r = await fetch("/api/admissions/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await r.json();
    setMessage(data.message || data.error || "Unable to submit application.");
    if (r.ok) setForm({ firstName: "", lastName: "", email: "", password: "", programmeId: "" });
  }

  return (
    <main className="publicPage">
      <nav className="portalNav">
        <Link href="/" className="brand"><span className="brandMark">U</span><span>UNICROSS Digital Campus</span></Link>
        <Link href="/login" className="signInButton">Sign in</Link>
      </nav>
      <section className="admissionHero">
        <div>
          <div className="eyebrow">ADMISSIONS • PROTOTYPE</div>
          <h1>Start your application.</h1>
          <p className="lead">Submit a prototype admission application and receive an application number.</p>
          <p className="prototypeNotice">Demo environment only. This does not submit to an official UNICROSS admissions system.</p>
        </div>
        <div className="admissionCard">
          <h2>Application form</h2>
          <form onSubmit={submit}>
            <label>First name<input required value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})}/></label>
            <label>Last name<input required value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})}/></label>
            <label>Email<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
            <label>Password<input type="password" minLength={8} required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
            <label>Programme<select required value={form.programmeId} onChange={e=>setForm({...form,programmeId:e.target.value})}><option value="">Select programme</option>{programmes.map(p=><option key={p.id} value={p.id}>{p.name} — {p.award}</option>)}</select></label>
            <button className="primary" type="submit">Submit application</button>
            {message && <div className="registrationMessage">{message}</div>}
          </form>
        </div>
      </section>
    </main>
  );
}

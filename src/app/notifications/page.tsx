"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Notice = { id: string; title: string; body: string; publishedAt: string | null; author: { firstName: string; lastName: string } };

export default function Notifications() {
  const [items, setItems] = useState<Notice[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/notifications").then(async r => {
      const d = await r.json();
      if (r.ok) setItems(d); else setError(d.error || "Unable to load notifications.");
    });
  }, []);
  return <main className="portalPage">
    <nav className="portalNav"><Link href="/dashboard" className="brand"><span className="brandMark">U</span><span>Notifications</span></Link><Link href="/api/auth/logout" className="portalLogout">Sign out</Link></nav>
    <section className="portalHero"><div className="eyebrow">CAMPUS COMMUNICATION</div><h1>Notifications</h1><p>Published university announcements and important notices.</p></section>
    <section className="registrationShell">{error && <div className="formError">{error}</div>}{!error && !items.length && <article className="portalCard"><h3>No notifications</h3><p>You are up to date.</p></article>}{items.map(x => <article className="portalCard" key={x.id}><small>{x.publishedAt ? new Date(x.publishedAt).toLocaleString() : "Published"}</small><h3>{x.title}</h3><p>{x.body}</p><span>By {x.author.firstName} {x.author.lastName}</span></article>)}</section>
  </main>;
}
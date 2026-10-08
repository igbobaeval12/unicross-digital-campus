"use client";

import { useState } from "react";

const statuses = ["UNDER_REVIEW", "ACCEPTED", "REJECTED"] as const;

export default function AdmissionActions({ id, status }: { id: string; status: string }) {
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function update(next: string) {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/admissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Update failed.");
      setValue(next);
      setMessage("Saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  if (value === "ACCEPTED" || value === "REJECTED") return <em>{value} · {message || "Final"}</em>;

  return (
    <div className="quickLinks">
      <select value={value} disabled={saving} onChange={(event) => update(event.target.value)}>
        <option value={value}>{value}</option>
        {statuses.filter((item) => item !== value).map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <small>{saving ? "Saving…" : message}</small>
    </div>
  );
}

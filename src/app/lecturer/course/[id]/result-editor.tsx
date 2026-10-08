"use client";

import { useState } from "react";

type Row = {
  studentId: string;
  matricNumber: string;
  name: string;
  ca: number | string;
  exam: number | string;
};

export default function ResultEditor({ offeringId, rows }: { offeringId: string; rows: Row[] }) {
  const [items, setItems] = useState<Row[]>(rows);
  const [message, setMessage] = useState("");

  function calculate(row: Row) {
    const total = Number(row.ca) + Number(row.exam);
    const grade = total >= 70 ? "A" : total >= 60 ? "B" : total >= 50 ? "C" : total >= 45 ? "D" : total >= 40 ? "E" : "F";
    const point = grade === "A" ? 4 : grade === "B" ? 3 : grade === "C" ? 2 : grade === "D" ? 1 : 0;
    return { ...row, total, grade, point };
  }

  function updateRow(index: number, field: "ca" | "exam", value: string) {
    setItems((current) => current.map((row, i) => i === index ? { ...row, [field]: value } : row));
  }

  async function save(publish: boolean) {
    const response = await fetch("/api/lecturer/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offeringId,
        results: items.map(calculate).map((row) => ({
          studentId: row.studentId,
          caScore: row.ca,
          examScore: row.exam,
          status: publish ? "PUBLISHED" : "SUBMITTED",
        })),
      }),
    });
    const data = await response.json();
    setMessage(data.message || data.error || "Unable to save results.");
  }

  return (
    <div className="resultEditor">
      {items.map((row, index) => {
        const calculated = calculate(row);
        return (
          <div className="resultEditorRow" key={row.studentId}>
            <div>
              <b>{row.matricNumber}</b>
              <span>{row.name}</span>
            </div>
            <input type="number" min="0" max="40" value={row.ca} onChange={(e) => updateRow(index, "ca", e.target.value)} />
            <input type="number" min="0" max="60" value={row.exam} onChange={(e) => updateRow(index, "exam", e.target.value)} />
            <strong>{calculated.total}</strong>
            <em>{calculated.grade}</em>
          </div>
        );
      })}
      <div className="resultActions">
        <button className="secondary" type="button" onClick={() => save(false)}>Save</button>
        <button className="primary" type="button" onClick={() => save(true)}>Publish results</button>
      </div>
      {message && <div className="registrationMessage">{message}</div>}
    </div>
  );
}

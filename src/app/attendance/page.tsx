"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Student = {
  id: string;
  matricNumber: string;
  user: { firstName: string; lastName: string };
};
type AttendanceRecord = { studentId: string; date: string; status: string };
type Offering = {
  id: string;
  course: { code: string; title: string };
  semester: { name: string };
  enrollments: { student: Student }[];
  attendance: AttendanceRecord[];
};

export default function Attendance() {
  const [rows, setRows] = useState<Offering[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Record<string, string>>({});
  const [date] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    let cancelled = false;

    async function loadAttendance() {
      try {
        const response = await fetch("/api/attendance", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const data = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          setError(data.error || "Unable to load attendance.");
          return;
        }

        setRows(data as Offering[]);
        const initial: Record<string, string> = {};
        for (const offering of data as Offering[]) {
          for (const record of offering.attendance || []) {
            if (record.date.slice(0, 10) === date) {
              initial[record.studentId] = record.status;
            }
          }
        }
        setStatus(initial);
      } catch {
        if (!cancelled) setError("Unable to connect to the attendance service. Please refresh and try again.");
      }
    }

    void loadAttendance();
    return () => {
      cancelled = true;
    };
  }, [date]);

  async function mark(offeringId: string, studentId: string) {
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ offeringId, studentId, date, status: "PRESENT" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus((current) => ({ ...current, [studentId]: data.error || "Failed to mark attendance" }));
        return;
      }
      setStatus((current) => ({ ...current, [studentId]: "PRESENT" }));
    } catch {
      setStatus((current) => ({ ...current, [studentId]: "Could not connect; retry" }));
    }
  }

  return (
    <main className="portalPage">
      <nav className="portalNav">
        <Link href="/lecturer" className="brand">
          <span className="brandMark">U</span><span>Attendance</span>
        </Link>
        <Link href="/api/auth/logout" className="portalLogout">Sign out</Link>
      </nav>
      <section className="portalHero">
        <div className="eyebrow">LECTURER WORKSPACE</div>
        <h1>Attendance</h1>
        <p>Mark attendance for students enrolled in your assigned courses.</p>
      </section>
      <section className="registrationShell">
        {error && <div className="formError">{error}</div>}
        {rows.map((offering) => (
          <article className="portalCard" key={offering.id}>
            <h3>{offering.course.code} — {offering.course.title}</h3>
            <p>{offering.semester.name} semester · {offering.enrollments.length} students</p>
            {offering.enrollments.map(({ student }) => (
              <div className="catalogRow" key={student.id}>
                <strong>{student.matricNumber}</strong>
                <span>{student.user.firstName} {student.user.lastName}</span>
                <button className="secondary" onClick={() => void mark(offering.id, student.id)}>
                  {status[student.id] === "PRESENT" ? "Present ✓" : status[student.id] || "Mark present"}
                </button>
              </div>
            ))}
          </article>
        ))}
      </section>
    </main>
  );
}

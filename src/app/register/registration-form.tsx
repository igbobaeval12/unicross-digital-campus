"use client";

import { useState } from "react";

type Course = { id: string; code: string; title: string; unit: number; level: number; registered: boolean };

export default function RegistrationForm({ courses }: { courses: Course[] }) {
  const [items, setItems] = useState(courses);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function register(id: string) {
    setBusy(id); setMessage("");
    try {
      const response = await fetch("/api/student/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offeringId: id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Registration failed.");
      setItems((current) => current.map((course) => course.id === id ? { ...course, registered: true } : course));
      setMessage(data.message || "Course registered successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setBusy("");
    }
  }

  const totalUnits = items.filter((c) => c.registered).reduce((sum, c) => sum + c.unit, 0);

  return (
    <div>
      <div className="registrationSummary"><strong>{items.filter((c) => c.registered).length} registered</strong><span>{totalUnits} total units</span></div>
      {message && <div className="registrationMessage">{message}</div>}
      <div className="registrationList">
        {items.length ? items.map((course) => (
          <article className="registrationRow" key={course.id}>
            <div><b>{course.code}</b><span>{course.title}</span></div>
            <small>{course.unit} units · Level {course.level}</small>
            <button className={course.registered ? "registeredButton" : "primary"} disabled={course.registered || busy === course.id} onClick={() => register(course.id)}>
              {busy === course.id ? "Registering…" : course.registered ? "Registered" : "Register"}
            </button>
          </article>
        )) : <div className="emptyState">No course offerings are available for your department and level yet.</div>}
      </div>
    </div>
  );
}
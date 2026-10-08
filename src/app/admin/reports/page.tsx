export const dynamic = "force-dynamic";

import Link from "next/link";
import type { ReactNode } from "react";
import { requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  await requireRoles(["UNIVERSITY_ADMIN", "SUPER_ADMIN", "FACULTY_ADMIN", "DEPARTMENT_ADMIN", "FINANCE"]);

  const [
    students,
    staff,
    activeEnrollments,
    publishedResults,
    attendance,
    paymentSummary,
    paymentStatuses,
    admissionStatuses,
    resultStatuses,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.staff.count(),
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),
    prisma.result.count({ where: { status: "PUBLISHED" } }),
    prisma.attendance.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.payment.aggregate({ where: { status: "SUCCESSFUL" }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.payment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.admissionApplication.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.result.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const paymentTotal = Number(paymentSummary._sum.amount ?? 0);

  return (
    <main className="portalPage">
      <nav className="portalNav">
        <Link href="/admin" className="brand">
          <span className="brandMark">U</span>
          <span>UNICROSS Digital Campus</span>
        </Link>
        <Link href="/admin" className="portalLogout">Back to management</Link>
      </nav>

      <section className="portalHero">
        <div className="eyebrow">MANAGEMENT REPORTS</div>
        <h1>Institutional analytics</h1>
        <p>Operational indicators across students, academics, finance, admissions and attendance.</p>
      </section>

      <section className="adminStats">
        {[
          ["Students", students],
          ["Staff", staff],
          ["Active enrollments", activeEnrollments],
          ["Published results", publishedResults],
          ["Successful payments", paymentSummary._count._all],
          ["Collected value", `₦${paymentTotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`],
        ].map(([label, value]) => (
          <article key={String(label)}>
            <small>{label}</small>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="registrationShell">
        <div className="adminGrid">
          <ReportCard title="Payment status">
            {paymentStatuses.map((item) => <ReportRow key={item.status} label={item.status} value={item._count._all} />)}
          </ReportCard>

          <ReportCard title="Admission pipeline">
            {admissionStatuses.map((item) => <ReportRow key={item.status} label={item.status} value={item._count._all} />)}
          </ReportCard>

          <ReportCard title="Result workflow">
            {resultStatuses.map((item) => <ReportRow key={item.status} label={item.status} value={item._count._all} />)}
          </ReportCard>

          <ReportCard title="Attendance">
            {attendance.length ? attendance.map((item) => <ReportRow key={item.status} label={item.status} value={item._count._all} />) : <p>No attendance records yet.</p>}
          </ReportCard>
        </div>
      </section>
    </main>
  );
}

function ReportCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="portalCard">
      <h3>{title}</h3>
      <div className="quickLinks">{children}</div>
    </article>
  );
}

function ReportRow({ label, value }: { label: string; value: number }) {
  return <div className="reportRow"><span>{label.replaceAll("_", " ")}</span><strong>{value}</strong></div>;
}

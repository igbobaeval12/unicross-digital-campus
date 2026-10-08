export const dynamic = "force-dynamic";

import Link from "next/link";
import type { ReactNode } from "react";
import { requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  const user = await requireRoles(["UNIVERSITY_ADMIN", "SUPER_ADMIN", "FACULTY_ADMIN", "DEPARTMENT_ADMIN"]);

  const unit = user.role === "UNIVERSITY_ADMIN" || user.role === "SUPER_ADMIN"
    ? null
    : await prisma.staff.findUnique({ where: { userId: user.id }, select: { facultyId: true, departmentId: true } });

  if (!unit && user.role !== "UNIVERSITY_ADMIN" && user.role !== "SUPER_ADMIN") {
    return <main className="portalPage"><section className="registrationShell"><div className="emptyState">No academic-unit assignment is configured for this administrator.</div></section></main>;
  }

  const departmentFilter = unit?.departmentId
    ? { departmentId: unit.departmentId }
    : unit?.facultyId
      ? { facultyId: unit.facultyId }
      : undefined;

  const courseFilter = departmentFilter ? { department: departmentFilter } : undefined;
  const studentFilter = departmentFilter ? { department: departmentFilter } : undefined;
  const staffFilter = departmentFilter ? { OR: [{ department: departmentFilter }, { facultyId: unit?.facultyId ?? undefined }] } : undefined;

  const offeringFilter = courseFilter ? { course: courseFilter } : undefined;
  const resultFilter = offeringFilter ? { offering: offeringFilter } : undefined;
  const attendanceFilter = offeringFilter ? { offering: offeringFilter } : undefined;
  const enrollmentFilter = offeringFilter ? { offering: offeringFilter, status: "ACTIVE" as const } : { status: "ACTIVE" as const };
  const paymentFilter = studentFilter ? { student: studentFilter, status: "SUCCESSFUL" as const } : { status: "SUCCESSFUL" as const };
  const admissionFilter = departmentFilter ? { programme: { department: departmentFilter } } : undefined;

  const [students, staff, activeEnrollments, publishedResults, attendance, paymentSummary, paymentStatuses, admissionStatuses, resultStatuses] = await Promise.all([
    prisma.student.count({ where: studentFilter }),
    prisma.staff.count({ where: staffFilter }),
    prisma.enrollment.count({ where: enrollmentFilter }),
    prisma.result.count({ where: resultFilter ? { ...resultFilter, status: "PUBLISHED" } : { status: "PUBLISHED" } }),
    prisma.attendance.groupBy({ by: ["status"], where: attendanceFilter, _count: { _all: true } }),
    prisma.payment.aggregate({ where: paymentFilter, _sum: { amount: true }, _count: { _all: true } }),
    prisma.payment.groupBy({ by: ["status"], where: studentFilter ? { student: studentFilter } : undefined, _count: { _all: true } }),
    prisma.admissionApplication.groupBy({ by: ["status"], where: admissionFilter, _count: { _all: true } }),
    prisma.result.groupBy({ by: ["status"], where: resultFilter, _count: { _all: true } }),
  ]);

  const paymentTotal = Number(paymentSummary._sum.amount ?? 0);

  return (
    <main className="portalPage">
      <nav className="portalNav">
        <Link href="/admin" className="brand"><span className="brandMark">U</span><span>UNICROSS Digital Campus</span></Link>
        <Link href="/admin" className="portalLogout">Back to management</Link>
      </nav>
      <section className="portalHero">
        <div className="eyebrow">MANAGEMENT REPORTS</div>
        <h1>Institutional analytics</h1>
        <p>Operational indicators scoped to your authorized academic unit.</p>
      </section>
      <section className="adminStats">
        {[
          ["Students", students],
          ["Staff", staff],
          ["Active enrollments", activeEnrollments],
          ["Published results", publishedResults],
          ["Successful payments", paymentSummary._count._all],
          ["Collected value", `₦${paymentTotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`],
        ].map(([label, value]) => <article key={String(label)}><small>{label}</small><strong>{value}</strong></article>)}
      </section>
      <section className="registrationShell">
        <div className="adminGrid">
          <ReportCard title="Payment status">{paymentStatuses.map(item => <ReportRow key={item.status} label={item.status} value={item._count._all} />)}</ReportCard>
          <ReportCard title="Admission pipeline">{admissionStatuses.map(item => <ReportRow key={item.status} label={item.status} value={item._count._all} />)}</ReportCard>
          <ReportCard title="Result workflow">{resultStatuses.map(item => <ReportRow key={item.status} label={item.status} value={item._count._all} />)}</ReportCard>
          <ReportCard title="Attendance">{attendance.length ? attendance.map(item => <ReportRow key={item.status} label={item.status} value={item._count._all} />) : <p>No attendance records yet.</p>}</ReportCard>
        </div>
      </section>
    </main>
  );
}

function ReportCard({ title, children }: { title: string; children: ReactNode }) {
  return <article className="portalCard"><h3>{title}</h3><div className="quickLinks">{children}</div></article>;
}

function ReportRow({ label, value }: { label: string; value: number }) {
  return <div className="reportRow"><span>{label.replaceAll("_", " ")}</span><strong>{value}</strong></div>;
}

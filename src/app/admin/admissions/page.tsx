export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Admissions() {
  await requireRoles(["UNIVERSITY_ADMIN", "SUPER_ADMIN", "FACULTY_ADMIN", "DEPARTMENT_ADMIN"]);
  const applications = await prisma.admissionApplication.findMany({
    include: { applicant: true, programme: true, session: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="portalPage">
      <nav className="portalNav">
        <Link href="/admin" className="brand"><span className="brandMark">U</span><span>Admissions</span></Link>
      </nav>
      <section className="registrationShell">
        <div className="registrationHeader">
          <div><div className="eyebrow">ADMISSIONS MANAGEMENT</div><h2>Applications</h2></div>
          <Link href="/admin" className="secondary">Back</Link>
        </div>
        <div className="catalogList">
          {applications.map((application) => (
            <div className="catalogRow" key={application.id}>
              <b>{application.applicationNo}</b>
              <div>
                <strong>{application.applicant.firstName} {application.applicant.lastName}</strong>
                <span>{application.programme.name} · {application.session.name}</span>
              </div>
              <em>{application.status}</em>
            </div>
          ))}
          {!applications.length && <div className="emptyState">No applications yet.</div>}
        </div>
      </section>
    </main>
  );
}

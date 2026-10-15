// Keep logout actions as plain anchors: Next.js Link prefetch can call the GET logout endpoint.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Lecturer() {
  const u = await requireRoles(["LECTURER"]);
  const staffInclude = { department: true, offerings: { include: { course: true, enrollments: { where: { status: "ACTIVE" as const } } } } };

  let s = await prisma.staff.findUnique({
    where: { userId: u.id },
    include: staffInclude,
  });

  // Repair the seeded demo lecturer profile on the same database used by the
  // live request. This also handles deployments where the pre-deploy seed and
  // runtime DATABASE_URL were temporarily out of sync.
  if (!s && u.email.toLowerCase() === "lecturer@demo.unicross.edu.ng") {
    const department = await prisma.department.findUnique({
      where: { code: "CSC" },
      include: { faculty: true },
    });

    if (department) {
      await prisma.staff.upsert({
        where: { userId: u.id },
        update: {
          staffNumber: "UNICROSS/STAFF/DEMO-001",
          facultyId: department.facultyId,
          departmentId: department.id,
          title: "Lecturer",
        },
        create: {
          userId: u.id,
          staffNumber: "UNICROSS/STAFF/DEMO-001",
          facultyId: department.facultyId,
          departmentId: department.id,
          title: "Lecturer",
        },
      });

      s = await prisma.staff.findUnique({
        where: { userId: u.id },
        include: staffInclude,
      });
    }
  }

  if (!s) {
    return (
      <main className="portalPage">
        <nav className="portalNav">
          <Link href="/" className="brand"><span className="brandMark">U</span><span>UNICROSS Digital Campus</span></Link>
          <div className="portalNavRight"><span className="roleBadge">LECTURER</span><a href="/api/auth/logout" className="portalLogout">Sign out</a></div>
        </nav>
        <section className="portalHero"><div className="eyebrow">LECTURER WORKSPACE</div><h1>Staff profile not configured</h1><p>Your account is signed in, but it is not linked to a lecturer profile yet. Please contact a university administrator.</p></section>
      </main>
    );
  }

  const studentCount = s.offerings.reduce((total, offering) => total + offering.enrollments.length, 0);
  const courseUnits = s.offerings.reduce((total, offering) => total + offering.course.unit, 0);

  return (
    <main className="portalPage lecturerPage">
      <nav className="portalNav">
        <Link href="/" className="brand"><span className="brandMark">U</span><span>UNICROSS Digital Campus</span></Link>
        <div className="portalNavRight"><span className="roleBadge">LECTURER</span><a href="/api/auth/logout" className="portalLogout">Sign out</a></div>
      </nav>

      <section className="portalHero">
        <div className="eyebrow">LECTURER WORKSPACE</div>
        <h1>Welcome, {u.firstName}.</h1>
        <p>{s.title || "Academic staff"} · {s.department?.name || "Department"}</p>
      </section>

      <section className="lecturerOverview" aria-label="Teaching overview">
        <article><span>Assigned courses</span><strong>{s.offerings.length}</strong><small>Courses assigned to you</small></article>
        <article><span>Enrolled students</span><strong>{studentCount}</strong><small>Across your course offerings</small></article>
        <article><span>Teaching units</span><strong>{courseUnits}</strong><small>Total units assigned</small></article>
      </section>

      <section className="registrationShell lecturerShell">
        <div className="lecturerSectionHeading">
          <div><div className="eyebrow">TEACHING</div><h2>Your courses</h2><p>Open a course to manage its academic activities.</p></div>
          <Link className="secondary smallAction" href="/attendance">Take attendance</Link>
        </div>

        {s.offerings.length ? (
          <div className="lecturerCourseGrid">
            {s.offerings.map((o) => (
              <article className="portalCard lecturerCourseCard" key={o.id}>
                <div className="lecturerCourseTop"><span className="lecturerCourseIcon">▤</span><span className="lecturerEnrollment">{o.enrollments.length} students</span></div>
                <div className="lecturerCourseCode">{o.course.code} <span>· {o.course.unit} units</span></div>
                <h3>{o.course.title}</h3>
                <p>Course workspace for attendance, learning materials and class activities.</p>
                <Link className="lecturerOpenCourse" href={"/lecturer/course/" + o.id}>Open course <span aria-hidden="true">→</span></Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="portalCard lecturerEmpty"><h3>No courses assigned yet</h3><p>Your assigned course offerings will appear here when they are available.</p></div>
        )}

        <article className="portalCard lecturerServices">
          <div><div className="eyebrow">SHORTCUTS</div><h3>Staff services</h3></div>
          <div className="quickLinks">
            <Link href="/attendance">Attendance</Link>
            <Link href="/profile">My profile</Link>
            <Link href="/materials">Course materials</Link>
            <Link href="/announcements">Announcements</Link>
          </div>
        </article>
      </section>
    </main>
  );
}

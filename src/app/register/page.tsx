import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RegistrationForm from "./registration-form";

export default async function CourseRegistrationPage() {
  const token = (await cookies()).get("unicross_session")?.value;
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) redirect("/login");

  let userId = "";
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    userId = String(payload.sub || "");
  } catch {
    redirect("/login");
  }

  const student = await prisma.student.findUnique({
    where: { userId },
    include: { programme: true, department: true, enrollments: { select: { offeringId: true } } },
  });
  if (!student) redirect("/login");

  const session = await prisma.academicSession.findFirst({
    where: { isCurrent: true },
    include: { semesters: true },
  });
  if (!session) return <main className="portalPage"><div className="portalHero"><h1>Course Registration</h1><p>No active academic session is configured.</p></div></main>;

  const semester = session.semesters.find((s) => s.name === "FIRST") ?? session.semesters[0];
  if (!semester) return <main className="portalPage"><div className="portalHero"><h1>Course Registration</h1><p>No active semester is configured.</p></div></main>;

  const offerings = await prisma.courseOffering.findMany({
    where: { sessionId: session.id, semesterId: semester.id, course: { departmentId: student.departmentId, level: { lte: student.level } } },
    include: { course: true },
    orderBy: { course: { code: "asc" } },
  });

  const registered = new Set(student.enrollments.map((e) => e.offeringId));
  const courses = offerings.map((o) => ({
    id: o.id, code: o.course.code, title: o.course.title, unit: o.course.unit, level: o.course.level,
    registered: registered.has(o.id),
  }));

  return (
    <main className="portalPage">
      <nav className="portalNav">
        <Link href="/dashboard" className="brand"><span className="brandMark">U</span><span>UNICROSS Digital Campus</span></Link>
        <div className="portalNavRight"><span className="roleBadge">STUDENT</span><Link className="portalLogout" href="/api/auth/logout">Sign out</Link></div>
      </nav>
      <section className="portalHero">
        <div className="eyebrow">ACADEMIC SERVICES</div>
        <h1>Course Registration</h1>
        <p>{session.name} · {semester.name === "FIRST" ? "First" : "Second"} Semester · {student.programme.name}</p>
      </section>
      <section className="registrationShell">
        <div className="registrationHeader"><div><h2>Available courses</h2><p>Select the courses you want to register for this semester.</p></div><Link className="secondary" href="/dashboard">Back to dashboard</Link></div>
        <RegistrationForm courses={courses} />
      </section>
    </main>
  );
}
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function Dashboard() {
  const token = (await cookies()).get("unicross_session")?.value;
  const secretValue = process.env.AUTH_SECRET;
  if (!token || !secretValue) redirect("/login");

  let userId = "";
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secretValue));
    userId = String(payload.sub || "");
  } catch {
    redirect("/login");
  }

  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      user: true,
      programme: true,
      department: { include: { faculty: true } },
      enrollments: { include: { offering: { include: { course: true } } } },
      results: { include: { offering: { include: { course: true } } } },
      payments: { include: { feeStructure: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!student) redirect("/login");

  const publishedResults = student.results.filter((r) => r.status === "PUBLISHED");
  const totalUnits = publishedResults.reduce((sum, r) => sum + r.offering.course.unit, 0);
  const qualityPoints = publishedResults.reduce((sum, r) => sum + (r.gradePoint || 0) * r.offering.course.unit, 0);
  const gpa = totalUnits ? (qualityPoints / totalUnits).toFixed(2) : "0.00";
  const paid = student.payments.filter((p) => p.status === "SUCCESSFUL").reduce((sum, p) => sum + Number(p.amount), 0);
  const feeTotal = student.payments[0] ? Number(student.payments[0].feeStructure.amount) : 0;
  const balance = Math.max(feeTotal - paid, 0);

  return (
    <main className="portalPage">
      <nav className="portalNav">
        <a href="/" className="brand"><span className="brandMark">U</span><span>UNICROSS Digital Campus</span></a>
        <div className="portalNavRight"><span className="roleBadge">STUDENT</span><a className="portalLogout" href="/api/auth/logout">Sign out</a></div>
      </nav>

      <section className="portalHero">
        <div>
          <div className="eyebrow">STUDENT WORKSPACE</div>
          <h1>Welcome back, {student.user.firstName}.</h1>
          <p>{student.programme.name} · {student.department.name} · Level {student.level}</p>
        </div>
      </section>

      <section className="portalStats">
        <article><small>Matriculation No.</small><strong>{student.matricNumber}</strong></article>
        <article><small>Current GPA</small><strong>{gpa}</strong></article>
        <article><small>Registered Courses</small><strong>{student.enrollments.length}</strong></article>
        <article><small>Fee Balance</small><strong>₦{balance.toLocaleString()}</strong></article>
      </section>

      <section className="portalGrid">
        <article className="portalCard portalWide"><div className="portalCardHead"><h3>Current courses</h3><span>{student.enrollments.length} courses</span></div>
          {student.enrollments.map((e) => <div className="courseRow" key={e.id}><b>{e.offering.course.code}</b><span>{e.offering.course.title}</span><em>{e.offering.course.unit} units</em></div>)}
        </article>
        <article className="portalCard"><h3>Academic summary</h3><div className="summaryLine"><span>Published results</span><b>{publishedResults.length}</b></div><div className="summaryLine"><span>Total units</span><b>{totalUnits}</b></div><div className="summaryLine"><span>CGPA</span><b>{gpa}</b></div></article>
        <article className="portalCard"><h3>Latest payment</h3>{student.payments[0] ? <><div className="paymentAmount">₦{Number(student.payments[0].amount).toLocaleString()}</div><p>{student.payments[0].status} · {student.payments[0].reference}</p></> : <p>No payment records.</p>}</article>
      </section>
    </main>
  );
}

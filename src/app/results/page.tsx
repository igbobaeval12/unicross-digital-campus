import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

function gradeFromScore(score: number) {
  if (score >= 70) return { grade: "A", point: 4 };
  if (score >= 60) return { grade: "B", point: 3 };
  if (score >= 50) return { grade: "C", point: 2 };
  if (score >= 45) return { grade: "D", point: 1 };
  if (score >= 40) return { grade: "E", point: 0 };
  return { grade: "F", point: 0 };
}

export default async function ResultsPage() {
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
    include: {
      user: true,
      programme: true,
      department: true,
      results: {
        where: { status: "PUBLISHED" },
        include: { offering: { include: { course: true, session: true, semester: true } } },
        orderBy: { offering: { course: { code: "asc" } } },
      },
    },
  });

  if (!student) redirect("/login");

  const results = student.results.map((result) => {
    const total = Number(result.totalScore);
    const calculated = gradeFromScore(total);
    return {
      ...result,
      total,
      grade: result.grade || calculated.grade,
      gradePoint: result.gradePoint ?? calculated.point,
    };
  });

  const totalUnits = results.reduce((sum, r) => sum + r.offering.course.unit, 0);
  const qualityPoints = results.reduce((sum, r) => sum + Number(r.gradePoint) * r.offering.course.unit, 0);
  const gpa = totalUnits ? (qualityPoints / totalUnits).toFixed(2) : "0.00";

  return (
    <main className="portalPage">
      <nav className="portalNav">
        <Link href="/dashboard" className="brand"><span className="brandMark">U</span><span>UNICROSS Digital Campus</span></Link>
        <div className="portalNavRight"><span className="roleBadge">STUDENT</span><Link className="portalLogout" href="/api/auth/logout">Sign out</Link></div>
      </nav>

      <section className="portalHero">
        <div className="eyebrow">ACADEMIC RECORDS</div>
        <h1>Results &amp; GPA</h1>
        <p>{student.user.firstName} {student.user.lastName} · {student.matricNumber} · {student.programme.name}</p>
      </section>

      <section className="resultsShell">
        <div className="resultsHeader">
          <div>
            <h2>Published results</h2>
            <p>Only results officially published to your student account are shown here.</p>
          </div>
          <Link className="secondary" href="/dashboard">Back to dashboard</Link>
        </div>

        <div className="resultsStats">
          <article><small>Current GPA</small><strong>{gpa}</strong><span>4.00 scale</span></article>
          <article><small>Courses</small><strong>{results.length}</strong><span>Published</span></article>
          <article><small>Total Units</small><strong>{totalUnits}</strong><span>Credit units</span></article>
          <article><small>Quality Points</small><strong>{qualityPoints.toFixed(1)}</strong><span>Weighted points</span></article>
        </div>

        <div className="resultsTable">
          <div className="resultsTableHead"><span>Course</span><span>CA</span><span>Exam</span><span>Total</span><span>Grade</span><span>Point</span><span>Units</span></div>
          {results.length ? results.map((result) => (
            <div className="resultsTableRow" key={result.id}>
              <div><b>{result.offering.course.code}</b><span>{result.offering.course.title}</span></div>
              <span>{result.caScore}</span>
              <span>{result.examScore}</span>
              <strong>{result.total}</strong>
              <em className={`grade grade-${result.grade}`}>{result.grade}</em>
              <span>{Number(result.gradePoint).toFixed(1)}</span>
              <span>{result.offering.course.unit}</span>
            </div>
          )) : <div className="emptyState">No published results are available yet.</div>}
        </div>

        <div className="resultsNote">
          <b>Grading scale</b>
          <span>A = 70–100 · B = 60–69 · C = 50–59 · D = 45–49 · E = 40–44 · F = 0–39</span>
        </div>

        <div className="prototypeNotice">Prototype data only. Results shown above are synthetic demonstration records and are not official university results.</div>
      </section>
    </main>
  );
}

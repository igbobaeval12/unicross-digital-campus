export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Courses() {
  const user = await requireRoles(["UNIVERSITY_ADMIN", "SUPER_ADMIN", "FACULTY_ADMIN", "DEPARTMENT_ADMIN"]);
  const scope = user.role === "UNIVERSITY_ADMIN" || user.role === "SUPER_ADMIN"
    ? null
    : await prisma.staff.findUnique({ where: { userId: user.id }, select: { facultyId: true, departmentId: true } });
  if (user.role !== "UNIVERSITY_ADMIN" && user.role !== "SUPER_ADMIN" && !scope) {
    return <main className="portalPage"><section className="registrationShell"><div className="emptyState">No academic-unit assignment is configured for this administrator.</div></section></main>;
  }
  const departmentFilter = scope?.departmentId
    ? { departmentId: scope.departmentId }
    : scope?.facultyId
      ? { department: { facultyId: scope.facultyId } }
      : undefined;
  const offerings = await prisma.courseOffering.findMany({
    where: departmentFilter ? { course: departmentFilter } : undefined,
    include: { course: true, semester: true, lecturer: { include: { user: true } } },
    orderBy: { course: { code: "asc" } },
    take: 500,
  });
  return <main className="portalPage"><nav className="portalNav"><Link href="/admin" className="brand"><span className="brandMark">U</span><span>Administration</span></Link></nav><section className="registrationShell"><div className="registrationHeader"><div><div className="eyebrow">COURSE MANAGEMENT</div><h2>Courses & offerings</h2><p>Course offerings within your authorized academic unit.</p></div><Link href="/admin" className="secondary">Back</Link></div><div className="catalogList">{offerings.map(o=><div className="catalogRow" key={o.id}><b>{o.course.code}</b><div><strong>{o.course.title}</strong><span>{o.course.unit} units · Level {o.course.level} · {o.semester.name==="FIRST"?"First":"Second"} semester</span></div><em>{o.lecturer?o.lecturer.user.firstName+" "+o.lecturer.user.lastName:"Unassigned"}</em></div>)}{!offerings.length&&<div className="emptyState">No course offerings in your authorized academic unit.</div>}</div></section></main>;
}
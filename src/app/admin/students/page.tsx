export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Students() {
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
  const students = await prisma.student.findMany({
    where: departmentFilter,
    include: { user: true, programme: true, department: true },
    orderBy: { matricNumber: "asc" },
    take: 500,
  });
  return <main className="portalPage"><nav className="portalNav"><Link href="/admin" className="brand"><span className="brandMark">U</span><span>Administration</span></Link></nav><section className="registrationShell"><div className="registrationHeader"><div><div className="eyebrow">ACADEMIC RECORDS</div><h2>Students</h2></div><Link href="/admin" className="secondary">Back</Link></div><div className="catalogList">{students.map(s=><div className="catalogRow" key={s.id}><b>{s.matricNumber}</b><div><strong>{s.user.firstName} {s.user.lastName}</strong><span>{s.programme.name} · {s.department.name} · Level {s.level}</span></div><em>{s.user.isActive?"Active":"Inactive"}</em></div>)}{!students.length&&<div className="emptyState">No students in your authorized academic unit.</div>}</div></section></main>;
}
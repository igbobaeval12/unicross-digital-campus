export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function StaffAdministration() {
  await requireRoles(["UNIVERSITY_ADMIN", "SUPER_ADMIN", "FACULTY_ADMIN", "DEPARTMENT_ADMIN"]);
  const staff = await prisma.staff.findMany({include:{user:true,faculty:true,department:true,offerings:{include:{course:true},take:20}},orderBy:{staffNumber:"asc"},take:200});
  return <main className="portalPage"><nav className="portalNav"><Link href="/admin" className="brand"><span className="brandMark">U</span><span>Administration</span></Link></nav><section className="registrationShell"><div className="registrationHeader"><div><div className="eyebrow">HUMAN RESOURCES & ACADEMIC STAFF</div><h2>Staff directory</h2><p>Institutional staff, academic units and current teaching assignments.</p></div><Link href="/admin" className="secondary">Back</Link></div><div className="catalogList">{staff.map(s=><div className="catalogRow" key={s.id}><b>{s.staffNumber}</b><div><strong>{s.user.firstName} {s.user.lastName}</strong><span>{s.title||"Staff"} · {s.department?.name||s.faculty?.name||"University level"}</span><span>{s.offerings.length} current course assignment{s.offerings.length===1?"":"s"}</span></div><em>{s.user.isActive?"Active":"Inactive"}</em></div>)}{!staff.length&&<div className="emptyState">No staff records available.</div>}</div></section></main>;
}
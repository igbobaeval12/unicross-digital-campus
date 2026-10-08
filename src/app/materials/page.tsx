export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MaterialForm from "./material-form";

export default async function Materials() {
  const u = await requireRoles(["STUDENT","LECTURER"]);
  const student = await prisma.student.findUnique({ where: { userId: u.id }, include: { enrollments: { where: { status: "ACTIVE" }, include: { offering: { include: { course: true } } } } } });
  const staff = await prisma.staff.findUnique({ where: { userId: u.id }, include: { offerings: { include: { course: true } } } });
  const courses = student?.enrollments.map(x=>x.offering.course) || staff?.offerings.map(x=>x.course) || [];
  const courseIds = courses.map(c=>c.id);
  const materials = courseIds.length ? await prisma.courseMaterial.findMany({ where:{courseId:{in:courseIds}}, include:{course:{select:{code:true,title:true}},uploader:{select:{firstName:true,lastName:true}}}, orderBy:{createdAt:"desc"}, take:100 }) : [];
  return <main className="portalPage"><nav className="portalNav"><Link href={u.role==="LECTURER"?"/lecturer":"/dashboard"} className="brand"><span className="brandMark">U</span><span>UNICROSS Digital Campus</span></Link><Link href="/api/auth/logout" className="portalLogout">Sign out</Link></nav><section className="registrationShell"><div className="registrationHeader"><div><div className="eyebrow">LEARNING RESOURCES</div><h2>Course materials</h2><p>Access published learning resources for your courses.</p></div></div><MaterialForm courses={courses.map(c=>({id:c.id,code:c.code}))} /><div className="materialsGrid">{materials.map(m=><article className="portalCard" key={m.id}><div className="eyebrow">{m.course.code}</div><h3>{m.title}</h3>{m.description&&<p>{m.description}</p>}<small>Published by {m.uploader.firstName} {m.uploader.lastName} · {new Date(m.createdAt).toLocaleDateString()}</small><div className="quickLinks"><a href={m.url} target="_blank" rel="noreferrer">Open resource ↗</a></div></article>)}{!materials.length&&<div className="emptyState">No published materials are available for your courses yet.</div>}</div></section></main>;
}
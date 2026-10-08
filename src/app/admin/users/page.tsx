export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Users() {
  await requireRoles(["UNIVERSITY_ADMIN", "SUPER_ADMIN"]);
  const users = await prisma.user.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
    orderBy: [{ isActive: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
    take: 200,
  });
  return <main className="portalPage">
    <nav className="portalNav"><Link href="/admin" className="brand"><span className="brandMark">U</span><span>User administration</span></Link></nav>
    <section className="registrationShell">
      <div className="registrationHeader"><div><div className="eyebrow">IDENTITY & ACCESS</div><h2>Users</h2><p>Institutional accounts and access roles.</p></div><Link href="/admin" className="secondary">Back</Link></div>
      <div className="catalogList">{users.map(u => <div className="catalogRow" key={u.id}><b>{u.role}</b><div><strong>{u.firstName} {u.lastName}</strong><span>{u.email} · Created {u.createdAt.toLocaleDateString()}</span></div><em>{u.isActive ? "Active" : "Inactive"}</em></div>)}{!users.length && <div className="emptyState">No users found.</div>}</div>
    </section>
  </main>;
}

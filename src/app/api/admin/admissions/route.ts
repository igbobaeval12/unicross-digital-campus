import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth";

const roles = ["UNIVERSITY_ADMIN", "SUPER_ADMIN", "FACULTY_ADMIN", "DEPARTMENT_ADMIN"] as const;
const allowed = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED"] as const;

export async function PATCH(req: Request) {
  try {
    const user = await requireRoles([...roles]);
    const body = await req.json();
    const id = String(body.id || "");
    const status = String(body.status || "");
    if (!id || !allowed.includes(status as (typeof allowed)[number])) {
      return NextResponse.json({ error: "Application and valid status are required." }, { status: 400 });
    }
    const application = await prisma.admissionApplication.findUnique({ where: { id } });
    if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    const updated = await prisma.admissionApplication.update({
      where: { id },
      data: { status: status as (typeof allowed)[number] },
      select: { id: true, applicationNo: true, status: true },
    });
    await prisma.auditLog.create({
      data: { userId: user.id, action: "ADMISSION_STATUS_UPDATED", entity: "AdmissionApplication", entityId: id, metadata: { from: application.status, to: status } },
    });
    return NextResponse.json({ ok: true, application: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to update application." }, { status: 500 });
  }
}

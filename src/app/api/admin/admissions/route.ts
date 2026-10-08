import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth";

const roles = ["UNIVERSITY_ADMIN", "SUPER_ADMIN", "FACULTY_ADMIN", "DEPARTMENT_ADMIN"] as const;

export async function PATCH(req: Request) {
  try {
    const user = await requireRoles([...roles]);
    const body = await req.json();
    const id = String(body.id || "");
    const status = String(body.status || "");
    const allowed = ["UNDER_REVIEW", "ACCEPTED", "REJECTED"] as const;

    if (!id || !allowed.includes(status as (typeof allowed)[number])) {
      return NextResponse.json({ error: "Application and valid review status are required." }, { status: 400 });
    }

    const application = await prisma.admissionApplication.findUnique({
      where: { id },
      include: { programme: { select: { departmentId: true, department: { select: { facultyId: true } } } } },
    });
    if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });

    if (user.role === "FACULTY_ADMIN" || user.role === "DEPARTMENT_ADMIN") {
      const staff = await prisma.staff.findUnique({ where: { userId: user.id }, select: { facultyId: true, departmentId: true } });
      if (!staff) return NextResponse.json({ error: "Administrative unit assignment is missing." }, { status: 403 });

      const inScope = user.role === "FACULTY_ADMIN"
        ? !!staff.facultyId && application.programme.department.facultyId === staff.facultyId
        : !!staff.departmentId && application.programme.departmentId === staff.departmentId;

      if (!inScope) return NextResponse.json({ error: "You are not authorized to review this application." }, { status: 403 });
    }

    const transitions: Record<string, string[]> = {
      SUBMITTED: ["UNDER_REVIEW"],
      UNDER_REVIEW: ["ACCEPTED", "REJECTED"],
    };
    if (!transitions[application.status]?.includes(status)) {
      return NextResponse.json({ error: "Invalid admission workflow transition." }, { status: 400 });
    }

    const updated = await prisma.admissionApplication.update({
      where: { id },
      data: { status: status as "UNDER_REVIEW" | "ACCEPTED" | "REJECTED" },
      select: { id: true, applicationNo: true, status: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "ADMISSION_STATUS_UPDATED",
        entity: "AdmissionApplication",
        entityId: id,
        metadata: { from: application.status, to: status },
      },
    });

    return NextResponse.json({ ok: true, application: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to update application." }, { status: 500 });
  }
}

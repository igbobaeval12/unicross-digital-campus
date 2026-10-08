import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const roles = ["UNIVERSITY_ADMIN", "SUPER_ADMIN", "FACULTY_ADMIN", "DEPARTMENT_ADMIN"];

async function getUnitScope(user: { id: string; role: string }) {
  if (user.role === "UNIVERSITY_ADMIN" || user.role === "SUPER_ADMIN") return { unrestricted: true, facultyId: null, departmentId: null };
  const staff = await prisma.staff.findUnique({ where: { userId: user.id }, select: { facultyId: true, departmentId: true } });
  if (!staff) return null;
  if (user.role === "DEPARTMENT_ADMIN" && !staff.departmentId) return null;
  if (user.role === "FACULTY_ADMIN" && !staff.facultyId) return null;
  return { unrestricted: false, facultyId: staff.facultyId, departmentId: staff.departmentId };
}

function inScope(scope: NonNullable<Awaited<ReturnType<typeof getUnitScope>>>, departmentId: string, facultyId: string) {
  if (scope.unrestricted) return true;
  if (scope.departmentId) return scope.departmentId === departmentId;
  return scope.facultyId === facultyId;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const scope = await getUnitScope(user);
  if (!scope) return NextResponse.json({ error: "Administrative unit assignment is missing." }, { status: 403 });

  const where = scope.unrestricted
    ? {}
    : scope.departmentId
      ? { student: { departmentId: scope.departmentId } }
      : { student: { department: { facultyId: scope.facultyId! } } };

  return NextResponse.json(await prisma.result.findMany({
    where,
    orderBy: { id: "desc" },
    take: 200,
    include: {
      student: { include: { user: true } },
      offering: { include: { course: true, lecturer: { include: { user: true } } } },
      semester: true,
    },
  }));
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json();
  const id = String(body.id || "");
  const action = String(body.action || "");
  if (!id || !["approve", "publish", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid workflow action." }, { status: 400 });
  }

  const result = await prisma.result.findUnique({
    where: { id },
    include: { student: { select: { departmentId: true, department: { select: { facultyId: true } } } } },
  });
  if (!result) return NextResponse.json({ error: "Result not found." }, { status: 404 });

  const scope = await getUnitScope(user);
  if (!scope) return NextResponse.json({ error: "Administrative unit assignment is missing." }, { status: 403 });
  if (!inScope(scope, result.student.departmentId, result.student.department.facultyId)) {
    return NextResponse.json({ error: "You are not authorized to manage this result." }, { status: 403 });
  }

  if (action === "approve" && result.status !== "SUBMITTED") return NextResponse.json({ error: "Only submitted results can be approved." }, { status: 400 });
  if (action === "publish" && result.status !== "APPROVED") return NextResponse.json({ error: "Only approved results can be published." }, { status: 400 });
  if (action === "reject" && result.status !== "SUBMITTED") return NextResponse.json({ error: "Only submitted results can be rejected." }, { status: 400 });

  const status = action === "approve" ? "APPROVED" : action === "publish" ? "PUBLISHED" : "DRAFT";
  const updated = await prisma.result.update({ where: { id }, data: { status } });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "RESULT_" + action.toUpperCase(),
      entity: "Result",
      entityId: id,
      metadata: { from: result.status, to: status },
    },
  });
  return NextResponse.json({ ok: true, result: updated });
}

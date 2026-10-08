import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const roles = ["UNIVERSITY_ADMIN", "SUPER_ADMIN", "FACULTY_ADMIN", "DEPARTMENT_ADMIN"];

async function getScope(user: { id: string; role: string }) {
  if (user.role === "UNIVERSITY_ADMIN" || user.role === "SUPER_ADMIN") return {};
  const staff = await prisma.staff.findUnique({ where: { userId: user.id }, select: { facultyId: true, departmentId: true } });
  if (!staff) return null;
  if (user.role === "DEPARTMENT_ADMIN") return staff.departmentId ? { student: { departmentId: staff.departmentId } } : null;
  if (user.role === "FACULTY_ADMIN") return staff.facultyId ? { student: { department: { facultyId: staff.facultyId } } } : null;
  return null;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const scope = await getScope(user);
  if (scope === null) return NextResponse.json({ error: "Administrative unit assignment is missing." }, { status: 403 });

  return NextResponse.json(await prisma.result.findMany({
    where: scope,
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

  const scope = await getScope(user);
  if (scope === null) return NextResponse.json({ error: "Administrative unit assignment is missing." }, { status: 403 });
  if (user.role === "DEPARTMENT_ADMIN" && result.student.departmentId !== (scope.student as { departmentId: string }).departmentId) {
    return NextResponse.json({ error: "You are not authorized to manage this result." }, { status: 403 });
  }
  if (user.role === "FACULTY_ADMIN" && result.student.department.facultyId !== (scope.student as { department: { facultyId: string } }).department.facultyId) {
    return NextResponse.json({ error: "You are not authorized to manage this result." }, { status: 403 });
  }

  if (action === "approve" && result.status !== "SUBMITTED") return NextResponse.json({ error: "Only submitted results can be approved." }, { status: 400 });
  if (action === "publish" && result.status !== "APPROVED") return NextResponse.json({ error: "Only approved results can be published." }, { status: 400 });
  if (action === "reject" && result.status !== "SUBMITTED") return NextResponse.json({ error: "Only submitted results can be rejected." }, { status: 400 });

  const status = action === "approve" ? "APPROVED" : action === "publish" ? "PUBLISHED" : "DRAFT";
  const updated = await prisma.result.update({ where: { id }, data: { status } });
  await prisma.auditLog.create({ data: { userId: user.id, action: "RESULT_" + action.toUpperCase(), entity: "Result", entityId: id, metadata: { from: result.status, to: status } } });
  return NextResponse.json({ ok: true, result: updated });
}

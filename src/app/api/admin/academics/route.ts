import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const roles = ["UNIVERSITY_ADMIN", "SUPER_ADMIN"];

export async function GET() {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const faculties = await prisma.faculty.findMany({
    orderBy: { name: "asc" },
    include: { campus: true, _count: { select: { departments: true, staff: true } }, departments: { orderBy: { name: "asc" }, include: { _count: { select: { programmes: true, courses: true, students: true, staff: true } } } } },
  });
  return NextResponse.json(faculties);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await request.json();
  try {
    if (body.action === "create-faculty") {
      const name = String(body.name || "").trim(), code = String(body.code || "").trim().toUpperCase();
      if (!name || !code) return NextResponse.json({ error: "Faculty name and code are required." }, { status: 400 });
      return NextResponse.json({ ok: true, faculty: await prisma.faculty.create({ data: { name, code } }) });
    }
    if (body.action === "create-department") {
      const facultyId = String(body.facultyId || ""), name = String(body.name || "").trim(), code = String(body.code || "").trim().toUpperCase();
      if (!facultyId || !name || !code) return NextResponse.json({ error: "Faculty, department name and code are required." }, { status: 400 });
      return NextResponse.json({ ok: true, department: await prisma.department.create({ data: { facultyId, name, code } }) });
    }
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("Unique constraint") ? "That faculty or department code already exists." : "Unable to save the academic unit.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
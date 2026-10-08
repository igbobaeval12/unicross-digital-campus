import { NextResponse } from "next/server";
import { requireRoles, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  const student = await prisma.student.findUnique({ where: { userId: user.id }, select: { id: true } });
  const staff = await prisma.staff.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!student && !staff) return NextResponse.json({ materials: [] });
  const courseIds = student
    ? (await prisma.enrollment.findMany({ where: { studentId: student.id, status: "ACTIVE" }, select: { offering: { select: { courseId: true } } } })).map((e) => e.offering.courseId)
    : (await prisma.courseOffering.findMany({ where: { lecturerId: staff!.id }, select: { courseId: true } })).map((o) => o.courseId);
  const materials = await prisma.courseMaterial.findMany({
    where: { courseId: { in: [...new Set(courseIds)] } },
    include: { course: { select: { code: true, title: true } }, uploader: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" }, take: 100,
  });
  return NextResponse.json({ materials });
}

export async function POST(request: Request) {
  const user = await requireRoles(["LECTURER"]);
  const body = await request.json().catch(() => ({}));
  const courseId = typeof body.courseId === "string" ? body.courseId : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : null;
  if (!courseId || !title || !url) return NextResponse.json({ error: "Course, title and URL are required." }, { status: 400 });
  try { new URL(url); } catch { return NextResponse.json({ error: "Enter a valid material URL." }, { status: 400 }); }
  const staff = await prisma.staff.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!staff) return NextResponse.json({ error: "Lecturer profile not found." }, { status: 403 });
  const assignment = await prisma.courseOffering.findFirst({ where: { lecturerId: staff.id, courseId: courseId } });
  if (!assignment) return NextResponse.json({ error: "You can only publish materials for your assigned courses." }, { status: 403 });
  const material = await prisma.courseMaterial.create({ data: { title, description: description || null, url, courseId, uploadedBy: user.id } });
  return NextResponse.json({ material }, { status: 201 });
}
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;

export async function GET() {
  const u = await getSessionUser();
  if (!u) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  if (u.role === "STUDENT") {
    const s = await prisma.student.findUnique({
      where: { userId: u.id },
      include: {
        enrollments: {
          include: {
            offering: { include: { course: true } },
            semester: true,
          },
        },
      },
    });
    return NextResponse.json(s?.enrollments ?? []);
  }

  if (u.role !== "LECTURER") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const staff = await prisma.staff.findUnique({ where: { userId: u.id } });
  if (!staff) return NextResponse.json({ error: "Staff profile not found." }, { status: 404 });

  const offerings = await prisma.courseOffering.findMany({
    where: { lecturerId: staff.id },
    include: {
      course: true,
      semester: true,
      enrollments: {
        include: {
          student: { include: { user: true } },
        },
      },
      attendance: true,
    },
  });

  return NextResponse.json(offerings);
}

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "LECTURER") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const b = await req.json();
  const offeringId = String(b.offeringId || "");
  const studentId = String(b.studentId || "");
  const dateText = String(b.date || "");
  const status = String(b.status || "PRESENT");

  if (!offeringId || !studentId || !dateText) {
    return NextResponse.json({ error: "Missing attendance details." }, { status: 400 });
  }
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid attendance status." }, { status: 400 });
  }

  const date = new Date(`${dateText}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || dateText.length !== 10) {
    return NextResponse.json({ error: "Invalid attendance date." }, { status: 400 });
  }

  const staff = await prisma.staff.findUnique({ where: { userId: u.id } });
  if (!staff) return NextResponse.json({ error: "Staff profile not found." }, { status: 404 });

  const offering = await prisma.courseOffering.findFirst({
    where: { id: offeringId, lecturerId: staff.id },
  });
  if (!offering) {
    return NextResponse.json({ error: "Course offering not assigned to you." }, { status: 403 });
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { offeringId, studentId, status: "ACTIVE" },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "Student is not actively enrolled in this course." }, { status: 400 });
  }

  const attendance = await prisma.attendance.upsert({
    where: { studentId_offeringId_date: { studentId, offeringId, date } },
    update: { status: status as (typeof VALID_STATUSES)[number] },
    create: { studentId, offeringId, date, status: status as (typeof VALID_STATUSES)[number] },
  });

  return NextResponse.json({ ok: true, attendance });
}

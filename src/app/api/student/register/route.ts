import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

async function getStudentId() {
  const token = (await cookies()).get("unicross_session")?.value;
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const userId = String(payload.sub || "");
    const student = await prisma.student.findUnique({ where: { userId }, select: { id: true } });
    return student?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const studentId = await getStudentId();
  if (!studentId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { offeringId } = await request.json();
    if (!offeringId || typeof offeringId !== "string") {
      return NextResponse.json({ error: "A course offering is required." }, { status: 400 });
    }

    const offering = await prisma.courseOffering.findUnique({
      where: { id: offeringId },
      include: { course: true, session: true, semester: true },
    });
    if (!offering) return NextResponse.json({ error: "Course offering not found." }, { status: 404 });

    const existing = await prisma.enrollment.findUnique({
      where: { studentId_offeringId: { studentId, offeringId } },
    });
    if (existing) return NextResponse.json({ ok: true, message: "Course already registered." });

    await prisma.enrollment.create({
      data: {
        studentId,
        offeringId,
        semesterId: offering.semesterId,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ ok: true, message: `${offering.course.code} registered successfully.` });
  } catch (error) {
    console.error("Course registration failed:", error);
    return NextResponse.json({ error: "Unable to register this course." }, { status: 500 });
  }
}
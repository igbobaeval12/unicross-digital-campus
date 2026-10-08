import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true, level: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
    }

    const { offeringId } = await request.json();

    if (!offeringId || typeof offeringId !== "string") {
      return NextResponse.json(
        { error: "A course offering is required." },
        { status: 400 }
      );
    }

    const offering = await prisma.courseOffering.findUnique({
      where: { id: offeringId },
      include: { course: true, session: true, semester: true },
    });

    if (!offering) {
      return NextResponse.json(
        { error: "Course offering not found." },
        { status: 404 }
      );
    }

    if (!offering.session.isCurrent || offering.semester.sessionId !== offering.sessionId) {
      return NextResponse.json(
        { error: "This course is not available for the current registration session." },
        { status: 409 }
      );
    }

    if (offering.course.level !== student.level) {
      return NextResponse.json(
        { error: "This course is not available for your current level." },
        { status: 409 }
      );
    }

    const existing = await prisma.enrollment.findUnique({
      where: { studentId_offeringId: { studentId: student.id, offeringId } },
    });

    if (existing) {
      return NextResponse.json({
        ok: true,
        message: "Course already registered.",
      });
    }

    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        offeringId,
        semesterId: offering.semesterId,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      ok: true,
      message: `${offering.course.code} registered successfully.`,
    });
  } catch (error) {
    console.error("Course registration failed:", error);
    return NextResponse.json(
      { error: "Unable to register this course." },
      { status: 500 }
    );
  }
}

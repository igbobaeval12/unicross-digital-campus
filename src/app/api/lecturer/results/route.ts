import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await getSessionUser();

  if (!user || user.role !== "LECTURER") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { offeringId, results } = await req.json();

    if (!offeringId || typeof offeringId !== "string" || !Array.isArray(results)) {
      return NextResponse.json(
        { error: "A course offering and result list are required." },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    const offering =
      staff &&
      (await prisma.courseOffering.findFirst({
        where: { id: offeringId, lecturerId: staff.id },
        select: { id: true, semesterId: true },
      }));

    if (!offering) {
      return NextResponse.json(
        { error: "Course offering not found." },
        { status: 404 }
      );
    }

    for (const item of results) {
      if (!item || typeof item.studentId !== "string") {
        return NextResponse.json(
          { error: "Each result must identify a student." },
          { status: 400 }
        );
      }

      const ca = Number(item.caScore);
      const exam = Number(item.examScore);

      if (
        !Number.isFinite(ca) ||
        !Number.isFinite(exam) ||
        ca < 0 ||
        ca > 40 ||
        exam < 0 ||
        exam > 60
      ) {
        return NextResponse.json(
          { error: "Scores must be numeric, with CA from 0–40 and exam from 0–60." },
          { status: 400 }
        );
      }

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_offeringId: {
            studentId: item.studentId,
            offeringId,
          },
        },
        select: { id: true },
      });

      if (!enrollment) {
        return NextResponse.json(
          { error: "A submitted result belongs to a student not enrolled in this course." },
          { status: 409 }
        );
      }

      const total = ca + exam;
      const grade =
        total >= 70
          ? "A"
          : total >= 60
            ? "B"
            : total >= 50
              ? "C"
              : total >= 45
                ? "D"
                : total >= 40
                  ? "E"
                  : "F";
      const point =
        grade === "A"
          ? 4
          : grade === "B"
            ? 3
            : grade === "C"
              ? 2
              : grade === "D"
                ? 1
                : 0;

      await prisma.result.upsert({
        where: {
          studentId_offeringId: {
            studentId: item.studentId,
            offeringId,
          },
        },
        update: {
          caScore: ca,
          examScore: exam,
          totalScore: total,
          grade,
          gradePoint: point,
          status: item.status === "PUBLISHED" ? "PUBLISHED" : "SUBMITTED",
          semesterId: offering.semesterId,
        },
        create: {
          studentId: item.studentId,
          offeringId,
          semesterId: offering.semesterId,
          caScore: ca,
          examScore: exam,
          totalScore: total,
          grade,
          gradePoint: point,
          status: item.status === "PUBLISHED" ? "PUBLISHED" : "SUBMITTED",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Results saved successfully.",
    });
  } catch (error) {
    console.error("Result submission failed:", error);
    return NextResponse.json(
      { error: "Unable to save results." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const roles = ["UNIVERSITY_ADMIN", "SUPER_ADMIN"];

async function authorized() {
  const user = await getSessionUser();
  return user && roles.includes(user.role) ? user : null;
}

export async function GET() {
  const user = await authorized();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const sessions = await prisma.academicSession.findMany({
    orderBy: { startDate: "desc" },
    include: { semesters: { orderBy: { name: "asc" } }, _count: { select: { students: true, offerings: true, fees: true, applications: true } } },
  });
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const user = await authorized();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json();
  const action = String(body.action || "");

  if (action === "create-session") {
    const name = String(body.name || "").trim();
    const startDate = new Date(String(body.startDate || ""));
    const endDate = new Date(String(body.endDate || ""));
    if (!name || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate >= endDate) {
      return NextResponse.json({ error: "Provide a valid session name and date range." }, { status: 400 });
    }
    const existing = await prisma.academicSession.findUnique({ where: { name } });
    if (existing) return NextResponse.json({ error: "That academic session already exists." }, { status: 409 });
    const session = await prisma.academicSession.create({ data: { name, startDate, endDate, isCurrent: Boolean(body.isCurrent) } });
    if (session.isCurrent) await prisma.academicSession.updateMany({ where: { id: { not: session.id } }, data: { isCurrent: false } });
    return NextResponse.json({ ok: true, session });
  }

  if (action === "set-current") {
    const id = String(body.id || "");
    const session = await prisma.academicSession.findUnique({ where: { id } });
    if (!session) return NextResponse.json({ error: "Academic session not found." }, { status: 404 });
    await prisma.$transaction([
      prisma.academicSession.updateMany({ data: { isCurrent: false } }),
      prisma.academicSession.update({ where: { id }, data: { isCurrent: true } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === "create-semester") {
    const sessionId = String(body.sessionId || "");
    const name = String(body.name || "").trim().toUpperCase();
    if (!sessionId || !["FIRST", "SECOND"].includes(name)) return NextResponse.json({ error: "Choose a valid session and semester." }, { status: 400 });
    try {
      const semester = await prisma.semester.create({ data: { sessionId, name: name as "FIRST" | "SECOND" } });
      return NextResponse.json({ ok: true, semester });
    } catch {
      return NextResponse.json({ error: "That semester already exists for this session." }, { status: 409 });
    }
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}

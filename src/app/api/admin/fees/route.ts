import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const roles = ["UNIVERSITY_ADMIN", "SUPER_ADMIN", "FINANCE"];

export async function GET() {
  const u = await getSessionUser();
  if (!u || !roles.includes(u.role)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const fees = await prisma.feeStructure.findMany({
    include: { session: true, payments: { where: { status: "SUCCESSFUL" }, select: { amount: true } }, programme: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(fees.map(f => ({
    id: f.id, name: f.name, amount: Number(f.amount), session: f.session.name,
    programme: f.programme?.name ?? "All programmes",
    collected: f.payments.reduce((sum, p) => sum + Number(p.amount), 0),
  })));
}

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u || !roles.includes(u.role)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await req.json();
  const name = String(body.name || "").trim();
  const amount = Number(body.amount);
  const sessionId = String(body.sessionId || "");
  const programmeId = body.programmeId ? String(body.programmeId) : null;
  if (!name || !Number.isFinite(amount) || amount <= 0 || !sessionId) {
    return NextResponse.json({ error: "Name, positive amount and session are required." }, { status: 400 });
  }
  const session = await prisma.academicSession.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: "Academic session not found." }, { status: 404 });
  if (programmeId && !(await prisma.programme.findUnique({ where: { id: programmeId } }))) {
    return NextResponse.json({ error: "Programme not found." }, { status: 404 });
  }
  const fee = await prisma.feeStructure.create({
    data: { name, amount, sessionId, programmeId },
  });
  return NextResponse.json({ ok: true, fee });
}
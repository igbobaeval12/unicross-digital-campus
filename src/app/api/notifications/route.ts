import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const announcements = await prisma.announcement.findMany({
    where: { published: true },
    select: { id: true, title: true, body: true, publishedAt: true, author: { select: { firstName: true, lastName: true } } },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });
  return NextResponse.json(announcements);
}
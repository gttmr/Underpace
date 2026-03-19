import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  const notices = await prisma.notice.findMany({ orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }] });
  return NextResponse.json(notices);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, body: bodyText, isPinned } = body;

  if (isPinned) {
    await prisma.notice.updateMany({ where: { isPinned: true }, data: { isPinned: false } });
  }

  const notice = await prisma.notice.create({
    data: { title, body: bodyText, isPinned: isPinned || false },
  });

  return NextResponse.json(notice, { status: 201 });
}

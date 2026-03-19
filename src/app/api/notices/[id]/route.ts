import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { title, body: bodyText, isPinned } = body;

  if (isPinned) {
    await prisma.notice.updateMany({ where: { isPinned: true, id: { not: parseInt(id) } }, data: { isPinned: false } });
  }

  const notice = await prisma.notice.update({
    where: { id: parseInt(id) },
    data: {
      ...(title && { title }),
      ...(bodyText !== undefined && { body: bodyText }),
      ...(isPinned !== undefined && { isPinned }),
    },
  });

  return NextResponse.json(notice);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.notice.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}

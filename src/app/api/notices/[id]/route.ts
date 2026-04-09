import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api-response";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const { title, body: bodyText, isPinned } = await req.json();

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

  return apiOk(notice);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  await prisma.notice.delete({ where: { id: parseInt(id) } });
  return apiOk({ ok: true });
}

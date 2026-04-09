import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { apiOk } from "@/lib/api-response";

export async function GET() {
  const notices = await prisma.notice.findMany({ orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }] });
  return apiOk(notices);
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { title, body: bodyText, isPinned } = await req.json();

  if (isPinned) {
    await prisma.notice.updateMany({ where: { isPinned: true }, data: { isPinned: false } });
  }

  const notice = await prisma.notice.create({
    data: { title, body: bodyText, isPinned: isPinned || false },
  });

  return apiOk(notice, 201);
}

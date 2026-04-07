import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";
import { isAdminAuthenticated } from "@/lib/auth";

// GET /api/training-logs?year=Y&month=M
export async function GET(req: NextRequest) {
  const year = parseInt(req.nextUrl.searchParams.get("year") ?? "");
  const month = parseInt(req.nextUrl.searchParams.get("month") ?? "");

  if (!year || !month) {
    return NextResponse.json({ error: "year, month 필수" }, { status: 400 });
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const prefix = `${year}-${pad(month)}`;

  const logs = await prisma.trainingLog.findMany({
    where: { meeting: { date: { startsWith: prefix } } },
    include: { meeting: { select: { date: true, startTime: true, endTime: true, classType: true } } },
    orderBy: { meeting: { date: "desc" } },
  });

  return NextResponse.json(logs);
}

// POST /api/training-logs  — COACH/ADMIN only, upsert
export async function POST(req: NextRequest) {
  const isAdmin = await isAdminAuthenticated();
  let kakaoId: string | null = null;

  if (!isAdmin) {
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { kakaoId: session.kakaoId },
      select: { role: true },
    });
    if (!user || (user.role !== "COACH" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "코치 또는 관리자 권한 필요" }, { status: 403 });
    }
    kakaoId = session.kakaoId;
  }

  const { meetingId, content } = await req.json();
  if (!meetingId || !content?.trim()) {
    return NextResponse.json({ error: "meetingId, content 필수" }, { status: 400 });
  }

  const log = await prisma.trainingLog.upsert({
    where: { meetingId: parseInt(meetingId) },
    create: { meetingId: parseInt(meetingId), coachKakaoId: kakaoId ?? "admin", content: content.trim() },
    update: { content: content.trim() },
  });

  return NextResponse.json(log);
}

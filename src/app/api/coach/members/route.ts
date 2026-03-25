import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";
import { isAdminAuthenticated } from "@/lib/auth";

// 코치/관리자: 특정 회원의 참가 기록 조회
export async function GET(req: NextRequest) {
  const isAdmin = await isAdminAuthenticated();

  if (!isAdmin) {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { kakaoId: session.kakaoId },
      select: { role: true },
    });

    if (!currentUser || (currentUser.role !== "COACH" && currentUser.role !== "ADMIN")) {
      return NextResponse.json({ error: "코치 또는 관리자 권한이 필요합니다" }, { status: 403 });
    }
  }

  const kakaoId = req.nextUrl.searchParams.get("kakaoId");
  if (!kakaoId) {
    return NextResponse.json({ error: "kakaoId가 필요합니다" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { kakaoId },
    select: {
      name: true,
      profileImage: true,
      pbFull: true,
      pbHalf: true,
      pb10k: true,
      pb5k: true,
      coachingNote: true,
      participants: {
        where: { status: "APPROVED" },
        orderBy: { submittedAt: "desc" },
        take: 20,
        include: {
          meeting: {
            select: {
              date: true,
              startTime: true,
              endTime: true,
              location: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "회원을 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json(user);
}

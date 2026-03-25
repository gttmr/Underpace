import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";
import { isAdminAuthenticated } from "@/lib/auth";

// 코치/관리자만 접근 가능한 모임별 참가자 상세 정보 API
export async function GET(req: NextRequest) {
  // 1) admin_session 쿠키로 관리자 인증된 경우 바로 통과
  const isAdmin = await isAdminAuthenticated();
  
  if (!isAdmin) {
    // 2) 카카오 세션으로 코치/관리자 role 확인
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

  const today = new Date().toISOString().split("T")[0];

  // 다가오는 모임 목록 + 참가자 + 참가자의 User 프로필
  const meetings = await prisma.meeting.findMany({
    where: { date: { gte: today } },
    orderBy: { date: "asc" },
    take: 10,
    include: {
      participants: {
        where: { status: { in: ["APPROVED", "PENDING"] } },
        orderBy: { submittedAt: "asc" },
        select: {
          id: true,
          name: true,
          status: true,
          note: true,
          kakaoId: true,
          user: {
            select: {
              name: true,
              profileImage: true,
              pbFull: true,
              pbHalf: true,
              pb10k: true,
              pb5k: true,
              coachingNote: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(meetings);
}

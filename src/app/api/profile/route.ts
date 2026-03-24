import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

// 내 프로필 정보 가져오기
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { kakaoId: session.kakaoId },
    include: {
      _count: {
        select: {
          participants: true,
          marathonParticipants: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "회원 정보를 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// 내 프로필 수정
export async function PUT(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const body = await req.json();
  const { name, phoneNumber, pbFull, pbHalf, pb10k, pb5k, coachingNote } = body;

  const user = await prisma.user.update({
    where: { kakaoId: session.kakaoId },
    data: {
      ...(name !== undefined && { name: name.trim() || null }),
      ...(phoneNumber !== undefined && { phoneNumber: phoneNumber.trim() || null }),
      ...(pbFull !== undefined && { pbFull: pbFull.trim() || null }),
      ...(pbHalf !== undefined && { pbHalf: pbHalf.trim() || null }),
      ...(pb10k !== undefined && { pb10k: pb10k.trim() || null }),
      ...(pb5k !== undefined && { pb5k: pb5k.trim() || null }),
      ...(coachingNote !== undefined && { coachingNote: coachingNote.trim() || null }),
    },
  });

  return NextResponse.json(user);
}

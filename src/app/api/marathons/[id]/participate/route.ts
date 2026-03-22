import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getSessionFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "카카오 로그인이 필요합니다." }, { status: 401 });
  }

  const resolvedParams = await params;
  const marathonId = parseInt(resolvedParams.id, 10);
  if (isNaN(marathonId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const body = await req.json();
    const { name, note } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
    }

    const marathon = await prisma.marathon.findUnique({
      where: { id: marathonId },
    });

    if (!marathon) {
      return NextResponse.json({ error: "마라톤 대회를 찾을 수 없습니다." }, { status: 404 });
    }

    const existing = await prisma.marathonParticipant.findUnique({
      where: { marathonId_kakaoId: { marathonId, kakaoId: user.kakaoId } },
    });

    if (existing) {
      return NextResponse.json({ error: "이미 신청한 대회입니다." }, { status: 409 });
    }

    const participant = await prisma.marathonParticipant.create({
      data: {
        marathonId,
        kakaoId: user.kakaoId,
        name: name.trim(),
        note: note?.trim() || null,
        status: "APPROVED",
      },
    });

    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

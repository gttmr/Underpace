import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";
import { formatSignupOpensAt, isSignupAvailable } from "@/lib/meetingSignup";
import { apiError, apiOk } from "@/lib/api-response";
import { countParticipantsByStatus } from "@/lib/participant-utils";

export async function POST(req: NextRequest) {
  const user = getSessionFromRequest(req);
  if (!user) return apiError(401, "카카오 로그인이 필요합니다");

  const body = await req.json();
  const { meetingId, name, note } = body;

  if (!meetingId || !name?.trim()) return apiError(400, "이름을 입력해주세요");

  const meeting = await prisma.meeting.findUnique({
    where: { id: parseInt(meetingId) },
    include: { participants: { select: { id: true, status: true, kakaoId: true } } },
  });

  if (!meeting) return apiError(404, "모임을 찾을 수 없습니다");
  if (!meeting.isOpen) return apiError(400, "신청이 마감된 모임입니다");
  if (!isSignupAvailable(meeting)) {
    return apiError(400, `신청은 ${formatSignupOpensAt(meeting.signupOpensAt)}부터 가능합니다`);
  }

  const duplicate = meeting.participants.find((p) => p.kakaoId === user.kakaoId);
  if (duplicate && duplicate.status !== "REJECTED") return apiError(409, "이미 신청하셨습니다");

  // REJECTED 레코드가 있으면 삭제 후 재신청
  if (duplicate && duplicate.status === "REJECTED") {
    await prisma.participant.delete({ where: { id: duplicate.id } });
  }

  const { approvedCount, waitlistedCount } = countParticipantsByStatus(
    meeting.participants.filter((p) => p.status !== "REJECTED")
  );
  const isFull = approvedCount >= meeting.maxCapacity;

  const participant = await prisma.participant.create({
    data: {
      meetingId: parseInt(meetingId),
      name: name.trim(),
      kakaoId: user.kakaoId,
      kakaoNickname: user.nickname,
      note: note?.trim() || null,
      status: isFull ? "WAITLISTED" : "APPROVED",
      waitlistPosition: isFull ? waitlistedCount + 1 : null,
    },
  });

  return apiOk(participant, 201);
}

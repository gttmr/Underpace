/**
 * 참가자 배열에서 상태별 카운트를 반환합니다.
 */
export function countParticipantsByStatus(participants: { status: string }[]) {
  return {
    approvedCount: participants.filter((p) => p.status === "APPROVED").length,
    pendingCount: participants.filter((p) => p.status === "PENDING").length,
    waitlistedCount: participants.filter((p) => p.status === "WAITLISTED").length,
  };
}

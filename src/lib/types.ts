export type ParticipantStatus = "PENDING" | "APPROVED" | "WAITLISTED" | "REJECTED";

export interface MeetingWithCounts {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxCapacity: number;
  description: string | null;
  isOpen: boolean;
  scheduleId: number | null;
  approvedCount: number;
  pendingCount: number;
  waitlistedCount: number;
}

export interface ParticipantWithMeeting {
  id: number;
  name: string;
  contact: string;
  note: string | null;
  status: ParticipantStatus;
  waitlistPosition: number | null;
  rejectionNote: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  meetingId: number;
}

export const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

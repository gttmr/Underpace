export type ParticipantStatus = "PENDING" | "APPROVED" | "WAITLISTED" | "REJECTED";

export interface MeetingWithCounts {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxCapacity: number;
  description: string | null;
  signupOpensAt: string | null;
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

// ── Admin ──────────────────────────────────────────────────────────────────

export interface UserWithCounts {
  id: number;
  kakaoId: string;
  name: string | null;
  profileImage: string | null;
  phoneNumber: string | null;
  role: string;
  createdAt: string;
  _count: {
    participants: number;
    marathonParticipants: number;
  };
}

export interface UserDetail extends Omit<UserWithCounts, "_count"> {
  participants: {
    id: number;
    name: string;
    status: string;
    submittedAt: string;
    meeting: { date: string; location: string; startTime: string };
  }[];
  marathonParticipants: {
    id: number;
    name: string;
    status: string;
    submittedAt: string;
    marathon: { title: string; date: string };
  }[];
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "관리자",
  COACH: "코치",
  MEMBER: "일반 회원",
  BANNED: "차단됨",
};

export const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  COACH: "bg-teal-100 text-teal-700",
  MEMBER: "bg-green-100 text-green-700",
  BANNED: "bg-red-100 text-red-700",
};

// ── Marathon ───────────────────────────────────────────────────────────────

export interface MarathonParticipant {
  id: number;
  kakaoId: string;
  name: string;
  status: string;
}

export interface MarathonDetail {
  id: number;
  title: string;
  date: string;
  startTime: string;
  location: string | null;
  description: string | null;
  link: string | null;
  participants: MarathonParticipant[];
}

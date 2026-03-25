const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

function parseDateString(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}

function formatDateString(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDateString(dateStr: string, diffDays: number) {
  const { year, month, day } = parseDateString(dateStr);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + diffDays);
  return formatDateString(date);
}

function toKstViewDate(input: string | Date) {
  const date = input instanceof Date ? input : new Date(input);
  return new Date(date.getTime() + KST_OFFSET_MS);
}

export function getDayOfWeekFromDateString(dateStr: string) {
  const { year, month, day } = parseDateString(dateStr);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function buildSignupOpensAt(dateStr: string, timeStr: string) {
  const { year, month, day } = parseDateString(dateStr);
  const [hour, minute] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute));
}

export function getSignupOpensAtForSchedule(
  meetingDate: string,
  signupOpenDayOfWeek: number | null,
  signupOpenTime: string | null,
) {
  if (signupOpenDayOfWeek === null || signupOpenTime === null) {
    return null;
  }

  const meetingDayOfWeek = getDayOfWeekFromDateString(meetingDate);
  const signupDate = shiftDateString(meetingDate, signupOpenDayOfWeek - meetingDayOfWeek);
  return buildSignupOpensAt(signupDate, signupOpenTime);
}

export function validateSignupWindowRule(
  meetingDayOfWeek: number,
  signupOpenDayOfWeek: number | null,
  signupOpenTime: string | null,
) {
  const hasDay = signupOpenDayOfWeek !== null;
  const hasTime = signupOpenTime !== null;

  if (hasDay !== hasTime) {
    return "신청 시작 요일과 시간은 함께 입력해야 합니다.";
  }

  if (!hasDay || !hasTime) {
    return null;
  }

  if (signupOpenDayOfWeek > meetingDayOfWeek) {
    return "신청 시작 요일은 모임 요일보다 늦을 수 없습니다.";
  }

  return null;
}

export function isSignupAvailable(meeting: { isOpen: boolean; signupOpensAt: string | Date | null }, now = new Date()) {
  if (!meeting.isOpen) {
    return false;
  }

  if (!meeting.signupOpensAt) {
    return true;
  }

  return new Date(meeting.signupOpensAt).getTime() <= now.getTime();
}

export function formatSignupOpensAt(signupOpensAt: string | Date | null) {
  if (!signupOpensAt) {
    return "항상 오픈";
  }

  const date = toKstViewDate(signupOpensAt);
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const weekday = DAY_KO[date.getUTCDay()];
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  return `${month}월 ${day}일 (${weekday}) ${hour}:${minute}`;
}

export function formatSignupOpensAtCompact(signupOpensAt: string | Date | null) {
  if (!signupOpensAt) {
    return "항상 오픈";
  }

  const date = toKstViewDate(signupOpensAt);
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const weekday = DAY_KO[date.getUTCDay()];
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  return `${month}/${day} (${weekday}) ${hour}:${minute}`;
}

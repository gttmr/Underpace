import { prisma } from "./db";

// 반복 일정에서 앞으로 N주치 모임 자동 생성
export async function generateMeetingsFromSchedule(
  scheduleId: number,
  weeksAhead: number = 8
) {
  const schedule = await prisma.recurringSchedule.findUnique({
    where: { id: scheduleId },
  });
  if (!schedule || !schedule.isActive) return;

  const today = new Date();
  const meetings = [];

  for (let w = 0; w < weeksAhead; w++) {
    const d = new Date(today);
    d.setDate(today.getDate() + w * 7);
    // 해당 주의 dayOfWeek 날짜 계산
    const diff = (schedule.dayOfWeek - d.getDay() + 7) % 7;
    const meetingDate = new Date(d);
    meetingDate.setDate(d.getDate() + diff);

    if (meetingDate < today) continue;

    const dateStr = meetingDate.toISOString().split("T")[0];

    // 이미 존재하면 스킵
    const exists = await prisma.meeting.findFirst({
      where: { scheduleId, date: dateStr },
    });
    if (exists) continue;

    meetings.push({
      scheduleId,
      date: dateStr,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      location: schedule.location,
      maxCapacity: schedule.maxCapacity,
      description: schedule.description,
      isOpen: true,
      isOverridden: false,
    });
  }

  if (meetings.length > 0) {
    await prisma.meeting.createMany({ data: meetings });
  }

  return meetings.length;
}

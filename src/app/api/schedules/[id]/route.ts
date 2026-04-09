import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { generateMeetingsFromSchedule, syncUpcomingMeetingSignupWindows } from "@/lib/schedule";
import { validateSignupWindowRule } from "@/lib/meetingSignup";
import { apiError, apiOk } from "@/lib/api-response";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const scheduleId = parseInt(id);
  const { dayOfWeek, startTime, endTime, location, maxCapacity, description, classType, isActive, signupOpenDayOfWeek, signupOpenTime } = await req.json();

  const existing = await prisma.recurringSchedule.findUnique({ where: { id: scheduleId } });
  if (!existing) return apiError(404, "Not found");

  const nextDayOfWeek = dayOfWeek !== undefined ? parseInt(dayOfWeek) : existing.dayOfWeek;
  const nextSignupOpenDayOfWeek =
    signupOpenDayOfWeek !== undefined
      ? (signupOpenDayOfWeek === null || signupOpenDayOfWeek === "" ? null : parseInt(signupOpenDayOfWeek))
      : existing.signupOpenDayOfWeek;
  const nextSignupOpenTime =
    signupOpenTime !== undefined ? (signupOpenTime ? String(signupOpenTime) : null) : existing.signupOpenTime;

  const validationError = validateSignupWindowRule(nextDayOfWeek, nextSignupOpenDayOfWeek, nextSignupOpenTime);
  if (validationError) return apiError(400, validationError);

  const schedule = await prisma.recurringSchedule.update({
    where: { id: scheduleId },
    data: {
      ...(dayOfWeek !== undefined && { dayOfWeek: nextDayOfWeek }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      ...(location && { location }),
      ...(maxCapacity !== undefined && { maxCapacity: parseInt(maxCapacity) }),
      ...(description !== undefined && { description: description || null }),
      ...(signupOpenDayOfWeek !== undefined && { signupOpenDayOfWeek: nextSignupOpenDayOfWeek }),
      ...(signupOpenTime !== undefined && { signupOpenTime: nextSignupOpenTime }),
      ...(isActive !== undefined && { isActive }),
      ...(classType !== undefined && { classType: classType || null }),
    },
  });

  if (schedule.isActive) {
    await generateMeetingsFromSchedule(schedule.id, 8);
    await syncUpcomingMeetingSignupWindows(schedule.id);
  }

  return apiOk(schedule);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  await prisma.recurringSchedule.delete({ where: { id: parseInt(id) } });
  return apiOk({ ok: true });
}

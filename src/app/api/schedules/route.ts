import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { generateMeetingsFromSchedule } from "@/lib/schedule";
import { validateSignupWindowRule } from "@/lib/meetingSignup";
import { apiError, apiOk } from "@/lib/api-response";

export async function GET() {
  const schedules = await prisma.recurringSchedule.findMany({ orderBy: { dayOfWeek: "asc" } });
  return apiOk(schedules);
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { dayOfWeek, startTime, endTime, location, maxCapacity, description, classType, signupOpenDayOfWeek, signupOpenTime } = await req.json();

  const parsedDayOfWeek = parseInt(dayOfWeek);
  const normalizedSignupOpenDayOfWeek =
    signupOpenDayOfWeek === null || signupOpenDayOfWeek === undefined || signupOpenDayOfWeek === ""
      ? null
      : parseInt(signupOpenDayOfWeek);
  const normalizedSignupOpenTime = signupOpenTime ? String(signupOpenTime) : null;

  const validationError = validateSignupWindowRule(parsedDayOfWeek, normalizedSignupOpenDayOfWeek, normalizedSignupOpenTime);
  if (validationError) return apiError(400, validationError);

  const schedule = await prisma.recurringSchedule.create({
    data: {
      dayOfWeek: parsedDayOfWeek,
      startTime,
      endTime,
      location,
      maxCapacity: parseInt(maxCapacity),
      description: description || null,
      classType: classType || null,
      signupOpenDayOfWeek: normalizedSignupOpenDayOfWeek,
      signupOpenTime: normalizedSignupOpenTime,
    },
  });

  await generateMeetingsFromSchedule(schedule.id, 8);
  return apiOk(schedule, 201);
}

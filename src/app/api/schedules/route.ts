import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { generateMeetingsFromSchedule } from "@/lib/schedule";
import { validateSignupWindowRule } from "@/lib/meetingSignup";

export async function GET() {
  const schedules = await prisma.recurringSchedule.findMany({
    orderBy: { dayOfWeek: "asc" },
  });
  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { dayOfWeek, startTime, endTime, location, maxCapacity, description, signupOpenDayOfWeek, signupOpenTime } = body;

  const parsedDayOfWeek = parseInt(dayOfWeek);
  const normalizedSignupOpenDayOfWeek =
    signupOpenDayOfWeek === null || signupOpenDayOfWeek === undefined || signupOpenDayOfWeek === ""
      ? null
      : parseInt(signupOpenDayOfWeek);
  const normalizedSignupOpenTime = signupOpenTime ? String(signupOpenTime) : null;
  const validationError = validateSignupWindowRule(
    parsedDayOfWeek,
    normalizedSignupOpenDayOfWeek,
    normalizedSignupOpenTime,
  );

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const schedule = await prisma.recurringSchedule.create({
    data: {
      dayOfWeek: parsedDayOfWeek,
      startTime,
      endTime,
      location,
      maxCapacity: parseInt(maxCapacity),
      description: description || null,
      signupOpenDayOfWeek: normalizedSignupOpenDayOfWeek,
      signupOpenTime: normalizedSignupOpenTime,
    },
  });

  // 자동으로 8주치 모임 생성
  await generateMeetingsFromSchedule(schedule.id, 8);

  return NextResponse.json(schedule, { status: 201 });
}

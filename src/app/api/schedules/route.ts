import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { generateMeetingsFromSchedule } from "@/lib/schedule";

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
  const { dayOfWeek, startTime, endTime, location, maxCapacity, description } = body;

  const schedule = await prisma.recurringSchedule.create({
    data: {
      dayOfWeek: parseInt(dayOfWeek),
      startTime,
      endTime,
      location,
      maxCapacity: parseInt(maxCapacity),
      description: description || null,
    },
  });

  // 자동으로 8주치 모임 생성
  await generateMeetingsFromSchedule(schedule.id, 8);

  return NextResponse.json(schedule, { status: 201 });
}

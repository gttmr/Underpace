import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { generateMeetingsFromSchedule } from "@/lib/schedule";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { dayOfWeek, startTime, endTime, location, maxCapacity, description, isActive } = body;

  const schedule = await prisma.recurringSchedule.update({
    where: { id: parseInt(id) },
    data: {
      ...(dayOfWeek !== undefined && { dayOfWeek: parseInt(dayOfWeek) }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      ...(location && { location }),
      ...(maxCapacity !== undefined && { maxCapacity: parseInt(maxCapacity) }),
      ...(description !== undefined && { description: description || null }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  // 새로운 모임 자동 생성
  if (schedule.isActive) {
    await generateMeetingsFromSchedule(schedule.id, 8);
  }

  return NextResponse.json(schedule);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.recurringSchedule.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}

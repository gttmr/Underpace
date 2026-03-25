import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { generateMeetingsFromSchedule } from "@/lib/schedule";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const upcoming = searchParams.get("upcoming") === "true";

  const today = new Date().toISOString().split("T")[0];

  const meetings = await prisma.meeting.findMany({
    where: upcoming ? { date: { gte: today } } : undefined,
    orderBy: { date: "asc" },
    include: {
      _count: {
        select: {
          participants: true,
        },
      },
      participants: {
        select: { status: true },
      },
    },
  });

  const result = meetings.map((m) => {
    const approvedCount = m.participants.filter((p) => p.status === "APPROVED").length;
    const pendingCount = m.participants.filter((p) => p.status === "PENDING").length;
    const waitlistedCount = m.participants.filter((p) => p.status === "WAITLISTED").length;
    return {
      id: m.id,
      date: m.date,
      startTime: m.startTime,
      endTime: m.endTime,
      location: m.location,
      maxCapacity: m.maxCapacity,
      description: m.description,
      signupOpensAt: m.signupOpensAt?.toISOString() ?? null,
      isOpen: m.isOpen,
      scheduleId: m.scheduleId,
      approvedCount,
      pendingCount,
      waitlistedCount,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { date, startTime, endTime, location, maxCapacity, description, scheduleId, isOpen, signupOpensAt } = body;

  const meeting = await prisma.meeting.create({
    data: {
      date,
      startTime,
      endTime,
      location,
      maxCapacity: parseInt(maxCapacity),
      description: description || null,
      scheduleId: scheduleId ? parseInt(scheduleId) : null,
      signupOpensAt: signupOpensAt ? new Date(signupOpensAt) : null,
      isOpen: isOpen !== false,
    },
  });

  return NextResponse.json(meeting, { status: 201 });
}

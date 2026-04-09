import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { generateMeetingsFromSchedule } from "@/lib/schedule";
import { countParticipantsByStatus } from "@/lib/participant-utils";
import { apiOk } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const upcoming = searchParams.get("upcoming") === "true";
  const today = new Date().toISOString().split("T")[0];

  const meetings = await prisma.meeting.findMany({
    where: upcoming ? { date: { gte: today } } : undefined,
    orderBy: { date: "asc" },
    include: {
      _count: { select: { participants: true } },
      participants: { select: { status: true } },
    },
  });

  const result = meetings.map((m) => {
    const { approvedCount, pendingCount, waitlistedCount } = countParticipantsByStatus(m.participants);
    return {
      id: m.id,
      date: m.date,
      startTime: m.startTime,
      endTime: m.endTime,
      location: m.location,
      maxCapacity: m.maxCapacity,
      description: m.description,
      classType: m.classType,
      signupOpensAt: m.signupOpensAt?.toISOString() ?? null,
      isOpen: m.isOpen,
      scheduleId: m.scheduleId,
      approvedCount,
      pendingCount,
      waitlistedCount,
    };
  });

  return apiOk(result);
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { date, startTime, endTime, location, maxCapacity, description, scheduleId, isOpen, signupOpensAt, classType } = await req.json();

  const meeting = await prisma.meeting.create({
    data: {
      date,
      startTime,
      endTime,
      location,
      maxCapacity: parseInt(maxCapacity),
      description: description || null,
      classType: classType || null,
      scheduleId: scheduleId ? parseInt(scheduleId) : null,
      signupOpensAt: signupOpensAt ? new Date(signupOpensAt) : null,
      isOpen: isOpen !== false,
    },
  });

  return apiOk(meeting, 201);
}

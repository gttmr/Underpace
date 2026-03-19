import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action, rejectionNote } = body; // action: "approve" | "reject" | "waitlist" | "pending"

  const participant = await prisma.participant.findUnique({
    where: { id: parseInt(id) },
    include: { meeting: { include: { participants: { select: { status: true } } } } },
  });

  if (!participant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let newStatus = participant.status;
  let newWaitlistPosition = participant.waitlistPosition;

  if (action === "approve") {
    newStatus = "APPROVED";
    newWaitlistPosition = null;
  } else if (action === "reject") {
    newStatus = "REJECTED";
    newWaitlistPosition = null;
  } else if (action === "waitlist") {
    const waitlistedCount = participant.meeting.participants.filter((p) => p.status === "WAITLISTED").length;
    newStatus = "WAITLISTED";
    newWaitlistPosition = waitlistedCount + 1;
  } else if (action === "pending") {
    newStatus = "PENDING";
    newWaitlistPosition = null;
  }

  const updated = await prisma.participant.update({
    where: { id: parseInt(id) },
    data: {
      status: newStatus,
      waitlistPosition: newWaitlistPosition,
      rejectionNote: action === "reject" ? rejectionNote || null : participant.rejectionNote,
      reviewedAt: ["approve", "reject"].includes(action) ? new Date() : participant.reviewedAt,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.participant.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}

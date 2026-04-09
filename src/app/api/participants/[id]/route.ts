import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api-response";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const { action, rejectionNote } = await req.json();

  const participant = await prisma.participant.findUnique({
    where: { id: parseInt(id) },
    include: { meeting: { include: { participants: { select: { status: true } } } } },
  });

  if (!participant) return apiError(404, "Not found");

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

  return apiOk(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  await prisma.participant.delete({ where: { id: parseInt(id) } });
  return apiOk({ ok: true });
}

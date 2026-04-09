import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    include: {
      participants: {
        include: { meeting: { select: { date: true, location: true, startTime: true } } },
        orderBy: { submittedAt: "desc" },
      },
      marathonParticipants: {
        include: { marathon: { select: { title: true, date: true } } },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!user) return apiError(404, "Not found");
  return apiOk(user);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const { role, phoneNumber, name } = await req.json();

  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data: {
      ...(role && { role }),
      ...(phoneNumber !== undefined && { phoneNumber: phoneNumber || null }),
      ...(name !== undefined && { name: name || null }),
    },
  });

  return apiOk(user);
}

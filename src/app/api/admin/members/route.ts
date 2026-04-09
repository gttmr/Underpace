import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { apiOk } from "@/lib/api-response";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { participants: true, marathonParticipants: true } } },
  });

  return apiOk(users);
}

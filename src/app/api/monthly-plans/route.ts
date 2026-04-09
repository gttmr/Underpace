import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";
import { isAdminAuthenticated } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api-response";

// GET /api/monthly-plans?year=Y&month=M
export async function GET(req: NextRequest) {
  const year = parseInt(req.nextUrl.searchParams.get("year") ?? "");
  const month = parseInt(req.nextUrl.searchParams.get("month") ?? "");

  if (!year || !month) return apiError(400, "year, month 필수");

  const plan = await prisma.monthlyPlan.findUnique({ where: { year_month: { year, month } } });
  return apiOk(plan ?? null);
}

// POST /api/monthly-plans  — COACH/ADMIN only, upsert
export async function POST(req: NextRequest) {
  const isAdmin = await isAdminAuthenticated();

  if (!isAdmin) {
    const session = getSessionFromRequest(req);
    if (!session) return apiError(401, "로그인 필요");

    const user = await prisma.user.findUnique({
      where: { kakaoId: session.kakaoId },
      select: { role: true },
    });
    if (!user || (user.role !== "COACH" && user.role !== "ADMIN")) {
      return apiError(403, "코치 또는 관리자 권한 필요");
    }
  }

  const { year, month, beginnerContent, advancedContent } = await req.json();
  if (!year || !month) return apiError(400, "year, month 필수");

  const plan = await prisma.monthlyPlan.upsert({
    where: { year_month: { year, month } },
    create: { year, month, beginnerContent: beginnerContent ?? "", advancedContent: advancedContent ?? "" },
    update: { beginnerContent: beginnerContent ?? "", advancedContent: advancedContent ?? "" },
  });

  return apiOk(plan);
}

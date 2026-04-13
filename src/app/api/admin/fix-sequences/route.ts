import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PostgreSQL autoincrement 시퀀스가 실제 MAX(id)보다 낮을 때 발생하는
// P2002 unique constraint 에러를 해결하기 위한 일회성 수정 엔드포인트.
// 관리자 쿠키가 필요하며, POST /api/admin/fix-sequences 로 호출한다.
export async function POST() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const tables = [
    "User",
    "Participant",
    "Meeting",
    "RecurringSchedule",
    "TrainingLog",
    "MonthlyPlan",
    "Notice",
    "Marathon",
    "MarathonParticipant",
  ];

  const results: Record<string, { before: number; after: number } | string> = {};

  for (const table of tables) {
    try {
      // 현재 시퀀스 값 조회
      const seqName = await prisma.$queryRawUnsafe<{ seq: string }[]>(
        `SELECT pg_get_serial_sequence('"${table}"', 'id') AS seq`
      );
      const seq = seqName[0]?.seq;
      if (!seq) {
        results[table] = "시퀀스 없음 (스킵)";
        continue;
      }

      const beforeRows = await prisma.$queryRawUnsafe<{ last_value: number }[]>(
        `SELECT last_value FROM ${seq}`
      );
      const before = Number(beforeRows[0]?.last_value ?? 0);

      // 시퀀스를 현재 MAX(id)로 재설정
      await prisma.$executeRawUnsafe(
        `SELECT setval('${seq}', COALESCE((SELECT MAX(id) FROM "${table}"), 1))`
      );

      const afterRows = await prisma.$queryRawUnsafe<{ last_value: number }[]>(
        `SELECT last_value FROM ${seq}`
      );
      const after = Number(afterRows[0]?.last_value ?? 0);

      results[table] = { before, after };
    } catch (err) {
      results[table] = String(err);
    }
  }

  return NextResponse.json({ ok: true, results });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const marathon = await prisma.marathon.findUnique({
      where: { id },
      include: {
        participants: {
          orderBy: { submittedAt: "asc" },
        },
      },
    });

    if (!marathon) {
      return NextResponse.json({ error: "마라톤 대회를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(marathon);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

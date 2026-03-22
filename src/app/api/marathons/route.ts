import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const year = url.searchParams.get("year");
  const month = url.searchParams.get("month");

  if (!year || !month) {
    return NextResponse.json({ error: "Missing year or month" }, { status: 400 });
  }

  const prefix = `${year}-${month.padStart(2, "0")}`;
  const marathons = await prisma.marathon.findMany({
    where: {
      date: {
        startsWith: prefix,
      },
    },
    orderBy: [
      { date: "asc" },
      { startTime: "asc" },
    ],
  });

  return NextResponse.json(marathons);
}

export async function POST(req: NextRequest) {
  const user = getSessionFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, date, startTime, location, description, link } = body;

    if (!title || !date || !startTime) {
      return NextResponse.json({ error: "필수 항목(제목, 날짜, 시간)을 입력해주세요." }, { status: 400 });
    }

    const marathon = await prisma.marathon.create({
      data: {
        title,
        date,
        startTime,
        location,
        description,
        link,
        createdById: user.kakaoId,
      },
    });

    return NextResponse.json(marathon, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

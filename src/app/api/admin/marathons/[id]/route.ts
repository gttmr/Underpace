import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminSession = req.cookies.get("admin_session")?.value;
  if (adminSession !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const marathonId = parseInt(id);

    if (isNaN(marathonId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.marathon.delete({
      where: { id: marathonId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete marathon:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

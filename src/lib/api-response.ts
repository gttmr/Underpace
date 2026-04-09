import { NextResponse } from "next/server";

export function apiError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

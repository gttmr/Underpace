import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "admin_session";
const SESSION_VALUE = "authenticated";

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === SESSION_VALUE;
}

/** 관리자 인증 가드. 미인증 시 401 응답 반환, 인증 시 null 반환. */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function setAdminCookie(response: Response): Response {
  response.headers.set(
    "Set-Cookie",
    `${COOKIE_NAME}=${SESSION_VALUE}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
  );
  return response;
}

export function clearAdminCookie(response: Response): Response {
  response.headers.set(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return response;
}

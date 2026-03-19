import { NextRequest, NextResponse } from "next/server";
import { encodeSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const returnTo = state ? decodeURIComponent(state) : "/";

  if (!code) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 1) 인가 코드 → 액세스 토큰 교환
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.KAKAO_CLIENT_ID!,
    redirect_uri: process.env.KAKAO_REDIRECT_URI!,
    code,
  });
  if (process.env.KAKAO_CLIENT_SECRET) {
    params.set("client_secret", process.env.KAKAO_CLIENT_SECRET);
  }

  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return NextResponse.redirect(new URL(`${returnTo}?auth_error=token`, req.url));
  }

  // 2) 사용자 정보 조회
  const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json();

  const kakaoId = String(userData.id);
  const nickname: string =
    userData.kakao_account?.profile?.nickname ??
    userData.properties?.nickname ??
    "카카오 사용자";
  const profileImage: string | undefined =
    userData.kakao_account?.profile?.thumbnail_image_url ??
    userData.properties?.thumbnail_image ??
    undefined;

  // 3) 세션 쿠키 설정 후 returnTo로 리다이렉트
  const token = encodeSession({ kakaoId, nickname, profileImage });
  const res = NextResponse.redirect(new URL(returnTo, req.url));
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return res;
}

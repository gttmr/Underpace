import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.KAKAO_CLIENT_ID;
  const redirectUri = process.env.KAKAO_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "카카오 앱이 설정되지 않았습니다" }, { status: 500 });
  }

  const returnTo = req.nextUrl.searchParams.get("returnTo") ?? "/";
  const state = encodeURIComponent(returnTo);

  const kakaoUrl =
    `https://kauth.kakao.com/oauth/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&state=${state}`;

  return NextResponse.redirect(kakaoUrl);
}

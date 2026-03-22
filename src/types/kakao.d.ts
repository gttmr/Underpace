interface KakaoAuth {
  authorize(options: { redirectUri: string; state?: string; prompt?: string }): void;
}

interface KakaoSDK {
  init(appKey: string): void;
  isInitialized(): boolean;
  Auth: KakaoAuth;
}

interface Window {
  Kakao?: KakaoSDK;
  __KAKAO_INIT__?: () => void;
}

"use client";

import { useState, useEffect } from "react";
import type { SessionUser } from "@/lib/session";

interface UserSessionResult {
  user: SessionUser | null | undefined;
  name: string;
  profileName: string | null;
  setName: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * 카카오 세션 + 프로필 이름을 fetch하는 공통 훅.
 * undefined = 로딩 중, null = 비로그인, SessionUser = 로그인 상태.
 */
export function useUserSession(deps: unknown[] = []): UserSessionResult {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: SessionUser | null) => {
        setUser(data);
        if (data?.kakaoId) {
          fetch("/api/profile")
            .then((r) => (r.ok ? r.json() : null))
            .then((profile: { name?: string } | null) => {
              if (profile?.name) {
                setName(profile.name);
                setProfileName(profile.name);
              } else if (data.nickname) {
                setName(data.nickname);
              }
            })
            .catch(() => {
              if (data.nickname) setName(data.nickname);
            });
        }
      })
      .catch(() => setUser(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { user, name, profileName, setName };
}

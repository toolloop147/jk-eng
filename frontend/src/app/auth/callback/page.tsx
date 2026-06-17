"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "@/lib/auth";
import { completeEngSwitch } from "@/lib/authSwitch";

function readSwitchTokenFromHash(): string | null {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(hash).get("token");
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const switchToken = readSwitchTokenFromHash();
    if (!switchToken) {
      setError("전환 토큰이 없습니다.");
      return;
    }

    let cancelled = false;

    completeEngSwitch(switchToken)
      .then((token) => {
        if (cancelled) return;
        setToken(token);
        window.history.replaceState(null, "", "/auth/callback");
        router.replace("/construction-manage");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "앱 전환에 실패했습니다.");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <div className="tl-card max-w-md rounded-2xl p-6 text-center">
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
          <a href="/login" className="tl-button-outline mt-4 inline-flex no-underline">
            로그인으로 이동
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--tl-accent)] border-t-transparent" />
    </div>
  );
}

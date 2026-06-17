"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { switchToApp, SwitchTargetApp } from "@/lib/appSwitcher";

function SwitchAppContent() {
  const searchParams = useSearchParams();
  const target = searchParams.get("target");
  const [error, setError] = useState("");

  useEffect(() => {
    if (target !== "ins" && target !== "eng") {
      setError("전환 대상 앱이 올바르지 않습니다.");
      return;
    }

    switchToApp(target as SwitchTargetApp).catch((err) => {
      setError(err instanceof Error ? err.message : "앱 전환에 실패했습니다.");
    });
  }, [target]);

  if (error) {
    return (
      <div className="tl-card max-w-md rounded-2xl p-6 text-center">
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
        <Link href="/construction-manage" className="tl-button-outline mt-4 inline-flex no-underline">
          대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[var(--tl-accent)] border-t-transparent" />
      <p className="text-sm text-slate-600">앱을 전환하는 중입니다...</p>
    </div>
  );
}

export default function SwitchAppPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <Suspense
        fallback={
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--tl-accent)] border-t-transparent" />
        }
      >
        <SwitchAppContent />
      </Suspense>
    </div>
  );
}

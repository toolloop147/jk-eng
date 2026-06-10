"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthUser, getMe } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { APP_DESCRIPTION, APP_SLUG, APP_TITLE, DASHBOARD_ITEMS } from "@/lib/config";
import { ToolloopLogo } from "./ToolloopLogo";

export function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    getMe()
      .then(setUser)
      .catch(() => {
        clearToken();
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <header className="tl-header sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <ToolloopLogo size="sm" variant="dark" />
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{user.name ?? "사용자"}</p>
              <p className="text-xs text-slate-500">{user.role}</p>
            </div>
            <button type="button" onClick={handleLogout} className="tl-button-outline text-sm">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <section className="tl-hero mb-8 rounded-2xl p-6 sm:p-8">
          <span className="tl-badge-light mb-3 inline-block">{APP_TITLE}</span>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            {APP_DESCRIPTION}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-cyan-100 sm:text-base">
            {user.email} 님, Toolloop {APP_TITLE} 서비스에 오신 것을 환영합니다.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DASHBOARD_ITEMS.map((item) => (
            <article key={item.title} className="tl-card p-5 sm:p-6">
              <h2 className="font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.desc}</p>
            </article>
          ))}
        </div>

        <footer className="mt-10 text-center text-xs text-slate-400">
          {APP_SLUG} · Toolloop Platform
        </footer>
      </main>
    </div>
  );
}

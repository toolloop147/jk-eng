"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthUser, getMe } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { APP_DESCRIPTION, APP_SLUG, APP_TITLE, DASHBOARD_ITEMS } from "@/lib/config";
import { AppSidebar } from "./AppSidebar";

export function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="flex min-h-full flex-1 items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--tl-accent)] border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="tl-dashboard-shell">
      <AppSidebar
        userName={user.name ?? "사용자"}
        activeId="dashboard"
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="tl-dashboard-content">
        <header className="flex items-center gap-3 border-b border-[var(--tl-border)] bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            className="tl-mobile-menu-btn"
            aria-label="메뉴 열기"
            onClick={() => setMobileMenuOpen(true)}
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
              <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-[var(--tl-accent)]">제이케이라이팅</span>
        </header>

        <main className="tl-page-main">
          <section className="tl-hero mb-8 rounded-2xl p-6 sm:p-8">
            <span className="tl-badge-light mb-3 inline-block">{APP_TITLE}</span>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{APP_DESCRIPTION}</h1>
            <p className="mt-2 max-w-xl text-sm text-teal-100 sm:text-base">
              {user.email} 님, Toolloop {APP_TITLE} 서비스에 오신 것을 환영합니다.
            </p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DASHBOARD_ITEMS.map((item) => (
              <article key={item.title} className="tl-card rounded-xl p-5 sm:p-6">
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
    </div>
  );
}

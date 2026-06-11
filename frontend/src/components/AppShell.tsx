"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthUser, getMe } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { AppSidebar } from "./AppSidebar";

function getActiveIdFromPath(pathname: string): string {
  if (pathname === "/" || pathname === "") return "dashboard";
  return pathname.replace(/^\//, "");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeId = getActiveIdFromPath(pathname);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    getMe()
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        clearToken();
        router.replace("/login");
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--tl-accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="tl-dashboard-shell">
      <AppSidebar
        userName={user.name ?? "사용자"}
        activeId={activeId}
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

        <main className="tl-page-main">{children}</main>
      </div>
    </div>
  );
}

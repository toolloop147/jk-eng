"use client";

import { APP_SLUG, DASHBOARD_ITEMS } from "@/lib/config";
import { PageHeader } from "./PageHeader";

export function DashboardPage() {
  return (
    <>
      <PageHeader title="대시보드" />

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
    </>
  );
}

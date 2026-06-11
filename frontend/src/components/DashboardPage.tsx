"use client";

import { APP_DESCRIPTION, APP_SLUG, APP_TITLE, DASHBOARD_ITEMS } from "@/lib/config";
import { PageHeader } from "./PageHeader";

export function DashboardPage() {
  return (
    <>
      <section className="tl-hero mb-8 rounded-2xl p-6 sm:p-8">
        <span className="tl-badge-light mb-3 inline-block">{APP_TITLE}</span>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{APP_DESCRIPTION}</h1>
      </section>

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

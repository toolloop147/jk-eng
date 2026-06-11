"use client";

import { APP_SLUG } from "@/lib/config";
import { getPageById } from "@/lib/navigation";
import { PageHeader } from "./PageHeader";

interface ModulePageProps {
  pageId: string;
}

export function ModulePage({ pageId }: ModulePageProps) {
  const page = getPageById(pageId);
  if (!page) return null;

  return (
    <>
      <PageHeader groupLabel={page.groupLabel} parentLabel={page.parentLabel} title={page.label} />

      <div className="tl-card rounded-xl p-5 sm:p-6">
        <p className="text-sm text-slate-500">{page.label} 화면입니다.</p>
      </div>

      <footer className="mt-10 text-center text-xs text-slate-400">
        {APP_SLUG} · Toolloop Platform
      </footer>
    </>
  );
}

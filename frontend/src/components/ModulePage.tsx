"use client";

import { ConstructionManagePage } from "./install/ConstructionManagePage";

interface ModulePageProps {
  pageId: string;
}

export function ModulePage({ pageId }: ModulePageProps) {
  if (pageId === "construction-manage") {
    return <ConstructionManagePage />;
  }

  return null;
}

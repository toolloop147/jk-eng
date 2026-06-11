import { ModulePage } from "@/components/ModulePage";
import { getAllPages, isValidPageId } from "@/lib/navigation";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ pageId: string }>;
};

export function generateStaticParams() {
  return getAllPages().map((page) => ({ pageId: page.id }));
}

export default async function SubMenuPageRoute({ params }: PageProps) {
  const { pageId } = await params;
  if (!isValidPageId(pageId)) notFound();
  return <ModulePage pageId={pageId} />;
}

interface PageHeaderProps {
  title: string;
  groupLabel?: string;
  parentLabel?: string;
}

export function PageHeader({ title, groupLabel, parentLabel }: PageHeaderProps) {
  const breadcrumb = [groupLabel, parentLabel].filter(Boolean).join(" · ");

  return (
    <section className="tl-page-header">
      {breadcrumb && <p className="tl-page-header-group">{breadcrumb}</p>}
      <h1 className="tl-page-header-title">{title}</h1>
    </section>
  );
}

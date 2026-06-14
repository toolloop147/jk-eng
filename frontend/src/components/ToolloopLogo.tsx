interface ToolloopLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark" | "brand";
  align?: "left" | "center";
  showSubtitle?: boolean;
  title?: string;
}

const sizes = {
  sm: { title: "text-sm leading-tight", subtitle: "text-[10px] leading-tight" },
  md: { title: "text-xl leading-tight", subtitle: "text-xs leading-tight" },
  lg: { title: "text-2xl leading-tight", subtitle: "text-sm leading-tight" },
};

export function ToolloopLogo({
  size = "md",
  variant = "light",
  align = "left",
  showSubtitle = true,
  title = "ckurity",
}: ToolloopLogoProps) {
  const s = sizes[size];
  const titleColor =
    variant === "light" ? "text-white" : variant === "brand" ? "text-[var(--tl-accent)]" : "text-slate-900";
  const subColor =
    variant === "light" ? "text-teal-200" : variant === "brand" ? "text-slate-400" : "text-[var(--tl-accent)]";
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <div className={`flex flex-col ${alignClass}`}>
      <p className={`font-bold tracking-tight whitespace-nowrap ${titleColor} ${s.title}`}>{title}</p>
      {showSubtitle && (
        <p className={`mt-1 font-medium ${subColor} ${s.subtitle}`}>Toolloop Enterprise Platform</p>
      )}
    </div>
  );
}

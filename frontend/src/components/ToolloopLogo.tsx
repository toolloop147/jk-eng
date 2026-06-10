interface ToolloopLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
}

const sizes = {
  sm: { icon: 28, text: "text-lg" },
  md: { icon: 36, text: "text-xl" },
  lg: { icon: 44, text: "text-2xl" },
};

export function ToolloopLogo({ size = "md", variant = "light" }: ToolloopLogoProps) {
  const s = sizes[size];
  const textColor = variant === "light" ? "text-white" : "text-slate-900";
  const subColor = variant === "light" ? "text-cyan-200" : "text-cyan-600";

  return (
    <div className="flex items-center gap-3">
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <rect width="48" height="48" rx="12" className="fill-cyan-500" />
        <path
          d="M14 24c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="24" cy="24" r="3" fill="white" />
      </svg>
      <div>
        <p className={`font-bold tracking-tight ${textColor} ${s.text}`}>Toolloop</p>
        <p className={`text-xs font-medium ${subColor}`}>Enterprise Platform</p>
      </div>
    </div>
  );
}

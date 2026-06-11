"use client";

import { useState } from "react";
import { SIDEBAR_GROUPS, SIDEBAR_LINKS, SIDEBAR_PRIMARY, SIDEBAR_SECONDARY } from "@/lib/config";
import { ToolloopLogo } from "./ToolloopLogo";

interface AppSidebarProps {
  userName?: string;
  activeId?: string;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="currentColor"
      aria-hidden
      className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="6" height="10" viewBox="0 0 6 10" fill="currentColor" aria-hidden className="shrink-0 opacity-40">
      <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v6M8.5 5.5a7 7 0 1 0 7 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NavItem({
  label,
  active,
  onClick,
  arrow,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  arrow?: "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tl-sidebar-item ${active ? "tl-sidebar-item-active" : ""}`}
    >
      <span>{label}</span>
      {arrow === "right" && <ChevronRight />}
    </button>
  );
}

export function AppSidebar({
  userName = "사용자",
  activeId = "dashboard",
  onLogout,
  mobileOpen = false,
  onMobileClose,
}: AppSidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SIDEBAR_GROUPS.filter((g) => g.defaultOpen).map((g) => [g.id, true])),
  );

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const sidebar = (
    <aside className="tl-sidebar">
      <div className="tl-sidebar-header">
        <ToolloopLogo size="sm" variant="brand" showSubtitle={false} />
        <div className="tl-sidebar-user-row">
          <span className="tl-sidebar-username">{userName}</span>
          <button type="button" onClick={onLogout} className="tl-sidebar-logout" aria-label="로그아웃">
            <PowerIcon />
          </button>
        </div>
      </div>

      <nav className="tl-sidebar-nav">
        {SIDEBAR_PRIMARY.map((item) => (
          <NavItem key={item.id} label={item.label} active={activeId === item.id} />
        ))}

        {SIDEBAR_LINKS.map((item) => (
          <NavItem key={item.id} label={item.label} active={activeId === item.id} />
        ))}

        {SIDEBAR_GROUPS.map((group) => {
          const open = openGroups[group.id] ?? false;
          return (
            <div key={group.id} className="tl-sidebar-group">
              <button
                type="button"
                className={`tl-sidebar-group-header ${open ? "tl-sidebar-group-header-open" : ""}`}
                onClick={() => toggleGroup(group.id)}
              >
                <span>{group.label}</span>
                <ChevronDown open={open} />
              </button>
              {open && (
                <div className="tl-sidebar-sub">
                  {group.items.map((item) => (
                    <NavItem key={item.id} label={item.label} active={activeId === item.id} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {SIDEBAR_SECONDARY.length > 0 && <div className="tl-sidebar-divider" />}

        {SIDEBAR_SECONDARY.map((item) => (
          <NavItem key={item.id} label={item.label} active={activeId === item.id} arrow="right" />
        ))}
      </nav>
    </aside>
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="tl-sidebar-backdrop"
          aria-label="메뉴 닫기"
          onClick={onMobileClose}
        />
      )}
      <div className={`tl-sidebar-wrap ${mobileOpen ? "tl-sidebar-wrap-open" : ""}`}>{sidebar}</div>
    </>
  );
}

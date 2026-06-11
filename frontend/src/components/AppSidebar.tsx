"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SIDEBAR_GROUPS, SIDEBAR_LINKS, SIDEBAR_PRIMARY, SIDEBAR_SECONDARY } from "@/lib/config";
import type { SidebarGroupItem } from "@/lib/config";
import { itemHasActiveChild } from "@/lib/navigation";
import { ToolloopLogo } from "./ToolloopLogo";

interface AppSidebarProps {
  userName?: string;
  activeId?: string;
  showAdminMenu?: boolean;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function MenuTriangle({ open }: { open: boolean }) {
  return (
    <svg
      width="8"
      height="6"
      viewBox="0 0 8 6"
      aria-hidden
      className={`tl-sidebar-triangle shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M0 0L8 0 4 6Z" fill="currentColor" />
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

function PrimaryNavItem({
  label,
  active,
  href,
  onNavigate,
}: {
  label: string;
  active?: boolean;
  href: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="tl-sidebar-group">
      <Link
        href={href}
        onClick={onNavigate}
        className={`tl-sidebar-group-header ${active ? "tl-sidebar-group-header-open" : ""}`}
      >
        <span>{label}</span>
      </Link>
    </div>
  );
}

function NavItem({
  label,
  active,
  href,
  arrow,
  onNavigate,
}: {
  label: string;
  active?: boolean;
  href: string;
  arrow?: "right";
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`tl-sidebar-item ${active ? "tl-sidebar-item-active" : ""}`}
    >
      <span>{label}</span>
      {arrow === "right" && <ChevronRight />}
    </Link>
  );
}

function SubNavItem({
  label,
  active,
  href,
  nested,
  onNavigate,
}: {
  label: string;
  active?: boolean;
  href: string;
  nested?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`tl-sidebar-sub-item ${nested ? "tl-sidebar-sub-item-nested" : ""} ${active ? "tl-sidebar-sub-item-active" : ""}`}
    >
      <span className="tl-sidebar-sub-line" aria-hidden />
      <span>{label}</span>
    </Link>
  );
}

function SubNavParent({
  label,
  open,
  active,
  onToggle,
}: {
  label: string;
  open: boolean;
  active?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`tl-sidebar-sub-parent ${active ? "tl-sidebar-sub-parent-active" : ""}`}
    >
      <span className="tl-sidebar-sub-line" aria-hidden />
      <span className="flex-1 text-left">{label}</span>
      <MenuTriangle open={open} />
    </button>
  );
}

function GroupSubItem({
  item,
  activeId,
  openSubGroups,
  toggleSubGroup,
  onNavigate,
}: {
  item: SidebarGroupItem;
  activeId: string;
  openSubGroups: Record<string, boolean>;
  toggleSubGroup: (id: string) => void;
  onNavigate?: () => void;
}) {
  if ("children" in item && item.children) {
    const subOpen = openSubGroups[item.id] ?? false;
    const hasActiveSub = itemHasActiveChild(item, activeId);
    const isCurrentSub = subOpen || hasActiveSub;

    return (
      <div className="tl-sidebar-nested">
        <SubNavParent
          label={item.label}
          open={subOpen}
          active={isCurrentSub}
          onToggle={() => toggleSubGroup(item.id)}
        />
        {subOpen &&
          item.children.map((child) => (
            <SubNavItem
              key={child.id}
              label={child.label}
              href={child.href}
              nested
              active={activeId === child.id}
              onNavigate={onNavigate}
            />
          ))}
      </div>
    );
  }

  if ("href" in item && item.href) {
    return (
      <SubNavItem
        label={item.label}
        href={item.href}
        active={activeId === item.id}
        onNavigate={onNavigate}
      />
    );
  }

  return null;
}

export function AppSidebar({
  userName = "사용자",
  activeId = "dashboard",
  showAdminMenu = true,
  onLogout,
  mobileOpen = false,
  onMobileClose,
}: AppSidebarProps) {
  const sidebarGroups = useMemo(
    () =>
      showAdminMenu ? SIDEBAR_GROUPS : SIDEBAR_GROUPS.filter((group) => group.id !== "admin"),
    [showAdminMenu],
  );

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const activeGroup = sidebarGroups.find((g) =>
      g.items.some((item) => itemHasActiveChild(item, activeId)),
    );
    if (activeGroup) return { [activeGroup.id]: true };
    return {};
  });

  const [openSubGroups, setOpenSubGroups] = useState<Record<string, boolean>>(() => {
    for (const group of sidebarGroups) {
      for (const item of group.items) {
        if ("children" in item && item.children?.some((child) => child.id === activeId)) {
          return { [item.id]: true };
        }
      }
    }
    return {};
  });

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      if (prev[id]) return { ...prev, [id]: false };
      const next: Record<string, boolean> = {};
      for (const g of sidebarGroups) {
        next[g.id] = g.id === id;
      }
      return next;
    });
    setOpenSubGroups({});
  }

  function toggleSubGroup(id: string) {
    setOpenSubGroups((prev) => {
      if (prev[id]) return { ...prev, [id]: false };
      return { [id]: true };
    });
  }

  useEffect(() => {
    const activeGroup = sidebarGroups.find((g) =>
      g.items.some((item) => itemHasActiveChild(item, activeId)),
    );
    if (activeGroup) {
      setOpenGroups({ [activeGroup.id]: true });
    } else {
      setOpenGroups({});
    }

    let activeSubId: string | undefined;
    for (const group of sidebarGroups) {
      for (const item of group.items) {
        if ("children" in item && item.children?.some((child) => child.id === activeId)) {
          activeSubId = item.id;
          break;
        }
      }
      if (activeSubId) break;
    }
    if (activeSubId) {
      setOpenSubGroups({ [activeSubId]: true });
    } else {
      setOpenSubGroups({});
    }
  }, [activeId, sidebarGroups]);

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
          <PrimaryNavItem
            key={item.id}
            label={item.label}
            href={item.href}
            active={activeId === item.id}
            onNavigate={onMobileClose}
          />
        ))}

        {SIDEBAR_LINKS.map((item) => (
          <PrimaryNavItem
            key={item.id}
            label={item.label}
            href={item.href}
            active={activeId === item.id}
            onNavigate={onMobileClose}
          />
        ))}

        {sidebarGroups.map((group) => {
          const open = openGroups[group.id] ?? false;
          const hasActiveChild = group.items.some((item) => itemHasActiveChild(item, activeId));
          const isCurrentGroup = open || hasActiveChild;

          return (
            <div key={group.id} className="tl-sidebar-group">
              <button
                type="button"
                className={`tl-sidebar-group-header ${isCurrentGroup ? "tl-sidebar-group-header-open" : ""}`}
                onClick={() => toggleGroup(group.id)}
              >
                <span>{group.label}</span>
                <MenuTriangle open={open} />
              </button>
              {open && (
                <div className="tl-sidebar-sub">
                  {group.items.map((item) => (
                    <GroupSubItem
                      key={item.id}
                      item={item}
                      activeId={activeId}
                      openSubGroups={openSubGroups}
                      toggleSubGroup={toggleSubGroup}
                      onNavigate={onMobileClose}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {SIDEBAR_SECONDARY.length > 0 && <div className="tl-sidebar-divider" />}

        {SIDEBAR_SECONDARY.map((item) => (
          <NavItem
            key={item.id}
            label={item.label}
            href={item.href}
            active={activeId === item.id}
            arrow="right"
            onNavigate={onMobileClose}
          />
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

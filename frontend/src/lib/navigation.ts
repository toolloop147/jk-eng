import { SIDEBAR_GROUPS, SIDEBAR_LINKS, SIDEBAR_PRIMARY, SIDEBAR_SECONDARY, SidebarGroupItem } from "./config";

export type PageDef = {
  id: string;
  label: string;
  href: string;
  groupId?: string;
  groupLabel?: string;
  parentLabel?: string;
};

function hasChildren(
  item: SidebarGroupItem,
): item is { id: string; label: string; children: { id: string; label: string; href: string }[] } {
  return "children" in item && Array.isArray(item.children);
}

function hasHref(item: SidebarGroupItem): item is { id: string; label: string; href: string } {
  return "href" in item && typeof item.href === "string";
}

function itemIsActive(item: SidebarGroupItem, activeId: string): boolean {
  if (hasHref(item) && item.id === activeId) return true;
  if (hasChildren(item)) {
    return item.children.some((child) => child.id === activeId);
  }
  return false;
}

export function getAllPages(): PageDef[] {
  const fromPrimary = SIDEBAR_PRIMARY.map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
  }));

  const fromLinks = SIDEBAR_LINKS.map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
  }));

  const fromSecondary = SIDEBAR_SECONDARY.map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
  }));

  const fromGroups = SIDEBAR_GROUPS.flatMap((group) =>
    group.items.flatMap((item) => {
      if (hasChildren(item)) {
        return item.children.map((child) => ({
          id: child.id,
          label: child.label,
          href: child.href,
          groupId: group.id,
          groupLabel: group.label,
          parentLabel: item.label,
        }));
      }
      if (hasHref(item)) {
        return [
          {
            id: item.id,
            label: item.label,
            href: item.href,
            groupId: group.id,
            groupLabel: group.label,
          },
        ];
      }
      return [];
    }),
  );

  return [...fromPrimary, ...fromLinks, ...fromSecondary, ...fromGroups];
}

export function getPageById(id: string): PageDef | undefined {
  return getAllPages().find((page) => page.id === id);
}

export function isValidPageId(id: string): boolean {
  return getAllPages().some((page) => page.id === id);
}

export function itemHasActiveChild(item: SidebarGroupItem, activeId: string): boolean {
  return itemIsActive(item, activeId);
}

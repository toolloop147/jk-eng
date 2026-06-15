export type SidebarLeaf = {
  id: string;
  label: string;
  href: string;
};

export type SidebarGroupItem =
  | ({ id: string; label: string; href: string; children?: undefined })
  | ({ id: string; label: string; href?: undefined; children: SidebarLeaf[] });

export const APP_SLUG = "jk-eng";
export const APP_TITLE = "Engineering";
export const APP_DESCRIPTION = "엔지니어링 관리 시스템";
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4002";
export const INS_API_URL =
  process.env.NEXT_PUBLIC_INS_API_URL ?? "http://localhost:4000";

export type ProjectCode = "op" | "ins" | "eng";

export const PROJECT_APPS: {
  code: ProjectCode;
  label: string;
  url: string;
}[] = [
  {
    code: "op",
    label: "JK-OP",
    url: process.env.NEXT_PUBLIC_JK_OP_URL ?? "http://localhost:3001",
  },
  {
    code: "ins",
    label: "JK-INS",
    url: process.env.NEXT_PUBLIC_JK_INS_URL ?? "http://localhost:3000",
  },
  {
    code: "eng",
    label: "JK-ENG",
    url: process.env.NEXT_PUBLIC_JK_ENG_URL ?? "http://localhost:3002",
  },
];

export const DASHBOARD_ITEMS: { title: string; desc: string }[] = [];

export const SIDEBAR_PRIMARY = [
  { id: "construction-manage", label: "시공관리", href: "/construction-manage" },
];

export const SIDEBAR_LINKS: { id: string; label: string; href: string }[] = [];

export const SIDEBAR_GROUPS: {
  id: string;
  label: string;
  defaultOpen?: boolean;
  items: SidebarGroupItem[];
}[] = [];

export const SIDEBAR_SECONDARY: { id: string; label: string; href: string }[] = [];

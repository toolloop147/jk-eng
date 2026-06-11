export const APP_SLUG = "jk-eng";
export const APP_TITLE = "엔지니어링";
export const APP_DESCRIPTION = "엔지니어링 관리 시스템";
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const DASHBOARD_ITEMS = [
  { title: "프로젝트", desc: "프로젝트 모듈입니다." },
  { title: "기술 문서", desc: "기술 문서 모듈입니다." },
  { title: "이슈 트래킹", desc: "이슈 트래킹 모듈입니다." },
];

export const SIDEBAR_PRIMARY = [{ id: "dashboard", label: "대시보드", href: "/" }];

export const SIDEBAR_LINKS = [
  { id: "projects", label: "프로젝트", href: "#" },
  { id: "issues", label: "이슈 트래킹", href: "#" },
  { id: "docs", label: "기술 문서", href: "#" },
];

export const SIDEBAR_GROUPS: {
  id: string;
  label: string;
  defaultOpen?: boolean;
  items: { id: string; label: string; href: string }[];
}[] = [];

export const SIDEBAR_SECONDARY = [
  { id: "reports", label: "리포트", href: "#" },
  { id: "settings", label: "설정", href: "#" },
];

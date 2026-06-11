import { API_URL } from "./config";
import { getToken } from "./auth";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  app: string;
}

export async function login(loginId: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: loginId, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "로그인에 실패했습니다.");
  return data as { token: string; user: AuthUser };
}

export async function getMe(): Promise<AuthUser> {
  const token = getToken();
  if (!token) throw new Error("인증이 필요합니다.");

  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "사용자 정보를 불러올 수 없습니다.");
  return data.user as AuthUser;
}

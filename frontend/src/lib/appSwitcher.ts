import { API_URL } from "./config";
import { getToken } from "./auth";

export type SwitchTargetApp = "ins" | "eng";

export interface SwitchAppResponse {
  token: string;
  targetApp: SwitchTargetApp;
  redirectUrl: string;
  expiresIn: number;
}

export async function switchToApp(targetApp: SwitchTargetApp): Promise<void> {
  const token = getToken();
  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }

  const res = await fetch(`${API_URL}/api/auth/switch-app`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ targetApp }),
  });

  const data = (await res.json()) as SwitchAppResponse & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "앱 전환에 실패했습니다.");
  }

  // Hash fragment는 서버 로그·Referer에 남지 않아 query string보다 안전합니다.
  const callbackUrl = `${data.redirectUrl}#token=${encodeURIComponent(data.token)}`;
  window.location.assign(callbackUrl);
}

import { API_URL } from "./config";

export async function completeEngSwitch(switchToken: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/complete-switch`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${switchToken}`,
    },
  });

  const data = (await res.json()) as { token?: string; error?: string };
  if (!res.ok || !data.token) {
    throw new Error(data.error ?? "앱 전환을 완료할 수 없습니다.");
  }

  return data.token;
}

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { formatPhoneInput } from "@/lib/formatPhone";
import { ToolloopLogo } from "./ToolloopLogo";

function handleLoginIdChange(value: string) {
  if (!value || /^[a-zA-Z]/.test(value)) {
    return value;
  }
  return formatPhoneInput(value);
}

export function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await login(loginId, password);
      setToken(token);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tl-login-bg flex min-h-full flex-1 items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <ToolloopLogo size="lg" align="center" />
        </div>

        <div className="tl-card rounded-2xl p-6 shadow-xl sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">로그인</h1>
            <p className="mt-2 text-sm text-slate-500">
              기사는 발급 시 등록한 연락처와 비밀번호로 로그인합니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label htmlFor="eng-login-id" className="tl-label">
                연락처
              </label>
              <input
                id="eng-login-id"
                name="jk-eng-login-id"
                type="text"
                inputMode="tel"
                autoComplete="off"
                value={loginId}
                onChange={(e) => setLoginId(handleLoginIdChange(e.target.value))}
                className="tl-input"
                placeholder="010-1234-5678"
                required
              />
              <p className="mt-1.5 text-xs text-slate-400">관리자 계정은 admin을 입력하세요.</p>
            </div>
            <div>
              <label htmlFor="eng-login-password" className="tl-label">
                비밀번호
              </label>
              <input
                id="eng-login-password"
                name="jk-eng-login-password"
                type="password"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="tl-input"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="tl-button-primary w-full">
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © Toolloop · 모바일·태블릿·데스크톱 지원
        </p>
      </div>
    </div>
  );
}

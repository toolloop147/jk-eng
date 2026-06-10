"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { APP_TITLE } from "@/lib/config";
import { ToolloopLogo } from "./ToolloopLogo";

export function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("admin");
  const [password, setPassword] = useState("admin123");
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
          <ToolloopLogo size="lg" />
        </div>

        <div className="tl-card rounded-2xl p-6 shadow-xl sm:p-8">
          <div className="mb-6 text-center">
            <span className="tl-badge mb-3 inline-block">{APP_TITLE}</span>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">로그인</h1>
            <p className="mt-2 text-sm text-slate-500">
              Toolloop 계정으로 서비스에 접속하세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="loginId" className="tl-label">
                아이디
              </label>
              <input
                id="loginId"
                type="text"
                autoComplete="username"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="tl-input"
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="tl-label">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
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

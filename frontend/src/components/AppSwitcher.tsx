"use client";

import { useState } from "react";
import { switchToApp } from "@/lib/appSwitcher";

export function AppSwitcher() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSwitchToIns() {
    setLoading(true);
    setError("");

    try {
      await switchToApp("ins");
    } catch (err) {
      setError(err instanceof Error ? err.message : "앱 전환에 실패했습니다.");
      setLoading(false);
    }
  }

  return (
    <div className="tl-sidebar-app-switch">
      <button
        type="button"
        className="tl-sidebar-app-switch-btn"
        onClick={handleSwitchToIns}
        disabled={loading}
      >
        {loading ? "전환 중..." : "Installation (Sales)"}
      </button>
      {error && (
        <p className="tl-sidebar-app-switch-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

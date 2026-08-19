"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

export default function ServiceStatus() {
  const [state, setState] = useState<"checking" | "ready" | "offline">(
    "checking",
  );
  useEffect(() => {
    Promise.all([
      apiRequest<{ status: string }>("/health"),
      apiRequest<{ status: string }>("/ready"),
    ])
      .then(([health, readiness]) =>
        setState(
          health.status === "ok" && readiness.status === "ready"
            ? "ready"
            : "offline",
        ),
      )
      .catch(() => setState("offline"));
  }, []);
  return (
    <span className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
      <span
        className={`h-2 w-2 rounded-full ${state === "ready" ? "bg-[var(--success)]" : state === "offline" ? "bg-[var(--danger)]" : "bg-[var(--warning)] aqua-pulse"}`}
      />
      {state === "ready"
        ? "API and persistence ready"
        : state === "offline"
          ? "Service unavailable"
          : "Checking service"}
    </span>
  );
}

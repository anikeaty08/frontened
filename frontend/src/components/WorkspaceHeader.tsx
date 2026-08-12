"use client";

import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { clearSession } from "@/lib/api";

export default function WorkspaceHeader({
  role,
  description,
}: {
  role: string;
  description: string;
}) {
  const router = useRouter();
  const signOut = async () => {
    await clearSession();
    router.push("/app");
    router.refresh();
  };
  return (
    <div className="flex flex-col gap-5 border-b aqua-divider bg-[var(--surface)] px-5 py-8 sm:flex-row sm:items-end sm:justify-between lg:px-8">
      <div>
        <p className="aqua-kicker">Secure operator workspace</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-.04em]">{role}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
      </div>
      <button onClick={signOut} className="aqua-button aqua-button-secondary">
        <Icon icon="solar:logout-2-linear" />
        End session
      </button>
    </div>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import { createSession } from "@/lib/api";
import type { Role } from "@/lib/types";

const roles: Array<{
  role: Role;
  label: string;
  description: string;
  icon: string;
  path: string;
}> = [
  {
    role: "ISSUER",
    label: "Issuer",
    description:
      "Publish snapshots, recover submissions, revoke and reconcile.",
    icon: "solar:buildings-2-linear",
    path: "/app/issuer",
  },
  {
    role: "ATTESTER",
    label: "Attester",
    description:
      "Review assigned snapshots and submit independent attestations.",
    icon: "solar:verified-check-linear",
    path: "/app/attester",
  },
  {
    role: "CUSTOMER",
    label: "Customer",
    description: "Verify your private inclusion receipt for a public snapshot.",
    icon: "solar:user-check-linear",
    path: "/verify",
  },
];

export default function AppPage() {
  const [role, setRole] = useState<Role>("ISSUER");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await createSession(token, role);
      router.push(roles.find((item) => item.role === role)?.path ?? "/");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Access could not be established.",
      );
    }
  };
  return (
    <AppShell>
      <PageHeader
        eyebrow="Secure workspace"
        title="Launch AquaReserve"
        description="Choose your assigned role and establish a secure session. Your credential remains in an HttpOnly cookie and is forwarded only to the AquaReserve API."
      />
      <section className="mx-auto grid max-w-[92rem] gap-8 px-5 py-12 lg:grid-cols-12 lg:px-8">
        <div className="grid gap-3 lg:col-span-7">
          {roles.map((item) => (
            <button
              type="button"
              key={item.role}
              onClick={() => setRole(item.role)}
              className={`flex items-start gap-4 rounded-xl border p-5 text-left transition-colors ${role === item.role ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "aqua-divider bg-[var(--surface)] hover:border-[var(--border-strong)]"}`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-soft)] text-xl text-[var(--accent)]">
                <Icon icon={item.icon} />
              </span>
              <span>
                <strong className="block">{item.label}</strong>
                <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
                  {item.description}
                </span>
              </span>
            </button>
          ))}
        </div>
        <form
          onSubmit={submit}
          className="aqua-panel h-fit rounded-2xl p-6 lg:col-span-5"
        >
          <p className="aqua-kicker">{role.toLowerCase()} access</p>
          <label
            htmlFor="access-token"
            className="mt-6 block text-sm font-semibold"
          >
            Access credential
          </label>
          <input
            id="access-token"
            type="password"
            autoComplete="current-password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            className="aqua-input mt-3"
            required
          />
          <p className="mt-3 text-xs leading-5 text-[var(--faint)]">
            AquaReserve does not place bearer credentials in local storage or
            client-readable cookies.
          </p>
          {error && (
            <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>
          )}
          <button className="aqua-button aqua-button-primary mt-6 w-full">
            Continue as {role.toLowerCase()}{" "}
            <Icon icon="solar:arrow-right-linear" />
          </button>
        </form>
      </section>
    </AppShell>
  );
}

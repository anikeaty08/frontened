"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";

export default function VerifyPage() {
  const [snapshotId, setSnapshotId] = useState("");
  const router = useRouter();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (/^[0-9a-f-]{36}$/i.test(snapshotId.trim()))
      router.push(`/verify/${snapshotId.trim()}`);
  };
  return (
    <AppShell>
      <PageHeader
        eyebrow="Private customer verification"
        title="Verify your inclusion"
        description="Enter the public snapshot ID first. Your access credential is requested only on the next secure step and is stored in an HttpOnly session cookie."
      />
      <section className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
        <form onSubmit={submit} className="aqua-panel rounded-2xl p-6 sm:p-8">
          <label htmlFor="snapshot-id" className="text-sm font-semibold">
            Snapshot ID
          </label>
          <p className="mt-2 text-sm text-[var(--muted)]">
            You can copy this identifier from the custodian or public reserve
            registry.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              id="snapshot-id"
              value={snapshotId}
              onChange={(event) => setSnapshotId(event.target.value)}
              className="aqua-input aqua-mono"
              placeholder="00000000-0000-0000-0000-000000000000"
              required
              pattern="[0-9a-fA-F-]{36}"
            />
            <button
              className="aqua-button aqua-button-primary shrink-0"
              type="submit"
            >
              Continue <Icon icon="solar:arrow-right-linear" />
            </button>
          </div>
        </form>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border aqua-divider bg-[var(--surface)] p-5">
            <Icon
              icon="solar:lock-keyhole-linear"
              className="text-2xl text-[var(--accent)]"
            />
            <h2 className="mt-5 font-semibold">Private by default</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Public users cannot access your receipt or balance.
            </p>
          </div>
          <div className="rounded-xl border aqua-divider bg-[var(--surface)] p-5">
            <Icon
              icon="solar:check-circle-linear"
              className="text-2xl text-[var(--success)]"
            />
            <h2 className="mt-5 font-semibold">Verified locally</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              The returned Merkle path is checked against the snapshot root.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { ApiError, apiRequest, compactHash, formatDate } from "@/lib/api";
import type { PublicSnapshot, SnapshotListResponse } from "@/lib/types";

const steps = [
  ["01", "Choose snapshot", "Select the custodian and cutoff you want to verify."],
  ["02", "Authenticate privately", "Enter the access credential issued to you by the custodian."],
  ["03", "Check your receipt", "AquaReserve validates your private Merkle proof against the public root."],
];

export default function VerifyPage() {
  const [snapshotId, setSnapshotId] = useState("");
  const [snapshots, setSnapshots] = useState<PublicSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    void apiRequest<SnapshotListResponse>("/v1/public/snapshots?limit=20")
      .then((result) => {
        if (active) setSnapshots(result.snapshots);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof ApiError
              ? cause.message
              : "Public snapshots could not be loaded.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

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
        description="Choose a public reserve snapshot, then use the private access credential issued by your custodian. A Midnight wallet is not required."
      />
      <section className="mx-auto max-w-5xl px-5 py-12 lg:px-8">
        <ol className="grid gap-px overflow-hidden rounded-xl border aqua-divider bg-[var(--border)] sm:grid-cols-3">
          {steps.map(([number, title, copy]) => (
            <li key={number} className="bg-[var(--surface)] p-5">
              <span className="aqua-mono text-xs text-[var(--accent)]">{number}</span>
              <p className="mt-3 font-semibold">{title}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex items-end justify-between gap-5 border-b aqua-divider pb-4">
          <div>
            <p className="aqua-kicker">Public registry</p>
            <h2 className="mt-3 text-2xl font-semibold">Choose a snapshot</h2>
          </div>
          <Link href="/reserves" className="text-sm font-semibold text-[var(--accent)]">
            Inspect full registry
          </Link>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-[var(--danger)] p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex items-center gap-3 py-12 text-sm text-[var(--muted)]">
            <Icon icon="solar:refresh-circle-linear" className="animate-spin text-xl" />
            Loading public snapshots
          </div>
        ) : snapshots.length ? (
          <div className="divide-y aqua-divider">
            {snapshots.map((snapshot) => (
              <Link
                href={`/verify/${snapshot.id}`}
                key={snapshot.id}
                className="grid gap-4 py-5 transition-colors hover:text-[var(--accent)] sm:grid-cols-[1fr_auto_auto] sm:items-center"
              >
                <div>
                  <p className="font-semibold">{snapshot.issuerId}</p>
                  <p className="aqua-mono mt-1 text-xs text-[var(--faint)]">
                    {snapshot.asset.code} · {compactHash(snapshot.id)}
                  </p>
                </div>
                <div className="text-sm text-[var(--muted)]">
                  Cutoff {formatDate(snapshot.cutoffAt)}
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <StatusBadge status={snapshot.status} />
                  <Icon icon="solar:arrow-right-linear" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-12 text-sm text-[var(--muted)]">
            No public snapshots are available yet.
          </p>
        )}

        <details className="mt-10 border-t aqua-divider pt-6">
          <summary className="cursor-pointer text-sm font-semibold">
            Use a snapshot ID manually
          </summary>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            This UUID identifies a public reserve snapshot. It is not a wallet or contract address.
          </p>
          <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              id="snapshot-id"
              aria-label="Public snapshot ID"
              value={snapshotId}
              onChange={(event) => setSnapshotId(event.target.value)}
              className="aqua-input aqua-mono"
              placeholder="00000000-0000-0000-0000-000000000000"
              required
              pattern="[0-9a-fA-F-]{36}"
            />
            <button className="aqua-button aqua-button-secondary shrink-0" type="submit">
              Continue <Icon icon="solar:arrow-right-linear" />
            </button>
          </form>
        </details>
      </section>
    </AppShell>
  );
}

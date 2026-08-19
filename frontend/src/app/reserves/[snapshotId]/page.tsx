"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import SnapshotDetail from "@/components/SnapshotDetail";
import { ApiError, apiRequest } from "@/lib/api";
import type { PublicSnapshot } from "@/lib/types";

export default function SnapshotPage({
  params,
}: {
  params: Promise<{ snapshotId: string }>;
}) {
  const { snapshotId } = use(params);
  const [snapshot, setSnapshot] = useState<PublicSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    apiRequest<{ snapshot: PublicSnapshot }>(
      `/v1/public/snapshots/${snapshotId}`,
    )
      .then((data) => setSnapshot(data.snapshot))
      .catch((cause) =>
        setError(
          cause instanceof ApiError
            ? cause.message
            : "Snapshot could not be loaded.",
        ),
      );
  }, [snapshotId]);
  return (
    <AppShell>
      <PageHeader
        eyebrow="Public evidence"
        title="Snapshot detail"
        description="This view reads the authoritative public lifecycle and checks it against AquaReserve's stored commitments."
        action={
          <Link
            href={`/verify/${snapshotId}`}
            className="aqua-button aqua-button-primary"
          >
            Verify inclusion
          </Link>
        }
      />
      <section className="mx-auto max-w-[92rem] px-5 py-10 lg:px-8">
        {error ? (
          <div className="rounded-xl border border-[var(--danger)] p-6 text-[var(--danger)]">
            {error}
          </div>
        ) : snapshot ? (
          <SnapshotDetail snapshot={snapshot} />
        ) : (
          <div className="flex items-center gap-3 py-16 text-sm text-[var(--muted)]">
            <Icon
              icon="solar:refresh-circle-linear"
              className="animate-spin text-xl"
            />
            Reading Midnight state
          </div>
        )}
      </section>
    </AppShell>
  );
}

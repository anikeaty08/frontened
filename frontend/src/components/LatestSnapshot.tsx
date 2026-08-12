"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { apiRequest, compactHash, formatDate } from "@/lib/api";
import type { PublicSnapshot, SnapshotListResponse } from "@/lib/types";
import StatusBadge from "./StatusBadge";

export default function LatestSnapshot() {
  const [snapshot, setSnapshot] = useState<PublicSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    apiRequest<SnapshotListResponse>("/v1/public/snapshots?limit=1")
      .then((data) => {
        if (active) setSnapshot(data.snapshots[0] ?? null);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="aqua-panel rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between border-b aqua-divider pb-5">
        <div>
          <p className="aqua-kicker">Latest public snapshot</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Authoritative detail is read from Midnight.
          </p>
        </div>
        <Icon
          icon="solar:shield-check-linear"
          className="text-3xl text-[var(--accent)]"
        />
      </div>
      {loading ? (
        <div className="space-y-4 py-8">
          <div className="h-5 w-28 animate-pulse rounded bg-[var(--surface-strong)]" />
          <div className="h-12 animate-pulse rounded bg-[var(--surface-soft)]" />
        </div>
      ) : error ? (
        <div className="py-10 text-sm text-[var(--muted)]">
          Public snapshot status is temporarily unavailable.
        </div>
      ) : snapshot ? (
        <div className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge status={snapshot.status} />
            <span className="aqua-mono text-xs text-[var(--faint)]">
              {snapshot.asset.code}
            </span>
          </div>
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Snapshot</dt>
              <dd className="aqua-mono">{compactHash(snapshot.id)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Expires</dt>
              <dd>{formatDate(snapshot.expiresAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Network</dt>
              <dd>
                {snapshot.anchor.mode === "MIDNIGHT_PREPROD"
                  ? "Midnight Preprod"
                  : "Development"}
              </dd>
            </div>
          </dl>
          <Link
            href={`/reserves/${snapshot.id}`}
            className="aqua-button aqua-button-secondary mt-6 w-full"
          >
            Inspect evidence <Icon icon="solar:arrow-right-linear" />
          </Link>
        </div>
      ) : (
        <div className="py-10 text-sm text-[var(--muted)]">
          No public snapshots are available yet.
        </div>
      )}
    </div>
  );
}

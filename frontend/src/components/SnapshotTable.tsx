"use client";

import Link from "next/link";
import { Icon } from "./Icon";
import { compactHash, formatDate } from "@/lib/api";
import type { PublicSnapshot } from "@/lib/types";
import StatusBadge from "./StatusBadge";

export default function SnapshotTable({
  snapshots,
  emptyMessage = "No snapshots found.",
}: {
  snapshots: PublicSnapshot[];
  emptyMessage?: string;
}) {
  if (!snapshots.length)
    return (
      <div className="rounded-xl border border-dashed aqua-divider bg-[var(--surface)] px-6 py-16 text-center">
        <Icon
          icon="solar:document-text-linear"
          className="mx-auto text-4xl text-[var(--faint)]"
        />
        <p className="mt-4 text-sm text-[var(--muted)]">{emptyMessage}</p>
      </div>
    );
  return (
    <div className="overflow-hidden rounded-xl border aqua-divider bg-[var(--surface)]">
      <div className="hidden grid-cols-[1.2fr_.7fr_.9fr_.9fr_32px] gap-4 border-b aqua-divider px-5 py-3 text-[.68rem] font-semibold uppercase tracking-wider text-[var(--faint)] md:grid">
        <span>Snapshot</span>
        <span>Status</span>
        <span>Cutoff</span>
        <span>Network</span>
        <span />
      </div>
      {snapshots.map((snapshot) => (
        <Link
          href={`/reserves/${snapshot.id}`}
          key={snapshot.id}
          className="grid gap-4 border-b aqua-divider px-5 py-5 last:border-0 hover:bg-[var(--surface-soft)] md:grid-cols-[1.2fr_.7fr_.9fr_.9fr_32px] md:items-center"
        >
          <div>
            <p className="font-semibold">
              {snapshot.asset.code} reserve snapshot
            </p>
            <p className="aqua-mono mt-1 text-xs text-[var(--faint)]">
              {compactHash(snapshot.id)}
            </p>
          </div>
          <div>
            <StatusBadge status={snapshot.status} />
          </div>
          <div className="text-sm text-[var(--muted)]">
            <span className="mr-2 text-xs text-[var(--faint)] md:hidden">
              Cutoff
            </span>
            {formatDate(snapshot.cutoffAt)}
          </div>
          <div className="text-sm text-[var(--muted)]">
            {snapshot.anchor.mode === "MIDNIGHT_PREPROD"
              ? "Midnight Preprod"
              : "Development"}
          </div>
          <Icon
            icon="solar:alt-arrow-right-linear"
            className="hidden text-[var(--faint)] md:block"
          />
        </Link>
      ))}
    </div>
  );
}

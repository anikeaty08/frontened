"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import SnapshotTable from "@/components/SnapshotTable";
import { ApiError, apiRequest } from "@/lib/api";
import type { PublicSnapshot, SnapshotListResponse } from "@/lib/types";

export default function ReservesPage() {
  const [snapshots, setSnapshots] = useState<PublicSnapshot[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async (next?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<SnapshotListResponse>(
        `/v1/public/snapshots?limit=20${next ? `&cursor=${next}` : ""}`,
      );
      setSnapshots((current) =>
        next ? [...current, ...result.snapshots] : result.snapshots,
      );
      setCursor(result.nextCursor);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Snapshots could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    void apiRequest<SnapshotListResponse>("/v1/public/snapshots?limit=20")
      .then((result) => {
        if (active) {
          setSnapshots(result.snapshots);
          setCursor(result.nextCursor);
        }
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof ApiError
              ? cause.message
              : "Snapshots could not be loaded.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <AppShell>
      <PageHeader
        eyebrow="Public reserve registry"
        title="Reserve snapshots"
        description="Inspect current status, declared scope, freshness and Midnight evidence. Public views never contain customer balances or identities."
      />
      <section className="mx-auto max-w-[92rem] px-5 py-10 lg:px-8">
        {error && (
          <div className="mb-6 rounded-xl border border-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}
        {loading && !snapshots.length ? (
          <div className="flex items-center gap-3 py-16 text-sm text-[var(--muted)]">
            <Icon
              icon="solar:refresh-circle-linear"
              className="animate-spin text-xl"
            />
            Loading reserve registry
          </div>
        ) : (
          <SnapshotTable snapshots={snapshots} />
        )}{" "}
        {cursor && (
          <button
            className="aqua-button aqua-button-secondary mt-6"
            disabled={loading}
            onClick={() => void load(cursor)}
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        )}
      </section>
    </AppShell>
  );
}

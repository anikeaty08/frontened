"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import AppShell from "@/components/AppShell";
import LifecycleTimeline from "@/components/LifecycleTimeline";
import SnapshotTable from "@/components/SnapshotTable";
import SnapshotDetail from "@/components/SnapshotDetail";
import WorkspaceHeader from "@/components/WorkspaceHeader";
import { ApiError, apiRequest } from "@/lib/api";
import type {
  PublicSnapshot,
  SnapshotEvent,
  SnapshotListResponse,
} from "@/lib/types";

export default function AttesterWorkspace() {
  const [snapshots, setSnapshots] = useState<PublicSnapshot[]>([]);
  const [selected, setSelected] = useState<PublicSnapshot | null>(null);
  const [events, setEvents] = useState<SnapshotEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const data = await apiRequest<SnapshotListResponse>(
        "/v1/attester/snapshots?limit=50",
      );
      setSnapshots(data.snapshots);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Assigned snapshots could not be loaded.",
      );
    }
  }, []);
  useEffect(() => {
    let active = true;
    void apiRequest<SnapshotListResponse>("/v1/attester/snapshots?limit=50")
      .then((data) => {
        if (active) setSnapshots(data.snapshots);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof ApiError
              ? cause.message
              : "Assigned snapshots could not be loaded.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  const select = async (snapshot: PublicSnapshot) => {
    setSelected(snapshot);
    try {
      const data = await apiRequest<{ events: SnapshotEvent[] }>(
        `/v1/snapshots/${snapshot.id}/events`,
      );
      setEvents(data.events);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Lifecycle events could not be loaded.",
      );
    }
  };
  const attest = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const data = await apiRequest<{ snapshot: PublicSnapshot }>(
        `/v1/snapshots/${selected.id}/attest`,
        { method: "POST" },
      );
      setSelected(data.snapshot);
      setNotice(
        `Attestation completed: ${data.snapshot.status.replaceAll("_", " ")}.`,
      );
      await load();
      await select(data.snapshot);
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Attestation failed.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <AppShell>
      <WorkspaceHeader
        role="Attester"
        description="Review declared scope and submit an independent Midnight coverage attestation."
      />
      <div className="mx-auto max-w-[92rem] px-5 py-10 lg:px-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold">Assigned snapshots</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Only snapshots assigned to this attester identity appear here.
          </p>
        </div>
        {error && (
          <div className="mb-6 rounded-xl border border-[var(--danger)] p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}
        <div
          onClick={(event) => {
            const link = (event.target as HTMLElement).closest("a");
            if (link) {
              event.preventDefault();
              const id = link.getAttribute("href")?.split("/").pop();
              const snapshot = snapshots.find((item) => item.id === id);
              if (snapshot) void select(snapshot);
            }
          }}
        >
          <SnapshotTable
            snapshots={snapshots}
            emptyMessage="No snapshots are currently assigned to this attester."
          />
        </div>
        {selected && (
          <div className="mt-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="aqua-kicker">Review selected snapshot</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Confirm the declared scope and evidence boundary before
                  attesting.
                </p>
              </div>
              <button
                disabled={
                  busy ||
                  selected.status !== "PENDING_ATTESTATION" ||
                  selected.anchor.status !== "CONFIRMED"
                }
                onClick={() => void attest()}
                className="aqua-button aqua-button-primary"
              >
                <Icon icon="solar:verified-check-linear" />
                {busy ? "Generating proof…" : "Attest coverage"}
              </button>
            </div>
            {notice && (
              <div className="mb-6 rounded-xl border border-[var(--success)] p-4 text-sm text-[var(--success)]">
                {notice}
              </div>
            )}
            <SnapshotDetail snapshot={selected} />
            <section className="mt-8 rounded-xl border aqua-divider bg-[var(--surface)] p-6">
              <h3 className="mb-7 font-semibold">Lifecycle events</h3>
              <LifecycleTimeline events={events} />
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}

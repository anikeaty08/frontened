import { formatDate } from "@/lib/api";
import type { SnapshotEvent } from "@/lib/types";

export default function LifecycleTimeline({
  events,
}: {
  events: SnapshotEvent[];
}) {
  if (!events.length)
    return (
      <p className="py-6 text-sm text-[var(--muted)]">
        No lifecycle events returned.
      </p>
    );
  return (
    <ol className="relative ml-2 border-l aqua-divider">
      {events.map((event) => (
        <li key={event.id} className="relative ml-6 pb-7 last:pb-0">
          <span className="absolute -left-[1.72rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)] bg-[var(--accent)]" />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold">
              {event.type.replaceAll("_", " ")}
            </p>
            <time className="text-xs text-[var(--faint)]">
              {formatDate(event.occurredAt)}
            </time>
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Actor: {event.actorId}
          </p>
          {Object.keys(event.metadata).length > 0 && (
            <p className="aqua-mono mt-2 break-all text-[.68rem] text-[var(--faint)]">
              {JSON.stringify(event.metadata)}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

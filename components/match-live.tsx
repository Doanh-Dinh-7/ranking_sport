"use client";

import { useEffect, useState } from "react";
import { isMatchInProgress } from "@/lib/match-time";
import { cn } from "@/lib/utils";

/** Re-render định kỳ để so sánh với thời gian thực. */
export function useIsMatchLive(
  scheduledAt: string | undefined,
  status: string | undefined,
): boolean {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [scheduledAt, status]);

  if (!scheduledAt || !status) return false;
  return isMatchInProgress(scheduledAt, status, now);
}

export function LiveStatusLabel({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-blue-600 dark:text-blue-400",
        className,
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
      </span>
      Đang diễn ra
    </span>
  );
}

export function MatchLiveBadge({
  scheduledAt,
  status,
  className,
}: {
  scheduledAt: string;
  status: string;
  className?: string;
}) {
  const live = useIsMatchLive(scheduledAt, status);
  if (!live) return null;
  return <LiveStatusLabel className={className} />;
}

/** Trạng thái góc thẻ trận: Kết thúc (xanh lá) / Đang diễn ra (xanh dương) / Chờ */
export function MatchCardStatus({
  scheduledAt,
  status,
}: {
  scheduledAt: string;
  status: string;
}) {
  const live = useIsMatchLive(scheduledAt, status);

  if (status === "finished") {
    return (
      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
        Kết thúc
      </span>
    );
  }

  if (live) {
    return <LiveStatusLabel />;
  }

  if (status === "scheduled") {
    return (
      <span className="text-xs font-semibold text-primary uppercase">Chờ</span>
    );
  }

  return null;
}

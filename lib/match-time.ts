/**
 * Cửa sổ "đang diễn ra" sau giờ bóng lăn (scheduled_at).
 * Trận vẫn `scheduled` trong DB nhưng đã quá lâu → không coi là live (chờ cập nhật kết quả).
 */
const MATCH_LIVE_WINDOW_MS = 1 * 60 * 60 * 1000; // 1 giờ

export function isMatchInProgress(
  scheduledAt: string | Date,
  status: string,
  at: Date = new Date(),
): boolean {
  if (status === "live") return true;
  if (status !== "scheduled") return false;
  const start = new Date(scheduledAt).getTime();
  if (Number.isNaN(start)) return false;
  const t = at.getTime();
  if (t < start) return false;
  return t < start + MATCH_LIVE_WINDOW_MS;
}

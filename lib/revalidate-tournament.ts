import { revalidatePath } from "next/cache";

/** Làm mới cache trang công khai sau khi admin đổi dữ liệu giải. */
export function revalidateTournamentData(matchId?: string) {
  revalidatePath("/");
  revalidatePath("/fixtures");
  revalidatePath("/standings");
  revalidatePath("/knockout");
  if (matchId) {
    revalidatePath(`/matches/${matchId}`);
  }
}

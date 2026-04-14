/** Thương hiệu giải — dùng chung cho metadata, navbar, trang chủ */
export const TOURNAMENT_NAME = "HUGO CHAMPIONS CUP X";

/** Mặc định khi biến môi trường tương ứng chưa gán (xem .env.example). */
const DEFAULT_URLS = {
  logo: "/placeholder.svg",
  banner: "/placeholder.svg",
} as const;

function pickPublicUrl(value: string | undefined, fallback: string): string {
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : fallback;
}

/** Logo giải — `NEXT_PUBLIC_TOURNAMENT_LOGO_URL` */
export const TOURNAMENT_LOGO_URL = pickPublicUrl(
  process.env.NEXT_PUBLIC_TOURNAMENT_LOGO_URL,
  DEFAULT_URLS.logo,
);

/** Banner trang chủ — `NEXT_PUBLIC_TOURNAMENT_BANNER_URL` */
export const TOURNAMENT_BANNER_URL = pickPublicUrl(
  process.env.NEXT_PUBLIC_TOURNAMENT_BANNER_URL,
  DEFAULT_URLS.banner,
);

/** Ảnh nhà vô địch (spotlight) — `NEXT_PUBLIC_HOME_CHAMPION_IMAGE_URL` */
export const HOME_CHAMPION_IMAGE_URL = pickPublicUrl(
  process.env.NEXT_PUBLIC_HOME_CHAMPION_IMAGE_URL,
  DEFAULT_URLS.banner,
);

/** Thủ môn xuất sắc — `NEXT_PUBLIC_HOME_AWARD_BEST_GOALKEEPER_IMAGE_URL` */
export const HOME_AWARD_BEST_GOALKEEPER_IMAGE_URL = pickPublicUrl(
  process.env.NEXT_PUBLIC_HOME_AWARD_BEST_GOALKEEPER_IMAGE_URL,
  DEFAULT_URLS.logo,
);

/** Cầu thủ xuất sắc — `NEXT_PUBLIC_HOME_AWARD_BEST_PLAYER_IMAGE_URL` */
export const HOME_AWARD_BEST_PLAYER_IMAGE_URL = pickPublicUrl(
  process.env.NEXT_PUBLIC_HOME_AWARD_BEST_PLAYER_IMAGE_URL,
  DEFAULT_URLS.logo,
);

/** Vua phá lưới — `NEXT_PUBLIC_HOME_AWARD_TOP_SCORER_IMAGE_URL` */
export const HOME_AWARD_TOP_SCORER_IMAGE_URL = pickPublicUrl(
  process.env.NEXT_PUBLIC_HOME_AWARD_TOP_SCORER_IMAGE_URL,
  DEFAULT_URLS.logo,
);

/** Hiển thị ảnh giải — `NEXT_PUBLIC_IS_SHOW_AWARD` */
export const IS_SHOW_AWARD =
  process.env.NEXT_PUBLIC_IS_SHOW_AWARD?.toLowerCase() === "true";

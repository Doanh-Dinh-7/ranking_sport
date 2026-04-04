import Image from "next/image";
import { Team } from "@/lib/supabase";

/** Chỉ logo (hoặc chữ cái), dùng xếp chồng logo — tên ở dưới. */
export function TeamLogo({
  team,
  size = "md",
  className = "",
}: {
  team: Team;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-16 h-16 sm:w-20 sm:h-20",
    xl: "w-24 h-24 sm:w-28 sm:h-28",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 shadow-sm ring-2 ring-border/60 ${className}`}
    >
      {team.logo_url ? (
        <Image
          src={team.logo_url}
          alt=""
          width={112}
          height={112}
          loading="eager"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary to-chart-4 flex items-center justify-center text-primary-foreground font-bold text-lg sm:text-2xl">
          {team.short_name.charAt(0)}
        </div>
      )}
    </div>
  );
}

interface TeamBadgeProps {
  team: Team;
  size?: "sm" | "md" | "lg";
}

export function TeamBadge({ team, size = "md" }: TeamBadgeProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-12 h-12 text-base",
  };

  return (
    <div className="flex items-center gap-2">
      {team.logo_url ? (
        <div
          className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0`}
        >
          <Image
            src={team.logo_url}
            alt={team.name}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary to-chart-4 flex items-center justify-center flex-shrink-0 text-primary-foreground font-bold shadow-sm`}
        >
          {team.short_name.charAt(0)}
        </div>
      )}
      <div className="flex-1">
        <p className="font-semibold text-foreground">{team.short_name}</p>
        <p className="text-xs text-muted-foreground">{team.name}</p>
      </div>
    </div>
  );
}

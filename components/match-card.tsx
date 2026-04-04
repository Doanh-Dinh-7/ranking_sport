import Link from "next/link";
import { Match, Team } from "@/lib/supabase";
import { formatStageLabel } from "@/lib/bracket-utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { MatchCardStatus } from "@/components/match-live";
import { TeamBadge, TeamLogo } from "./team-badge";

interface MatchCardProps {
  match: any; // Match with related team and venue data
  homeTeam: Team;
  awayTeam: Team;
  variant?: "compact" | "full";
}

export function MatchCard({
  match,
  homeTeam,
  awayTeam,
  variant = "compact",
}: MatchCardProps) {
  const isFinished = match.status === "finished";
  const scheduledDate = new Date(match.scheduled_at);

  return (
    <Link href={`/matches/${match.id}`}>
      <div className="bg-card rounded-lg p-4 hover:bg-accent/80 transition-colors cursor-pointer border border-border">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            {formatStageLabel(match.stage, match.home_team?.group_name)}
          </span>
          <MatchCardStatus
            scheduledAt={match.scheduled_at}
            status={match.status}
          />
        </div>

        {/* Match info */}
        {variant === "compact" ? (
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <TeamLogo team={homeTeam} size="md" />
              <p className="line-clamp-2 text-center text-xs font-semibold leading-tight text-foreground">
                {homeTeam.short_name}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-center justify-center gap-1 px-1 text-center">
              <p className="text-[11px] text-muted-foreground">
                {format(scheduledDate, "dd/MM/yyyy", { locale: vi })}
              </p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {format(scheduledDate, "HH:mm", { locale: vi })}
              </p>
              {isFinished ? (
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-foreground">
                    {match.home_score}
                  </span>
                  <span className="text-xs text-muted-foreground">-</span>
                  <span className="text-lg font-bold text-foreground">
                    {match.away_score}
                  </span>
                </div>
              ) : (
                <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  vs
                </span>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <TeamLogo team={awayTeam} size="md" />
              <p className="line-clamp-2 text-center text-xs font-semibold leading-tight text-foreground">
                {awayTeam.short_name}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-3">
              {format(scheduledDate, "EEEE, dd MMMM yyyy · HH:mm", {
                locale: vi,
              })}
            </p>

            {/* Teams */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <TeamBadge team={homeTeam} size="sm" />
                {isFinished && (
                  <p className="text-2xl font-bold text-foreground">
                    {match.home_score}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <TeamBadge team={awayTeam} size="sm" />
                {isFinished && (
                  <p className="text-2xl font-bold text-foreground">
                    {match.away_score}
                  </p>
                )}
              </div>
            </div>

            {/* Venue */}
            {match.venue && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {match.venue.name}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

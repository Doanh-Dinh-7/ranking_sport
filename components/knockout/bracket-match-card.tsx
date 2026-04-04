"use client";

import Image from "next/image";
import Link from "next/link";
import type { Team } from "@/lib/supabase";
import type { MatchWithTeams } from "@/lib/bracket-utils";
import {
  BRACKET_MATCH_CARD_WIDTH_PX,
  getMatchWinner,
} from "@/lib/bracket-utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

type RowRef = (el: HTMLDivElement | null) => void;

function CompactTeam({ team }: { team: Team }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      {team.logo_url ? (
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
          <Image
            src={team.logo_url}
            alt={team.name}
            width={32}
            height={32}
            loading="eager"
            className="object-cover w-full h-full"
          />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full shrink-0 bg-linear-to-br from-primary to-chart-4 flex items-center justify-center text-primary-foreground text-xs font-bold">
          {team.short_name.slice(0, 2)}
        </div>
      )}
      <span className="text-sm font-semibold truncate text-foreground">
        {team.name}
      </span>
    </div>
  );
}

interface BracketMatchCardProps {
  match: MatchWithTeams;
  setHomeRowRef?: RowRef;
  setAwayRowRef?: RowRef;
}

export function BracketMatchCard({
  match,
  setHomeRowRef,
  setAwayRowRef,
}: BracketMatchCardProps) {
  const w = getMatchWinner(match);
  const scheduledDate = new Date(match.scheduled_at);
  const venueName = match.venue?.name ?? "—";

  const homeAdvances = w === "home";
  const awayAdvances = w === "away";
  const decided = match.status === "finished" && w !== null;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block shrink-0 hover:opacity-[0.98] transition-opacity cursor-pointer"
      style={{ width: BRACKET_MATCH_CARD_WIDTH_PX }}
    >
      <div
        className={cn(
          "rounded-lg border border-border bg-card p-0 overflow-hidden shadow-sm",
          "hover:ring-2 hover:ring-primary/40 transition-shadow",
        )}
      >
        <div
          ref={setHomeRowRef}
          className={cn(
            "relative flex items-center justify-between gap-2 pl-3 pr-3 py-2.5 border-b border-border/60",
            decided &&
              homeAdvances &&
              "z-1 border border-amber-400/70 border-b-amber-400/40 bg-amber-500/8",
            decided && awayAdvances && "opacity-50",
          )}
        >
          {decided && homeAdvances && (
            <span
              className="pointer-events-none absolute left-0 top-0 bottom-0 w-1 bg-amber-400 shadow-[1px_0_0_0_rgba(251,191,36,0.35)]"
              aria-hidden
            />
          )}
          <div className="min-w-0 flex-1">
            {match.home_team ? (
              <CompactTeam team={match.home_team} />
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
          <span
            className={cn(
              "tabular-nums text-lg shrink-0",
              homeAdvances
                ? "font-bold text-foreground"
                : "font-medium text-muted-foreground",
              match.status !== "finished" && "text-muted-foreground",
            )}
          >
            {match.home_score ?? "—"}
          </span>
        </div>
        <div
          ref={setAwayRowRef}
          className={cn(
            "relative flex items-center justify-between gap-2 pl-3 pr-3 py-2.5",
            decided &&
              awayAdvances &&
              "z-1 border border-amber-400/70 border-t-0 bg-amber-500/8",
            decided && homeAdvances && "opacity-50",
          )}
        >
          {decided && awayAdvances && (
            <span
              className="pointer-events-none absolute left-0 top-0 bottom-0 w-1 bg-amber-400 shadow-[1px_0_0_0_rgba(251,191,36,0.35)]"
              aria-hidden
            />
          )}
          <div className="min-w-0 flex-1">
            {match.away_team ? (
              <CompactTeam team={match.away_team} />
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
          <span
            className={cn(
              "tabular-nums text-lg shrink-0",
              awayAdvances
                ? "font-bold text-foreground"
                : "font-medium text-muted-foreground",
              match.status !== "finished" && "text-muted-foreground",
            )}
          >
            {match.away_score ?? "—"}
          </span>
        </div>
        <div className="px-3 py-1.5 bg-muted/40 border-t border-border/80">
          <p className="text-[10px] text-muted-foreground text-center leading-tight">
            {format(scheduledDate, "dd/MM · HH:mm", { locale: vi })} ·{" "}
            {venueName}
          </p>
          {match.status === "scheduled" && (
            <p className="text-[10px] text-primary text-center font-medium">
              Sắp diễn ra
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

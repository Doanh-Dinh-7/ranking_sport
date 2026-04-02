import { useMemo } from "react";
import { Standing, Team } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { TeamBadge } from "./team-badge";

interface StandingsTableProps {
  standings: Standing[];
  teams: { [id: string]: Team };
  groupName?: string;
}

function sortStandingsForTable(rows: Standing[]): Standing[] {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goals_for - a.goals_against;
    const gdB = b.goals_for - b.goals_against;
    if (gdB !== gdA) return gdB - gdA;
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    return 0;
  });
}

export function StandingsTable({
  standings,
  teams,
  groupName,
}: StandingsTableProps) {
  const filtered = useMemo(
    () =>
      groupName
        ? standings.filter((s) => s.group_name === groupName)
        : standings,
    [standings, groupName]
  );

  const sorted = useMemo(
    () => sortStandingsForTable(filtered),
    [filtered]
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60">
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
              #
            </th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
              Đội
            </th>
            <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
              Trận
            </th>
            <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
              Thắng
            </th>
            <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
              Hòa
            </th>
            <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
              Thua
            </th>
            <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
              HS
            </th>
            <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
              ĐM
            </th>
            <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
              Pts
            </th>
            <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
              Form
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((standing, index) => {
            const team = teams[standing.team_id];
            if (!team) return null;

            const goalDiff = standing.goals_for - standing.goals_against;
            const isTopTwo = index < 2;

            return (
              <tr
                key={standing.id}
                className={cn(
                  "border-b border-border transition-colors",
                  isTopTwo
                    ? "bg-emerald-500/8 hover:bg-emerald-500/12 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15"
                    : "hover:bg-muted/50"
                )}
              >
                <td className="px-4 py-3 font-semibold text-foreground">
                  {index + 1}
                </td>
                <td className="px-4 py-3">
                  <TeamBadge team={team} size="sm" />
                </td>
                <td className="text-center px-4 py-3 text-foreground">
                  {standing.played}
                </td>
                <td className="text-center px-4 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                  {standing.won}
                </td>
                <td className="text-center px-4 py-3 text-amber-600 dark:text-amber-400 font-semibold">
                  {standing.drawn}
                </td>
                <td className="text-center px-4 py-3 text-rose-600 dark:text-rose-400 font-semibold">
                  {standing.lost}
                </td>
                <td className="text-center px-4 py-3 text-foreground">
                  {standing.goals_for}-{standing.goals_against}
                </td>
                <td
                  className={`text-center px-4 py-3 font-semibold ${goalDiff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                >
                  {goalDiff > 0 ? "+" : ""}
                  {goalDiff}
                </td>
                <td className="text-center px-4 py-3 text-primary font-bold text-lg">
                  {standing.points}
                </td>
                <td className="text-center px-4 py-3">
                  {isTopTwo ? (
                    <div
                      className="flex justify-center gap-1"
                      title="Top 2 bảng — đi vòng knockout"
                      aria-label="Top 2 bảng"
                    >
                      <span className="inline-block size-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_2px_var(--background)] ring-1 ring-emerald-600/30" />
                    </div>
                  ) : (
                    <span className="inline-block size-2 shrink-0 opacity-0" aria-hidden />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

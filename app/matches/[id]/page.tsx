"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { TeamLogo } from "@/components/team-badge";
import { Team, MatchEvent } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { formatStageLabel } from "@/lib/bracket-utils";
import { useIsMatchLive, LiveStatusLabel } from "@/components/match-live";

export default function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [match, setMatch] = useState<any>(null);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      try {
        const res = await fetch(`/api/matches/${id}`);
        const data = await res.json();

        setMatch(data);
        setEvents(data.events || []);

        // Load teams for display
        if (data.home_team_id && data.away_team_id) {
          const teamsRes = await fetch("/api/teams");
          const teamsData = await teamsRes.json();
          const home = teamsData.find((t: Team) => t.id === data.home_team_id);
          const away = teamsData.find((t: Team) => t.id === data.away_team_id);
          setHomeTeam(home);
          setAwayTeam(away);
        }
      } catch (error) {
        console.error("Failed to load match:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const live = useIsMatchLive(match?.scheduled_at, match?.status);

  if (loading || !match || !homeTeam || !awayTeam) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen bg-background">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  const isFinished = match.status === "finished";
  const scheduledDate = new Date(match.scheduled_at);
  const byMinute = (a: MatchEvent, b: MatchEvent) =>
    (a.minute ?? 0) - (b.minute ?? 0);
  const homeEvents = events
    .filter((e) => e.team_id === match.home_team_id)
    .sort(byMinute);
  const awayEvents = events
    .filter((e) => e.team_id === match.away_team_id)
    .sort(byMinute);

  return (
    <>
      <Navbar />
      <main className="bg-background min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back button */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Link href="/knockout">
              <Button variant="outline" size="sm">
                ← Vòng loại
              </Button>
            </Link>
            <Link href="/fixtures">
              <Button variant="outline" size="sm">
                Lịch thi đấu
              </Button>
            </Link>
          </div>

          {/* Match Header */}
          <Card className="border-border mb-8">
            <CardContent className="pt-8">
              <p className="mb-6 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {formatStageLabel(match.stage, homeTeam.group_name)}
              </p>

              <div className="mb-6 grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto_1fr] sm:gap-4">
                {/* Home */}
                <div className="flex flex-col items-center gap-3 text-center">
                  <TeamLogo team={homeTeam} size="xl" />
                  <h2 className="text-lg font-bold leading-tight text-foreground sm:text-xl">
                    {homeTeam.name}
                  </h2>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 text-center">
                  <p className="text-sm text-muted-foreground capitalize">
                    {format(scheduledDate, "EEEE, dd/MM/yyyy", { locale: vi })}
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {format(scheduledDate, "HH:mm", { locale: vi })}
                  </p>
                  {isFinished ? (
                    <div className="mt-2 rounded-lg bg-muted px-6 py-4">
                      <div className="text-4xl font-bold tabular-nums text-foreground sm:text-5xl">
                        {match.home_score} – {match.away_score}
                      </div>
                      <p className="mt-2 text-xs font-semibold uppercase text-muted-foreground">
                        Kết thúc
                      </p>
                    </div>
                  ) : live ? (
                    <div className="mt-2 rounded-lg border-2 border-blue-500/45 bg-blue-500/10 px-8 py-5 dark:border-blue-400/35 dark:bg-blue-500/15">
                      <div className="flex justify-center">
                        <LiveStatusLabel className="text-sm sm:text-base" />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 rounded-lg bg-muted px-8 py-4">
                      <p className="text-lg font-semibold uppercase tracking-widest text-muted-foreground">
                        vs
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Chờ đá
                      </p>
                    </div>
                  )}
                </div>

                {/* Away */}
                <div className="flex flex-col items-center gap-3 text-center">
                  <TeamLogo team={awayTeam} size="xl" />
                  <h2 className="text-lg font-bold leading-tight text-foreground sm:text-xl">
                    {awayTeam.name}
                  </h2>
                </div>
              </div>

              {/* Venue */}
              {match.venue && (
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground text-center">
                    <span className="font-semibold">Sân: </span>
                    {match.venue.name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Match Events — 2 cột theo đội nhà / đội khách */}
          {isFinished && events.length > 0 && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Sự kiện trận đấu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
                  {/* Đội nhà */}
                  <div className="min-w-0">
                    <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:text-left">
                      {homeTeam.short_name}
                    </p>
                    <ul className="space-y-2">
                      {homeEvents.length === 0 ? (
                        <li className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                          Không có sự kiện
                        </li>
                      ) : (
                        homeEvents.map((event) => (
                          <li
                            key={event.id}
                            className="flex items-center justify-between gap-2 rounded-md bg-muted/80 px-3 py-2.5 text-sm"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="shrink-0" aria-hidden>
                                {event.event_type === "goal" && "⚽"}
                                {event.event_type === "own_goal" && "⚽"}
                                {event.event_type === "yellow" && "🟨"}
                                {event.event_type === "red" && "🟥"}
                              </span>
                              <span className="truncate text-foreground">
                                {event.player_name || "—"}
                                {event.event_type === "own_goal" && (
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    (phản lưới)
                                  </span>
                                )}
                              </span>
                            </div>
                            <span className="shrink-0 tabular-nums text-muted-foreground">
                              {event.minute != null ? `${event.minute}'` : "—"}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                  {/* Đội khách */}
                  <div className="min-w-0">
                    <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:text-right">
                      {awayTeam.short_name}
                    </p>
                    <ul className="space-y-2">
                      {awayEvents.length === 0 ? (
                        <li className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                          Không có sự kiện
                        </li>
                      ) : (
                        awayEvents.map((event) => (
                          <li
                            key={event.id}
                            className="flex items-center justify-between gap-2 rounded-md bg-muted/80 px-3 py-2.5 text-sm"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="shrink-0" aria-hidden>
                                {event.event_type === "goal" && "⚽"}
                                {event.event_type === "own_goal" && "⚽"}
                                {event.event_type === "yellow" && "🟨"}
                                {event.event_type === "red" && "🟥"}
                              </span>
                              <span className="truncate text-foreground">
                                {event.player_name || "—"}
                                {event.event_type === "own_goal" && (
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    (phản lưới)
                                  </span>
                                )}
                              </span>
                            </div>
                            <span className="shrink-0 tabular-nums text-muted-foreground">
                              {event.minute != null ? `${event.minute}'` : "—"}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}

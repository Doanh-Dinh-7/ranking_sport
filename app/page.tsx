"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar";
import { MatchCard } from "@/components/match-card";
import { StandingsTable } from "@/components/standings-table";
import { Match, Team, Standing } from "@/lib/supabase";
import Image from "next/image";
import {
  TOURNAMENT_BANNER_URL,
  TOURNAMENT_LOGO_URL,
  TOURNAMENT_NAME,
} from "@/lib/tournament";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isMatchInProgress } from "@/lib/match-time";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

/** Ngày lịch local YYYY-MM-DD (theo giờ máy người xem). */
function calendarDateKeyLocal(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

function formatDayLabel(dayKey: string): string {
  const [y, m, da] = dayKey.split("-").map(Number);
  const d = new Date(y, m - 1, da);
  return format(d, "EEEE, dd/MM/yyyy", { locale: vi });
}

export default function Home() {
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalMatches: 0,
    finishedMatches: 0,
    remainingMatches: 0,
    totalGoals: 0,
  });
  const [matches, setMatches] = useState<any[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [teams, setTeams] = useState<{ [id: string]: Team }>({});
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const dashboardRes = await fetch("/api/dashboard");
        const dashboardData = await dashboardRes.json();
        const teamsData = dashboardData.teams || [];
        const matchesData = dashboardData.matches || [];
        const standingsData = dashboardData.standings || [];

        const teamsMap = Object.fromEntries(
          teamsData.map((t: Team) => [t.id, t]),
        );
        setTeams(teamsMap);
        setMatches(matchesData);
        setStandings(standingsData);

        // Calculate stats
        const finished = matchesData.filter(
          (m: Match) => m.status === "finished",
        ).length;
        const total = matchesData.length;

        const totalGoals = (matchesData as Match[]).reduce((sum, m) => {
          if (m.status !== "finished") return sum;
          if (m.home_score == null || m.away_score == null) return sum;
          return sum + m.home_score + m.away_score;
        }, 0);

        const playableTeams = teamsData.filter(
          (t: Team) => t.group_name !== "K",
        );
        setStats({
          totalTeams: playableTeams.length,
          totalMatches: total,
          finishedMatches: finished,
          remainingMatches: total - finished,
          totalGoals,
        });
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const finishedList = useMemo(
    () =>
      matches
        .filter((m: Match) => m.status === "finished")
        .sort(
          (a, b) =>
            new Date(b.scheduled_at).getTime() -
            new Date(a.scheduled_at).getTime(),
        ),
    [matches],
  );

  const liveList = useMemo(
    () =>
      matches
        .filter((m: Match) =>
          isMatchInProgress(m.scheduled_at, m.status, clock),
        )
        .sort(
          (a, b) =>
            new Date(a.scheduled_at).getTime() -
            new Date(b.scheduled_at).getTime(),
        ),
    [matches, clock],
  );

  const upcomingList = useMemo(
    () =>
      matches
        .filter(
          (m: Match) =>
            m.status === "scheduled" &&
            !isMatchInProgress(m.scheduled_at, m.status, clock),
        )
        .sort(
          (a, b) =>
            new Date(a.scheduled_at).getTime() -
            new Date(b.scheduled_at).getTime(),
        ),
    [matches, clock],
  );

  /** Ngày lịch gần nhất có trận đã kết thúc + mọi trận finished trong ngày đó. */
  const { latestFinishedDay, finishedOnLatestDay } = useMemo(() => {
    if (finishedList.length === 0) {
      return {
        latestFinishedDay: null as string | null,
        finishedOnLatestDay: [] as Match[],
      };
    }
    const latestDay = finishedList.reduce((max, m) => {
      const k = calendarDateKeyLocal(m.scheduled_at);
      return k > max ? k : max;
    }, calendarDateKeyLocal(finishedList[0].scheduled_at));
    const onDay = finishedList
      .filter((m) => calendarDateKeyLocal(m.scheduled_at) === latestDay)
      .sort(
        (a, b) =>
          new Date(b.scheduled_at).getTime() -
          new Date(a.scheduled_at).getTime(),
      );
    return { latestFinishedDay: latestDay, finishedOnLatestDay: onDay };
  }, [finishedList]);

  /** Ngày lịch chờ đấu gần nhất (theo trận sớm nhất trong upcoming) + mọi trận chờ cùng ngày. */
  const { nearestWaitDay, upcomingOnNearestDay } = useMemo(() => {
    if (upcomingList.length === 0) {
      return {
        nearestWaitDay: null as string | null,
        upcomingOnNearestDay: [] as Match[],
      };
    }
    const day = calendarDateKeyLocal(upcomingList[0].scheduled_at);
    const onDay = upcomingList.filter(
      (m) => calendarDateKeyLocal(m.scheduled_at) === day,
    );
    return { nearestWaitDay: day, upcomingOnNearestDay: onDay };
  }, [upcomingList]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen bg-background">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  const groupA = standings.filter((s) => s.group_name === "A");
  const groupB = standings.filter((s) => s.group_name === "B");
  const groupC = standings.filter((s) => s.group_name === "C");
  const groupD = standings.filter((s) => s.group_name === "D");

  return (
    <>
      <Navbar />
      <main className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tournament banner + title */}
          <div className="relative mb-8 overflow-hidden rounded-lg shadow-md min-h-[160px] sm:min-h-[200px]">
            <Image
              src={TOURNAMENT_BANNER_URL}
              alt=""
              fill
              className="object-cover"
              loading="eager"
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
            <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/45 to-black/25" />
            <div className="relative flex flex-col sm:flex-row items-start gap-4 p-6 sm:p-8">
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-lg ring-2 ring-white/30 shadow-lg">
                <Image
                  src={TOURNAMENT_LOGO_URL}
                  alt={TOURNAMENT_NAME}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-md tracking-tight">
                  {TOURNAMENT_NAME}
                </h1>
                <p className="text-white/90 text-sm sm:text-base">
                  {stats.totalTeams} đội tham dự · {stats.totalMatches} trận đấu
                  · {stats.totalGoals} bàn thắng
                  {liveList.length > 0
                    ? " · Có trận đang diễn ra"
                    : " · Theo dõi lịch & kết quả bên dưới"}
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-border">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Số đội</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.totalTeams}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Trận đã đá</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.finishedMatches}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Bàn thắng</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.totalGoals}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">
                  Trận còn lại
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.remainingMatches}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8 space-y-6">
            {/* Hàng 1: đang diễn ra — full width */}
            {liveList.length > 0 && (
              <div className="w-full">
                <Card className="w-full border-blue-500/35 bg-blue-500/4 dark:bg-blue-500/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-blue-700 dark:text-blue-400">
                      Đang diễn ra
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-normal">
                      Trạng thái &quot;live&quot; hoặc trong khung giờ trận (2h
                      sau giờ lăn bóng) · {liveList.length} trận
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {liveList.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">
                        Không có trận đang diễn ra
                      </p>
                    ) : (
                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {liveList.map((m) => {
                          const home = teams[m.home_team_id];
                          const away = teams[m.away_team_id];
                          if (!home || !away) return null;
                          return (
                            <MatchCard
                              key={m.id}
                              match={m}
                              homeTeam={home}
                              awayTeam={away}
                              variant="full"
                            />
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Hàng 2: kết quả ngày gần nhất | các trận chờ cùng ngày gần nhất */}
            <div className="grid w-full gap-6 md:grid-cols-2">
              <Card className="border-border min-w-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-emerald-700 dark:text-emerald-400">
                    Kết quả ngày gần nhất
                  </CardTitle>
                  <p className="text-xs text-muted-foreground font-normal">
                    {latestFinishedDay
                      ? `${formatDayLabel(latestFinishedDay)} · ${finishedOnLatestDay.length} trận`
                      : "Chưa có trận kết thúc"}
                  </p>
                </CardHeader>
                <CardContent className="flex max-h-[min(520px,55vh)] flex-col gap-5 overflow-y-auto pt-0">
                  {finishedOnLatestDay.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      Chưa có trận kết thúc
                    </p>
                  ) : (
                    finishedOnLatestDay.map((m) => {
                      const home = teams[m.home_team_id];
                      const away = teams[m.away_team_id];
                      if (!home || !away) return null;
                      return (
                        <div key={m.id} className="w-full min-w-0 shrink-0">
                          <MatchCard
                            match={m}
                            homeTeam={home}
                            awayTeam={away}
                            variant="full"
                          />
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              <Card className="border-border min-w-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-primary">
                    Lịch chờ — ngày gần nhất
                  </CardTitle>
                  <p className="text-xs text-muted-foreground font-normal">
                    {nearestWaitDay
                      ? `${formatDayLabel(nearestWaitDay)} · ${upcomingOnNearestDay.length} trận`
                      : "Không có trận chờ"}
                  </p>
                </CardHeader>
                <CardContent className="flex max-h-[min(520px,55vh)] flex-col gap-5 overflow-y-auto pt-0">
                  {upcomingOnNearestDay.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      Không có trận chờ
                    </p>
                  ) : (
                    upcomingOnNearestDay.map((m) => {
                      const home = teams[m.home_team_id];
                      const away = teams[m.away_team_id];
                      if (!home || !away) return null;
                      return (
                        <div key={m.id} className="w-full min-w-0 shrink-0">
                          <MatchCard
                            match={m}
                            homeTeam={home}
                            awayTeam={away}
                            variant="full"
                          />
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Standings */}
          <Tabs defaultValue="groupA" className="mb-8">
            <TabsList className="bg-muted border-border flex-wrap h-auto gap-1">
              <TabsTrigger value="groupA">Bảng A</TabsTrigger>
              <TabsTrigger value="groupB">Bảng B</TabsTrigger>
              <TabsTrigger value="groupC">Bảng C</TabsTrigger>
              <TabsTrigger value="groupD">Bảng D</TabsTrigger>
            </TabsList>

            <TabsContent value="groupA" className="mt-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Bảng Xếp Hạng A</CardTitle>
                </CardHeader>
                <CardContent>
                  <StandingsTable standings={groupA} teams={teams} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groupB" className="mt-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Bảng Xếp Hạng B</CardTitle>
                </CardHeader>
                <CardContent>
                  <StandingsTable standings={groupB} teams={teams} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groupC" className="mt-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Bảng Xếp Hạng C</CardTitle>
                </CardHeader>
                <CardContent>
                  <StandingsTable standings={groupC} teams={teams} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groupD" className="mt-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Bảng Xếp Hạng D</CardTitle>
                </CardHeader>
                <CardContent>
                  <StandingsTable standings={groupD} teams={teams} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}

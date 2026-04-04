"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar";
import { MatchCard } from "@/components/match-card";
import { StandingsTable } from "@/components/standings-table";
import { TeamBadge } from "@/components/team-badge";
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
        // Load teams
        const teamsRes = await fetch("/api/teams");
        const teamsData = await teamsRes.json();
        const teamsMap = Object.fromEntries(
          teamsData.map((t: Team) => [t.id, t]),
        );
        setTeams(teamsMap);

        // Load matches
        const matchesRes = await fetch("/api/matches");
        const matchesData = await matchesRes.json();
        setMatches(matchesData);

        // Load standings
        const standingsRes = await fetch("/api/standings");
        const standingsData = await standingsRes.json();
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

  const liveMatches = useMemo(
    () =>
      matches.filter((m) => isMatchInProgress(m.scheduled_at, m.status, clock)),
    [matches, clock],
  );
  const liveMatchIds = useMemo(
    () => new Set(liveMatches.map((m) => m.id)),
    [liveMatches],
  );

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

  const latestMatch = matches
    .filter((m) => m.status === "finished")
    .sort(
      (a, b) =>
        new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime(),
    )[0];

  const nextMatch = matches
    .filter((m) => m.status === "scheduled")
    .sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
    )[0];

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
                  · {stats.totalGoals} bàn thắng · Vòng bảng đang diễn ra
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

          {/* Trận đang diễn ra (theo lịch + cửa sổ thời gian, đồng bộ match-live) */}
          {liveMatches.length > 0 && (
            <Card className="mb-8 border-blue-500/35 bg-blue-500/4 dark:bg-blue-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-blue-700 dark:text-blue-400">
                  Trận đang diễn ra
                </CardTitle>
              </CardHeader>
              <CardContent
                className={
                  liveMatches.length > 1
                    ? "grid gap-4 sm:grid-cols-2"
                    : undefined
                }
              >
                {liveMatches.map((m) => {
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
              </CardContent>
            </Card>
          )}

          {/* Latest and Next Match */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {latestMatch && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Kết quả gần nhất</CardTitle>
                </CardHeader>
                <CardContent>
                  <MatchCard
                    match={latestMatch}
                    homeTeam={teams[latestMatch.home_team_id]}
                    awayTeam={teams[latestMatch.away_team_id]}
                    variant="full"
                  />
                </CardContent>
              </Card>
            )}

            {nextMatch && !liveMatchIds.has(nextMatch.id) && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Trận sắp tới</CardTitle>
                </CardHeader>
                <CardContent>
                  <MatchCard
                    match={nextMatch}
                    homeTeam={teams[nextMatch.home_team_id]}
                    awayTeam={teams[nextMatch.away_team_id]}
                    variant="full"
                  />
                </CardContent>
              </Card>
            )}
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

'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { MatchCard } from '@/components/match-card';
import { Team } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FixturesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<{ [id: string]: Team }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Load teams
        const teamsRes = await fetch('/api/teams');
        const teamsData = await teamsRes.json();
        const teamsMap = Object.fromEntries(teamsData.map((t: Team) => [t.id, t]));
        setTeams(teamsMap);

        // Load matches
        const matchesRes = await fetch('/api/matches');
        const matchesData = await matchesRes.json();
        const sorted = matchesData.sort(
          (a: any, b: any) =>
            new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        );
        setMatches(sorted);
      } catch (error) {
        console.error('Failed to load fixtures:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

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

  const groupMatches = matches.filter((m) => m.stage === 'group');
  const scheduledMatches = matches.filter((m) => m.status === 'scheduled');
  const finishedMatches = matches.filter((m) => m.status === 'finished');

  return (
    <>
      <Navbar />
      <main className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-foreground mb-8">Lịch Thi Đấu</h1>

          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList className="bg-muted border-border">
              <TabsTrigger value="upcoming">Chờ đá</TabsTrigger>
              <TabsTrigger value="finished">Đã đá</TabsTrigger>
              <TabsTrigger value="all">Tất cả</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              <Card className="border-border">
                <CardContent className="pt-6">
                  {scheduledMatches.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Không có trận nào</p>
                  ) : (
                    <div className="grid gap-4">
                      {scheduledMatches.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          homeTeam={teams[match.home_team_id]}
                          awayTeam={teams[match.away_team_id]}
                          variant="compact"
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="finished">
              <Card className="border-border">
                <CardContent className="pt-6">
                  {finishedMatches.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Không có trận nào</p>
                  ) : (
                    <div className="grid gap-4">
                      {finishedMatches.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          homeTeam={teams[match.home_team_id]}
                          awayTeam={teams[match.away_team_id]}
                          variant="compact"
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all">
              <Card className="border-border">
                <CardContent className="pt-6">
                  <div className="grid gap-4">
                    {matches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        homeTeam={teams[match.home_team_id]}
                        awayTeam={teams[match.away_team_id]}
                        variant="compact"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}

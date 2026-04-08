'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { StandingsTable } from '@/components/standings-table';
import { Standing, Team } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function StandingsPage() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [teams, setTeams] = useState<{ [id: string]: Team }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [teamsRes, standingsRes] = await Promise.all([
          fetch('/api/teams'),
          fetch('/api/standings'),
        ]);
        const [teamsData, standingsData] = await Promise.all([
          teamsRes.json(),
          standingsRes.json(),
        ]);
        const teamsMap = Object.fromEntries(teamsData.map((t: Team) => [t.id, t]));
        setTeams(teamsMap);
        setStandings(standingsData);
      } catch (error) {
        console.error('Failed to load standings:', error);
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

  const groupA = standings.filter((s) => s.group_name === 'A');
  const groupB = standings.filter((s) => s.group_name === 'B');
  const groupC = standings.filter((s) => s.group_name === 'C');
  const groupD = standings.filter((s) => s.group_name === 'D');

  return (
    <>
      <Navbar />
      <main className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-foreground mb-8">Bảng Xếp Hạng</h1>

          <Tabs defaultValue="groupA" className="space-y-6">
            <TabsList className="bg-muted border-border flex-wrap h-auto gap-1">
              <TabsTrigger value="groupA">Bảng A</TabsTrigger>
              <TabsTrigger value="groupB">Bảng B</TabsTrigger>
              <TabsTrigger value="groupC">Bảng C</TabsTrigger>
              <TabsTrigger value="groupD">Bảng D</TabsTrigger>
              <TabsTrigger value="all">Tất cả</TabsTrigger>
            </TabsList>

            <TabsContent value="groupA">
              <Card className="border-border">
                <CardContent className="pt-6">
                  <StandingsTable standings={groupA} teams={teams} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groupB">
              <Card className="border-border">
                <CardContent className="pt-6">
                  <StandingsTable standings={groupB} teams={teams} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groupC">
              <Card className="border-border">
                <CardContent className="pt-6">
                  <StandingsTable standings={groupC} teams={teams} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groupD">
              <Card className="border-border">
                <CardContent className="pt-6">
                  <StandingsTable standings={groupD} teams={teams} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all">
              <div className="space-y-6">
                <Card className="border-border">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Bảng A</h3>
                    <StandingsTable standings={groupA} teams={teams} />
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Bảng B</h3>
                    <StandingsTable standings={groupB} teams={teams} />
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Bảng C</h3>
                    <StandingsTable standings={groupC} teams={teams} />
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Bảng D</h3>
                    <StandingsTable standings={groupD} teams={teams} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}

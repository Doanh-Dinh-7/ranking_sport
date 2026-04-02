'use client';

import { useEffect, useState } from 'react';
import { Team, Standing } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminDashboard() {
  const [matches, setMatches] = useState<any[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [matchesRes, teamsRes, standingsRes] = await Promise.all([
          fetch('/api/matches'),
          fetch('/api/teams'),
          fetch('/api/standings'),
        ]);

        const matchesData = await matchesRes.json();
        const teamsData = await teamsRes.json();
        const standingsData = await standingsRes.json();

        setMatches(matchesData);
        setTeams(teamsData);
        setStandings(standingsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleSaveResult(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMatch || homeScore === '' || awayScore === '') {
      setMessage('Vui lòng điền tất cả các trường');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: selectedMatch,
          home_score: parseInt(homeScore),
          away_score: parseInt(awayScore),
          events: [],
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage('Lỗi: ' + (data.error || 'Lưu không thành công'));
        return;
      }

      await res.json();
      setMessage('✓ Lưu kết quả thành công! Bảng xếp hạng đã cập nhật.');

      // Refresh data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Save error:', error);
      setMessage('Lỗi: Không thể lưu kết quả');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const stats = {
    finished: matches.filter((m) => m.status === 'finished').length,
    scheduled: matches.filter((m) => m.status === 'scheduled').length,
    total: matches.length,
  };

  const unfinishedMatches = matches.filter((m) => m.status === 'scheduled');
  const getTeamName = (id: string) => teams.find((t) => t.id === id)?.short_name || 'N/A';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Kết Quả Trận Đấu</h1>
        <p className="text-muted-foreground">Nhập kết quả để cập nhật bảng xếp hạng</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Chờ kết quả</p>
            <p className="text-3xl font-bold text-foreground">{stats.scheduled}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Đã hoàn thành</p>
            <p className="text-3xl font-bold text-foreground">{stats.finished}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Còn lại</p>
            <p className="text-3xl font-bold text-foreground">{stats.total - stats.finished}</p>
          </CardContent>
        </Card>
      </div>

      {/* Form and Matches */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Nhập Kết Quả</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveResult} className="space-y-4">
                {/* Match selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Chọn Trận Đấu</label>
                  <Select value={selectedMatch} onValueChange={setSelectedMatch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trận đấu..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unfinishedMatches.map((match) => (
                        <SelectItem key={match.id} value={match.id}>
                          {getTeamName(match.home_team_id)} vs {getTeamName(match.away_team_id)} ·{' '}
                          {new Date(match.scheduled_at).toLocaleDateString('vi-VN')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Score inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Bàn thắng Nhà</label>
                    <Input
                      type="number"
                      min="0"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Bàn thắng Khách</label>
                    <Input
                      type="number"
                      min="0"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Message */}
                {message && (
                  <div
                    className={`p-3 rounded-md text-sm border ${
                      message.includes('✓')
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        : 'bg-destructive/15 text-destructive border-destructive/30'
                    }`}
                  >
                    {message}
                  </div>
                )}

                {/* Submit button */}
                <Button type="submit" disabled={saving || !selectedMatch} className="w-full">
                  {saving ? 'Đang lưu...' : 'Lưu Kết Quả'}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Lưu ý:</strong> Khi lưu kết quả, PostgreSQL trigger tự động sẽ cập nhật
                  bảng xếp hạng. Không cần nhập dữ liệu manually.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming matches list */}
        <div>
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Danh Sách Trận Chờ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {unfinishedMatches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Không có trận chờ</p>
                ) : (
                  unfinishedMatches.map((match) => (
                    <div
                      key={match.id}
                      className={`p-3 rounded-md text-sm border cursor-pointer transition-colors ${
                        selectedMatch === match.id
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-muted/50 border-border text-foreground hover:bg-muted'
                      }`}
                      onClick={() => setSelectedMatch(match.id)}
                    >
                      <p className="font-semibold">
                        {getTeamName(match.home_team_id)} vs {getTeamName(match.away_team_id)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(match.scheduled_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Current standings preview */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Bảng Xếp Hạng Hiện Tại</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {['A', 'B', 'C', 'D'].map((group) => (
              <div key={group}>
                <h3 className="font-semibold text-foreground mb-3">Bảng {group}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left px-2 py-2">#</th>
                        <th className="text-left px-2 py-2">Đội</th>
                        <th className="text-center px-2 py-2">T</th>
                        <th className="text-center px-2 py-2">Th-H-Th</th>
                        <th className="text-center px-2 py-2">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings
                        .filter((s) => s.group_name === group)
                        .slice(0, 4)
                        .map((standing, i) => (
                          <tr key={standing.id} className="border-b border-border">
                            <td className="px-2 py-2 text-muted-foreground">{i + 1}</td>
                            <td className="px-2 py-2 text-foreground">{getTeamName(standing.team_id)}</td>
                            <td className="text-center px-2 py-2 text-foreground">
                              {standing.played}
                            </td>
                            <td className="text-center px-2 py-2 text-foreground">
                              {standing.won}-{standing.drawn}-{standing.lost}
                            </td>
                            <td className="text-center px-2 py-2 font-semibold text-primary">
                              {standing.points}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

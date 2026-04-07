"use client";

import { useEffect, useMemo, useState } from "react";
import { Team, Standing } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminDashboard() {
  const [matches, setMatches] = useState<any[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMatch, setSelectedMatch] = useState<string>("");
  const [homeScore, setHomeScore] = useState<string>("");
  const [awayScore, setAwayScore] = useState<string>("");
  const [matchStatus, setMatchStatus] = useState<
    "scheduled" | "live" | "finished"
  >("scheduled");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [matchesRes, teamsRes, standingsRes] = await Promise.all([
          fetch("/api/matches"),
          fetch("/api/teams"),
          fetch("/api/standings"),
        ]);

        const matchesData = await matchesRes.json();
        const teamsData = await teamsRes.json();
        const standingsData = await standingsRes.json();

        setMatches(Array.isArray(matchesData) ? matchesData : []);
        setTeams(Array.isArray(teamsData) ? teamsData : []);
        setStandings(Array.isArray(standingsData) ? standingsData : []);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const sortedMatches = useMemo(
    () =>
      [...matches].sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime(),
      ),
    [matches],
  );

  useEffect(() => {
    if (!selectedMatch) return;
    const m = matches.find((x) => x.id === selectedMatch);
    if (!m) return;
    setHomeScore(m.home_score != null ? String(m.home_score) : "");
    setAwayScore(m.away_score != null ? String(m.away_score) : "");
    setMatchStatus(
      m.status === "finished"
        ? "finished"
        : m.status === "live"
          ? "live"
          : "scheduled",
    );
  }, [selectedMatch, matches]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMatch) {
      setMessage("Chọn trận đấu");
      return;
    }

    if (matchStatus === "finished" || matchStatus === "live") {
      if (homeScore === "" || awayScore === "") {
        setMessage("Kết thúc / đang diễn ra cần nhập tỉ số hai đội");
        return;
      }
      const hs = parseInt(homeScore, 10);
      const as = parseInt(awayScore, 10);
      if (Number.isNaN(hs) || Number.isNaN(as) || hs < 0 || as < 0) {
        setMessage("Tỉ số phải là số nguyên ≥ 0");
        return;
      }
    }

    setSaving(true);
    setMessage("");

    try {
      const body: Record<string, unknown> = {
        match_id: selectedMatch,
        status: matchStatus,
      };
      if (matchStatus === "finished" || matchStatus === "live") {
        body.home_score = parseInt(homeScore, 10);
        body.away_score = parseInt(awayScore, 10);
      } else {
        body.home_score = null;
        body.away_score = null;
      }

      const res = await fetch("/api/admin/match", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage("Lỗi: " + (data.error || "Lưu không thành công"));
        return;
      }

      setMessage("✓ Đã cập nhật tỉ số và trạng thái.");
      const matchesRes = await fetch("/api/matches");
      const matchesData = await matchesRes.json();
      setMatches(Array.isArray(matchesData) ? matchesData : []);
      const standingsRes = await fetch("/api/standings");
      const standingsData = await standingsRes.json();
      setStandings(Array.isArray(standingsData) ? standingsData : []);
    } catch (error) {
      console.error("Save error:", error);
      setMessage("Lỗi: Không thể lưu");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const stats = {
    finished: matches.filter((m) => m.status === "finished").length,
    live: matches.filter((m) => m.status === "live").length,
    scheduled: matches.filter((m) => m.status === "scheduled").length,
    total: matches.length,
  };

  const getTeamName = (id: string) =>
    teams.find((t) => t.id === id)?.short_name || "N/A";

  const stageLabel = (stage: string) => {
    if (stage === "group") return "Bảng";
    if (stage === "qf") return "TK";
    if (stage === "sf") return "BK";
    if (stage === "final") return "CK";
    if (stage === "third_place") return "H3";
    return stage;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-4xl font-bold text-foreground">
          Tỉ số & trạng thái
        </h1>
        <p className="text-muted-foreground">
          Chọn trận: <strong>Chờ đá</strong> → <strong>Đang diễn ra</strong>{" "}
          (nhập tỉ số, cập nhật diễn biến tại mục Diễn biến) →{" "}
          <strong>Kết thúc</strong> (BXH vòng bảng chỉ cập nhật khi kết thúc).
        </p>
        <p className="mt-2 text-xs text-amber-700/90 dark:text-amber-400/90">
          Lưu ý: chuyển từ &quot;Kết thúc&quot; về &quot;Chờ đá&quot; có thể
          khiến BXH chưa khớp — cần kiểm tra lại dữ liệu nếu dùng tính năng này.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="mb-1 text-sm text-muted-foreground">Chờ đá</p>
            <p className="text-3xl font-bold text-foreground">
              {stats.scheduled}
            </p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="pt-6">
            <p className="mb-1 text-sm text-muted-foreground">Đang diễn ra</p>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              {stats.live}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="mb-1 text-sm text-muted-foreground">Đã kết thúc</p>
            <p className="text-3xl font-bold text-foreground">
              {stats.finished}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="mb-1 text-sm text-muted-foreground">Tổng trận</p>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Cập nhật trận</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label>Trận đấu</Label>
                  <Select
                    value={selectedMatch}
                    onValueChange={setSelectedMatch}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trận..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {sortedMatches.map((match) => (
                        <SelectItem key={match.id} value={match.id}>
                          <span className="font-medium">
                            {getTeamName(match.home_team_id)} vs{" "}
                            {getTeamName(match.away_team_id)}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            · {stageLabel(match.stage)} ·{" "}
                            {new Date(match.scheduled_at).toLocaleString(
                              "vi-VN",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                            {match.status === "finished" ||
                            match.status === "live"
                              ? ` · ${match.home_score ?? "—"}-${match.away_score ?? "—"}`
                              : ""}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select
                    value={matchStatus}
                    onValueChange={(v) =>
                      setMatchStatus(v as "scheduled" | "live" | "finished")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">
                        Chờ đá (scheduled)
                      </SelectItem>
                      <SelectItem value="live">Đang diễn ra (live)</SelectItem>
                      <SelectItem value="finished">
                        Kết thúc (finished)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bàn nhà</Label>
                    <Input
                      type="number"
                      min={0}
                      disabled={matchStatus === "scheduled"}
                      required={matchStatus !== "scheduled"}
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bàn khách</Label>
                    <Input
                      type="number"
                      min={0}
                      disabled={matchStatus === "scheduled"}
                      required={matchStatus !== "scheduled"}
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                {message && (
                  <div
                    className={`rounded-md border p-3 text-sm ${
                      message.includes("✓")
                        ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                        : "border-destructive/30 bg-destructive/15 text-destructive"
                    }`}
                  >
                    {message}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={saving || !selectedMatch}
                  className="w-full"
                >
                  {saving ? "Đang lưu..." : "Lưu cập nhật"}
                </Button>
              </form>

              <div className="mt-6 border-t border-border pt-6">
                <p className="text-xs text-muted-foreground">
                  Trigger BXH chỉ chạy khi trạng thái <strong>Kết thúc</strong>{" "}
                  (trận vòng bảng). Trạng thái <strong>Đang diễn ra</strong> chỉ
                  để cập nhật tỉ số tạm và diễn biến.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Danh sách trận</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-112 space-y-2 overflow-y-auto">
                {sortedMatches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Không có trận</p>
                ) : (
                  sortedMatches.map((match) => (
                    <button
                      key={match.id}
                      type="button"
                      onClick={() => setSelectedMatch(match.id)}
                      className={`w-full rounded-md border p-3 text-left text-sm transition-colors ${
                        selectedMatch === match.id
                          ? "border-primary bg-primary/15"
                          : "border-border bg-muted/40 hover:bg-muted"
                      }`}
                    >
                      <p className="font-semibold text-foreground">
                        {getTeamName(match.home_team_id)} vs{" "}
                        {getTeamName(match.away_team_id)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {stageLabel(match.stage)} ·{" "}
                        {new Date(match.scheduled_at).toLocaleDateString(
                          "vi-VN",
                        )}
                      </p>
                      <p className="mt-1 text-xs">
                        <span
                          className={
                            match.status === "finished"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : match.status === "live"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-muted-foreground"
                          }
                        >
                          {match.status === "finished"
                            ? `Kết thúc ${match.home_score ?? "—"}-${match.away_score ?? "—"}`
                            : match.status === "live"
                              ? `Đang diễn ra ${match.home_score ?? "—"}-${match.away_score ?? "—"}`
                              : "Chờ đá"}
                        </span>
                      </p>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Bảng xếp hạng (xem nhanh)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {["A", "B", "C", "D"].map((group) => (
              <div key={group}>
                <h3 className="mb-3 font-semibold text-foreground">
                  Bảng {group}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="px-2 py-2 text-left">#</th>
                        <th className="px-2 py-2 text-left">Đội</th>
                        <th className="px-2 py-2 text-center">T</th>
                        <th className="px-2 py-2 text-center">Th-H-Th</th>
                        <th className="px-2 py-2 text-center">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings
                        .filter((s) => s.group_name === group)
                        .slice(0, 4)
                        .map((standing, i) => (
                          <tr
                            key={standing.id}
                            className="border-b border-border"
                          >
                            <td className="px-2 py-2 text-muted-foreground">
                              {i + 1}
                            </td>
                            <td className="px-2 py-2 text-foreground">
                              {getTeamName(standing.team_id)}
                            </td>
                            <td className="px-2 py-2 text-center text-foreground">
                              {standing.played}
                            </td>
                            <td className="px-2 py-2 text-center text-foreground">
                              {standing.won}-{standing.drawn}-{standing.lost}
                            </td>
                            <td className="px-2 py-2 text-center font-semibold text-primary">
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

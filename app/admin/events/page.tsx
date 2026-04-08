"use client";

import { useEffect, useMemo, useState } from "react";
import { Team, MatchEvent } from "@/lib/supabase";
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

const EVENT_TYPES: { value: string; label: string }[] = [
  { value: "goal", label: "Bàn thắng" },
  { value: "own_goal", label: "Phản lưới" },
  { value: "yellow", label: "Thẻ vàng" },
  { value: "red", label: "Thẻ đỏ" },
];

type MatchRow = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  scheduled_at: string;
  stage: string;
  status: string;
};

export default function AdminMatchEventsPage() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState("");
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState("");
  const [eventType, setEventType] = useState("goal");
  const [playerName, setPlayerName] = useState("");
  const [minute, setMinute] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [mr, tr] = await Promise.all([
          fetch("/api/matches"),
          fetch("/api/teams"),
        ]);
        const md = await mr.json();
        const td = await tr.json();
        setMatches(Array.isArray(md) ? md : []);
        setTeams(Array.isArray(td) ? td : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const sortedMatches = useMemo(() => {
    const byTime = (a: MatchRow, b: MatchRow) =>
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
    const live = matches.filter((m) => m.status === "live").sort(byTime);
    const rest = matches.filter((m) => m.status !== "live").sort(byTime);
    return [...live, ...rest];
  }, [matches]);

  useEffect(() => {
    if (!selectedMatch) {
      setEvents([]);
      return;
    }
    let cancelled = false;
    setLoadingEvents(true);
    fetch(`/api/matches/${selectedMatch}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setEvents(Array.isArray(d.events) ? d.events : []);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingEvents(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMatch]);

  const current = matches.find((m) => m.id === selectedMatch);
  const getTeamName = (id: string) =>
    teams.find((t) => t.id === id)?.short_name || id.slice(0, 8);

  function resetForm() {
    setEditingId(null);
    setEventType("goal");
    setPlayerName("");
    setMinute("");
    const m = matches.find((x) => x.id === selectedMatch);
    if (m) setTeamId(m.home_team_id);
  }

  useEffect(() => {
    if (!selectedMatch) return;
    setEditingId(null);
    setMessage("");
  }, [selectedMatch]);

  useEffect(() => {
    if (!selectedMatch) return;
    const m = matches.find((x) => x.id === selectedMatch);
    if (m) setTeamId(m.home_team_id);
  }, [selectedMatch, matches]);

  async function refreshEvents() {
    if (!selectedMatch) return;
    setLoadingEvents(true);
    const r = await fetch(`/api/matches/${selectedMatch}`, {
      cache: "no-store",
    });
    const d = await r.json();
    setEvents(Array.isArray(d.events) ? d.events : []);
    setLoadingEvents(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMatch || !teamId) {
      setMessage("Chọn trận và đội");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      let minuteNum: number | null = null;
      if (minute !== "") {
        const n = Math.trunc(Number(minute));
        if (!Number.isFinite(n)) {
          setMessage("Phút không hợp lệ");
          setSaving(false);
          return;
        }
        minuteNum = n;
      }

      if (editingId) {
        const res = await fetch("/api/admin/match-events", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            id: editingId,
            team_id: teamId,
            event_type: eventType,
            player_name: playerName.trim() || null,
            minute: minuteNum,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage(data.error || "Lỗi cập nhật");
          return;
        }
        setMessage("✓ Đã cập nhật sự kiện");
      } else {
        const res = await fetch("/api/admin/match-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            match_id: selectedMatch,
            team_id: teamId,
            event_type: eventType,
            player_name: playerName.trim() || null,
            minute: minuteNum,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage(data.error || "Lỗi thêm sự kiện");
          return;
        }
        setMessage("✓ Đã thêm sự kiện");
      }
      resetForm();
      await refreshEvents();
    } catch (err) {
      console.error(err);
      setMessage("Lỗi mạng");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(ev: MatchEvent) {
    setEditingId(ev.id);
    setTeamId(ev.team_id);
    setEventType(ev.event_type);
    setPlayerName(ev.player_name || "");
    setMinute(ev.minute != null ? String(ev.minute) : "");
    setMessage("");
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa sự kiện này?")) return;
    setMessage("");
    try {
      const res = await fetch(
        `/api/admin/match-events?id=${encodeURIComponent(id)}`,
        { method: "DELETE", credentials: "include" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Không xóa được");
        return;
      }
      if (editingId === id) {
        resetForm();
      }
      setMessage("✓ Đã xóa");
      await refreshEvents();
    } catch {
      setMessage("Lỗi mạng");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          Diễn biến trận đấu
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Chọn trận, thêm / sửa / xóa sự kiện (ghi bàn, thẻ, phút).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <Card className="min-w-0 border-border">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Chọn trận & biểu mẫu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Trận đấu</Label>
              <Select value={selectedMatch} onValueChange={setSelectedMatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trận..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {sortedMatches.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {getTeamName(m.home_team_id)} vs{" "}
                      {getTeamName(m.away_team_id)}
                      {m.status === "live" ? " · LIVE" : ""} ·{" "}
                      {new Date(m.scheduled_at).toLocaleString("vi-VN")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMatch && current && (
              <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
                {current.status === "live" && (
                  <p className="rounded-md border border-blue-500/35 bg-blue-500/10 px-3 py-2 text-sm text-blue-800 dark:text-blue-200">
                    Trận <strong>đang diễn ra</strong> — ghi diễn biến tại đây;
                    cập nhật tỉ số ở trang{" "}
                    <strong>Tỉ số &amp; trạng thái</strong>.
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {editingId ? "Sửa sự kiện" : "Thêm sự kiện mới"}
                </p>

                <div className="space-y-2">
                  <Label>Đội</Label>
                  <Select value={teamId} onValueChange={setTeamId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={current.home_team_id}>
                        Nhà: {getTeamName(current.home_team_id)}
                      </SelectItem>
                      <SelectItem value={current.away_team_id}>
                        Khách: {getTeamName(current.away_team_id)}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Loại</Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cầu thủ / mô tả</Label>
                  <Input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Tên cầu thủ"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phút</Label>
                  <Input
                    type="number"
                    min={0}
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                    placeholder="VD: 45"
                  />
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

                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving
                      ? "Đang lưu..."
                      : editingId
                        ? "Cập nhật"
                        : "Thêm mới"}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setMessage("");
                      }}
                    >
                      Hủy sửa
                    </Button>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Danh sách sự kiện
              {selectedMatch && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {loadingEvents ? "(đang tải...)" : `(${events.length})`}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedMatch ? (
              <p className="text-sm text-muted-foreground">Chọn một trận.</p>
            ) : loadingEvents ? (
              <p className="text-sm text-muted-foreground">Đang tải...</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có sự kiện.</p>
            ) : (
              <ul className="max-h-72 space-y-2 overflow-y-auto sm:max-h-96 lg:max-h-128">
                {[...events]
                  .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))
                  .map((ev) => (
                    <li
                      key={ev.id}
                      className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 text-sm">
                        <span className="font-semibold text-foreground">
                          {EVENT_TYPES.find((x) => x.value === ev.event_type)
                            ?.label || ev.event_type}
                        </span>
                        <span className="text-muted-foreground"> · </span>
                        <span className="text-foreground">
                          {getTeamName(ev.team_id)}
                        </span>
                        {ev.player_name && (
                          <>
                            <span className="text-muted-foreground"> — </span>
                            <span>{ev.player_name}</span>
                          </>
                        )}
                        {ev.minute != null && (
                          <span className="text-muted-foreground">
                            {" "}
                            ({ev.minute}&apos;)
                          </span>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(ev)}
                        >
                          Sửa
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(ev.id)}
                        >
                          Xóa
                        </Button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

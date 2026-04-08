"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Team } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Settings = {
  group_count: number;
  teams_per_group: number;
  updated_at?: string;
};

function groupLetters(count: number): string[] {
  return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
}

export default function AdminGroupsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [settings, setSettings] = useState<Settings>({
    group_count: 4,
    teams_per_group: 4,
  });
  const [groupCountInput, setGroupCountInput] = useState("4");
  const [teamsPerGroupInput, setTeamsPerGroupInput] = useState("4");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [setupBanner, setSetupBanner] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    setSetupBanner(null);
    try {
      const [tr, sr] = await Promise.all([
        fetch("/api/teams"),
        fetch("/api/admin/tournament-settings", { credentials: "include" }),
      ]);
      const td = await tr.json();
      setTeams(Array.isArray(td) ? td : []);

      if (sr.ok) {
        const sd = await sr.json();
        if (sd && typeof sd.group_count === "number") {
          setSettings({
            group_count: sd.group_count,
            teams_per_group: sd.teams_per_group,
            updated_at: sd.updated_at,
          });
          setGroupCountInput(String(sd.group_count));
          setTeamsPerGroupInput(String(sd.teams_per_group));
        }
        if (sd?.setupRequired && typeof sd.setupHint === "string") {
          setSetupBanner(sd.setupHint);
        }
      } else {
        const err = await sr.json().catch(() => ({}));
        setMessage(
          err.error ||
            "Không đọc cấu hình bảng. Chạy scripts/013-tournament-settings.sql và scripts/014-rls-anon-writes-admin.sql.",
        );
      }
    } catch (e) {
      console.error(e);
      setMessage("Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const letters = useMemo(
    () => groupLetters(settings.group_count),
    [settings.group_count],
  );

  const countsByGroup = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of teams) {
      map[t.group_name] = (map[t.group_name] ?? 0) + 1;
    }
    return map;
  }, [teams]);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    const gc = parseInt(groupCountInput, 10);
    const tp = parseInt(teamsPerGroupInput, 10);
    if (
      Number.isNaN(gc) ||
      gc < 1 ||
      gc > 12 ||
      Number.isNaN(tp) ||
      tp < 1 ||
      tp > 16
    ) {
      setMessage("Số bảng 1–12, số đội/bảng 1–16");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/tournament-settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_count: gc,
          teams_per_group: tp,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Lưu thất bại");
        return;
      }
      if (data.settings) {
        setSettings(data.settings);
        setGroupCountInput(String(data.settings.group_count));
        setTeamsPerGroupInput(String(data.settings.teams_per_group));
      }
      await load();
    } catch (err) {
      console.error(err);
      setMessage("Lỗi mạng");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="text-muted-foreground text-sm">Đang tải cấu hình…</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Quản lý vòng bảng
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Số bảng (A, B, …) và số đội tối đa gợi ý mỗi bảng. Đội thực tế gán ở
          trang Đội (kể cả bảng K).
        </p>
      </div>

      {setupBanner ? (
        <p
          className="text-sm rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-950 dark:text-amber-100"
          role="status"
        >
          {setupBanner}
        </p>
      ) : null}

      {message ? (
        <p className="text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : null}

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Tham số giải</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={saveSettings}
            className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <div className="grid gap-2">
              <Label htmlFor="gc">Số lượng bảng</Label>
              <Input
                id="gc"
                type="number"
                min={1}
                max={12}
                value={groupCountInput}
                onChange={(e) => setGroupCountInput(e.target.value)}
                className="w-32"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tp">Số đội / 1 bảng (gợi ý)</Label>
              <Input
                id="tp"
                type="number"
                min={1}
                max={16}
                value={teamsPerGroupInput}
                onChange={(e) => setTeamsPerGroupInput(e.target.value)}
                className="w-32"
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu cấu hình"}
            </Button>
          </form>
          {settings.updated_at ? (
            <p className="text-xs text-muted-foreground mt-3">
              Cập nhật lần cuối:{" "}
              {new Date(settings.updated_at).toLocaleString("vi-VN")}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Số đội theo bảng</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bảng</TableHead>
                <TableHead>Số đội hiện có</TableHead>
                <TableHead>Gợi ý tối đa</TableHead>
                <TableHead>Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {letters.map((g) => {
                const n = countsByGroup[g] ?? 0;
                const over = n > settings.teams_per_group;
                return (
                  <TableRow key={g}>
                    <TableCell className="font-medium">{g}</TableCell>
                    <TableCell>{n}</TableCell>
                    <TableCell>{settings.teams_per_group}</TableCell>
                    <TableCell>
                      {over ? (
                        <span className="text-destructive text-sm">
                          Vượt gợi ý ({n} &gt; {settings.teams_per_group})
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">OK</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {countsByGroup["K"] != null && countsByGroup["K"]! > 0 ? (
                <TableRow>
                  <TableCell className="font-medium">K</TableCell>
                  <TableCell>{countsByGroup["K"]}</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    Đội knockout / dự bị (ngoài vòng bảng A…)
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

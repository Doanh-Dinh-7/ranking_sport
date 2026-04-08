"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Team } from "@/lib/supabase";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatStageLabel } from "@/lib/bracket-utils";

type Venue = {
  id: string;
  name: string;
};

type MatchRow = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  venue_id: string;
  scheduled_at: string;
  home_score: number | null;
  away_score: number | null;
  stage: string;
  status: string;
  bracket_slot?: number | null;
};

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function stageLabelAdmin(stage: string): string {
  if (stage === "group") return "Vòng bảng";
  if (stage === "qf") return "Tứ kết";
  if (stage === "sf") return "Bán kết";
  if (stage === "final") return "Chung kết";
  if (stage === "third_place") return "Tranh hạng 3";
  return stage;
}

function statusLabel(s: string): string {
  if (s === "scheduled") return "Chờ đá";
  if (s === "live") return "Đang đá";
  if (s === "finished") return "Kết thúc";
  return s;
}

export default function AdminSchedulesPage() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [homeId, setHomeId] = useState("");
  const [awayId, setAwayId] = useState("");
  const [venueId, setVenueId] = useState("");
  const [scheduledLocal, setScheduledLocal] = useState("");
  const [stage, setStage] = useState("group");
  const [status, setStatus] = useState("scheduled");
  const [bracketSlot, setBracketSlot] = useState("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const teamMap = useMemo(
    () => Object.fromEntries(teams.map((t) => [t.id, t])),
    [teams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const [mr, tr, vr] = await Promise.all([
        fetch("/api/matches"),
        fetch("/api/teams"),
        fetch("/api/venues"),
      ]);
      const md = await mr.json();
      const td = await tr.json();
      const vd = await vr.json();
      setMatches(Array.isArray(md) ? md : []);
      setTeams(Array.isArray(td) ? td : []);
      setVenues(Array.isArray(vd) ? vd : []);
    } catch (e) {
      console.error(e);
      setMessage("Không tải được lịch thi đấu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(
    () =>
      [...matches].sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime(),
      ),
    [matches],
  );

  function resetForm() {
    setHomeId(teams[0]?.id ?? "");
    setAwayId(teams[1]?.id ?? teams[0]?.id ?? "");
    setVenueId(venues[0]?.id ?? "");
    setScheduledLocal(toDatetimeLocalValue(new Date().toISOString()));
    setStage("group");
    setStatus("scheduled");
    setBracketSlot("");
    setHomeScore("");
    setAwayScore("");
  }

  function openCreate() {
    setEditingId(null);
    resetForm();
    setCreateOpen(true);
    setMessage("");
  }

  function openEdit(m: MatchRow) {
    setEditingId(m.id);
    setHomeId(m.home_team_id);
    setAwayId(m.away_team_id);
    setVenueId(m.venue_id);
    setScheduledLocal(toDatetimeLocalValue(m.scheduled_at));
    setStage(m.stage);
    setStatus(m.status);
    setBracketSlot(
      m.bracket_slot != null && m.bracket_slot !== undefined
        ? String(m.bracket_slot)
        : "",
    );
    setHomeScore(m.home_score != null ? String(m.home_score) : "");
    setAwayScore(m.away_score != null ? String(m.away_score) : "");
    setEditOpen(true);
    setMessage("");
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduledLocal) {
      setMessage("Chọn ngày giờ trận");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const body: Record<string, unknown> = {
        home_team_id: homeId,
        away_team_id: awayId,
        venue_id: venueId,
        scheduled_at: new Date(scheduledLocal).toISOString(),
        stage,
        status,
      };
      if (bracketSlot.trim() !== "") {
        body.bracket_slot = parseInt(bracketSlot, 10);
      }
      const res = await fetch("/api/admin/schedules", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Không tạo được trận");
        return;
      }
      setCreateOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      setMessage("Lỗi mạng");
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !scheduledLocal) {
      setMessage("Thiếu dữ liệu");
      return;
    }
    if (status === "finished" || status === "live") {
      if (homeScore === "" || awayScore === "") {
        setMessage("Trạng thái này cần tỉ số nhà và khách");
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
        home_team_id: homeId,
        away_team_id: awayId,
        venue_id: venueId,
        scheduled_at: new Date(scheduledLocal).toISOString(),
        stage,
        status,
      };
      if (bracketSlot.trim() === "") {
        body.bracket_slot = null;
      } else {
        body.bracket_slot = parseInt(bracketSlot, 10);
      }
      if (status === "finished" || status === "live") {
        body.home_score =
          homeScore === "" ? null : parseInt(homeScore, 10);
        body.away_score =
          awayScore === "" ? null : parseInt(awayScore, 10);
      } else {
        body.home_score = null;
        body.away_score = null;
      }

      const res = await fetch(`/api/admin/schedules/${editingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Không cập nhật được");
        return;
      }
      setEditOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      setMessage("Lỗi mạng");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/schedules/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Không xóa được");
        return;
      }
      setDeleteId(null);
      await load();
    } catch (e) {
      console.error(e);
      setMessage("Lỗi xóa");
    } finally {
      setSaving(false);
    }
  }

  const formFields = (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Đội nhà</Label>
          <Select value={homeId} onValueChange={setHomeId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn đội" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.short_name} — {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Đội khách</Label>
          <Select value={awayId} onValueChange={setAwayId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn đội" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.short_name} — {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Sân</Label>
        <Select value={venueId} onValueChange={setVenueId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn sân" />
          </SelectTrigger>
          <SelectContent>
            {venues.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="sched">Thời gian (local)</Label>
        <Input
          id="sched"
          type="datetime-local"
          value={scheduledLocal}
          onChange={(e) => setScheduledLocal(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Giai đoạn</Label>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="group">{stageLabelAdmin("group")}</SelectItem>
              <SelectItem value="qf">{stageLabelAdmin("qf")}</SelectItem>
              <SelectItem value="sf">{stageLabelAdmin("sf")}</SelectItem>
              <SelectItem value="final">{stageLabelAdmin("final")}</SelectItem>
              <SelectItem value="third_place">
                {stageLabelAdmin("third_place")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Trạng thái</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">
                {statusLabel("scheduled")}
              </SelectItem>
              <SelectItem value="live">{statusLabel("live")}</SelectItem>
              <SelectItem value="finished">
                {statusLabel("finished")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="slot">Bracket slot (tùy chọn, knockout)</Label>
        <Input
          id="slot"
          type="number"
          placeholder="Để trống nếu không dùng"
          value={bracketSlot}
          onChange={(e) => setBracketSlot(e.target.value)}
        />
      </div>
    </>
  );

  if (loading) {
    return (
      <p className="text-muted-foreground text-sm">Đang tải lịch thi đấu…</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Quản lý lịch thi đấu
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tạo / sửa / xóa trận. Tỉ số khi trạng thái chờ đá sẽ được xóa.
        </p>
      </div>

      {message ? (
        <p className="text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : null}

      <Card className="border-border">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Danh sách trận</CardTitle>
          <Button type="button" size="sm" onClick={openCreate}>
            Thêm trận
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Trận</TableHead>
                <TableHead>Giai đoạn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-end w-44">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Chưa có trận
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((m) => {
                  const h = teamMap[m.home_team_id];
                  const a = teamMap[m.away_team_id];
                  const tStr = new Date(m.scheduled_at).toLocaleString("vi-VN");
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {tStr}
                      </TableCell>
                      <TableCell className="text-sm">
                        {h && a ? (
                          <>
                            {h.short_name} vs {a.short_name}
                            {(m.status === "finished" || m.status === "live") &&
                            m.home_score != null &&
                            m.away_score != null ? (
                              <span className="text-muted-foreground ml-1">
                                ({m.home_score}–{m.away_score})
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            Đội không xác định
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatStageLabel(m.stage, h?.group_name)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {statusLabel(m.status)}
                      </TableCell>
                      <TableCell className="text-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(m)}
                        >
                          Sửa
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteId(m.id)}
                        >
                          Xóa
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <form onSubmit={submitCreate}>
            <DialogHeader>
              <DialogTitle>Thêm trận</DialogTitle>
              <DialogDescription>
                Chọn hai đội khác nhau, sân và thời gian.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">{formFields}</div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Đang lưu…" : "Tạo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <form onSubmit={submitEdit}>
            <DialogHeader>
              <DialogTitle>Sửa trận</DialogTitle>
              <DialogDescription>
                Kết thúc / đang đá: nhập tỉ số. Chờ đá: tỉ số sẽ bị xóa khi lưu.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {formFields}
              {(status === "finished" || status === "live") && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="hs">Tỉ số nhà</Label>
                    <Input
                      id="hs"
                      type="number"
                      min={0}
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="as">Tỉ số khách</Label>
                    <Input
                      id="as"
                      type="number"
                      min={0}
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Đang lưu…" : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa trận?</AlertDialogTitle>
            <AlertDialogDescription>
              Xóa vĩnh viễn trận này và mọi sự kiện liên quan (nếu có).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
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

type Settings = {
  group_count: number;
  teams_per_group: number;
};

function groupLetters(count: number): string[] {
  return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
}

function isProbablyUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [settings, setSettings] = useState<Settings>({
    group_count: 4,
    teams_per_group: 4,
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [groupName, setGroupName] = useState("A");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLabel, setDeleteLabel] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const [tr, sr] = await Promise.all([
        fetch("/api/teams"),
        fetch("/api/admin/tournament-settings", { credentials: "include" }),
      ]);
      const td = await tr.json();
      const sd = sr.ok ? await sr.json() : null;
      setTeams(Array.isArray(td) ? td : []);
      if (sd && typeof sd.group_count === "number") {
        setSettings({
          group_count: sd.group_count,
          teams_per_group: sd.teams_per_group,
        });
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

  const groupSelectOptions = useMemo(() => {
    const base = [...letters, "K"];
    if (groupName && !base.includes(groupName)) {
      return [...base, groupName];
    }
    return base;
  }, [letters, groupName]);

  function openCreate() {
    setEditingId(null);
    setName("");
    setShortName("");
    setLogoUrl("");
    setGroupName(letters[0] ?? "A");
    setDialogOpen(true);
    setMessage("");
  }

  function openEdit(t: Team) {
    setEditingId(t.id);
    setName(t.name);
    setShortName(t.short_name);
    setLogoUrl(t.logo_url ?? "");
    setGroupName(t.group_name);
    setDialogOpen(true);
    setMessage("");
  }

  async function submitTeam(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        name: name.trim(),
        short_name: shortName.trim(),
        logo_url: logoUrl.trim() || null,
        group_name: groupName,
      };
      const url = editingId
        ? `/api/admin/teams/${editingId}`
        : "/api/admin/teams";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Lỗi lưu");
        return;
      }
      setDialogOpen(false);
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
      const res = await fetch(`/api/admin/teams/${deleteId}`, {
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

  if (loading) {
    return (
      <p className="text-muted-foreground text-sm">Đang tải danh sách đội…</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Master data — Đội
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tạo mới chỉ nhận link logo (không upload file); xem trước ảnh từ
          URL.
        </p>
      </div>

      {message ? (
        <p className="text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : null}

      <Card className="border-border">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Danh sách đội</CardTitle>
          <Button type="button" size="sm" onClick={openCreate}>
            Thêm đội
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Logo</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead className="w-24">Viết tắt</TableHead>
                <TableHead className="w-20">Bảng</TableHead>
                <TableHead className="w-40 text-end">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Chưa có đội
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      {t.logo_url && isProbablyUrl(t.logo_url) ? (
                        <div className="relative h-9 w-9 overflow-hidden rounded-md ring-1 ring-border">
                          <Image
                            src={t.logo_url}
                            alt=""
                            width={36}
                            height={36}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.short_name}</TableCell>
                    <TableCell>{t.group_name}</TableCell>
                    <TableCell className="text-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(t)}
                      >
                        Sửa
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setDeleteId(t.id);
                          setDeleteLabel(t.name);
                        }}
                      >
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitTeam}>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Sửa đội" : "Thêm đội mới"}
              </DialogTitle>
              <DialogDescription>
                Dán URL ảnh logo (https://…). Không hỗ trợ tải file từ máy.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="team-name">Tên đội</Label>
                <Input
                  id="team-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="team-short">Tên viết tắt</Label>
                <Input
                  id="team-short"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="team-logo">Link logo</Label>
                <Input
                  id="team-logo"
                  type="url"
                  inputMode="url"
                  placeholder="https://..."
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  autoComplete="off"
                />
                {logoUrl.trim() && isProbablyUrl(logoUrl.trim()) ? (
                  <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 p-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md ring-1 ring-border">
                      <Image
                        src={logoUrl.trim()}
                        alt="Preview logo"
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                        unoptimized
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Xem trước (nếu URL hợp lệ và cho phép nhúng)
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label>Bảng</Label>
                <Select value={groupName} onValueChange={setGroupName}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groupSelectOptions.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g === "K" ? "K (knockout / dự bị)" : `Bảng ${g}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
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
            <AlertDialogTitle>Xóa đội?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteLabel}: mọi trận và dữ liệu liên quan có thể bị xóa theo
              CASCADE. Thao tác không hoàn tác.
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

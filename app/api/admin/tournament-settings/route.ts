import { verifyAdminToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

const DEFAULT_ROW = {
  id: "default",
  group_count: 4,
  teams_per_group: 4,
} as const;

/** PostgREST: bảng chưa tồn tại hoặc chưa vào schema cache sau khi tạo bảng. */
function isTournamentSettingsUnavailable(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST205") return true;
  return Boolean(
    error.message?.includes("tournament_settings") &&
      error.message?.toLowerCase().includes("could not find"),
  );
}

export async function GET() {
  try {
    if (!(await verifyAdminToken())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("tournament_settings")
      .select("id,group_count,teams_per_group,updated_at")
      .eq("id", "default")
      .maybeSingle();

    if (error) {
      if (isTournamentSettingsUnavailable(error)) {
        console.warn(
          "tournament-settings: bảng chưa có — trả mặc định. Chạy scripts/013-tournament-settings.sql trên Supabase.",
        );
        return NextResponse.json({
          ...DEFAULT_ROW,
          setupRequired: true as const,
          setupHint:
            "Chạy file scripts/013-tournament-settings.sql trong SQL Editor, sau đó scripts/014-rls-anon-writes-admin.sql để lưu được cấu hình.",
        });
      }
      console.error("tournament-settings GET:", error);
      return NextResponse.json(
        { error: error.message || "Không đọc được cấu hình" },
        { status: 500 },
      );
    }

    return NextResponse.json(data ?? DEFAULT_ROW);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await verifyAdminToken())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const group_count = Number(body.group_count);
    const teams_per_group = Number(body.teams_per_group);

    if (
      !Number.isInteger(group_count) ||
      group_count < 1 ||
      group_count > 12 ||
      !Number.isInteger(teams_per_group) ||
      teams_per_group < 1 ||
      teams_per_group > 16
    ) {
      return NextResponse.json(
        {
          error:
            "group_count (1–12) và teams_per_group (1–16) phải là số nguyên hợp lệ",
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("tournament_settings")
      .upsert(
        {
          id: "default",
          group_count,
          teams_per_group,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      )
      .select("id,group_count,teams_per_group,updated_at")
      .single();

    if (error) {
      console.error("tournament-settings PUT:", error);
      const setupMsg =
        "Tạo bảng và quyền ghi: chạy scripts/013-tournament-settings.sql rồi scripts/014-rls-anon-writes-admin.sql trong Supabase SQL Editor.";
      if (isTournamentSettingsUnavailable(error)) {
        return NextResponse.json({ error: setupMsg }, { status: 503 });
      }
      return NextResponse.json(
        {
          error: error.message || `Không lưu được. ${setupMsg}`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, settings: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

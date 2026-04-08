import { verifyAdminToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { revalidateTournamentData } from "@/lib/revalidate-tournament";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    if (!(await verifyAdminToken())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, short_name, logo_url, group_name } = body as {
      name?: string;
      short_name?: string;
      logo_url?: string | null;
      group_name?: string;
    };

    if (!name?.trim() || !short_name?.trim() || !group_name?.trim()) {
      return NextResponse.json(
        { error: "Thiếu tên đội, tên viết tắt hoặc bảng" },
        { status: 400 },
      );
    }

    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .insert({
        name: name.trim(),
        short_name: short_name.trim(),
        logo_url: logo_url?.trim() || null,
        group_name: group_name.trim().toUpperCase(),
      })
      .select(
        "id,name,short_name,logo_url,group_name,created_at",
      )
      .single();

    if (teamErr) {
      console.error("admin teams POST:", teamErr);
      return NextResponse.json(
        { error: teamErr.message || "Không thể tạo đội" },
        { status: 400 },
      );
    }

    const { error: stErr } = await supabase.from("standings").insert({
      team_id: team.id,
      group_name: team.group_name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      points: 0,
    });

    if (stErr) {
      console.error("admin standings insert:", stErr);
      await supabase.from("teams").delete().eq("id", team.id);
      return NextResponse.json(
        { error: "Không thể tạo bản ghi bảng xếp hạng" },
        { status: 500 },
      );
    }

    revalidateTournamentData();
    return NextResponse.json({ success: true, team }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

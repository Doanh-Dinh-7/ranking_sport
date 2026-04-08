import { verifyAdminToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { revalidateTournamentData } from "@/lib/revalidate-tournament";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await verifyAdminToken())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, short_name, logo_url, group_name } = body as {
      name?: string;
      short_name?: string;
      logo_url?: string | null;
      group_name?: string;
    };

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (short_name !== undefined) updates.short_name = String(short_name).trim();
    if (logo_url !== undefined) {
      updates.logo_url =
        logo_url === null || String(logo_url).trim() === ""
          ? null
          : String(logo_url).trim();
    }
    if (group_name !== undefined) {
      updates.group_name = String(group_name).trim().toUpperCase();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Không có dữ liệu cập nhật" }, {
        status: 400,
      });
    }

    const { data: team, error } = await supabase
      .from("teams")
      .update(updates)
      .eq("id", id)
      .select("id,name,short_name,logo_url,group_name,created_at")
      .single();

    if (error || !team) {
      console.error("admin teams PATCH:", error);
      return NextResponse.json(
        { error: error?.message || "Không tìm thấy đội" },
        { status: 400 },
      );
    }

    if (updates.group_name !== undefined) {
      await supabase
        .from("standings")
        .update({ group_name: team.group_name })
        .eq("team_id", id);
    }

    revalidateTournamentData();
    return NextResponse.json({ success: true, team });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await verifyAdminToken())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { error } = await supabase.from("teams").delete().eq("id", id);

    if (error) {
      console.error("admin teams DELETE:", error);
      return NextResponse.json(
        { error: error.message || "Không thể xóa đội" },
        { status: 400 },
      );
    }

    revalidateTournamentData();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

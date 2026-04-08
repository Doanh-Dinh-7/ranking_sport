import { verifyAdminToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { revalidateTournamentData } from "@/lib/revalidate-tournament";
import { NextResponse } from "next/server";

const STAGES = ["group", "qf", "sf", "final", "third_place"] as const;
const STATUSES = ["scheduled", "live", "finished"] as const;

function validStage(s: string): s is (typeof STAGES)[number] {
  return STAGES.includes(s as (typeof STAGES)[number]);
}

function validStatus(s: string): s is (typeof STATUSES)[number] {
  return STATUSES.includes(s as (typeof STATUSES)[number]);
}

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
    const {
      home_team_id,
      away_team_id,
      venue_id,
      scheduled_at,
      stage,
      status,
      bracket_slot,
      home_score,
      away_score,
    } = body as {
      home_team_id?: string;
      away_team_id?: string;
      venue_id?: string;
      scheduled_at?: string;
      stage?: string;
      status?: string;
      bracket_slot?: number | null | string;
      home_score?: number | null | string;
      away_score?: number | null | string;
    };

    const updates: Record<string, unknown> = {};

    if (home_team_id !== undefined) updates.home_team_id = home_team_id;
    if (away_team_id !== undefined) updates.away_team_id = away_team_id;
    if (venue_id !== undefined) updates.venue_id = venue_id;

    if (scheduled_at !== undefined) {
      const at = new Date(scheduled_at);
      if (Number.isNaN(at.getTime())) {
        return NextResponse.json({ error: "scheduled_at không hợp lệ" }, {
          status: 400,
        });
      }
      updates.scheduled_at = at.toISOString();
    }

    if (stage !== undefined) {
      if (!validStage(stage)) {
        return NextResponse.json({ error: "stage không hợp lệ" }, {
          status: 400,
        });
      }
      updates.stage = stage;
    }

    if (status !== undefined) {
      if (!validStatus(status)) {
        return NextResponse.json({ error: "status không hợp lệ" }, {
          status: 400,
        });
      }
      updates.status = status;
    }

    if (bracket_slot !== undefined) {
      if (bracket_slot === null || bracket_slot === "") {
        updates.bracket_slot = null;
      } else {
        const n = Number(bracket_slot);
        updates.bracket_slot = Number.isFinite(n) ? Math.trunc(n) : null;
      }
    }

    if (home_score !== undefined) {
      updates.home_score =
        home_score === null || home_score === ""
          ? null
          : Number(home_score);
    }
    if (away_score !== undefined) {
      updates.away_score =
        away_score === null || away_score === ""
          ? null
          : Number(away_score);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Không có dữ liệu cập nhật" }, {
        status: 400,
      });
    }

    const { data: cur } = await supabase
      .from("matches")
      .select("home_team_id,away_team_id")
      .eq("id", id)
      .single();

    if (updates.home_team_id && updates.away_team_id) {
      if (updates.home_team_id === updates.away_team_id) {
        return NextResponse.json(
          { error: "Hai đội phải khác nhau" },
          { status: 400 },
        );
      }
    } else if (cur) {
      const h = (updates.home_team_id as string) ?? cur.home_team_id;
      const a = (updates.away_team_id as string) ?? cur.away_team_id;
      if (h === a) {
        return NextResponse.json(
          { error: "Hai đội phải khác nhau" },
          { status: 400 },
        );
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data: match, error } = await supabase
      .from("matches")
      .update(updates)
      .eq("id", id)
      .select(
        "id,home_team_id,away_team_id,venue_id,scheduled_at,home_score,away_score,stage,status,bracket_slot,created_at,updated_at",
      )
      .single();

    if (error || !match) {
      console.error("schedules PATCH:", error);
      return NextResponse.json(
        { error: error?.message || "Không cập nhật được" },
        { status: 400 },
      );
    }

    revalidateTournamentData(id);
    return NextResponse.json({ success: true, match });
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
    const { error } = await supabase.from("matches").delete().eq("id", id);

    if (error) {
      console.error("schedules DELETE:", error);
      return NextResponse.json(
        { error: error.message || "Không xóa được" },
        { status: 400 },
      );
    }

    revalidateTournamentData(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

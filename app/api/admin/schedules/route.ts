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

export async function POST(request: Request) {
  try {
    if (!(await verifyAdminToken())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      home_team_id,
      away_team_id,
      venue_id,
      scheduled_at,
      stage = "group",
      status = "scheduled",
      bracket_slot,
    } = body as {
      home_team_id?: string;
      away_team_id?: string;
      venue_id?: string;
      scheduled_at?: string;
      stage?: string;
      status?: string;
      bracket_slot?: number | null | string;
    };

    if (!home_team_id || !away_team_id || !venue_id || !scheduled_at) {
      return NextResponse.json(
        { error: "Thiếu đội nhà, đội khách, sân hoặc thời gian" },
        { status: 400 },
      );
    }

    if (home_team_id === away_team_id) {
      return NextResponse.json(
        { error: "Hai đội phải khác nhau" },
        { status: 400 },
      );
    }

    if (!validStage(stage)) {
      return NextResponse.json({ error: "stage không hợp lệ" }, {
        status: 400,
      });
    }

    if (!validStatus(status)) {
      return NextResponse.json({ error: "status không hợp lệ" }, {
        status: 400,
      });
    }

    const at = new Date(scheduled_at);
    if (Number.isNaN(at.getTime())) {
      return NextResponse.json({ error: "scheduled_at không hợp lệ" }, {
        status: 400,
      });
    }

    let slot: number | null = null;
    if (
      bracket_slot !== undefined &&
      bracket_slot !== null &&
      String(bracket_slot).trim() !== ""
    ) {
      const n = Number(bracket_slot);
      slot = Number.isFinite(n) ? Math.trunc(n) : null;
    }

    const insertRow: Record<string, unknown> = {
      home_team_id,
      away_team_id,
      venue_id,
      scheduled_at: at.toISOString(),
      stage,
      status,
      home_score: null,
      away_score: null,
      updated_at: new Date().toISOString(),
    };
    if (slot !== null) insertRow.bracket_slot = slot;

    const { data: match, error } = await supabase
      .from("matches")
      .insert(insertRow)
      .select(
        "id,home_team_id,away_team_id,venue_id,scheduled_at,home_score,away_score,stage,status,bracket_slot,created_at,updated_at",
      )
      .single();

    if (error) {
      console.error("schedules POST:", error);
      return NextResponse.json(
        { error: error.message || "Không thể tạo trận" },
        { status: 400 },
      );
    }

    revalidateTournamentData(match.id);
    return NextResponse.json({ success: true, match }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

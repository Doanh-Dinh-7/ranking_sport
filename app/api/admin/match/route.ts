import { supabase } from "@/lib/supabase";
import { verifyAdminToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Verify admin token
    const isAdmin = await verifyAdminToken();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { match_id, home_score, away_score, events = [] } = body;

    if (!match_id || home_score === undefined || away_score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: match_id, home_score, away_score" },
        { status: 400 },
      );
    }

    // Update match status to finished
    const { data: updatedMatch, error: updateError } = await supabase
      .from("matches")
      .update({
        home_score,
        away_score,
        status: "finished",
        updated_at: new Date().toISOString(),
      })
      .eq("id", match_id)
      .select(
        `
        *,
        home_team:teams!home_team_id(*),
        away_team:teams!away_team_id(*),
        venue:venues(*)
      `,
      )
      .single();

    if (updateError) {
      console.error("Match update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update match" },
        { status: 500 },
      );
    }

    // Insert match events (goals, cards, etc.)
    if (events.length > 0) {
      const { error: eventsError } = await supabase.from("match_events").insert(
        events.map((event: any) => ({
          ...event,
          match_id,
        })),
      );

      if (eventsError) {
        console.error("Events insert error:", eventsError);
        // Don't fail the entire request if events fail
      }
    }

    // Fetch updated standings (trigger should have run automatically)
    const { data: standings, error: standingsError } = await supabase
      .from("standings")
      .select("*")
      .in("team_id", [updatedMatch.home_team_id, updatedMatch.away_team_id]);

    return NextResponse.json(
      {
        success: true,
        match: updatedMatch,
        standings: standings || [],
        message: "Match result saved and standings updated",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Match update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const isAdmin = await verifyAdminToken();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { match_id, home_score, away_score, status } = body as {
      match_id?: string;
      home_score?: number | null;
      away_score?: number | null;
      status?: string;
    };

    if (!match_id) {
      return NextResponse.json({ error: "Missing match_id" }, { status: 400 });
    }

    const { data: cur, error: curErr } = await supabase
      .from("matches")
      .select("*")
      .eq("id", match_id)
      .single();

    if (curErr || !cur) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const parseScore = (v: unknown): number | null => {
      if (v === null || v === undefined || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const merged = {
      status: status !== undefined ? status : cur.status,
      home_score:
        home_score !== undefined ? parseScore(home_score) : cur.home_score,
      away_score:
        away_score !== undefined ? parseScore(away_score) : cur.away_score,
    };

    if (merged.status === "finished" || merged.status === "live") {
      if (
        merged.home_score === null ||
        merged.away_score === null ||
        merged.home_score < 0 ||
        merged.away_score < 0
      ) {
        const label =
          merged.status === "live" ? "Đang diễn ra" : "Kết thúc";
        return NextResponse.json(
          {
            error: `Trạng thái "${label}" cần tỉ số nhà và khách (số nguyên ≥ 0)`,
          },
          { status: 400 },
        );
      }
    }

    if (merged.status === "scheduled") {
      merged.home_score = null;
      merged.away_score = null;
    }

    const { data: updatedMatch, error: updateError } = await supabase
      .from("matches")
      .update({
        status: merged.status,
        home_score: merged.home_score,
        away_score: merged.away_score,
        updated_at: new Date().toISOString(),
      })
      .eq("id", match_id)
      .select(
        `
        *,
        home_team:teams!home_team_id(*),
        away_team:teams!away_team_id(*),
        venue:venues(*)
      `,
      )
      .single();

    if (updateError) {
      console.error("Match PATCH error:", updateError);
      return NextResponse.json(
        { error: "Failed to update match" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        match: updatedMatch,
        message: "Đã cập nhật trận đấu",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Match PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Verify admin token
    const isAdmin = await verifyAdminToken();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { match_id, home_score, away_score } = body;

    if (!match_id) {
      return NextResponse.json({ error: "Missing match_id" }, { status: 400 });
    }

    // Update existing match
    const { data: updatedMatch, error: updateError } = await supabase
      .from("matches")
      .update({
        home_score,
        away_score,
        status: "finished",
        updated_at: new Date().toISOString(),
      })
      .eq("id", match_id)
      .select("*")
      .single();

    if (updateError) {
      console.error("Match update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update match" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        match: updatedMatch,
        message: "Match updated successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Match update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

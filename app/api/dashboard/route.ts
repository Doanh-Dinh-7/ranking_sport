import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [teamsRes, matchesRes, standingsRes] = await Promise.all([
      supabase
        .from("teams")
        .select("id,name,short_name,logo_url,group_name,created_at")
        .order("group_name", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("matches")
        .select(
          "id,home_team_id,away_team_id,venue_id,scheduled_at,home_score,away_score,stage,status,bracket_slot,created_at,updated_at",
        )
        .order("scheduled_at", { ascending: false }),
      supabase
        .from("standings")
        .select(
          "id,team_id,group_name,played,won,drawn,lost,goals_for,goals_against,points,updated_at",
        )
        .order("points", { ascending: false })
        .order("goals_against", { ascending: true })
        .order("goals_for", { ascending: false }),
    ]);

    if (teamsRes.error || matchesRes.error || standingsRes.error) {
      console.error("Dashboard query error:", {
        teams: teamsRes.error,
        matches: matchesRes.error,
        standings: standingsRes.error,
      });
      return NextResponse.json(
        { error: "Failed to fetch dashboard data" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        teams: teamsRes.data ?? [],
        matches: matchesRes.data ?? [],
        standings: standingsRes.data ?? [],
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

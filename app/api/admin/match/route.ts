import { supabase } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Verify admin token
    const isAdmin = await verifyAdminToken();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      match_id,
      home_score,
      away_score,
      events = [],
    } = body;

    if (!match_id || home_score === undefined || away_score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: match_id, home_score, away_score' },
        { status: 400 }
      );
    }

    // Update match status to finished
    const { data: updatedMatch, error: updateError } = await supabase
      .from('matches')
      .update({
        home_score,
        away_score,
        status: 'finished',
        updated_at: new Date().toISOString(),
      })
      .eq('id', match_id)
      .select(`
        *,
        home_team:teams!home_team_id(*),
        away_team:teams!away_team_id(*),
        venue:venues(*)
      `)
      .single();

    if (updateError) {
      console.error('Match update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update match' },
        { status: 500 }
      );
    }

    // Insert match events (goals, cards, etc.)
    if (events.length > 0) {
      const { error: eventsError } = await supabase
        .from('match_events')
        .insert(
          events.map((event: any) => ({
            ...event,
            match_id,
          }))
        );

      if (eventsError) {
        console.error('Events insert error:', eventsError);
        // Don't fail the entire request if events fail
      }
    }

    // Fetch updated standings (trigger should have run automatically)
    const { data: standings, error: standingsError } = await supabase
      .from('standings')
      .select('*')
      .in('team_id', [updatedMatch.home_team_id, updatedMatch.away_team_id]);

    return NextResponse.json(
      {
        success: true,
        match: updatedMatch,
        standings: standings || [],
        message: 'Match result saved and standings updated',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Match update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Verify admin token
    const isAdmin = await verifyAdminToken();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { match_id, home_score, away_score } = body;

    if (!match_id) {
      return NextResponse.json(
        { error: 'Missing match_id' },
        { status: 400 }
      );
    }

    // Update existing match
    const { data: updatedMatch, error: updateError } = await supabase
      .from('matches')
      .update({
        home_score,
        away_score,
        status: 'finished',
        updated_at: new Date().toISOString(),
      })
      .eq('id', match_id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Match update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update match' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        match: updatedMatch,
        message: 'Match updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Match update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

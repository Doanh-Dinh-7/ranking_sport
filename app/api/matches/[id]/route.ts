import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch match with related data
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select(`
        id,home_team_id,away_team_id,venue_id,scheduled_at,home_score,away_score,stage,status,bracket_slot,created_at,updated_at,
        home_team:teams!home_team_id(id,name,short_name,logo_url,group_name),
        away_team:teams!away_team_id(id,name,short_name,logo_url,group_name),
        venue:venues(id,name,address,lat,lng)
      `)
      .eq('id', id)
      .single();

    if (matchError || !matchData) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Fetch match events
    const { data: events, error: eventsError } = await supabase
      .from('match_events')
      .select('id,match_id,team_id,event_type,player_name,minute,created_at')
      .eq('match_id', id)
      .order('minute', { ascending: true });

    if (eventsError) {
      console.error('Events query error:', eventsError);
    }

    return NextResponse.json({
      ...matchData,
      events: events || [],
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=40',
      },
    });
  } catch (error) {
    console.error('Match detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

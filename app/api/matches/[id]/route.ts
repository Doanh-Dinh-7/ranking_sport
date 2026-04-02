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
        *,
        home_team:teams!home_team_id(*),
        away_team:teams!away_team_id(*),
        venue:venues(*)
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
      .select('*')
      .eq('match_id', id)
      .order('minute', { ascending: true });

    if (eventsError) {
      console.error('Events query error:', eventsError);
    }

    return NextResponse.json({
      ...matchData,
      events: events || [],
    });
  } catch (error) {
    console.error('Match detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

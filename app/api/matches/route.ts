import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const stage = url.searchParams.get('stage');
    const status = url.searchParams.get('status');

    let query = supabase
      .from('matches')
      .select(`
        id,home_team_id,away_team_id,venue_id,scheduled_at,home_score,away_score,stage,status,bracket_slot,created_at,updated_at,
        home_team:teams!home_team_id(id,name,short_name,logo_url,group_name),
        away_team:teams!away_team_id(id,name,short_name,logo_url,group_name),
        venue:venues(id,name,address,lat,lng)
      `)
      .order('scheduled_at', { ascending: false });

    if (stage) {
      query = query.eq('stage', stage);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Matches query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=40',
      },
    });
  } catch (error) {
    console.error('Matches error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

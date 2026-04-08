import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const group = url.searchParams.get('group');

    let query = supabase
      .from('standings')
      .select(
        'id,team_id,group_name,played,won,drawn,lost,goals_for,goals_against,points,updated_at'
      )
      .order('points', { ascending: false })
      .order('goals_against', { ascending: true })
      .order('goals_for', { ascending: false });

    if (group) {
      query = query.eq('group_name', group);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Standings query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch standings' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Standings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

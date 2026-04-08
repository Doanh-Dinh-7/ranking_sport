import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const group = url.searchParams.get('group');

    let query = supabase
      .from('teams')
      .select('id,name,short_name,logo_url,group_name,created_at')
      .order('group_name', { ascending: true })
      .order('name', { ascending: true });

    if (group) {
      query = query.eq('group_name', group);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Teams query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch teams' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Teams error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

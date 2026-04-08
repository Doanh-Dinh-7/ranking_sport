import { supabase } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { revalidateTournamentData } from '@/lib/revalidate-tournament';

const EVENT_TYPES = ['goal', 'own_goal', 'yellow', 'red'] as const;

function validEventType(t: string): t is (typeof EVENT_TYPES)[number] {
  return EVENT_TYPES.includes(t as (typeof EVENT_TYPES)[number]);
}


/** Thêm sự kiện */
export async function POST(request: Request) {
  try {
    if (!(await verifyAdminToken())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { match_id, team_id, event_type, player_name, minute } = body as {
      match_id?: string;
      team_id?: string;
      event_type?: string;
      player_name?: string | null;
      minute?: number | null | string;
    };

    if (!match_id || !team_id || !event_type) {
      return NextResponse.json(
        { error: 'Thiếu match_id, team_id hoặc event_type' },
        { status: 400 },
      );
    }

    if (!validEventType(event_type)) {
      return NextResponse.json(
        { error: `event_type phải là: ${EVENT_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    let minuteVal: number | null = null;
    if (minute !== null && minute !== undefined && minute !== '') {
      const n = Number(minute);
      minuteVal = Number.isFinite(n) ? Math.trunc(n) : null;
    }

    const { data: row, error } = await supabase
      .from('match_events')
      .insert({
        match_id,
        team_id,
        event_type,
        player_name: player_name?.trim() || null,
        minute: minuteVal,
      })
      .select('*')
      .single();

    if (error) {
      console.error('match_events POST:', error);
      return NextResponse.json(
        { error: 'Không thể thêm sự kiện' },
        { status: 500 },
      );
    }

    revalidateTournamentData(match_id);

    return NextResponse.json({ success: true, event: row }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/** Sửa sự kiện */
export async function PATCH(request: Request) {
  try {
    if (!(await verifyAdminToken())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, team_id, event_type, player_name, minute } = body as {
      id?: string;
      team_id?: string;
      event_type?: string;
      player_name?: string | null;
      minute?: number | null | string;
    };

    if (!id) {
      return NextResponse.json({ error: 'Thiếu id sự kiện' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (team_id !== undefined) updates.team_id = team_id;
    if (event_type !== undefined) {
      if (!validEventType(event_type)) {
        return NextResponse.json(
          { error: `event_type phải là: ${EVENT_TYPES.join(', ')}` },
          { status: 400 },
        );
      }
      updates.event_type = event_type;
    }
    if (player_name !== undefined) {
      updates.player_name = player_name?.trim() || null;
    }
    if (minute !== undefined) {
      if (minute === null || minute === '') {
        updates.minute = null;
      } else {
        const n = Number(minute);
        updates.minute = Number.isFinite(n) ? Math.trunc(n) : null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Không có trường nào để cập nhật' },
        { status: 400 },
      );
    }

    const { data: row, error } = await supabase
      .from('match_events')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('match_events PATCH:', error);
      return NextResponse.json(
        { error: 'Không thể cập nhật sự kiện' },
        { status: 500 },
      );
    }

    if (!row) {
      return NextResponse.json({ error: 'Không tìm thấy sự kiện' }, { status: 404 });
    }

    revalidateTournamentData((row as { match_id?: string }).match_id);

    return NextResponse.json({ success: true, event: row }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/** Xóa sự kiện — ?id=uuid */
export async function DELETE(request: Request) {
  try {
    if (!(await verifyAdminToken())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Thiếu ?id=' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('match_events')
      .select('match_id')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('match_events').delete().eq('id', id);

    if (error) {
      console.error('match_events DELETE:', error);
      return NextResponse.json(
        { error: 'Không thể xóa sự kiện' },
        { status: 500 },
      );
    }

    revalidateTournamentData(existing?.match_id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

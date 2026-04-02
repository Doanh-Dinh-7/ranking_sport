import type { Match, Team } from '@/lib/supabase';

export type MatchWithTeams = Match & {
  bracket_slot?: number | null;
  home_team?: Team;
  away_team?: Team;
  venue?: { name: string };
};

/** Winner of a finished knockout match (null = draw or not finished). */
export function getMatchWinner(m: MatchWithTeams): 'home' | 'away' | null {
  if (m.status !== 'finished' || m.home_score == null || m.away_score == null) return null;
  if (m.home_score > m.away_score) return 'home';
  if (m.away_score > m.home_score) return 'away';
  return null;
}

export function sortByBracketSlot(matches: MatchWithTeams[]): MatchWithTeams[] {
  return [...matches].sort((a, b) => (a.bracket_slot ?? 0) - (b.bracket_slot ?? 0));
}

/** QF index 0..3 → which SF (0|1) and home/away row. */
export const QF_TO_SF: { sfIndex: 0 | 1; side: 'home' | 'away' }[] = [
  { sfIndex: 0, side: 'home' },
  { sfIndex: 0, side: 'away' },
  { sfIndex: 1, side: 'home' },
  { sfIndex: 1, side: 'away' },
];

/** SF index → final home or away slot. */
export const SF_TO_FINAL: { side: 'home' | 'away' }[] = [
  { side: 'home' },
  { side: 'away' },
];

export function groupKnockoutMatches(matches: MatchWithTeams[]) {
  const ko = matches.filter((m) => ['qf', 'sf', 'final'].includes(m.stage));
  const qf = sortByBracketSlot(ko.filter((m) => m.stage === 'qf'));
  const sf = sortByBracketSlot(ko.filter((m) => m.stage === 'sf'));
  const finalMatch = sortByBracketSlot(ko.filter((m) => m.stage === 'final'))[0] ?? null;
  return { qf, sf, finalMatch };
}

/** Orthogonal path in container coordinates. */
export function orthPath(x1: number, y1: number, x2: number, y2: number, elbow = 32): string {
  const ex = Math.min(elbow, Math.abs(x2 - x1) / 3);
  const dir = x2 >= x1 ? 1 : -1;
  const hx = x1 + dir * ex;
  if (Math.abs(y2 - y1) < 4) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
  return `M ${x1} ${y1} L ${hx} ${y1} L ${hx} ${y2} L ${x2} ${y2}`;
}

export function formatStageLabel(stage: string, groupName?: string): string {
  if (stage === 'group') return `Bảng ${groupName ?? ''}`.trim();
  if (stage === 'qf') return 'Tứ kết';
  if (stage === 'sf') return 'Bán kết';
  if (stage === 'final') return 'Chung kết';
  if (stage === 'third_place') return 'Tranh hạng 3';
  return stage;
}

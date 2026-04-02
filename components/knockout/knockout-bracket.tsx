"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { MatchWithTeams } from "@/lib/bracket-utils";
import {
  getMatchWinner,
  groupKnockoutMatches,
  orthPath,
  QF_TO_SF,
  SF_TO_FINAL,
} from "@/lib/bracket-utils";
import { BracketMatchCard } from "./bracket-match-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

type RowPair = { home: HTMLDivElement | null; away: HTMLDivElement | null };

function rightEdge(el: HTMLElement, container: HTMLElement) {
  const r = el.getBoundingClientRect();
  const c = container.getBoundingClientRect();
  return { x: r.right - c.left, y: r.top - c.top + r.height / 2 };
}

function leftEdge(el: HTMLElement, container: HTMLElement) {
  const r = el.getBoundingClientRect();
  const c = container.getBoundingClientRect();
  return { x: r.left - c.left, y: r.top - c.top + r.height / 2 };
}

function midRight(
  home: HTMLElement,
  away: HTMLElement,
  container: HTMLElement,
) {
  const h = rightEdge(home, container);
  const a = rightEdge(away, container);
  return { x: h.x, y: (h.y + a.y) / 2 };
}

interface KnockoutBracketProps {
  matches: MatchWithTeams[];
}

function pathsSignature(
  paths: { d: string; active: boolean; key: string }[],
): string {
  return paths.map((p) => `${p.key}:${p.d}:${p.active}`).join("|");
}

export function KnockoutBracket({ matches }: KnockoutBracketProps) {
  const { qf, sf, finalMatch } = useMemo(
    () => groupKnockoutMatches(matches),
    [matches],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const qfRefs = useRef<RowPair[]>([
    { home: null, away: null },
    { home: null, away: null },
    { home: null, away: null },
    { home: null, away: null },
  ]);
  const sfRefs = useRef<RowPair[]>([
    { home: null, away: null },
    { home: null, away: null },
  ]);
  const finalRefs = useRef<RowPair>({ home: null, away: null });
  const championRef = useRef<HTMLDivElement>(null);

  const [lineVersion, setLineVersion] = useState(0);
  const [linePaths, setLinePaths] = useState<
    { d: string; active: boolean; key: string }[]
  >([]);
  const lastPathsSig = useRef("");

  const setQfHome = useCallback(
    (i: number) => (el: HTMLDivElement | null) => {
      qfRefs.current[i].home = el;
    },
    [],
  );
  const setQfAway = useCallback(
    (i: number) => (el: HTMLDivElement | null) => {
      qfRefs.current[i].away = el;
    },
    [],
  );
  const setSfHome = useCallback(
    (i: number) => (el: HTMLDivElement | null) => {
      sfRefs.current[i].home = el;
    },
    [],
  );
  const setSfAway = useCallback(
    (i: number) => (el: HTMLDivElement | null) => {
      sfRefs.current[i].away = el;
    },
    [],
  );
  const setFinalHome = useCallback((el: HTMLDivElement | null) => {
    finalRefs.current.home = el;
  }, []);
  const setFinalAway = useCallback((el: HTMLDivElement | null) => {
    finalRefs.current.away = el;
  }, []);

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const next: { d: string; active: boolean; key: string }[] = [];

    const add = (
      from: { x: number; y: number },
      to: { x: number; y: number },
      active: boolean,
      key: string,
    ) => {
      next.push({ d: orthPath(from.x, from.y, to.x, to.y), active, key });
    };

    for (let i = 0; i < 4; i++) {
      const m = qf[i];
      const qr = qfRefs.current[i];
      if (!m || !qr.home || !qr.away) continue;

      const { sfIndex, side } = QF_TO_SF[i];
      const sfM = sf[sfIndex];
      const sr = sfRefs.current[sfIndex];
      if (!sfM || !sr.home || !sr.away) continue;

      const w = getMatchWinner(m);
      const from =
        w === "home"
          ? rightEdge(qr.home, root)
          : w === "away"
            ? rightEdge(qr.away, root)
            : midRight(qr.home, qr.away, root);
      const toEl = side === "away" ? sr.away : sr.home;
      add(from, leftEdge(toEl, root), w !== null, `qf${i}-tosf${sfIndex}`);
    }

    const fr = finalRefs.current;
    if (finalMatch && fr.home && fr.away) {
      for (let s = 0; s < 2; s++) {
        const m = sf[s];
        const sr = sfRefs.current[s];
        if (!m || !sr.home || !sr.away) continue;

        const { side: finSide } = SF_TO_FINAL[s];
        const w = getMatchWinner(m);
        const from =
          w === "home"
            ? rightEdge(sr.home, root)
            : w === "away"
              ? rightEdge(sr.away, root)
              : midRight(sr.home, sr.away, root);
        const toEl = finSide === "away" ? fr.away : fr.home;
        add(from, leftEdge(toEl, root), w !== null, `sf${s}-final`);
      }

      const fm = finalMatch;
      const fw = getMatchWinner(fm);
      if (fw && championRef.current) {
        const fromEl = fw === "home" ? fr.home : fr.away;
        const from = rightEdge(fromEl, root);
        const champ = championRef.current;
        const r = champ.getBoundingClientRect();
        const c = root.getBoundingClientRect();
        const to = {
          x: r.left - c.left + r.width / 2,
          y: r.top - c.top + r.height / 2,
        };
        add(from, to, true, "final-champ");
      }
    }

    const sig = pathsSignature(next);
    if (sig !== lastPathsSig.current) {
      lastPathsSig.current = sig;
      setLinePaths(next);
    }
  }, [qf, sf, finalMatch, lineVersion]);

  /* Second pass: refs attach after first paint */
  useLayoutEffect(() => {
    if (qf.length === 0) return;
    const id = requestAnimationFrame(() => setLineVersion((v) => v + 1));
    return () => cancelAnimationFrame(id);
  }, [qf.length, sf.length]);

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setLineVersion((v) => v + 1));
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  if (qf.length === 0 && sf.length === 0 && !finalMatch) {
    return (
      <p className="text-muted-foreground text-center py-12">
        Chưa có lịch vòng loại trực tiếp. Chạy script{" "}
        <code className="text-xs bg-muted px-1 rounded">
          006-schedule-hugo-2026-bracket.sql
        </code>{" "}
        trên Supabase nếu cần dữ liệu mặc định.
      </p>
    );
  }

  const sf1Active = sf.some((m) => m.status === "scheduled");
  const qf0 = qf[0];
  const qf1 = qf[1];
  const qf2 = qf[2];
  const qf3 = qf[3];
  const sf0 = sf[0];
  const sf1 = sf[1];

  const finalWinner = finalMatch ? getMatchWinner(finalMatch) : null;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        className="absolute inset-0 w-full h-full min-h-[420px] pointer-events-none z-[1] overflow-visible"
        aria-hidden
      >
        {linePaths.map(({ d, active, key }) => (
          <path
            key={key}
            d={d}
            fill="none"
            strokeWidth={active ? 3 : 1.75}
            stroke={active ? "var(--bracket-line)" : "var(--border)"}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(!active && "opacity-60")}
          />
        ))}
      </svg>

      <div className="relative z-[2] flex flex-col xl:flex-row gap-8 xl:gap-10 items-center justify-center min-w-0 xl:min-w-[880px] py-6 px-2">
        <div className="flex flex-col gap-10 w-full max-w-lg xl:max-w-none">
          {(qf0 || qf1) && (
            <div className="flex items-center gap-3 xl:gap-5">
              <div className="flex flex-col gap-4 shrink-0">
                {qf0 && (
                  <BracketMatchCard
                    match={qf0}
                    setHomeRowRef={setQfHome(0)}
                    setAwayRowRef={setQfAway(0)}
                  />
                )}
                {qf1 && (
                  <BracketMatchCard
                    match={qf1}
                    setHomeRowRef={setQfHome(1)}
                    setAwayRowRef={setQfAway(1)}
                  />
                )}
              </div>
              {sf0 && (
                <div className="shrink-0">
                  <BracketMatchCard
                    match={sf0}
                    setHomeRowRef={setSfHome(0)}
                    setAwayRowRef={setSfAway(0)}
                  />
                </div>
              )}
            </div>
          )}

          {(qf2 || qf3) && (
            <div className="flex items-center gap-3 xl:gap-5">
              <div className="flex flex-col gap-4 shrink-0">
                {qf2 && (
                  <BracketMatchCard
                    match={qf2}
                    setHomeRowRef={setQfHome(2)}
                    setAwayRowRef={setQfAway(2)}
                  />
                )}
                {qf3 && (
                  <BracketMatchCard
                    match={qf3}
                    setHomeRowRef={setQfHome(3)}
                    setAwayRowRef={setQfAway(3)}
                  />
                )}
              </div>
              {sf1 && (
                <div className="shrink-0">
                  <BracketMatchCard
                    match={sf1}
                    setHomeRowRef={setSfHome(1)}
                    setAwayRowRef={setSfAway(1)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {finalMatch && (
          <div className="flex flex-col items-center gap-6 shrink-0">
            {sf1Active && (
              <Badge variant="secondary" className="text-xs">
                Bán kết đang diễn ra
              </Badge>
            )}
            <BracketMatchCard
              match={finalMatch}
              setHomeRowRef={setFinalHome}
              setAwayRowRef={setFinalAway}
            />
            <div
              ref={championRef}
              className="flex flex-col items-center gap-2 rounded-full border-2 border-primary/50 bg-card px-8 py-6 text-center"
            >
              <Trophy className="size-12 text-primary" strokeWidth={1.25} />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Vô địch
              </p>
              <p className="text-sm font-bold text-foreground">
                {finalWinner === "home"
                  ? (finalMatch.home_team?.name ?? "—")
                  : finalWinner === "away"
                    ? (finalMatch.away_team?.name ?? "—")
                    : "Chưa xác định"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

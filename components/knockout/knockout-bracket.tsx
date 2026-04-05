"use client";

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MatchWithTeams } from "@/lib/bracket-utils";
import {
  BRACKET_MATCH_CARD_WIDTH_PX,
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

type BracketLinePath = {
  d: string;
  active: boolean;
  key: string;
  dashed?: boolean;
};

function pathsSignature(paths: BracketLinePath[]): string {
  return paths
    .map((p) => `${p.key}:${p.d}:${p.active}:${p.dashed ? 1 : 0}`)
    .join("|");
}

function BracketStageHeader({
  children,
  live = false,
}: {
  children: ReactNode;
  live?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-muted/60 px-2 py-2.5 text-center shadow-sm",
        "flex min-h-14 flex-col items-center justify-center gap-1",
        live && "border-blue-500/35 bg-blue-500/6",
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span
          className={cn(
            "text-[11px] font-bold uppercase tracking-widest sm:text-xs",
            live ? "text-blue-700 dark:text-blue-400" : "text-foreground",
          )}
        >
          {children}
        </span>
        {live && (
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
          </span>
        )}
      </div>
      {live && (
        <span className="text-[10px] font-semibold leading-none text-blue-600 dark:text-blue-400">
          Đang diễn ra
        </span>
      )}
    </div>
  );
}

export function KnockoutBracket({ matches }: KnockoutBracketProps) {
  const { qf, sf, finalMatch, thirdPlaceMatch } = useMemo(
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
  const thirdRefs = useRef<RowPair>({ home: null, away: null });
  const championRef = useRef<HTMLDivElement>(null);

  const [lineVersion, setLineVersion] = useState(0);
  const [linePaths, setLinePaths] = useState<BracketLinePath[]>([]);
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
  const setThirdHome = useCallback((el: HTMLDivElement | null) => {
    thirdRefs.current.home = el;
  }, []);
  const setThirdAway = useCallback((el: HTMLDivElement | null) => {
    thirdRefs.current.away = el;
  }, []);

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const next: BracketLinePath[] = [];

    const add = (
      from: { x: number; y: number },
      to: { x: number; y: number },
      active: boolean,
      key: string,
      dashed?: boolean,
    ) => {
      next.push({
        d: orthPath(from.x, from.y, to.x, to.y),
        active,
        key,
        ...(dashed ? { dashed: true } : {}),
      });
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

    const tr = thirdRefs.current;
    if (thirdPlaceMatch && tr.home && tr.away) {
      for (let s = 0; s < 2; s++) {
        const m = sf[s];
        const sr = sfRefs.current[s];
        if (!m || !sr.home || !sr.away) continue;

        const w = getMatchWinner(m);
        const from =
          w === "home"
            ? rightEdge(sr.away, root)
            : w === "away"
              ? rightEdge(sr.home, root)
              : midRight(sr.home, sr.away, root);
        const toEl = s === 0 ? tr.home : tr.away;
        add(from, leftEdge(toEl, root), w !== null, `sf${s}-loser-third`, true);
      }
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
      const champEl = championRef.current;
      if (champEl) {
        const from =
          fw === "home"
            ? rightEdge(fr.home, root)
            : fw === "away"
              ? rightEdge(fr.away, root)
              : midRight(fr.home, fr.away, root);
        add(from, leftEdge(champEl, root), fw !== null, "final-champ");
      }
    }

    const sig = pathsSignature(next);
    if (sig !== lastPathsSig.current) {
      lastPathsSig.current = sig;
      setLinePaths(next);
    }
  }, [qf, sf, finalMatch, thirdPlaceMatch, lineVersion]);

  /* Second pass: refs attach after first paint */
  useLayoutEffect(() => {
    if (qf.length === 0 && sf.length === 0 && !finalMatch && !thirdPlaceMatch)
      return;
    const id = requestAnimationFrame(() => setLineVersion((v) => v + 1));
    return () => cancelAnimationFrame(id);
  }, [qf.length, sf.length, thirdPlaceMatch?.id, finalMatch?.id]);

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setLineVersion((v) => v + 1));
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  if (qf.length === 0 && sf.length === 0 && !finalMatch && !thirdPlaceMatch) {
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

  const qf0 = qf[0];
  const qf1 = qf[1];
  const qf2 = qf[2];
  const qf3 = qf[3];
  const sf0 = sf[0];
  const sf1 = sf[1];

  const finalWinner = finalMatch ? getMatchWinner(finalMatch) : null;

  /** Một vòng coi là xong khi mọi trận đã có tỉ số phân định (có đội thắng). */
  const { headerQfLive, headerSfLive, headerFinalLive } = useMemo(() => {
    const qfAllDecided =
      qf.length > 0 && qf.every((m) => getMatchWinner(m) !== null);
    const sfAllDecided =
      sf.length > 0 && sf.every((m) => getMatchWinner(m) !== null);
    const finalDecided = !finalMatch || getMatchWinner(finalMatch) !== null;
    const thirdDecided =
      !thirdPlaceMatch || getMatchWinner(thirdPlaceMatch) !== null;
    const finalColumnDecided = finalDecided && thirdDecided;
    const hasFinalColumn = finalMatch != null || thirdPlaceMatch != null;

    return {
      headerQfLive: qf.length > 0 && !qfAllDecided,
      headerSfLive: qfAllDecided && sf.length > 0 && !sfAllDecided,
      headerFinalLive:
        qfAllDecided && sfAllDecided && hasFinalColumn && !finalColumnDecided,
    };
  }, [qf, sf, finalMatch, thirdPlaceMatch]);

  const colTemplate = `repeat(4, minmax(${BRACKET_MATCH_CARD_WIDTH_PX}px, 1fr))`;

  return (
    <div
      className={cn(
        "w-full max-w-full overflow-auto overscroll-contain rounded-lg border border-border/70 bg-muted/10",
        "max-h-[min(88vh,920px)] touch-pan-x touch-pan-y",
        "[-webkit-overflow-scrolling:touch]",
      )}
      role="region"
      aria-label="Bảng bracket — cuộn để xem toàn bộ"
    >
      <div
        ref={containerRef}
        className="relative mx-auto w-max min-w-full px-4 py-5 sm:px-5 sm:py-6"
        style={{
          minWidth: `max(100%, ${BRACKET_MATCH_CARD_WIDTH_PX * 4 + 220}px)`,
        }}
      >
        <svg
          className="absolute inset-0 w-full h-full min-h-[480px] pointer-events-none z-1 overflow-visible"
          aria-hidden
        >
          {linePaths.map(({ d, active, key, dashed }) => (
            <path
              key={key}
              d={d}
              fill="none"
              strokeWidth={active ? 3 : 1.75}
              stroke={active ? "var(--bracket-line)" : "var(--border)"}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={dashed ? "3 7" : undefined}
              className={cn(!active && "opacity-60")}
            />
          ))}
        </svg>

        <div
          className="relative z-2 grid gap-x-10 gap-y-8"
          style={{
            gridTemplateColumns: colTemplate,
          }}
        >
          <BracketStageHeader live={headerQfLive}>Tứ kết</BracketStageHeader>
          <BracketStageHeader live={headerSfLive}>Bán kết</BracketStageHeader>
          <BracketStageHeader live={headerFinalLive}>
            Chung kết
          </BracketStageHeader>
          {/* Cột Vô địch: không dùng BracketStageHeader — canh chiều cao hàng tiêu đề */}
          <div className="min-h-14" aria-hidden />

          {(qf0 || qf1) && (
            <div className="col-start-1 row-start-2 flex flex-col gap-4 items-center justify-center">
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
          )}

          {sf0 && (
            <div className="col-start-2 row-start-2 flex items-center justify-center self-center">
              <BracketMatchCard
                match={sf0}
                setHomeRowRef={setSfHome(0)}
                setAwayRowRef={setSfAway(0)}
              />
            </div>
          )}

          {(thirdPlaceMatch || finalMatch) && (
            <div className="col-start-3 row-start-2 row-span-2 flex flex-col items-center gap-10 justify-center self-stretch min-h-0">
              {finalMatch && (
                <BracketMatchCard
                  match={finalMatch}
                  setHomeRowRef={setFinalHome}
                  setAwayRowRef={setFinalAway}
                />
              )}
              {thirdPlaceMatch && (
                <div className="flex flex-col items-center gap-3 w-full">
                  <Badge variant="outline" className="text-xs font-semibold">
                    Tranh hạng 3
                  </Badge>
                  <BracketMatchCard
                    match={thirdPlaceMatch}
                    setHomeRowRef={setThirdHome}
                    setAwayRowRef={setThirdAway}
                  />
                </div>
              )}
            </div>
          )}

          {finalMatch && (
            <div className="col-start-4 row-start-2 row-span-2 flex min-h-0 w-full items-center justify-center self-stretch">
              <div
                ref={championRef}
                className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-primary/50 bg-card px-6 py-6 text-center"
              >
                <Trophy className="size-12 text-primary" strokeWidth={1.25} />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Vô địch
                </p>
                <p className="text-sm font-bold text-foreground px-1">
                  {finalWinner === "home"
                    ? (finalMatch.home_team?.name ?? "—")
                    : finalWinner === "away"
                      ? (finalMatch.away_team?.name ?? "—")
                      : "Chưa xác định"}
                </p>
              </div>
            </div>
          )}

          {(qf2 || qf3) && (
            <div className="col-start-1 row-start-3 flex flex-col gap-4 items-center justify-center">
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
          )}

          {sf1 && (
            <div className="col-start-2 row-start-3 flex items-center justify-center self-center">
              <BracketMatchCard
                match={sf1}
                setHomeRowRef={setSfHome(1)}
                setAwayRowRef={setSfAway(1)}
              />
            </div>
          )}
          {!finalMatch &&
            !thirdPlaceMatch &&
            (qf.length > 0 || sf.length > 0) && (
              <div className="col-start-3 row-start-2 row-span-2 flex items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center">
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Lịch chung kết / tranh hạng 3 sẽ hiển thị khi có dữ liệu trận.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

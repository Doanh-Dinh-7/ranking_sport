"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { KnockoutBracket } from "@/components/knockout/knockout-bracket";
import type { MatchWithTeams } from "@/lib/bracket-utils";

export default function KnockoutPage() {
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/matches");
        const data = await res.json();
        if (!cancelled) setMatches(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Navbar />
      <main className="bg-background min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                Vòng loại trực tiếp
              </h1>
            </div>
          </div>

          {loading ? (
            <p className="text-muted-foreground text-center py-16">
              Loading...
            </p>
          ) : (
            <KnockoutBracket matches={matches} />
          )}
        </div>
      </main>
    </>
  );
}

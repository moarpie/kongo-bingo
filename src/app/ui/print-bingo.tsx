"use client";

import { Printer, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { OddsWord } from "@/lib/odds";
import TopNav from "./top-nav";
import {
  BOARD_COLS,
  JACKPOT_ODDS_MIN,
  ODDS_SPAN_MAX,
  ODDS_SPAN_MIN,
  buildBoard,
  createThresholds,
  randomSeed,
  type BoardCell,
} from "./bingo-utils";

function generateJob(
  odds: OddsWord[],
  count: number,
  thresholds: ReturnType<typeof createThresholds>,
) {
  const clamped = Math.max(1, Math.min(50, Math.floor(count)));
  const seeds: string[] = [];
  const seen = new Set<string>();

  while (seeds.length < clamped) {
    const next = randomSeed();
    if (seen.has(next)) continue;
    seen.add(next);
    seeds.push(next);
  }

  const boards = seeds.map((seed) =>
    buildBoard({
      odds,
      seed,
      thresholds,
      oddsSpanMin: ODDS_SPAN_MIN,
      oddsSpanMax: ODDS_SPAN_MAX,
      jackpotOddsMin: JACKPOT_ODDS_MIN,
    }),
  );

  return { seeds, boards };
}

export default function PrintBingo({ odds }: { odds: OddsWord[] }) {
  const thresholds = useMemo(
    () => createThresholds(ODDS_SPAN_MIN, ODDS_SPAN_MAX),
    [],
  );

  const [count, setCount] = useState(6);
  const [job, setJob] = useState(() => generateJob(odds, 6, thresholds));
  const [shouldPrint, setShouldPrint] = useState(false);

  useEffect(() => {
    if (!shouldPrint) return;
    const handleAfterPrint = () => setShouldPrint(false);
    window.addEventListener("afterprint", handleAfterPrint);
    const frame = window.requestAnimationFrame(() => window.print());

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
      window.cancelAnimationFrame(frame);
    };
  }, [shouldPrint]);

  const regenerateAll = () => setJob(generateJob(odds, count, thresholds));

  const applyCount = () => setJob(generateJob(odds, count, thresholds));

  return (
    <div className="main">
      <div className="print-only hidden bg-white text-black">
        <div className="mx-auto max-w-[210mm]">
          {Array.from({ length: Math.ceil(job.boards.length / 2) }).map(
            (_, pageIndex) => {
              const firstIndex = pageIndex * 2;
              const secondIndex = firstIndex + 1;
              const first = job.boards[firstIndex];
              const second = job.boards[secondIndex];

              return (
                <div key={`page-${pageIndex}`} className="break-after-page">
                  <div className="grid grid-rows-2 gap-6">
                    <PrintableBoard
                      seed={job.seeds[firstIndex]}
                      cells={first}
                    />
                    {second ? (
                      <PrintableBoard
                        seed={job.seeds[secondIndex]}
                        cells={second}
                      />
                    ) : (
                      <div />
                    )}
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>

      <div className="no-print mx-auto max-w-6xl px-2 py-8 sm:px-4 sm:py-12 md:px-8 md:py-16">
        <TopNav />

        <header className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold sm:text-5xl">
            Print bingoplader
          </h1>
          <p className="max-w-3xl text-base text-zinc-700 sm:text-lg dark:text-zinc-300">
            Vælg antal plader, generér dem, og print dem samlet (2 plader per A4
            side).
          </p>
        </header>

        <section className="rounded-2xl bg-white/70 p-4 shadow-lg shadow-orange-100 backdrop-blur sm:p-6 dark:border dark:border-amber-500/15 dark:bg-white/5 dark:shadow-none">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
              <label
                htmlFor="count"
                className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
              >
                Antal plader
              </label>
              <input
                id="count"
                type="number"
                min={1}
                max={50}
                inputMode="numeric"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-24 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:focus-visible:outline-amber-400"
              />
              <button
                onClick={applyCount}
                className="rounded-lg border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-amber-500/25 dark:bg-white/5 dark:text-amber-200 dark:hover:bg-white/10 dark:focus-visible:outline-amber-400"
              >
                Opdatér
              </button>
            </div>

            <button
              onClick={regenerateAll}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 dark:shadow-none dark:focus-visible:outline-amber-400"
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Bland pladerne
            </button>
          </div>
        </section>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {job.boards.map((board, idx) => (
            <PrintableBoard
              key={job.seeds[idx]}
              seed={job.seeds[idx]}
              cells={board}
            />
          ))}
        </div>

        <div className="no-print sticky bottom-0 mt-8 border-t border-orange-100 bg-white/70 px-2 py-4 backdrop-blur sm:px-4 dark:border-amber-500/15 dark:bg-zinc-950/60">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Klar til print: {job.boards.length} plader •{" "}
              {Math.ceil(job.boards.length / 2)} A4 sider
            </p>
            <button
              onClick={() => setShouldPrint(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 dark:shadow-none dark:focus-visible:outline-amber-400"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Print alle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintableBoard({ seed, cells }: { seed: string; cells: BoardCell[] }) {
  return (
    <div>
      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-amber-500/15 dark:bg-white/5 dark:shadow-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-600 dark:text-zinc-400">
              Konge-bingo
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Bingoplade (id: {seed})
            </p>
          </div>
          <div className="text-right text-[10px] text-zinc-500 dark:text-zinc-400">
            3×4 felter • 2-3 per række
          </div>
        </div>

        <div
          className="mt-3 grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${BOARD_COLS}, minmax(0, 1fr))`,
          }}
        >
          {cells.map((cell, index) => (
            <div
              key={`${seed}-${index}`}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-center text-xs font-semibold ${
                cell.empty
                  ? "border-zinc-200 bg-zinc-100 text-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-white/5"
                  : "border-zinc-300 dark:border-white/10"
              }`}
            >
              {cell.empty ? (
                <span className="sr-only">Tomt felt</span>
              ) : (
                <>
                  <span className="leading-tight">{cell.word}</span>
                  <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                    Odds: {cell.odds.toFixed(2)}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="print-only mt-3 hidden items-center justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Brikker (8 stk.)
        </p>
        <div
          className="inline-grid grid-cols-8"
          style={{ columnGap: "1mm", rowGap: "1mm" }}
        >
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={`${seed}-token-${idx}`}
              className="flex h-[12mm] w-[12mm] items-center justify-center rounded-sm bg-zinc-800 text-[14px] text-white"
              style={{ printColorAdjust: "exact" }}
            >
              👑
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

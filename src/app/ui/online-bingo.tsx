"use client";

import JSConfetti from "js-confetti";
import { Clipboard, RefreshCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { OddsWord } from "@/lib/odds";
import TopNav from "./top-nav";
import {
  BOARD_COLS,
  JACKPOT_ODDS_MIN,
  ODDS_SPAN_MAX,
  ODDS_SPAN_MIN,
  buildBoard,
  checkBingo,
  createThresholds,
  randomSeed,
  type BoardCell,
} from "./bingo-utils";

const CONFETTI_EMOJIS = ["🎉", "🎊", "🥂", "🍾", "✨", "👑", "🤴", "🇩🇰"] as const;

export default function OnlineBingo({ odds }: { odds: OddsWord[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jsConfetti = useMemo(() => new JSConfetti(), []);

  const thresholds = useMemo(
    () => createThresholds(ODDS_SPAN_MIN, ODDS_SPAN_MAX),
    [],
  );

  const initialSeed = searchParams.get("id") ?? randomSeed();
  const [seed, setSeed] = useState(initialSeed);
  const [cells, setCells] = useState<BoardCell[]>(() =>
    buildBoard({
      odds,
      seed: initialSeed,
      thresholds,
      oddsSpanMin: ODDS_SPAN_MIN,
      oddsSpanMax: ODDS_SPAN_MAX,
      jackpotOddsMin: JACKPOT_ODDS_MIN,
    }),
  );

  const hasBingo = useMemo(() => checkBingo(cells), [cells]);

  useEffect(() => {
    const currentId = searchParams.get("id");
    if (currentId !== seed) {
      router.replace(`?id=${seed}`, { scroll: false });
    }
  }, [seed, router, searchParams]);

  useEffect(() => {
    if (!hasBingo) return;
    void jsConfetti.addConfetti({
      emojis: [...CONFETTI_EMOJIS],
      emojiSize: 56,
      confettiNumber: 48,
    });
  }, [hasBingo, jsConfetti]);

  const regenerateBoard = (nextSeed?: string) => {
    const activeSeed = nextSeed ?? randomSeed();
    setSeed(activeSeed);
    setCells(
      buildBoard({
        odds,
        seed: activeSeed,
        thresholds,
        oddsSpanMin: ODDS_SPAN_MIN,
        oddsSpanMax: ODDS_SPAN_MAX,
        jackpotOddsMin: JACKPOT_ODDS_MIN,
      }),
    );
  };

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?id=${seed}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch (error) {
      console.error("Kunne ikke kopiere link", error);
    }
  };

  const toggleCell = (index: number) => {
    setCells((prev) => {
      const target = prev[index];
      if (target.empty) return prev;
      const next = [...prev];
      next[index] = { ...next[index], marked: !next[index].marked };
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-2 py-8 sm:px-4 sm:py-12 md:px-8 md:py-16">
      <TopNav />

      <header className="mb-10 flex flex-col gap-3">
        <h1 className="text-3xl font-semibold sm:text-5xl">
          Bingoplader til kongens nytårstale
        </h1>
        <p className="max-w-3xl text-base text-zinc-700 sm:text-lg dark:text-zinc-300">
          Siden genererer en unik bingoplade til Kongens Nytårstale. Hver plade er tilfældig, men kan deles med et ID i linket.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
        <section className="space-y-6 rounded-2xl bg-white/70 p-6 shadow-lg shadow-orange-100 backdrop-blur dark:border dark:border-amber-500/15 dark:bg-white/5 dark:shadow-none">
          <h2 className="text-xl font-semibold">Online</h2>

          <div className="space-y-3">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Aktuelt id:{" "}
              <span className="font-semibold text-orange-700 dark:text-amber-200">
                {seed}
              </span>
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => regenerateBoard()}
                  className="btn-gold inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:focus-visible:outline-amber-400"
                >
                  <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                  Ny tilfældig plade
                </button>
              <button
                onClick={copyLink}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 px-4 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 sm:w-40 dark:border-amber-500/25 dark:bg-white/5 dark:text-amber-200 dark:hover:bg-white/10 dark:focus-visible:outline-amber-400"
              >
                <Clipboard className="h-4 w-4" aria-hidden="true" />
                Kopiér link
              </button>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Del linket for at dele præcis samme plade. Nye plader får et nyt
              id i URL&apos;en.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-orange-100 bg-white/80 p-3 shadow-lg shadow-orange-100 backdrop-blur sm:p-6 dark:border-amber-500/15 dark:bg-white/5 dark:shadow-none">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-amber-200">
                  URL id: <span className="font-semibold">{seed}</span>
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Klik på udfyldte felter for at markere dem. Bingo giver
                  konfetti.
                </p>
              </div>
              <button
                onClick={() => regenerateBoard(seed)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-amber-500/25 dark:bg-white/5 dark:text-amber-200 dark:hover:bg-white/10 dark:focus-visible:outline-amber-400"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Ryd pladen
              </button>
            </div>

            <div
              className="grid gap-1 rounded-2xl bg-gradient-to-b from-orange-50 to-white p-1 shadow-inner sm:gap-2 sm:p-3 dark:from-white/10 dark:to-white/5 dark:shadow-none"
              style={{
                gridTemplateColumns: `repeat(${BOARD_COLS}, minmax(0, 1fr))`,
              }}
            >
              {cells.map((cell, index) => (
                <button
                  key={`${cell.word}-${index}`}
                  onClick={() => toggleCell(index)}
                  disabled={cell.empty}
                  className={`relative flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-center text-sm font-semibold transition shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:min-h-[88px] sm:px-2 sm:py-3 dark:shadow-none ${
                    cell.empty
                      ? "border-zinc-200 bg-zinc-200 text-zinc-200 dark:border-white/10 dark:bg-white/5 dark:text-white/5"
                      : "border-zinc-200 bg-white text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50"
                  } ${
                    cell.marked && !cell.empty
                      ? "kb-pop ring-2 ring-offset-2 ring-orange-500 dark:ring-amber-400 dark:ring-offset-zinc-950"
                      : ""
                  } ${cell.empty ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  {cell.empty ? (
                    <span className="sr-only">Tomt felt</span>
                  ) : (
                    <>
                      {cell.marked && (
                        <span
                          aria-hidden="true"
                          className="kb-crown pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 select-none text-xl drop-shadow sm:-top-6 sm:text-3xl"
                        >
                          👑
                        </span>
                      )}
                      <span className="w-full whitespace-normal break-words text-[13px] leading-tight sm:text-base">
                        {cell.word}
                      </span>
                      <span className="inline-flex items-center gap-2 text-[11px] font-medium text-zinc-700 sm:text-xs dark:text-zinc-300">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            cell.bucket === "grøn"
                              ? "bg-emerald-500"
                              : cell.bucket === "gul"
                                ? "bg-amber-500"
                                : "bg-rose-600"
                          }`}
                        />
                        Odds: {cell.odds.toFixed(2)}
                      </span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

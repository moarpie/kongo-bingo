"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clipboard, Printer, RefreshCcw, Trash2 } from "lucide-react";
import JSConfetti from "js-confetti";

import type { OddsWord } from "@/lib/odds";

type BoardCell = {
  word: string;
  odds: number;
  bucket?: "grøn" | "gul" | "jackpot";
  marked: boolean;
  empty?: boolean;
};

const BOARD_ROWS = 3;
const BOARD_COLS = 4;
const TOTAL_CELLS = BOARD_ROWS * BOARD_COLS;
const MIN_FILLED_PER_ROW = 2;
const MAX_FILLED_PER_ROW = 3;

// Odds-parametre kan redigeres her
// Alle "normale" udfyldte felter bliver trukket fra dette odd-spænd:
const ODDS_SPAN_MIN = 1;
const ODDS_SPAN_MAX = 8;
// Derudover: altid ét felt med "meget lav sandsynlighed" (dvs. høj odds)
const JACKPOT_ODDS_MIN = 100;

type Thresholds = {
  highMax: number;
  mediumMax: number;
};

const CONFETTI_EMOJIS = ["🎉", "🎊", "🥂", "🍾", "✨", "👑", "🤴", "🇩🇰"] as const;

export default function Bingo({ odds }: { odds: OddsWord[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jsConfetti = useMemo(() => new JSConfetti(), []);

  const initialSeed = searchParams.get("id") ?? randomSeed();
  const thresholds = useMemo(
    () => ({
      highMax: ODDS_SPAN_MIN + (ODDS_SPAN_MAX - ODDS_SPAN_MIN) * 0.33,
      mediumMax: ODDS_SPAN_MIN + (ODDS_SPAN_MAX - ODDS_SPAN_MIN) * 0.66,
    }),
    [],
  );

  const [seed, setSeed] = useState(initialSeed);
  const [cells, setCells] = useState<BoardCell[]>(() =>
    buildBoard(odds, initialSeed, thresholds),
  );

  const hasBingo = useMemo(() => checkBingo(cells), [cells]);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printCount, setPrintCount] = useState(4);
  const [printJob, setPrintJob] = useState<{
    seeds: string[];
    boards: BoardCell[][];
  } | null>(null);

  useEffect(() => {
    // Sikrer at URL altid indeholder det aktive id
    const currentId = searchParams.get("id");
    if (currentId !== seed) {
      router.replace(`?id=${seed}`, { scroll: false });
    }
  }, [seed, router, searchParams]);

  useEffect(() => {
    if (hasBingo) {
      fireConfetti(jsConfetti);
    }
  }, [hasBingo, jsConfetti]);

  const regenerateBoard = (nextSeed?: string) => {
    const activeSeed = nextSeed ?? randomSeed();
    setSeed(activeSeed);
    setCells(buildBoard(odds, activeSeed, thresholds));
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

  useEffect(() => {
    if (!printJob) return;

    const handleAfterPrint = () => setPrintJob(null);
    window.addEventListener("afterprint", handleAfterPrint);

    const frame = window.requestAnimationFrame(() => {
      window.print();
    });

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
      window.cancelAnimationFrame(frame);
    };
  }, [printJob]);

  const startPrint = () => {
    const clamped = Math.max(1, Math.min(50, Math.floor(printCount)));
    const seeds: string[] = [];
    const seen = new Set<string>();

    while (seeds.length < clamped) {
      const next = randomSeed();
      if (seen.has(next)) continue;
      seen.add(next);
      seeds.push(next);
    }

    setPrintJob({
      seeds,
      boards: seeds.map((id) => buildBoard(odds, id, thresholds)),
    });
    setIsPrintDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 text-zinc-900 selection:bg-orange-200/70 selection:text-zinc-900 dark:bg-gradient-to-br dark:from-slate-950 dark:via-zinc-950 dark:to-amber-950 dark:text-zinc-50 dark:selection:bg-amber-400/30 dark:selection:text-zinc-50">
      <div className="print-only hidden bg-white text-black">
        <div className="mx-auto max-w-[210mm]">
          {printJob &&
            Array.from({
              length: Math.ceil(printJob.boards.length / 2),
            }).map((_, pageIndex) => {
              const firstIndex = pageIndex * 2;
              const secondIndex = firstIndex + 1;
              const first = printJob.boards[firstIndex];
              const second = printJob.boards[secondIndex];

              return (
                <div key={`page-${pageIndex}`} className="break-after-page">
                  <div className="grid grid-rows-2 gap-6">
                    <PrintableBoard
                      seed={printJob.seeds[firstIndex]}
                      cells={first}
                    />
                    {second ? (
                      <PrintableBoard
                        seed={printJob.seeds[secondIndex]}
                        cells={second}
                      />
                    ) : (
                      <div />
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="no-print mx-auto max-w-6xl px-2 py-8 sm:px-4 sm:py-12 md:px-8 md:py-16">
        <header className="mb-10 flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-orange-600 dark:text-amber-300">
            Konge-bingo
          </p>
          <h1 className="text-3xl font-semibold sm:text-5xl">
            🥂 Bingoplader til kongens nytårstale 🍾
          </h1>
          <p className="max-w-3xl text-base text-zinc-700 sm:text-lg dark:text-zinc-300">
            Pladen er 3 rækker x 4 kolonner. Hver række udfyldes tilfældigt med
            2-3 felter; URL&apos;ens id genskaber samme plade.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
          <section className="space-y-6 rounded-2xl bg-white/70 p-6 shadow-lg shadow-orange-100 backdrop-blur dark:border dark:border-amber-500/15 dark:bg-white/5 dark:shadow-none">
            <h2 className="text-xl font-semibold">Plade</h2>
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => regenerateBoard()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 dark:shadow-none dark:focus-visible:outline-amber-400"
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
              <button
                onClick={() => setIsPrintDialogOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 px-4 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-amber-500/25 dark:bg-white/5 dark:text-amber-200 dark:hover:bg-white/10 dark:focus-visible:outline-amber-400"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                Print plader
              </button>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Del linket for at dele præcis samme plade. Nye plader får et nyt
                id i URL&apos;en.
              </p>
            </div>

            {/* <div className="rounded-xl border border-zinc-100 bg-white px-4 py-3 text-sm text-zinc-700">
              <p className="font-semibold text-zinc-900">Aktuel fordeling</p>
              <p>
                Grøn: {counts.green} | Gul: {counts.yellow} | Jackpot:{" "}
                {counts.jackpot}
                {" | "}Tomme: {counts.empty}
              </p>
              <p className="text-xs text-zinc-500">
                Udfyldt: {counts.filled} / {TOTAL_CELLS} (2-3 felter per række).
              </p>
            </div> */}
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
                        ? "border-zinc-200 bg-zinc-100 text-zinc-200 dark:border-white/10 dark:bg-white/5 dark:text-white/5"
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
                            className="kb-crown pointer-events-none absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2 select-none text-xl drop-shadow sm:text-3xl"
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

        <footer className="mt-10 text-xs text-zinc-600 dark:text-zinc-400">
          Odds kommer fra{" "}
          <a
            href="https://danskespil.dk/oddset/sports/competition/25652/kongens-nytarstale/danmark/danmark-kongens-nytarstale/outrights"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-orange-700 underline decoration-orange-200 underline-offset-2 hover:text-orange-800 dark:text-amber-200 dark:decoration-amber-500/30 dark:hover:text-amber-100"
          >
            Danskespil Oddset
          </a>
          .
        </footer>
      </div>

      {isPrintDialogOpen && (
        <div
          className="no-print fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Print plader"
          onClick={() => setIsPrintDialogOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:border dark:border-amber-500/20 dark:bg-zinc-950 dark:shadow-none"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Print plader
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Vælg hvor mange plader du vil printe. Der er 2 plader per A4 side.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <label
                className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                htmlFor="count"
              >
                Antal
              </label>
              <input
                id="count"
                inputMode="numeric"
                type="number"
                min={1}
                max={50}
                value={printCount}
                onChange={(event) => setPrintCount(Number(event.target.value))}
                className="w-24 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:focus-visible:outline-amber-400"
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                (A4 sider: {Math.ceil(Math.max(1, printCount) / 2)})
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setIsPrintDialogOpen(false)}
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 sm:w-auto dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:focus-visible:outline-amber-400"
              >
                Annuller
              </button>
              <button
                onClick={startPrint}
                className="w-full rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 sm:w-auto dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 dark:shadow-none dark:focus-visible:outline-amber-400"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PrintableBoard({ seed, cells }: { seed: string; cells: BoardCell[] }) {
  return (
    <section className="rounded-xl border border-zinc-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
            Konge-bingo
          </p>
          <p className="text-sm font-semibold text-zinc-900">
            Bingoplade (id: {seed})
          </p>
        </div>
        <div className="text-right text-[10px] text-zinc-500">
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
                ? "border-zinc-200 bg-zinc-100 text-zinc-100"
                : "border-zinc-300"
            }`}
          >
            {cell.empty ? (
              <span className="sr-only">Tomt felt</span>
            ) : (
              <>
                <span className="leading-tight">{cell.word}</span>
                <span className="text-[10px] font-medium text-zinc-600">
                  Odds: {cell.odds.toFixed(2)}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function resolveBucket(oddsValue: number, thresholds: Thresholds) {
  if (oddsValue >= JACKPOT_ODDS_MIN) return "jackpot" as const;
  if (oddsValue <= thresholds.highMax) return "grøn" as const;
  return "gul" as const;
}

function buildBoard(
  odds: OddsWord[],
  seed: string,
  thresholds: Thresholds,
): BoardCell[] {
  const rng = mulberry32(hashSeed(seed));
  const filledPositions = buildLayout(rng);
  const totalFilled = filledPositions.length;

  const taken = new Set<string>();
  const selected: BoardCell[] = [];

  const jackpotCandidates = odds.filter(
    (entry) => entry.odds >= JACKPOT_ODDS_MIN && !taken.has(entry.word),
  );
  const jackpotPick = draw(jackpotCandidates, 1, rng)[0];
  if (jackpotPick) {
    taken.add(jackpotPick.word);
    selected.push({
      ...jackpotPick,
      bucket: "jackpot",
      marked: false,
    });
  }

  const spanCandidates = odds.filter(
    (entry) =>
      entry.odds >= ODDS_SPAN_MIN &&
      entry.odds <= ODDS_SPAN_MAX &&
      entry.odds < JACKPOT_ODDS_MIN &&
      !taken.has(entry.word),
  );

  const remainingCount = Math.max(0, totalFilled - selected.length);
  selected.push(
    ...draw(spanCandidates, remainingCount, rng).map((entry) => ({
      ...entry,
      bucket: resolveBucket(entry.odds, thresholds),
      marked: false,
    })),
  );

  if (selected.length < totalFilled) {
    const emergencyCandidates = odds.filter(
      (entry) =>
        entry.odds >= ODDS_SPAN_MIN &&
        entry.odds <= ODDS_SPAN_MAX &&
        !taken.has(entry.word),
    );
    selected.push(
      ...draw(emergencyCandidates, totalFilled - selected.length, rng).map(
        (entry) => ({
          ...entry,
          bucket: resolveBucket(entry.odds, thresholds),
          marked: false,
        }),
      ),
    );
  }

  const shuffled = shuffle(selected, rng);

  const emptyCell: BoardCell = {
    word: "Tomt felt",
    odds: 0,
    marked: false,
    empty: true,
  };

  const grid: BoardCell[] = Array.from({ length: TOTAL_CELLS }, () => ({
    ...emptyCell,
  }));

  filledPositions.forEach((position, index) => {
    grid[position] = { ...shuffled[index], empty: false };
  });

  return grid;
}

function buildLayout(rng: () => number) {
  const positions: number[] = [];
  const colCounts = Array.from({ length: BOARD_COLS }, () => 0);

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    const fillCount =
      MIN_FILLED_PER_ROW +
      Math.floor(rng() * (MAX_FILLED_PER_ROW - MIN_FILLED_PER_ROW + 1));

    const columnsToFill =
      fillCount === 3
        ? pickThreeNonContiguous(colCounts, rng)
        : pickBalancedColumns(colCounts, fillCount, rng);

    columnsToFill.forEach((col) => {
      colCounts[col] += 1;
      positions.push(row * BOARD_COLS + col);
    });
  }

  return positions;
}

function pickBalancedColumns(
  colCounts: number[],
  fillCount: number,
  rng: () => number,
) {
  const scored = colCounts.map((count, col) => ({
    col,
    count,
    tiebreaker: rng(),
  }));

  scored.sort((a, b) => {
    if (a.count !== b.count) return a.count - b.count;
    return a.tiebreaker - b.tiebreaker;
  });

  return scored.slice(0, Math.min(fillCount, colCounts.length)).map((s) => s.col);
}

function pickThreeNonContiguous(colCounts: number[], rng: () => number) {
  const optionMissing1 = {
    cols: [0, 2, 3],
    score: colCounts[0] + colCounts[2] + colCounts[3],
  };
  const optionMissing2 = {
    cols: [0, 1, 3],
    score: colCounts[0] + colCounts[1] + colCounts[3],
  };

  if (optionMissing1.score === optionMissing2.score) {
    return rng() < 0.5 ? optionMissing1.cols : optionMissing2.cols;
  }

  return optionMissing1.score < optionMissing2.score
    ? optionMissing1.cols
    : optionMissing2.cols;
}

function draw<T>(list: T[], count: number, rng: () => number): T[] {
  const pool = shuffle(list, rng);
  return pool.slice(0, Math.min(count, pool.length));
}

function shuffle<T>(list: T[], rng: () => number): T[] {
  const array = [...list];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

function mulberry32(a: number) {
  return function random() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomSeed() {
  return crypto.randomUUID().slice(0, 8);
}

function checkBingo(cells: BoardCell[]) {
  if (cells.length !== TOTAL_CELLS) return false;

  const rowWin = () =>
    Array.from({ length: BOARD_ROWS }).some((_, row) =>
      isLineComplete(
        cells,
        Array.from({ length: BOARD_COLS }, (_, col) => row * BOARD_COLS + col),
      ),
    );

  const colWin = () =>
    Array.from({ length: BOARD_COLS }).some((_, col) =>
      isLineComplete(
        cells,
        Array.from({ length: BOARD_ROWS }, (_, row) => row * BOARD_COLS + col),
      ),
    );

  const diagWin = () => {
    const main = Array.from(
      { length: Math.min(BOARD_ROWS, BOARD_COLS) },
      (_, idx) => idx * BOARD_COLS + idx,
    );
    const other = Array.from(
      { length: Math.min(BOARD_ROWS, BOARD_COLS) },
      (_, idx) => idx * BOARD_COLS + (BOARD_COLS - idx - 1),
    );
    return isLineComplete(cells, main) || isLineComplete(cells, other);
  };

  return rowWin() || colWin() || diagWin();
}

function isLineComplete(cells: BoardCell[], indexes: number[]) {
  const filledIndexes = indexes.filter((idx) => !cells[idx].empty);
  if (filledIndexes.length < 2) return false;
  return filledIndexes.every((idx) => cells[idx].marked);
}

function fireConfetti(jsConfetti: JSConfetti) {
  void jsConfetti.addConfetti({
    emojis: [...CONFETTI_EMOJIS],
    emojiSize: 56,
    confettiNumber: 48,
  });
}

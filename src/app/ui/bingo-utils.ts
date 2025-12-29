import type { OddsWord } from "@/lib/odds";

export type BoardBucket = "grøn" | "gul" | "jackpot";

export type BoardCell = {
  word: string;
  odds: number;
  bucket?: BoardBucket;
  marked: boolean;
  empty?: boolean;
};

export const BOARD_ROWS = 3;
export const BOARD_COLS = 4;
export const TOTAL_CELLS = BOARD_ROWS * BOARD_COLS;
export const MIN_FILLED_PER_ROW = 2;
export const MAX_FILLED_PER_ROW = 3;

export type Thresholds = {
  highMax: number;
  mediumMax: number;
};

export const ODDS_SPAN_MIN = 1;
export const ODDS_SPAN_MAX = 8;
export const JACKPOT_ODDS_MIN = 100;

export function createThresholds(oddsSpanMin: number, oddsSpanMax: number) {
  return {
    highMax: oddsSpanMin + (oddsSpanMax - oddsSpanMin) * 0.33,
    mediumMax: oddsSpanMin + (oddsSpanMax - oddsSpanMin) * 0.66,
  };
}

export function resolveBucket(
  oddsValue: number,
  thresholds: Thresholds,
  jackpotOddsMin: number,
): BoardBucket {
  if (oddsValue >= jackpotOddsMin) return "jackpot";
  if (oddsValue <= thresholds.highMax) return "grøn";
  return "gul";
}

export function buildBoard(params: {
  odds: OddsWord[];
  seed: string;
  thresholds: Thresholds;
  oddsSpanMin: number;
  oddsSpanMax: number;
  jackpotOddsMin: number;
}): BoardCell[] {
  const { odds, seed, thresholds, oddsSpanMin, oddsSpanMax, jackpotOddsMin } =
    params;
  const rng = mulberry32(hashSeed(seed));
  const filledPositions = buildLayout(rng);
  const totalFilled = filledPositions.length;

  const taken = new Set<string>();
  const selected: BoardCell[] = [];

  const jackpotCandidates = odds.filter(
    (entry) => entry.odds >= jackpotOddsMin && !taken.has(entry.word),
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
      entry.odds >= oddsSpanMin &&
      entry.odds <= oddsSpanMax &&
      entry.odds < jackpotOddsMin &&
      !taken.has(entry.word),
  );

  const remainingCount = Math.max(0, totalFilled - selected.length);
  selected.push(
    ...draw(spanCandidates, remainingCount, rng).map((entry) => ({
      ...entry,
      bucket: resolveBucket(entry.odds, thresholds, jackpotOddsMin),
      marked: false,
    })),
  );

  if (selected.length < totalFilled) {
    const emergencyCandidates = odds.filter(
      (entry) =>
        entry.odds >= oddsSpanMin &&
        entry.odds <= oddsSpanMax &&
        !taken.has(entry.word),
    );
    selected.push(
      ...draw(emergencyCandidates, totalFilled - selected.length, rng).map(
        (entry) => ({
          ...entry,
          bucket: resolveBucket(entry.odds, thresholds, jackpotOddsMin),
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

export function randomSeed() {
  return crypto.randomUUID().slice(0, 8);
}

export function checkBingo(cells: BoardCell[]) {
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

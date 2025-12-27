import fs from "fs";
import path from "path";

export type OddsWord = {
  word: string;
  odds: number;
};

export function loadOdds(): OddsWord[] {
  const filePath = path.join(
    process.cwd(),
    "kongens_nytaarstale_odds_sorted.csv",
  );
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .slice(1)
    .map((line) => {
      const [word, oddsRaw] = line.split(";");
      const odds = Number.parseFloat(oddsRaw?.replace(",", ".") ?? "");

      return { word: word?.trim(), odds };
    })
    .filter(
      (entry): entry is OddsWord =>
        Boolean(entry.word) && Number.isFinite(entry.odds),
    );
}

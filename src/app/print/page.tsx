import { loadOdds } from "@/lib/odds";
import PrintBingo from "../ui/print-bingo";

export default function PrintPage() {
  const odds = loadOdds();
  return <PrintBingo odds={odds} />;
}


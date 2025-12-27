import { loadOdds } from "@/lib/odds";
import Bingo from "./ui/bingo";
import { Suspense } from "react";

export default function Home() {
  const odds = loadOdds();

  return (
    <Suspense fallback={null}>
      <Bingo odds={odds} />
    </Suspense>
  );
}

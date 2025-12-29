import { loadOdds } from "@/lib/odds";
import OnlineBingo from "./ui/online-bingo";
import { Suspense } from "react";

export default function Home() {
  const odds = loadOdds();

  return (
    <Suspense fallback={null}>
      <OnlineBingo odds={odds} />
    </Suspense>
  );
}

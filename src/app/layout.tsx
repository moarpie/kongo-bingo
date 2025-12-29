import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.URL ??
      process.env.DEPLOY_PRIME_URL ??
      "http://localhost:3000",
  ),
  title: {
    default: "👑 Kongens Nytårstale Bingo 🥂",
    template: "%s · Kongens Nytårstale Bingo",
  },
  description:
    "Gør Kongens Nytårstale sjovere med bingo! 🎲 Generér en tilfældig bingoplade og spil med familie og venner.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "da_DK",
    title: "👑 Kongens Nytårstale Bingo 🥂",
    description:
      "Gør Kongens Nytårstale sjovere med bingo! 🎲 Generér en tilfældig bingoplade og spil med familie og venner.",
    siteName: "Kongens Nytårstale Bingo",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kongens Nytårstale Bingo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "👑 Kongens Nytårstale Bingo 🥂",
    description:
      "Gør Kongens Nytårstale sjovere med bingo! 🎲 Generér en tilfældig bingoplade og spil med familie og venner.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body className="antialiased">
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 text-zinc-900 selection:bg-orange-200/70 selection:text-zinc-900 dark:bg-gradient-to-br dark:from-slate-950 dark:via-zinc-950 dark:to-amber-950 dark:text-zinc-50 dark:selection:bg-amber-400/30 dark:selection:text-zinc-50">
          {children}
          <footer className="no-print mx-auto max-w-6xl px-2 pb-10 text-xs text-zinc-600 sm:px-4 md:px-8 dark:text-zinc-400">
            Odds fra{" "}
            <a
              href="https://danskespil.dk/oddset/sports/competition/25652/kongens-nytarstale/danmark/danmark-kongens-nytarstale/outrights"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-orange-700 underline decoration-orange-200 underline-offset-2 hover:text-orange-800 dark:text-amber-200 dark:decoration-amber-500/30 dark:hover:text-amber-100"
            >
              Danskespil Oddset
            </a>
            <span className="pr-2 pl-2">•</span> 
            vibe-kodet af {" "}
            <a
              href="https://www.linkedin.com/in/mj-ux/"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-orange-700 underline decoration-orange-200 underline-offset-2 hover:text-orange-800 dark:text-amber-200 dark:decoration-amber-500/30 dark:hover:text-amber-100"
            >
              ham her
            </a>
            .
          </footer>
        </div>
      </body>
    </html>
  );
}

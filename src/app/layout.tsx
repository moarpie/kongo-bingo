import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Kongens Nytårstale Bingo",
    template: "%s · Kongens Nytårstale Bingo",
  },
  description:
    "Gør Kongens Nytårstale sjovere med bingo! Generér en tilfældig bingoplade og spil med familie og venner. 👑🥂",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "da_DK",
    title: "Kongens Nytårstale Bingo",
    description:
      "Gør Kongens Nytårstale sjovere med bingo! Generér en tilfældig bingoplade og spil med familie og venner. 👑🥂",
    siteName: "Kongens Nytårstale Bingo",
  },
  twitter: {
    card: "summary",
    title: "Kongens Nytårstale Bingo",
    description:
      "Gør Kongens Nytårstale sjovere med bingo! Generér en tilfældig bingoplade og spil med familie og venner. 👑🥂",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body className="antialiased">{children}</body>
    </html>
  );
}

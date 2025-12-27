import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Konge Bingo",
  description: "Generer bingoplader til Kongens nytårstale med odds og seed.",
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

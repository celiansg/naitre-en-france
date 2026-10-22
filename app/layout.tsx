import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Naître en France — Une vie parmi d'autres",
  description: "Une simulation de vie française, sensible et explicitement synthétique.",
  icons: { icon: "/kit/assets/brand/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

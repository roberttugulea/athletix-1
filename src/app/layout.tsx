import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATHLETIX | Gestione sportiva",
  description: "Piattaforma per la gestione di organizzazioni sportive.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}

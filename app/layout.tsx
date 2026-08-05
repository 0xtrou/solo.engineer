import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({ variable: "--signal-sans", subsets: ["latin"] });
const mono = DM_Mono({ variable: "--signal-mono", subsets: ["latin"], weight: ["400", "500"] });
const display = Fraunces({ variable: "--signal-display", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: "Signal — Personal web reader",
  description: "A quiet personal feed for builder communities.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} ${display.variable}`}>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AquaReserve — Privacy-Preserving Reserve Assurance",
  description: "Time-bound, scoped reserve snapshots with private customer inclusion verification.",
  icons: {
    icon: "/aquareserve-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} scroll-smooth`}>
      <body className="selection:bg-[#0052FF] selection:text-white font-sans font-light antialiased">
        {children}
      </body>
    </html>
  );
}

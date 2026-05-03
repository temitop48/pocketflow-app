import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Web3Provider from "@/components/providers/Web3Provider";
import AppShell from "@/components/AppShell";
import WalletAutoRegister from "@/components/WalletAutoRegister";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PocketFlow",
  description: "Stablecoin-native pocket bank and proof-of-cashflow on Arc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} bg-slate-50 font-sans text-slate-900 antialiased`}
      >
        <Web3Provider>
          <WalletAutoRegister />
          <AppShell>{children}</AppShell>
        </Web3Provider>
      </body>
    </html>
  );
}
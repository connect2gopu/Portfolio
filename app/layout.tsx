import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Analytics } from "@vercel/analytics/react";
import { generateSEO } from "@/lib/seo";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = generateSEO();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}

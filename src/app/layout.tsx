import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { StarField } from "@/components/star-field";
import { PurePulseFooter } from "@/components/purepulse-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeCodes Space",
  description: "Create a professional personal website in minutes",
  other: {
    "impact-site-verification": "945b781c-7d3c-4c41-bcc7-5fe9a4343fad",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <StarField />
          {children}
          <Toaster />
          <PurePulseFooter />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

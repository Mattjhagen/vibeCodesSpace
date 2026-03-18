import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeCodes Space",
  description: "Create a professional personal website in minutes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

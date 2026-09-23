import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YOU — Your personal context",
  description: "A private, portable memory for your people, plans, preferences, and life.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

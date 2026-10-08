import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UNICROSS Digital Campus",
  description: "Unified university management platform prototype for academic, student, administrative, and financial services.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

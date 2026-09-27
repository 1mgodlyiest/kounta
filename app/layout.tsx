import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Kounta", description: "Kounta SaaS rebuild" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

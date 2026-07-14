import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Property Hunter",
  description: "Owner-posted property listings, refreshed daily.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

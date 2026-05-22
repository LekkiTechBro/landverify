import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LandVerify - Verified Nigerian Real Estate",
  description: "Find verified properties across Nigeria with zero title risk",
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

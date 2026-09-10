import type { Metadata } from "next";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { AppStateProvider } from "@/lib/app-state";

export const metadata: Metadata = {
  title: "CivicPulse Lahore — See it. Report it. Verify it. Resolve it.",
  description: "City intelligence and civic accountability platform for Lahore, Pakistan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}

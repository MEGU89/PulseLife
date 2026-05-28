import type React from "react"
import type { Metadata } from "next"
import "leaflet/dist/leaflet.css";

import "../styles/globals.css"

export const metadata: Metadata = {
  title: "Pulselife | Emergency Blood and Organ Coordination",
  description:
    "Pulselife connects donors, hospitals, and recipients through a calmer emergency blood and organ coordination experience.",
  icons: {
    icon: "/pulselife-icon.svg",
    shortcut: "/pulselife-icon.svg",
    apple: "/pulselife-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

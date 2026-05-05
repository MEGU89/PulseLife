import type React from "react"
import type { Metadata } from "next"
import "leaflet/dist/leaflet.css";

import "../styles/globals.css"

export const metadata: Metadata = {
  title: "Pulse Bank | Emergency Blood Coordination",
  description:
    "Pulse Bank connects donors, hospitals, and recipients through a calmer emergency blood coordination experience.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
}

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
  )
}

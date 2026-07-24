import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollButtons from "./components/ScrollButtons";

import ThemeProvider from "./providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "सानिध्यशाला | From Clarity to Mastery",

  description:
    "A space to learn, teach and reflect. Mathematics, education, philosophy and thoughtful learning.",

  applicationName: "Sanidhyashala",

  manifest: "/site.webmanifest",

  icons: {
    icon: [
      {
        url: "/favicon.ico",
      },
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],

    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1E40AF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <ThemeProvider>
            <Navbar />

            <main className="flex-1">
              {children}
            </main>

            <Footer />

            <ScrollButtons />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
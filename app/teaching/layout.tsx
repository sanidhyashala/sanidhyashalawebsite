import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/teaching",
  },
};

export default function TeachingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
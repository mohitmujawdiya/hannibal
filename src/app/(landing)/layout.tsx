import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hannibal — Cursor for PMs",
  description:
    "The AI workspace where product strategy writes itself. Join as a founding member.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

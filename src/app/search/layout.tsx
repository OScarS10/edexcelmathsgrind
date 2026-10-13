import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chapters",
  description:
    "Browse every Edexcel A-Level maths year 1 and year 2 chapter and topic, pick multiple chapters, and jump straight into practice.",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
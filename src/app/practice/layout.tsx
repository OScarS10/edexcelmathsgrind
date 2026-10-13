import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Practice",
  description:
    "Generate past-paper style Edexcel A-Level maths questions by module, chapter and difficulty — with examiner-style mark schemes.",
};

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skills",
  description:
    "Technique-focused training for Edexcel A-Level maths: graphs, differentiation, integration, trigonometry, vectors, mechanics and statistics.",
};

export default function SkillsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
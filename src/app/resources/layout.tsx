import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Practice library",
  description:
    "Hand-picked, freely available Edexcel A-Level maths resources: official Pearson papers, question banks, worksheets and video courses.",
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
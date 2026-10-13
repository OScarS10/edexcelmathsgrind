import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Progress",
  description:
    "Gap analysis in paper-mark terms, rehearsal grade estimates, spaced-repetition due dates and an exam-plan built backwards from your exam date.",
};

export default function ProgressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TMUA",
  description:
    "Tackle TMUA Paper 1 and Paper 2 topics — speed practice, counterexamples, hidden assumptions and flawed arguments — with a Further Maths bridging guide.",
};

export default function TmuaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
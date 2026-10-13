import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/nav";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_NAME = "Edexcel A-Level Maths Revision Bot";
const APP_DESCRIPTION =
  "Practice Edexcel A-Level (GCE) Mathematics with past-paper style questions, computer-algebra-checked generation, chapter search and step-by-step explanations.";

export const metadata: Metadata = {
  metadataBase: new URL("https://edexcelmathsgrind.vercel.app"),
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "Edexcel A-Level Maths",
    "A Level maths practice",
    "9MA0",
    "past paper style questions",
    "differentiation",
    "integration",
    "mechanics",
    "statistics",
    "revision",
  ],
  applicationName: APP_NAME,
  category: "education",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    url: "https://edexcelmathsgrind.vercel.app",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: APP_NAME,
              url: "https://edexcelmathsgrind.vercel.app",
              description: APP_DESCRIPTION,
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
            }),
          }}
        />
        <Nav />
        <main className="flex-1">{children}</main>
        <PwaRegister />
      </body>
    </html>
  );
}

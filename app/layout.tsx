import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://totaltransformationministries.netlify.app"
  ),
  title: {
    default: "Total Transformation Center | Where Lives Find Purpose & Grace",
    template: "%s | Total Transformation Center",
  },
  description:
    "A vibrant Christ-centered church community rooted in faith, united by love, and committed to seeing every life reach its God-given potential through worship, prayer, and fellowship.",
  keywords: [
    "Total Transformation Center",
    "TTC Church",
    "TTC Chennai",
    "Christian Church Chennai",
    "Sunday Worship Service",
    "Prayer Fellowship",
    "Church Directory",
    "Gospel Ministry",
    "Bible Study",
    "Faith Community",
  ],
  authors: [{ name: "Total Transformation Center", url: "https://ttc.org" }],
  creator: "Total Transformation Center",
  publisher: "Total Transformation Center",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Total Transformation Center | Where Lives Find Purpose & Grace",
    description:
      "A vibrant faith community committed to spiritual growth, Christ-centered fellowship, and holistic transformation.",
    url: "https://ttc.org",
    siteName: "Total Transformation Center",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Total Transformation Center",
    description:
      "A faith community committed to spiritual breakthrough, Christ-centered fellowship, and holistic transformation.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Church",
  name: "Total Transformation Center",
  alternateName: "TTC Church",
  url: "https://ttc.org",
  logo: "https://ttc.org/assets/TTC%20Logo%20PNG.png",
  description:
    "A community rooted in faith, united by love, and committed to seeing every life reach its God-given potential.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Chennai",
    addressRegion: "Tamil Nadu",
    addressCountry: "IN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


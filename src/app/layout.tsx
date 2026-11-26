// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import CookieBanner from "@/components/layout/CookieBanner";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { getCurrentHotelServer } from "@/lib/hotel-server";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const hotel = await getCurrentHotelServer();
  const name = hotel?.name || "GuestsKit";
  const description =
    hotel?.description || `Votre compagnon de séjour — ${name}`;
  const image = hotel?.logo_url || "/icon-512.png";
  return {
    title: name,
    description,
    icons: { icon: "/favicon.ico" },
    openGraph: {
      title: name,
      description,
      locale: "fr_FR",
      type: "website",
      images: [{ url: image, width: 512, height: 512, alt: name }],
    },
    twitter: { card: "summary", title: name, description, images: [image] },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <Header />
        <main className="flex-grow pb-16 lg:pb-0">{children}</main>
        <Footer />
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
